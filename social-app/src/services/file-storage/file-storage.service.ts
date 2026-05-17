import type { Readable } from 'node:stream';

export type WriteFileProperties = {
  createdOn: Date;
  contentLength: number;
};

export abstract class FileStorageService {
  /**
   * Read file from a specified path
   * @param filePath
   * @param encoding
   * @returns ReadableStream Stream of file contents
   */
  public abstract readFile(filePath: string, encoding?: BufferEncoding): Promise<Readable>;

  /**
   * Read file contents from a specified path
   * @param filePath
   * @param encoding
   * @returns string Target file contents
   */
  public abstract readFileContents(filePath: string, encoding?: BufferEncoding): Promise<string>;

  /**
   * Write file to a specified path
   * @param filePath
   * @param contentStream
   */
  public abstract writeFile(filePath: string, contentStream: Readable): Promise<WriteFileProperties>;
  /**
   * Write file contents to a specified path
   * @param filePath
   * @param contents
   */
  public abstract writeFileContents(filePath: string, contents: string): Promise<WriteFileProperties>;
  /**
   * Delete file from a specified path
   * @param filePath
   */
  public abstract deleteFile(filePath: string): Promise<boolean>;
}
