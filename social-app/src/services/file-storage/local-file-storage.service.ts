import * as fs from 'node:fs';
import * as path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

import { FileStorageService, WriteFileProperties } from './file-storage.service';

export class LocalFileStorageService extends FileStorageService {
  constructor(private readonly rootFolder: string) {
    super();
  }

  async deleteFile(filePath: string): Promise<boolean> {
    const fullPath = path.resolve(this.rootFolder, filePath);
    return new Promise((resolve, reject) => {
      fs.unlink(fullPath, err => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  async readFile(filePath: string, encoding?: BufferEncoding): Promise<Readable> {
    const fullPath = this.getFullPath(filePath);
    return fs.createReadStream(fullPath, encoding ? { encoding } : undefined);
  }

  async readFileContents(filePath: string, encoding?: BufferEncoding): Promise<string> {
    const stream = await this.readFile(filePath, encoding);
    return new Promise((resolve, reject) => {
      const contents = [];
      stream.on('data', chunk => contents.push(chunk.toString()));
      stream.on('end', () => resolve(contents.join('')));
      stream.on('error', err => reject(err));
    });
  }

  async writeFile(filePath: string, contentStream: Readable): Promise<WriteFileProperties> {
    const fullPath = this.getFullPath(filePath);
    const writeStream = fs.createWriteStream(fullPath);
    await pipeline(contentStream, writeStream);

    return {
      createdOn: new Date(),
      contentLength: fs.statSync(fullPath).size
    };
  }

  async writeFileContents(filePath: string, contents: string): Promise<WriteFileProperties> {
    return this.writeFile(filePath, Readable.from([contents]));
  }

  private getFullPath(filePath: string): string {
    return path.resolve(this.rootFolder, filePath);
  }
}
