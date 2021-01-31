import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as Cloudinary from 'cloudinary';
import * as fs from 'fs';
import { join } from 'path';
import { config } from '../../../config';
import * as IUser from '../interfaces';

@Injectable()
export class UploadeService {
  private readonly logger: Logger = new Logger('UploadeService');

  constructor() {
    Cloudinary.v2.config({
      cloud_name: config.CLOUDINARY.NAME,
      api_key: config.CLOUDINARY.KEY,
      api_secret: config.CLOUDINARY.SECRET,
    });
  }

  private isDirectoryExist(): Promise<boolean> {
    const path: string = join(process.cwd(), 'public/assets');
    return new Promise((resolve, reject) => {
      fs.stat(path, (err, stats) => {
        if (!stats) {
          fs.mkdirSync(join(process.cwd(), 'public'));
          fs.mkdirSync(join(process.cwd(), 'public/assets'));
          resolve(true);
        } else {
          return resolve(true);
        }
      });
    });
  }

  /**
   * @description Create Write Stream
   * @private
   * @param {ITrip.BufferedFile} file
   * @returns {Promise<boolean>}
   */
  private async writeStream(file: IUser.BufferedFile): Promise<boolean> {
    const isDir = await this.isDirectoryExist();
    if (!isDir) throw new InternalServerErrorException('Directory not existed');

    return new Promise((resolve, reject) => {
      fs.createWriteStream(join(process.cwd(), `public/assets/${file.originalname}`)).write(Buffer.from(file.buffer['data']), (err) => {
        if (err) return reject(false);
        resolve(true);
      });
    });
  }

  public async uploadBatch(files: IUser.BufferedFile[]): Promise<void> {
    const promises = [];

    for (let i = 0; i < files.length; i++) {
      await this.writeStream(files[i]);
    }

    files.forEach((file) => {
      const public_id = file.originalname.replace(/\.[^.]+$/, '');
      promises.push(
        Cloudinary.v2.uploader.upload(
          join(process.cwd(), `public/assets/${file.originalname}`),
          {
            access_mode: 'public',
            resource_type: 'image',
            folder: 'users',
            allowed_formats: ['jpg', 'png', 'jpeg'],
            public_id,
            unique_filename: true,
            timestamp: new Date().getTime(),
          },
          function(err, result) {
            if (err) return err;
            return result;
          },
        ),
      );
    });

    Promise.all(promises)
      .then((resources) => resources)
      .catch((err) => err);
  }
}
