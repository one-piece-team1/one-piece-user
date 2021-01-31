import { type } from 'os';

export type TMimeType = 'image/png' | 'image/jpeg';

export interface IStoredFile extends IHasFile, IStoredFileMetadata {}

export interface IHasFile {
  file: Buffer | string;
}
export interface IStoredFileMetadata {
  id: string;
  name: string;
  encoding: string;
  mimetype: TMimeType;
  size: number;
  updatedAt: Date;
  fileSrc?: string;
}
