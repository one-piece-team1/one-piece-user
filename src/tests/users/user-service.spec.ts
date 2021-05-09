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
  let mockUserForgetDto: UserForgetDto;
  let mockVerifyKeyDto: VerifyKeyDto;
  let mockVerifyUpdatePasswordDto: VerifyUpdatePasswordDto;
  let mockUserUpdatePassDto: UserUpdatePassDto;
  let mockUpdateUserAdditionalInfoInServerDto: UpdateUserAdditionalInfoInServerDto;

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
      userRepository.getUsers = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await userService.getUsers(mockUserInfo, mockUserSearchDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });
  });

  describe('# Get User by Id', () => {
    afterEach(() => {
      mockUserInfo = null;
    });

    it('Should return user `id` not found when no user is founded', async (done: jest.DoneCallback) => {
      mockUserInfo = {
        role: EUser.EUserRole.USER,
      };
      userRepository.getUserById = jest.fn().mockReturnValueOnce(undefined);
      const result = await userService.getUserById('testId', mockUserInfo);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.NOT_FOUND);
      expect(resultResponse.error).toEqual('User testId not found');
      done();
    });

    it('Should be able to user when user is existed', async (done: jest.DoneCallback) => {
      mockUserInfo = {
        role: EUser.EUserRole.USER,
      };
      const mockedUser = await MockUser();
      userRepository.getUserById = jest.fn().mockReturnValueOnce(mockedUser);
      const result = await userService.getUserById(mockedUser.id, mockUserInfo);
      const resultResponse = result as IShare.IResponseBase<{ user: User }>;
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.statusCode).toEqual(HttpStatus.OK);
      expect(resultResponse.message.user.id).toEqual(mockedUser.id);
      done();
    });

    it('Should be able to return internal server error when exception is caught', async (done: jest.DoneCallback) => {
      mockUserInfo = {
        role: EUser.EUserRole.USER,
      };
      userRepository.getUserById = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await userService.getUserById('testId', mockUserInfo);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });
  });

  describe('# Google Login', () => {
    afterEach(() => {
      mockUserInfo = null;
    });

    it('Should return unauthorized error exception when user is not defined', async (done: jest.DoneCallback) => {
      const result = await userService.googleLogin(mockUserInfo);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.UNAUTHORIZED);
      expect(resultResponse.error).toEqual('No user existed');
      done();
    });

    it('Should return internal server error exception when google api provider went wrong', async (done: jest.DoneCallback) => {
      mockUserInfo = {
        username: '',
        email: '',
      };
      userRepository.thirdPartySignUp = jest.fn().mockReturnValueOnce({});
      const result = await userService.googleLogin(mockUserInfo);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Google signup provider failed');
      done();
    });

    it('Should return internal server error exception when mail handler is not working properly', async (done: jest.DoneCallback) => {
      const mockUser = await MockUser();
      mockUserInfo = {
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        role: mockUser.role,
      };
      userRepository.thirdPartySignUp = jest.fn().mockReturnValueOnce({ id: mockUser.id, tempPass: 'test123' });
      userService.mailSender = jest.fn().mockImplementationOnce(() => Promise.resolve(undefined));
      const result = await userService.googleLogin(mockUserInfo);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Google signup mail failed');
      done();
    });

    it('Should return user information from google', async (done: jest.DoneCallback) => {
      const mockUser = await MockUser();
      mockUserInfo = {
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        role: mockUser.role,
      };
      userRepository.thirdPartySignUp = jest.fn().mockReturnValueOnce({ id: mockUser.id, tempPass: 'test123' });
      userService.mailSender = jest.fn().mockImplementationOnce(() => Promise.resolve(true));
      const result = await userService.googleLogin(mockUserInfo);
      const resultResponse = result as IShare.IResponseBase<{ user: IUser.UserInfo }>;
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.statusCode).toEqual(HttpStatus.OK);
      expect(resultResponse.message.user.id).toEqual(mockUser.id);
      done();
    });
  });

  describe('# Facebook Login', () => {
    afterEach(() => {
      mockUserInfo = null;
    });

    it('Should return unauthorized error exception when user is not defined', async (done: jest.DoneCallback) => {
      const result = await userService.fbLogin(mockUserInfo);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.UNAUTHORIZED);
      expect(resultResponse.error).toEqual('No user existed');
      done();
    });

    it('Should return internal server error exception when facebook api provider went wrong', async (done: jest.DoneCallback) => {
      mockUserInfo = {
        username: '',
        email: '',
      };
      userRepository.thirdPartySignUp = jest.fn().mockReturnValueOnce({});
      const result = await userService.fbLogin(mockUserInfo);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Facebook signup provider failed');
      done();
    });

    it('Should return internal server error exception when mail handler is not working properly', async (done: jest.DoneCallback) => {
      const mockUser = await MockUser();
      mockUserInfo = {
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        role: mockUser.role,
      };
      userRepository.thirdPartySignUp = jest.fn().mockReturnValueOnce({ id: mockUser.id, tempPass: 'test123' });
      userService.mailSender = jest.fn().mockImplementationOnce(() => Promise.resolve(undefined));
      const result = await userService.fbLogin(mockUserInfo);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Facebook signup mail failed');
      done();
    });

    it('Should return user information from facebook', async (done: jest.DoneCallback) => {
      const mockUser = await MockUser();
      mockUserInfo = {
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        role: mockUser.role,
      };
      userRepository.thirdPartySignUp = jest.fn().mockReturnValueOnce({ id: mockUser.id, tempPass: 'test123' });
      userService.mailSender = jest.fn().mockImplementationOnce(() => Promise.resolve(true));
      const result = await userService.fbLogin(mockUserInfo);
      const resultResponse = result as IShare.IResponseBase<{ user: IUser.UserInfo }>;
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.statusCode).toEqual(HttpStatus.OK);
      expect(resultResponse.message.user.id).toEqual(mockUser.id);
      done();
    });
  });

  describe('# Create User Forget', () => {
    afterEach(() => {
      mockUserForgetDto = null;
    });

    it('Should return create user forget when user not existed', async (done: jest.DoneCallback) => {
      mockUserForgetDto = {
        email: '',
      };
      userRepository.createUserForget = jest.fn().mockReturnValueOnce(undefined);
      const result = await userService.createUserForget(mockUserForgetDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.UNAUTHORIZED);
      expect(resultResponse.error).toEqual('No user existed');
      done();
    });

    it('Should return create user forget when user not existed', async (done: jest.DoneCallback) => {
      mockUserForgetDto = {
        email: '',
      };
      const mockUser = await MockUser();
      userRepository.createUserForget = jest.fn().mockReturnValueOnce(mockUser);
      userService.mailSender = jest.fn().mockImplementation(() => Promise.resolve(undefined));
      const result = await userService.createUserForget(mockUserForgetDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('User forget mail failed');
      done();
    });

    it('Should return success result', async (done: jest.DoneCallback) => {
      mockUserForgetDto = {
        email: '',
      };
      const mockUser = await MockUser();
      userRepository.createUserForget = jest.fn().mockReturnValueOnce(mockUser);
      userService.mailSender = jest.fn().mockImplementation(() => Promise.resolve(true));
      const result = await userService.createUserForget(mockUserForgetDto);
      const resultResponse = result as IShare.IResponseBase<string>;
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.statusCode).toEqual(HttpStatus.OK);
      expect(resultResponse.message).toEqual('Send mail success');
      done();
    });

    it('Should return internal server error exception when mail handler is not working properly', async (done: jest.DoneCallback) => {
      mockUserForgetDto = {
        email: '',
      };
      userRepository.createUserForget = jest.fn().mockRejectedValueOnce(new Error('Invternal server error'));
      const result = await userService.createUserForget(mockUserForgetDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Invternal server error');
      done();
    });
  });

  describe('# Validate Verify key', () => {
    afterEach(() => {
      mockVerifyKeyDto = null;
    });

    it('Should not validate verify key', async (done: jest.DoneCallback) => {
      mockVerifyKeyDto = {
        key: '',
      };
      userService.redisClient.get = jest.fn().mockReturnValueOnce(undefined);
      const result = await userService.validateVerifyKey(mockVerifyKeyDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
      expect(resultResponse.error).toEqual('Invalid verify key');
      done();
    });

    it('Should validate verify key', async (done: jest.DoneCallback) => {
      mockVerifyKeyDto = {
        key: 'fakeKey',
      };
      userService.redisClient.get = jest.fn().mockReturnValueOnce('success');
      const result = await userService.validateVerifyKey(mockVerifyKeyDto);
      const resultResponse = result as IShare.IResponseBase<string>;
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.statusCode).toEqual(HttpStatus.OK);
      expect(resultResponse.message).toEqual('Verify success');
      done();
    });
  });

  describe('# Verify Update Password', () => {
    beforeEach(() => {
      mockVerifyUpdatePasswordDto = {
        key: '',
        password: '',
      };
    });

    afterEach(() => {
      mockVerifyUpdatePasswordDto = null;
    });

    it('Should reject where key is not existing', async (done: jest.DoneCallback) => {
      userService.redisClient.get = jest.fn().mockReturnValueOnce(undefined);
      const result = await userService.verifyUpdatePassword(mockVerifyUpdatePasswordDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
      expect(resultResponse.error).toEqual('Invalid validate key');
      done();
    });

    it('Should reject where user password refreshing is not working', async (done: jest.DoneCallback) => {
      userService.redisClient.get = jest.fn().mockReturnValueOnce('123');
      userRepository.verifyUpdatePassword = jest.fn().mockReturnValueOnce(undefined);
      const result = await userService.verifyUpdatePassword(mockVerifyUpdatePasswordDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.CONFLICT);
      expect(resultResponse.error).toEqual('Renew new password failed');
      done();
    });

    it('Should success when every coditions matches', async (done: jest.DoneCallback) => {
      const mockUser = await MockUser();
      userService.redisClient.get = jest.fn().mockReturnValueOnce('123');
      userRepository.verifyUpdatePassword = jest.fn().mockReturnValueOnce(mockUser);
      UserHandlerFactory.updateUserPassword = jest.fn().mockImplementation(() => {});
      const result = await userService.verifyUpdatePassword(mockVerifyUpdatePasswordDto);
      const resultResponse = result as IShare.IResponseBase<string>;
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.statusCode).toEqual(HttpStatus.OK);
      expect(resultResponse.message).toEqual('update password success');
      done();
    });

    it('Should success when every coditions matches', async (done: jest.DoneCallback) => {
      userService.redisClient.get = jest.fn().mockReturnValueOnce('123');
      userRepository.verifyUpdatePassword = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await userService.verifyUpdatePassword(mockVerifyUpdatePasswordDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });
  });

  describe('# User Update Password', () => {
    beforeEach(() => {
      mockUserUpdatePassDto = {
        oldPassword: '',
        newPassword: '',
      };
    });

    afterEach(() => {
      mockUserUpdatePassDto = null;
    });

    it('Should return reject when id is invalid', async (done: jest.DoneCallback) => {
      const result = await userService.userUpdatePassword(mockUserUpdatePassDto, '', '123');
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.FORBIDDEN);
      expect(resultResponse.error).toEqual('Invalid Id request');
      done();
    });

    it('Should return reject when user is invalid', async (done: jest.DoneCallback) => {
      userRepository.userUpdatePassword = jest.fn().mockReturnValueOnce(undefined);
      const result = await userService.userUpdatePassword(mockUserUpdatePassDto, '123', '123');
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.FORBIDDEN);
      expect(resultResponse.error).toEqual('User not found');
      done();
    });

    it('Should return reject when exception is caught', async (done: jest.DoneCallback) => {
      userRepository.userUpdatePassword = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await userService.userUpdatePassword(mockUserUpdatePassDto, '123', '123');
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });

    it('Should return reject when exception is caught', async (done: jest.DoneCallback) => {
      const userMock = await MockUser();
      userRepository.userUpdatePassword = jest.fn().mockReturnValueOnce(userMock);
      UserHandlerFactory.updateUserPassword = jest.fn().mockImplementationOnce(() => {});
      const result = await userService.userUpdatePassword(mockUserUpdatePassDto, '123', '123');
      const resultResponse = result as IShare.IResponseBase<string>;
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.statusCode).toEqual(HttpStatus.OK);
      expect(resultResponse.message).toEqual('Update password success');
      done();
    });
  });

  describe('# Update user additional information', () => {
    beforeEach(() => {
      mockUpdateUserAdditionalInfoInServerDto = {};
    });

    afterEach(() => {
      mockUpdateUserAdditionalInfoInServerDto = null;
    });

    it('Should return reject when id is invalid', async (done: jest.DoneCallback) => {
      const result = await userService.updateUserAdditionalInfo(mockUpdateUserAdditionalInfoInServerDto, '', '123');
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.FORBIDDEN);
      expect(resultResponse.error).toEqual('Invalid Id request');
      done();
    });

    it('Should return reject when update result is invalid', async (done: jest.DoneCallback) => {
      userRepository.updateUserAdditionalInfo = jest.fn().mockReturnValueOnce(undefined);
      const result = await userService.updateUserAdditionalInfo(mockUpdateUserAdditionalInfoInServerDto, '123', '123');
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.CONFLICT);
      expect(resultResponse.error).toEqual('Update user additional information failed');
      done();
    });

    it('Should return reject when update result is invalid', async (done: jest.DoneCallback) => {
      userRepository.updateUserAdditionalInfo = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await userService.updateUserAdditionalInfo(mockUpdateUserAdditionalInfoInServerDto, '123', '123');
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });

    it('Should return success when every conditioin is satisified', async (done: jest.DoneCallback) => {
      const userMock = await MockUser();
      userRepository.updateUserAdditionalInfo = jest.fn().mockReturnValueOnce(userMock);
      UserHandlerFactory.updateUserAdditionalInfo = jest.fn().mockImplementationOnce(() => {});
      const result = await userService.updateUserAdditionalInfo(mockUpdateUserAdditionalInfoInServerDto, '123', '123');
      const resultResponse = result as IShare.IResponseBase<User>;
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.statusCode).toEqual(HttpStatus.OK);
      expect(resultResponse.message).toEqual(userMock);
      done();
    });
  });

  describe('# Soft Delete User', () => {
    it('Shoud return reject when id is invalid', async (done: jest.DoneCallback) => {
      const result = await userService.softDeleteUser('', '123');
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.FORBIDDEN);
      expect(resultResponse.error).toEqual('Invalid Id request');
      done();
    });

    it('Shoud return reject when soft delete failed', async (done: jest.DoneCallback) => {
      userRepository.softDeleteUser = jest.fn().mockReturnValueOnce(undefined);
      const result = await userService.softDeleteUser('123', '123');
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.CONFLICT);
      expect(resultResponse.error).toEqual('Soft delete user failed');
      done();
    });

    it('Shoud return reject when exception is caught', async (done: jest.DoneCallback) => {
      userRepository.softDeleteUser = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await userService.softDeleteUser('123', '123');
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });

    it('Shoud return no content when soft delete success', async (done: jest.DoneCallback) => {
      userRepository.softDeleteUser = jest.fn().mockReturnValueOnce(true);
      const result = await userService.softDeleteUser('123', '123');
      const resultResponse = result as IShare.IResponseBase<unknown>;
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.statusCode).toEqual(HttpStatus.NO_CONTENT);
      done();
    });
  });

  describe('# Logout User', () => {
    it('Should log out user', async (done: jest.DoneCallback) => {
      userService.redisClient.lpush = jest.fn().mockReturnValueOnce(1);
      const result = await userService.logOut('123');
      const resultResponse = result as IShare.IResponseBase<string>;
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.statusCode).toEqual(HttpStatus.OK);
      expect(resultResponse.message).toEqual('Logout success');
      done();
    });

    it('Should return reject when exception is caught', async (done: jest.DoneCallback) => {
      userService.redisClient.lpush = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await userService.logOut('123');
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });
  });
});
