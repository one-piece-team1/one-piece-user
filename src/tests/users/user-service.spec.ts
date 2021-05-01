import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { HttpException, HttpStatus } from '@nestjs/common';
import { User } from '../../users/user.entity';
import { UserRepository } from '../../users/user.repository';
import { UserService } from '../../users/user.service';
import { UploadeService } from '../../users/uploads/cloudinary.service';
import { UserHandlerFactory } from '../../handlers';
import { SigninCreditDto, UserCreditDto, UserForgetDto, VerifyKeyDto, VerifyUpdatePasswordDto, UserUpdatePassDto, UpdateSubscription, UpdateUserAdditionalInfoInServerDto, UserSearchDto } from '../../users/dto';
import { MockUser } from '../../libs/mock_data';
import * as IShare from '../../interfaces';
import * as EUser from '../../users/enums';
import * as IUser from '../../users/interfaces';

interface IServerCustomExpcetion {
  status: number;
  error: string;
}

jest.mock('../../handlers');
describe('# User Service', () => {
  let userService: UserService;
  let userRepository: UserRepository;
  let jwtService: JwtService;
  let uploadeService: UploadeService;

  // mock data
  let mockUserCreditDto: UserCreditDto;
  let mockSigninCreditDto: SigninCreditDto;
  let mockPayload: IUser.JwtPayload;
  let mockUserInfo: IUser.UserInfo;
  let mockUserSearchDto: UserSearchDto;

  beforeEach(async (done: jest.DoneCallback) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            signUp: jest.fn(),
            validateUserPassword: jest.fn(),
            getUsers: jest.fn(),
            getUserById: jest.fn(),
            thirdPartySignUp: jest.fn(),
            createUserForget: jest.fn(),
            verifyUpdatePassword: jest.fn(),
            userUpdatePassword: jest.fn(),
            updateSubscribePlan: jest.fn(),
            updateUserAdditionalInfo: jest.fn(),
            softDeleteUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: UploadeService,
          useValue: {
            uploadBatch: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    jwtService = module.get<JwtService>(JwtService);
    uploadeService = module.get<UploadeService>(UploadeService);

    done();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Should all instances to be created', () => {
    expect(userService).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(uploadeService).toBeDefined();
  });

  describe('# Sign Up', () => {
    afterEach(() => {
      mockUserCreditDto = null;
    });

    it('Should be able to create user', async (done: jest.DoneCallback) => {
      mockUserCreditDto = {
        username: 'unit-test1',
        email: 'unit-test1@test.com',
        password: 'Aabc1234',
      };
      const mockedUser = await MockUser();
      userRepository.signUp = jest.fn().mockReturnValueOnce(mockedUser);
      UserHandlerFactory.createUser = jest.fn().mockImplementation(() => {});
      const result = await userService.signUp(mockUserCreditDto);
      const resultResponse = result as IShare.IResponseBase<string>;
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.statusCode).toEqual(HttpStatus.CREATED);
      expect(resultResponse.message).toEqual('signup success');
      done();
    });

    it('Should be able to return internal server error when exception is caught', async (done: jest.DoneCallback) => {
      mockUserCreditDto = {
        username: 'unit-test1',
        email: 'unit-test1@test.com',
        password: 'Aabc1234',
      };
      userRepository.signUp = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await userService.signUp(mockUserCreditDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });
  });

  describe('# Sign In', () => {
    afterEach(() => {
      mockSigninCreditDto = null;
      mockPayload = null;
    });

    it('Should throw Invalid credits when sign in failed', async (done: jest.DoneCallback) => {
      mockSigninCreditDto = {
        email: 'test@test.com',
        password: '123',
      };
      userRepository.validateUserPassword = jest.fn().mockReturnValueOnce(undefined);
      const result = await userService.signIn(mockSigninCreditDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.UNAUTHORIZED);
      expect(resultResponse.error).toEqual('Invalid credentials');
      done();
    });

    it('Should be able to return access token when sigin success', async (done: jest.DoneCallback) => {
      mockSigninCreditDto = {
        email: 'unit-test1@gmail.com',
        password: '123',
      };
      const mockedUser = await MockUser();
      userRepository.validateUserPassword = jest.fn().mockReturnValueOnce(mockedUser);
      mockPayload = {
        id: mockedUser.id,
        username: mockedUser.username,
        role: EUser.EUserRole.USER,
        licence: 'onepiece',
      };
      jwtService.sign = jest.fn().mockReturnValueOnce('testToken');
      const result = await userService.signIn(mockSigninCreditDto);
      const resultResponse = result as IShare.IResponseBase<string>;
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.statusCode).toEqual(HttpStatus.OK);
      expect(resultResponse.message).toEqual('testToken');
      done();
    });

    it('Should be able to return internal server error when exception is caught', async (done: jest.DoneCallback) => {
      mockSigninCreditDto = {
        email: 'unit-test1@gmail.com',
        password: '123',
      };
      userRepository.validateUserPassword = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await userService.signIn(mockSigninCreditDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });
  });

  describe('# Get User', () => {
    afterEach(() => {
      mockUserInfo = null;
    });

    it('Should return unauthorized error exception when user is not defined', async (done: jest.DoneCallback) => {
      const result = userService.getUser(mockUserInfo);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.UNAUTHORIZED);
      expect(resultResponse.error).toEqual('No user existed');
      done();
    });

    it('Should return user info when user is defined', async (done: jest.DoneCallback) => {
      mockUserInfo = {
        id: '123',
        role: 'user',
        username: 'test',
        licence: 'onepiece',
        email: 'test@test.com',
      };
      const result = userService.getUser(mockUserInfo);
      const resultResponse = result as IShare.IResponseBase<{ user: IUser.JwtPayload }>;
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.statusCode).toEqual(HttpStatus.OK);
      expect(resultResponse.message.user).toEqual(mockUserInfo);
      done();
    });
  });

  describe('# Get Users', () => {
    afterEach(() => {
      mockUserInfo = null;
      mockUserSearchDto = null;
    });

    it('Should return user not found when no user is founded', async (done: jest.DoneCallback) => {
      mockUserInfo = {
        role: EUser.EUserRole.USER,
      };
      mockUserSearchDto = {};
      userRepository.getUsers = jest.fn().mockReturnValueOnce({ users: undefined, count: 0, take: 10, skip: 0 });
      const result = await userService.getUsers(mockUserInfo, mockUserSearchDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.NOT_FOUND);
      expect(resultResponse.error).toEqual('User Not Found');
      done();
    });

    it('Should be able to return multiple users', async (done: jest.DoneCallback) => {
      mockUserInfo = {
        role: EUser.EUserRole.USER,
      };
      mockUserSearchDto = {};
      const mockedUsers = await MockUser();
      userRepository.getUsers = jest.fn().mockReturnValueOnce({ users: [mockedUsers], count: 1, take: 10, skip: 0 });
      const result = await userService.getUsers(mockUserInfo, mockUserSearchDto);
      const resultResponse = result as IShare.IResponseBase<IShare.IUsersPagingResponseBase<User[]>>;
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.statusCode).toEqual(HttpStatus.OK);
      expect(resultResponse.message.count).toEqual(1);
      expect(resultResponse.message.take).toEqual(10);
      expect(resultResponse.message.skip).toEqual(0);
      expect(resultResponse.message.users[0].id).toEqual(mockedUsers.id);
      done();
    });

    it('Should be able to return internal server error when exception is caught', async (done: jest.DoneCallback) => {
      mockUserInfo = {
        role: EUser.EUserRole.USER,
      };
      mockUserSearchDto = {};
      const mockedUsers = await MockUser();
      userRepository.getUsers = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await userService.getUsers(mockUserInfo, mockUserSearchDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });
  });
});
