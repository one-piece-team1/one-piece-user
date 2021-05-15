import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from '../../app.module';
import { JwtStrategy } from '../../users/strategy/jwt-strategy';
import { UserService } from '../../users/user.service';
import { SigninCreditDto, UserCreditDto, UserForgetDto, VerifyKeyDto, VerifyUpdatePasswordDto, UserUpdatePassDto, UpdateSubscription, UpdateUserAdditionalInfoInServerDto, UserSearchDto } from '../../users/dto';
import { config } from '../../../config';
import { MockUser } from '../../libs/mock_data';
import * as EUser from '../../users/enums';
import * as IShare from '../../interfaces';
import * as IUser from '../../users/interfaces';
import { User } from '../../users/user.entity';

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
  statusCode?: number;
}

describe('# App Integration', () => {
  const testToken: string = process.env.TESTTOKEN;
  let app: INestApplication;
  let jwtStrategy: JwtStrategy;
  let userService: UserService;

  // mock data
  let mockValideUser: IUser.JwtPayload;
  let mockInvalidUser: IUser.JwtPayload;
  let mockUserCreditDto: UserCreditDto;
  let mockSigninCreditDto: SigninCreditDto;
  let mockPayload: IUser.JwtPayload;
  let mockUserInfo: IUser.UserInfo;
  let mockUserSearchDto: UserSearchDto;
  let mockUserForgetDto: UserForgetDto;
  let mockVerifyKeyDto: VerifyKeyDto;
  let mockVerifyUpdatePasswordDto: VerifyUpdatePasswordDto;
  let mockUserUpdatePassDto: UserUpdatePassDto;
  let mockUpdateUserAdditionalInfoInServerDto: UpdateUserAdditionalInfoInServerDto;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: JwtStrategy,
          useValue: {
            validate: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            signUp: jest.fn(),
            signIn: jest.fn(),
            getUsers: jest.fn(),
            getUserById: jest.fn(),
            googleLogin: jest.fn(),
            fbLogin: jest.fn(),
            createUserForget: jest.fn(),
            mailSender: jest.fn(),
            validateVerifyKey: jest.fn(),
            verifyUpdatePassword: jest.fn(),
            userUpdatePassword: jest.fn(),
            updateUserAdditionalInfo: jest.fn(),
            softDeleteUser: jest.fn(),
            logOut: jest.fn(),
          },
        },
      ],
    }).compile();
    jwtStrategy = moduleFixture.get<JwtStrategy>(JwtStrategy);
    userService = moduleFixture.get<UserService>(UserService);

    mockValideUser = {
      id: uuidv4(),
      username: 'test',
      licence: 'onepiece',
      email: '',
      role: 'admin',
    };
    mockInvalidUser = {
      id: uuidv4(),
      username: 'test',
      licence: 'test',
      email: '',
      role: 'admin',
    };

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

  describe('# User Controller Integration', () => {
    describe('# Sign Up', () => {
      afterEach(() => {
        mockUserCreditDto = null;
      });

      it('Should not be able to sign up user and return bad request failed when dto guard not passed', async (done: jest.DoneCallback) => {
        mockUserCreditDto = {
          username: 'unit-test1',
          email: 'sdfsdfsd',
          password: 'Aabc1234',
        };
        const res = await request(app.getHttpServer())
          .post('/users/signup')
          .set('Accept', 'application/json')
          .send(mockUserCreditDto);
        const result = res.body as IDtoException;
        expect(result.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(result.error).toEqual('Bad Request');
        expect(result.message).toEqual(['email must be an email']);
        done();
      });

      it('Should not be able to sign up user when exception is been thrown', async (done: jest.DoneCallback) => {
        mockUserCreditDto = {
          username: 'unit-test1',
          email: 'unit-test1@test.com',
          password: 'Aabc1234',
        };
        userService.signUp = jest.fn().mockReturnValue({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Http Exception',
          response: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Some Error',
          },
        });
        const res = await request(app.getHttpServer())
          .post('/users/signup')
          .set('Accept', 'application/json')
          .send(mockUserCreditDto);
        const response = res.body as IServerException;
        expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(response.status).toEqual(response.response.status);
        expect(response.message).toEqual('Http Exception');
        expect(response.response.error).toEqual('Some Error');
        done();
      });

      it('Should be able to sign up user', async (done: jest.DoneCallback) => {
        mockUserCreditDto = {
          username: 'unit-test1',
          email: 'unit-test1@test.com',
          password: 'Aabc1234',
        };
        userService.signUp = jest.fn().mockReturnValueOnce({
          status: 'success',
          statusCode: HttpStatus.CREATED,
          message: 'signup success',
        });
        const res = await request(app.getHttpServer())
          .post('/users/signup')
          .set('Accept', 'application/json')
          .send(mockUserCreditDto);
        const result = res.body as IShare.IResponseBase<string>;
        expect(result.statusCode).toEqual(HttpStatus.CREATED);
        expect(result.message).toEqual('signup success');
        done();
      });
    });

    describe('# Sign In', () => {
      afterEach(() => {
        mockSigninCreditDto = null;
      });

      it('Should not be able to sign in user and return bad request failed when dto guard not passed', async (done: jest.DoneCallback) => {
        mockSigninCreditDto = {
          email: 'sdfsdfsd',
          password: 'Aabc1234',
        };
        const res = await request(app.getHttpServer())
          .post('/users/signin')
          .set('Accept', 'application/json')
          .send(mockSigninCreditDto);
        const result = res.body as IDtoException;
        expect(result.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(result.error).toEqual('Bad Request');
        expect(result.message).toEqual(['email must be an email']);
        done();
      });

      it('Should not be able to sign in user when exception is been thrown', async (done: jest.DoneCallback) => {
        mockSigninCreditDto = {
          email: 'unit-test1@test.com',
          password: 'Aabc1234',
        };
        userService.signIn = jest.fn().mockReturnValue({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Http Exception',
          response: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Some Error',
          },
        });
        const res = await request(app.getHttpServer())
          .post('/users/signin')
          .set('Accept', 'application/json')
          .send(mockSigninCreditDto);
        const response = res.body as IServerException;
        expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(response.status).toEqual(response.response.status);
        expect(response.message).toEqual('Http Exception');
        expect(response.response.error).toEqual('Some Error');
        done();
      });

      it('Should be able to sign in user', async (done: jest.DoneCallback) => {
        mockSigninCreditDto = {
          email: 'unit-test1@test.com',
          password: 'Aabc1234',
        };
        userService.signIn = jest.fn().mockReturnValueOnce({
          status: 'success',
          statusCode: HttpStatus.CREATED,
          message: 'fake access token',
        });
        const res = await request(app.getHttpServer())
          .post('/users/signin')
          .set('Accept', 'application/json')
          .send(mockSigninCreditDto);
        const result = res.body as IShare.IResponseBase<string>;
        expect(result.statusCode).toEqual(HttpStatus.CREATED);
        expect(result.message).toEqual('fake access token');
        done();
      });
    });

    describe('# Get Users', () => {
      afterEach(() => {
        mockUserSearchDto = null;
      });

      it('Should not be able to get users and return failed when guard not passed', async (done: jest.DoneCallback) => {
        mockUserSearchDto = {};
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockInvalidUser);
        const res = await request(app.getHttpServer())
          .get('/users/paging')
          .set('Accept', 'application/json')
          .query(mockUserSearchDto);
        const result = res.body as IServerException;
        expect(result).toEqual({ statusCode: 401, message: 'Unauthorized' });
        done();
      });

      it('Should be able to get users', async (done: jest.DoneCallback) => {
        mockUserSearchDto = {};
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockValideUser);
        const mockedUser = await MockUser();
        mockedUser.expiredDate = null;
        const mockReturn = {
          status: 'success',
          statusCode: HttpStatus.OK,
          message: {
            users: [mockedUser],
            take: 10,
            skip: 0,
            count: 1,
          },
        };
        userService.getUsers = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .get('/users/paging')
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json')
          .query(mockUserSearchDto);
        const result = res.body as IShare.IUsersPagingResponseBase<User[]>;
        expect(result).toEqual(mockReturn);
        done();
      });

      it('Should not be able to get users when exception is thrown', async (done: jest.DoneCallback) => {
        mockUserSearchDto = {};
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockValideUser);
        const mockReturn = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Http Exception',
          response: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Some Error',
          },
        };
        userService.getUsers = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .get('/users/paging')
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json')
          .query(mockUserSearchDto);
        const result = res.body as IServerException;
        expect(result).toEqual(mockReturn);
        done();
      });
    });

    describe('# Get User', () => {
      it('Should not be able to get user and return failed when guard not passed', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockInvalidUser);
        const res = await request(app.getHttpServer())
          .get('/users/info')
          .set('Accept', 'application/json');
        const result = res.body as IServerException;
        expect(result).toEqual({ statusCode: 401, message: 'Unauthorized' });
        done();
      });

      it('Should be able to get user', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockValideUser);
        const mockReturn = {
          status: 'success',
          statusCode: HttpStatus.OK,
          message: {
            user: mockInvalidUser,
          },
        };
        userService.getUser = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .get('/users/info')
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json');
        const result = res.body as IShare.IResponseBase<{ user: IUser.JwtPayload }>;
        expect(result).toEqual(mockReturn);
        done();
      });
    });

    describe('# Logout User', () => {
      it('Should not be able to log out user and return failed when guard not passed', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockInvalidUser);
        const res = await request(app.getHttpServer())
          .get('/users/logout')
          .set('Accept', 'application/json');
        const result = res.body as IServerException;
        expect(result).toEqual({ statusCode: 401, message: 'Unauthorized' });
        done();
      });

      it('Should be able to log out user', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockValideUser);
        const mockReturn = {
          status: 'success',
          statusCode: HttpStatus.OK,
          message: 'Logout success',
        };
        userService.logOut = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .get('/users/logout')
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json');
        const result = res.body as IShare.IResponseBase<string>;
        expect(result).toEqual(mockReturn);
        done();
      });

      it('Should not be able to log out user when exception is thrown', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockValideUser);
        const mockReturn = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Http Exception',
          response: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Some Error',
          },
        };
        userService.logOut = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .get('/users/logout')
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json')
          .query(mockUserSearchDto);
        const result = res.body as IServerException;
        expect(result).toEqual(mockReturn);
        done();
      });
    });

    describe('# Get user info by id', () => {
      it('Should not be able to get user info by id and return failed when guard not passed', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockInvalidUser);
        const res = await request(app.getHttpServer())
          .get(`/users/${uuidv4()}/info`)
          .set('Accept', 'application/json');
        const result = res.body as IServerException;
        expect(result).toEqual({ statusCode: 401, message: 'Unauthorized' });
        done();
      });

      it('Should be able to get user info by id', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockValideUser);
        const mockedUser = await MockUser();
        mockedUser.expiredDate = null;
        const mockReturn = {
          status: 'success',
          statusCode: HttpStatus.OK,
          message: {
            user: mockedUser,
          },
        };
        userService.getUserById = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .get(`/users/${uuidv4()}/info`)
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json');
        const result = res.body as IShare.IResponseBase<{ user: IUser.UserInfo }>;
        expect(result).toEqual(mockReturn);
        done();
      });

      it('Should not be able to get user info by id when exception is thrown', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockValideUser);
        const mockReturn = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Http Exception',
          response: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Some Error',
          },
        };
        userService.getUserById = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .get(`/users/${uuidv4()}/info`)
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json');
        const result = res.body as IServerException;
        expect(result).toEqual(mockReturn);
        done();
      });
    });

    describe('# Generate forget process 1', () => {
      afterEach(() => {
        mockUserForgetDto = null;
      });

      it('Should be able to pass forget process 1', async (done: jest.DoneCallback) => {
        mockUserForgetDto = {
          email: 'test@gmail.com',
        };
        const mockReturn = {
          status: 'success',
          statusCode: HttpStatus.OK,
          message: 'Send mail success',
        };
        userService.createUserForget = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .post('/users/forgets/generates')
          .set('Accept', 'application/json')
          .send(mockUserCreditDto);
        const result = res.body as IShare.IResponseBase<string>;
        expect(result).toEqual(mockReturn);
        done();
      });

      it('Should not be able to forget process 1 when exception is thrown', async (done: jest.DoneCallback) => {
        const mockReturn = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Http Exception',
          response: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Some Error',
          },
        };
        userService.createUserForget = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .post('/users/forgets/generates')
          .set('Accept', 'application/json')
          .query(mockUserSearchDto);
        const result = res.body as IServerException;
        expect(result).toEqual(mockReturn);
        done();
      });
    });

    describe('# Generate forget process 2', () => {
      afterEach(() => {
        mockVerifyKeyDto = null;
      });

      it('Should be able to pass forget process 2 when dto not pass', async (done: jest.DoneCallback) => {
        const res = await request(app.getHttpServer())
          .post('/users/forgets/verifies')
          .set('Accept', 'application/json')
          .send({});
        const result = res.body as IDtoException;
        expect(result.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(result.error).toEqual('Bad Request');
        expect(result.message).toEqual(['key must be a string']);
        done();
      });

      it('Should be able to pass forget process 2', async (done: jest.DoneCallback) => {
        mockVerifyKeyDto = {
          key: 'fakeKey',
        };
        const mockReturn = {
          status: 'success',
          statusCode: HttpStatus.OK,
          message: 'Verify success',
        };
        userService.validateVerifyKey = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .post('/users/forgets/verifies')
          .set('Accept', 'application/json')
          .send(mockVerifyKeyDto);
        const result = res.body as IShare.IResponseBase<string>;
        expect(result).toEqual(mockReturn);
        done();
      });

      it('Should not be able to forget process 2 when exception is thrown', async (done: jest.DoneCallback) => {
        mockVerifyKeyDto = {
          key: 'fakeKey',
        };
        const mockReturn = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Http Exception',
          response: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Some Error',
          },
        };
        userService.validateVerifyKey = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .post('/users/forgets/verifies')
          .set('Accept', 'application/json')
          .send(mockVerifyKeyDto);
        const result = res.body as IServerException;
        expect(result).toEqual(mockReturn);
        done();
      });
    });

    describe('# Generate forget process 3', () => {
      afterEach(() => {
        mockVerifyUpdatePasswordDto = null;
      });

      it('Should be able to pass forget process 3 when dto not pass', async (done: jest.DoneCallback) => {
        const res = await request(app.getHttpServer())
          .post('/users/forgets/confirms')
          .set('Accept', 'application/json')
          .send({
            password: 'Testest123',
          });
        const result = res.body as IDtoException;
        expect(result.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(result.error).toEqual('Bad Request');
        expect(result.message).toEqual(['key must be a string']);
        done();
      });

      it('Should be able to pass forget process 3', async (done: jest.DoneCallback) => {
        mockVerifyUpdatePasswordDto = {
          key: 'fakeKey',
          password: 'Testest123',
        };
        const mockReturn = {
          status: 'success',
          statusCode: HttpStatus.OK,
          message: 'update password success',
        };
        userService.verifyUpdatePassword = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .post('/users/forgets/confirms')
          .set('Accept', 'application/json')
          .send(mockVerifyUpdatePasswordDto);
        const result = res.body as IShare.IResponseBase<string>;
        expect(result).toEqual(mockReturn);
        done();
      });

      it('Should not be able to forget process 3 when exception is thrown', async (done: jest.DoneCallback) => {
        mockVerifyUpdatePasswordDto = {
          key: 'fakeKey',
          password: 'Testest123',
        };
        const mockReturn = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Http Exception',
          response: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Some Error',
          },
        };
        userService.verifyUpdatePassword = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .post('/users/forgets/confirms')
          .set('Accept', 'application/json')
          .send(mockVerifyUpdatePasswordDto);
        const result = res.body as IServerException;
        expect(result).toEqual(mockReturn);
        done();
      });
    });

    describe('# Update User Informations', () => {
      it('Should not be able to Update User Informations and return failed when guard not passed', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockInvalidUser);
        const res = await request(app.getHttpServer())
          .post(`/users/${uuidv4()}/informations/additionals`)
          .set('Accept', 'application/json')
          .send({});
        const result = res.body as IServerException;
        expect(result).toEqual({ statusCode: 401, message: 'Unauthorized' });
        done();
      });

      it('Should be able to Update User Informations', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockValideUser);
        const mockedUser = await MockUser();
        mockedUser.expiredDate = null;
        const mockReturn = {
          status: 'success',
          statusCode: HttpStatus.OK,
          message: {
            user: mockedUser,
          },
        };
        userService.updateUserAdditionalInfo = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .post(`/users/${uuidv4()}/informations/additionals`)
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json')
          .send({});
        const result = res.body as IShare.IResponseBase<User>;
        expect(result).toEqual(mockReturn);
        done();
      });

      it('Should not be able to Update User Informations when exception is thrown', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockValideUser);
        const mockReturn = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Http Exception',
          response: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Some Error',
          },
        };
        userService.updateUserAdditionalInfo = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .post(`/users/${uuidv4()}/informations/additionals`)
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json');
        const result = res.body as IServerException;
        expect(result).toEqual(mockReturn);
        done();
      });
    });

    describe('# Update User Password', () => {
      afterEach(() => {
        mockUserUpdatePassDto = null;
      });

      it('Should not be able to Update User Password and return failed when guard not passed', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockInvalidUser);
        const res = await request(app.getHttpServer())
          .put(`/users/${uuidv4()}/password`)
          .set('Accept', 'application/json')
          .send({});
        const result = res.body as IServerException;
        expect(result).toEqual({ statusCode: 401, message: 'Unauthorized' });
        done();
      });

      it('Should not be able to Update User Password and return failed when dto not passed', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockInvalidUser);
        const res = await request(app.getHttpServer())
          .put(`/users/${uuidv4()}/password`)
          .set('Accept', 'application/json')
          .send({});
        const result = res.body as IServerException;
        console.log('result: ', result);
        done();
      });

      it('Should be able to Update User Password', async (done: jest.DoneCallback) => {
        mockUserUpdatePassDto = {
          oldPassword: 'Aabscs123',
          newPassword: 'Testst1234',
        };
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockValideUser);
        const mockedUser = await MockUser();
        mockedUser.expiredDate = null;
        const mockReturn = {
          status: 'success',
          statusCode: HttpStatus.OK,
          message: 'Update password success',
        };
        userService.userUpdatePassword = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .put(`/users/${uuidv4()}/password`)
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json')
          .send(mockUserUpdatePassDto);
        const result = res.body as IShare.IResponseBase<User>;
        expect(result).toEqual(mockReturn);
        done();
      });

      it('Should not be able to Update User Password when exception is thrown', async (done: jest.DoneCallback) => {
        mockUserUpdatePassDto = {
          oldPassword: 'Aabscs123',
          newPassword: 'Testst1234',
        };
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockValideUser);
        const mockReturn = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Http Exception',
          response: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Some Error',
          },
        };
        userService.userUpdatePassword = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .put(`/users/${uuidv4()}/password`)
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json')
          .send(mockUserUpdatePassDto);
        const result = res.body as IServerException;
        expect(result).toEqual(mockReturn);
        done();
      });
    });

    describe('# Delete User', () => {
      it('Should not be able to Delete User and return failed when guard not passed', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockInvalidUser);
        const res = await request(app.getHttpServer())
          .delete(`/users/${uuidv4()}`)
          .set('Accept', 'application/json')
          .send({});
        const result = res.body as IServerException;
        expect(result).toEqual({ statusCode: 401, message: 'Unauthorized' });
        done();
      });

      it('Should be able to Delete User', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockValideUser);
        const mockReturn = {
          status: 'success',
          statusCode: HttpStatus.OK,
        };
        userService.softDeleteUser = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .delete(`/users/${uuidv4()}`)
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json');
        const result = res.body as IShare.IResponseBase<User>;
        expect(result).toEqual(mockReturn);
        done();
      });

      it('Should not be able to Delete User when exception is thrown', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValueOnce(mockValideUser);
        const mockReturn = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Http Exception',
          response: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Some Error',
          },
        };
        userService.softDeleteUser = jest.fn().mockReturnValueOnce(mockReturn);
        const res = await request(app.getHttpServer())
          .delete(`/users/${uuidv4()}`)
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json');
        const result = res.body as IServerException;
        expect(result).toEqual(mockReturn);
        done();
      });
    });
  });
});
