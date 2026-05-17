import { BlobSASPermissions, BlobServiceClient, type ContainerClient, SASProtocol } from '@azure/storage-blob';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FileStorageService, WriteFileProperties } from './file-storage.service';
import { Readable } from 'node:stream';
import { CustomLoggerService } from '../logging/custom-logger.service';
import { CacheTTL, SERVICE } from '../../helpers/constants';
import { getAsNumber } from '../../helpers/environment';
import { SomethingWentWrongException } from 'src/exceptions/general.error';

@Injectable()
export class AzureBlobFileStorageService extends FileStorageService {
  private readonly logger = new CustomLoggerService(SERVICE, AzureBlobFileStorageService.name);

  private connectionString: string;
  private containerName: string;
  private containerClient: ContainerClient;

  private urlValidityPeriod: number;

  constructor(private readonly configService: ConfigService) {
    super();
    this.connectionString = this.configService.get<string>('AZURE_STORAGE_CONNECTION_STRING');
    this.containerName = this.configService.get<string>('AZURE_STORAGE_CONTAINER_NAME');

    const blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
    this.containerClient = blobServiceClient.getContainerClient(this.containerName);

    this.urlValidityPeriod = getAsNumber('AZURE_STORAGE_URL_VALIDITY_PERIOD', CacheTTL.MINUTES_5);
  }

  async deleteFile(filePath: string): Promise<boolean> {
    await this.containerClient.createIfNotExists();

    const blockBlobClient = this.containerClient?.getBlockBlobClient(filePath);
    try {
      const response = await blockBlobClient.delete({ deleteSnapshots: 'include' });
      return !Boolean(response.errorCode);
    } catch (err) {
      this.logger.error(err.message);
      this.logger.debug(err.stack);
      return false;
    }
  }

  async readFile(filePath: string, encoding?: BufferEncoding): Promise<Readable> {
    await this.containerClient.createIfNotExists();

    const blockBlobClient = this.containerClient.getBlockBlobClient(filePath);
    const download = await blockBlobClient.download();
    return (download.readableStreamBody as Readable) ?? Readable.from([]);
  }

  async readFileContents(filePath: string, encoding?: BufferEncoding): Promise<string> {
    const stream = await this.readFile(filePath, encoding);
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', data => chunks.push(data.toString()));
      stream.on('end', () => resolve(chunks.join('')));
      stream.on('error', reject);
    });
  }

  async writeFile(filePath: string, contentStream: Readable): Promise<WriteFileProperties> {
    await this.containerClient.createIfNotExists();

    const blockBlobClient = this.containerClient.getBlockBlobClient(filePath);
    const { errorCode: uploadError } = await blockBlobClient.uploadStream(contentStream);
    const { errorCode: propError, createdOn, contentLength } = await blockBlobClient.getProperties();

    if (uploadError || propError) {
      throw new SomethingWentWrongException(`Error uploading block blob ${filePath}: ${uploadError || propError}`);
    }
    this.logger.log({ message: `Uploaded block blob ${filePath}`, filePath, createdOn, contentLength });

    return {
      createdOn,
      contentLength
    };
  }

  writeFileContents(filePath: string, contents: string): Promise<WriteFileProperties> {
    return this.writeFile(filePath, Readable.from([contents]));
  }

  async generateSasUrl(filePath: string) {
    const blobClient = this.containerClient.getBlockBlobClient(filePath);

    const startsOn = new Date();
    const expiresOn = new Date(startsOn.getTime() + this.urlValidityPeriod);
    const sasUrl = await blobClient.generateSasUrl({
      permissions: BlobSASPermissions.parse('r'),
      expiresOn,
      protocol: SASProtocol.HttpsAndHttp,
      startsOn
    });

    console.log('Generated SAS URL:', sasUrl);
    return { sasUrl, expiresAt: expiresOn };
  }
}
