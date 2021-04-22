import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { config } from '../../../config';

interface IDtoException {
  statusCode: number;
  message: string[];
  error: string;
}

interface IServerException {
  response?: {
    status?: number;
    error?: string;
  };
  status: number;
  message?: string;
}

describe('# App Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(config.PORT);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('# Health Check', () => {
    it('Should be able to return with success health status', async (done: jest.DoneCallback) => {
      return request(app.getHttpServer())
        .get('/healths')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, {
          status: 'ok',
          info: {
            'User-Services': {
              status: 'up',
            },
          },
          error: {},
          details: {
            'User-Services': {
              status: 'up',
            },
          },
        })
        .then(() => done())
        .catch((err) => done(err));
    });
  });
});
