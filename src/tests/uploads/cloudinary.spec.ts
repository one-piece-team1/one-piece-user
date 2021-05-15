import * as Cloudinary from 'cloudinary';
import { UploadeService } from '../../users/uploads/cloudinary.service';
import * as IUser from '../../users/interfaces';

jest.mock('cloudinary');
describe('# Cloudinary Service', () => {
  let uploadeService!: UploadeService;
  let mockFiles: IUser.BufferedFile[] = [];
  beforeEach(() => {
    Cloudinary.v2.config = jest.fn();
    Cloudinary.v2.uploader.upload = jest.fn();
    uploadeService = new UploadeService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Should UploadeService be created', () => {
    expect(uploadeService).toBeDefined();
  });

  describe('# Upload Batch', () => {
    beforeEach(() => {
      mockFiles = [
        {
          fieldname: 'test',
          originalname: 'test',
          encoding: 'utf-8',
          mimetype: 'image/jpeg',
          size: 2048,
          buffer: Buffer.from(new Array(100).fill('i')),
        },
      ];
    });

    afterEach(() => {
      mockFiles.length = 0;
    });
    it('Should not update success when exception is thrown in write stream', async (done: jest.DoneCallback) => {
      uploadeService.writeStream = jest.fn().mockRejectedValue(new Error('Some Error'));
      try {
        await uploadeService.uploadBatch(mockFiles);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toEqual('Some Error');
      }
      done();
    });

    it('Should be able to upload sucess', async (done: jest.DoneCallback) => {
      uploadeService.writeStream = jest.fn().mockReturnValueOnce(true);
      Cloudinary.v2.uploader.upload = jest.fn().mockReturnValueOnce({});
      try {
        await uploadeService.uploadBatch(mockFiles);
      } catch (error) {
        expect(error).not.toBeDefined();
      }
      done();
    });

    it('Should be able to upload one sucess and one is fail', async (done: jest.DoneCallback) => {
      mockFiles = [
        {
          fieldname: 'test',
          originalname: 'test',
          encoding: 'utf-8',
          mimetype: 'image/jpeg',
          size: 2048,
          buffer: Buffer.from(new Array(100).fill('i')),
        },
        {
          fieldname: 'test2',
          originalname: 'test2',
          encoding: 'utf-8',
          mimetype: 'image/jpeg',
          size: 2048,
          buffer: Buffer.from(new Array(100).fill('i')),
        },
      ];
      uploadeService.writeStream = jest.fn().mockReturnValueOnce(true);
      Cloudinary.v2.uploader.upload = jest
        .fn()
        .mockReturnValueOnce({})
        .mockRejectedValueOnce(new Error());
      try {
        await uploadeService.uploadBatch(mockFiles);
      } catch (error) {
        expect(error).not.toBeDefined();
      }
      done();
    });
  });
});
