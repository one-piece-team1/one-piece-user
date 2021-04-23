import { Test, TestingModule } from '@nestjs/testing';
import { getCustomRepositoryToken } from '@nestjs/typeorm';
import { Connection, createConnection } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../users/user.entity';
import { Trip } from '../../trips/trip.entity';
import { Post } from '../../posts/post.entity';
import { UserHandlerFactory } from '../../handlers';
import { SigninCreditDto, UpdateSubscription, UpdateUserAdditionalInfoInServerDto, UserCreditDto, UserForgetDto, UserThirdDto, UserUpdatePassDto, VerifyUpdatePasswordDto, UserSearchDto } from '../../users/dto';
import { UserRepository } from '../../users/user.repository';
import { testOrmconfig } from '../../config/orm.config';
import * as EUser from '../../users/enums';

jest.mock('../../handlers');
describe('# User Repository', () => {
  let connection: Connection;
  let userRepository: UserRepository;
  let id: string = '';

  // mock
  let mockCreateUserDto: UserCreditDto;
  let mockThridCreateUserDto: UserThirdDto;
  let mockSigninCreditDto: SigninCreditDto;
  let mockUserSearchDto: UserSearchDto;
  let mockUserForgetDto: UserForgetDto;
  let mockVerifyUpdatePasswordDto: VerifyUpdatePasswordDto;
  let mockUserUpdatePassDto: UserUpdatePassDto;
  let mockUpdateSubscriptionDto: UpdateSubscription;
  let mockUpdateUserAdditionalInfoInServerDto: UpdateUserAdditionalInfoInServerDto;

  beforeAll(async (done: jest.DoneCallback) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getCustomRepositoryToken(UserRepository),
          useClass: UserRepository,
        },
      ],
    }).compile();
    connection = await createConnection(testOrmconfig([User, Trip, Post]));
    User.useConnection(connection);
    Trip.useConnection(connection);
    Post.useConnection(connection);
    userRepository = module.get(getCustomRepositoryToken(UserRepository));
    done();
  });

  afterAll(async (done: jest.DoneCallback) => {
    await connection.close();
    done();
  });

  it('User Repository should be created', () => {
    expect(userRepository).toBeDefined();
  });

  describe('# Signup User', () => {
    afterEach(() => {
      mockCreateUserDto = null;
    });

    it('Should be able to create user', async (done: jest.DoneCallback) => {
      mockCreateUserDto = {
        username: 'unit-test1',
        email: 'unit-test1@gmail.com',
        password: 'Aabc123',
      };
      const result = await userRepository.signUp(mockCreateUserDto);
      expect(result.username).toEqual(mockCreateUserDto.username);
      expect(result.email).toEqual(mockCreateUserDto.email);
      id = result.id;
      done();
    });

    it('Should be able to throw exception when duplicate username data found', async (done: jest.DoneCallback) => {
      mockCreateUserDto = {
        username: 'unit-test1',
        email: 'unit-test1@gmail.com',
        password: 'Aabc123',
      };
      try {
        await userRepository.signUp(mockCreateUserDto);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toEqual(`Username: ${mockCreateUserDto.username} or Email: ${mockCreateUserDto.email} already exists`);
      }
      done();
    });

    it('Should be able to throw exception when duplicate email data found', async (done: jest.DoneCallback) => {
      mockCreateUserDto = {
        username: 'unit-test2',
        email: 'unit-test1@gmail.com',
        password: 'Aabc123',
      };
      try {
        await userRepository.signUp(mockCreateUserDto);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toEqual(`Username: ${mockCreateUserDto.username} or Email: ${mockCreateUserDto.email} already exists`);
      }
      done();
    });
  });

  describe('# Third Party Signup User', () => {
    afterEach(() => {
      mockThridCreateUserDto = null;
    });

    it('Should be able to create user', async (done: jest.DoneCallback) => {
      mockThridCreateUserDto = {
        username: 'unit-test2',
        email: 'unit-test2@gmail.com',
      };
      UserHandlerFactory.createUser = jest.fn().mockImplementationOnce(() => ({}));
      const result = await userRepository.thirdPartySignUp(mockThridCreateUserDto);
      expect(typeof result).toEqual('string');
      done();
    });

    it('Should be able to throw exception when duplicate username data found', async (done: jest.DoneCallback) => {
      mockThridCreateUserDto = {
        username: 'unit-test2',
        email: 'unit-test2@gmail.com',
      };
      try {
        await userRepository.thirdPartySignUp(mockThridCreateUserDto);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toEqual(`Username: ${mockThridCreateUserDto.username} or Email: ${mockThridCreateUserDto.email} already exists`);
      }
      done();
    });

    it('Should be able to throw exception when duplicate email data found', async (done: jest.DoneCallback) => {
      mockThridCreateUserDto = {
        username: 'unit-test3',
        email: 'unit-test2@gmail.com',
      };
      try {
        await userRepository.thirdPartySignUp(mockThridCreateUserDto);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toEqual(`Username: ${mockThridCreateUserDto.username} or Email: ${mockThridCreateUserDto.email} already exists`);
      }
      done();
    });
  });

  describe('# Validate user password', () => {
    afterEach(() => {
      mockSigninCreditDto = null;
    });

    it('Should be able to validate user', async (done: jest.DoneCallback) => {
      mockSigninCreditDto = {
        email: 'unit-test1@gmail.com',
        password: 'Aabc123',
      };
      const result = await userRepository.validateUserPassword(mockSigninCreditDto);
      expect(result.email).toEqual(mockSigninCreditDto.email);
      done();
    });

    it('Should not be able to validate user', async (done: jest.DoneCallback) => {
      mockSigninCreditDto = {
        email: 'fake@gmail.com',
        password: 'Aabc123',
      };
      const result = await userRepository.validateUserPassword(mockSigninCreditDto);
      expect(result).toEqual(null);
      done();
    });
  });

  describe('# Get Users', () => {
    afterEach(() => {
      mockUserSearchDto = null;
    });

    it('Should be able to get users', async (done: jest.DoneCallback) => {
      mockUserSearchDto = {
        sort: 'DESC',
        keyword: 'unit',
      };
      const result = await userRepository.getUsers(mockUserSearchDto, false);
      expect(result.users.length).toEqual(2);
      expect(result.count).toEqual(2);
      expect(result.take).toEqual(10);
      expect(result.skip).toEqual(0);
      done();
    });
  });

  describe('# Get User By Id', () => {
    it('Should be able to get user by id', async (done: jest.DoneCallback) => {
      const result = await userRepository.getUserById(id, false);
      expect(result.id).toEqual(id);
      done();
    });

    it('Should be able not get user when not exist', async (done: jest.DoneCallback) => {
      const result = await userRepository.getUserById(uuidv4(), false);
      expect(result).toEqual(null);
      done();
    });

    it('Should be able throw exception when id is not uuid', async (done: jest.DoneCallback) => {
      try {
        await userRepository.getUserById('123', false);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toMatch(/(invalid|syntax|uuid)/gi);
      }
      done();
    });
  });

  describe('# Create User Forget Dto', () => {
    afterEach(() => {
      mockUserForgetDto = null;
    });

    it('Should be able to find user', async (done: jest.DoneCallback) => {
      mockUserForgetDto = {
        email: 'unit-test1@gmail.com',
      };
      const result = await userRepository.createUserForget(mockUserForgetDto);
      expect(result.email).toEqual(mockUserForgetDto.email);
      done();
    });

    it('Should not be able to find user and throw exception', async (done: jest.DoneCallback) => {
      mockUserForgetDto = {
        email: 'unit-test4@gmail.com',
      };
      try {
        await userRepository.createUserForget(mockUserForgetDto);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toEqual('Invalid user');
      }
      done();
    });
  });

  describe('# Verify Update Password', () => {
    afterEach(() => {
      mockVerifyUpdatePasswordDto = null;
    });

    it('Should be able to verify password', async (done: jest.DoneCallback) => {
      mockVerifyUpdatePasswordDto = {
        key: 'test',
        password: 'Labc123',
      };
      const result = await userRepository.verifyUpdatePassword(mockVerifyUpdatePasswordDto, id);
      expect(result).not.toEqual(undefined);
      done();
    });
  });

  describe('# Update user password', () => {
    afterEach(() => {
      mockUserUpdatePassDto = null;
    });

    it('Should not be able to update password when user not existed', async (done: jest.DoneCallback) => {
      mockUserUpdatePassDto = {
        oldPassword: 'Babc1234',
        newPassword: 'KAbc123',
      };
      try {
        await userRepository.userUpdatePassword(mockUserUpdatePassDto, uuidv4());
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toEqual('Invalid Password');
      }
      done();
    });

    it('Should not be able to update password when old password is invalid', async (done: jest.DoneCallback) => {
      mockUserUpdatePassDto = {
        oldPassword: 'Babc1234',
        newPassword: 'KAbc123',
      };
      try {
        await userRepository.userUpdatePassword(mockUserUpdatePassDto, id);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toEqual('Invalid Password');
      }
      done();
    });

    it('Should not be able to update password when new password is invalid', async (done: jest.DoneCallback) => {
      mockUserUpdatePassDto = {
        oldPassword: 'Labc123',
        newPassword: 'Labc123',
      };
      try {
        await userRepository.userUpdatePassword(mockUserUpdatePassDto, id);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toEqual('Cannot use previous password');
      }
      done();
    });

    it('Should be able to update password', async (done: jest.DoneCallback) => {
      mockUserUpdatePassDto = {
        oldPassword: 'Labc123',
        newPassword: 'Kabc123',
      };
      const result = await userRepository.userUpdatePassword(mockUserUpdatePassDto, id);
      expect(result).not.toEqual(undefined);
      done();
    });
  });

  describe('# Update user subscription plan', () => {
    afterEach(() => {
      mockUpdateSubscriptionDto = null;
    });

    it('Should not be able to update user subscription plan when user not found', async (done: jest.DoneCallback) => {
      mockUpdateSubscriptionDto = {
        role: EUser.EUserRole.ADMIN,
        subRange: 5,
      };
      try {
        await userRepository.updateSubscribePlan(mockUpdateSubscriptionDto, uuidv4());
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toEqual('User not found');
      }
      done();
    });

    it('Should not be able to update user subscription plan when user not found', async (done: jest.DoneCallback) => {
      mockUpdateSubscriptionDto = {
        role: EUser.EUserRole.ADMIN,
        subRange: 5,
      };
      const result = await userRepository.updateSubscribePlan(mockUpdateSubscriptionDto, id);
      expect(result.message).toEqual('Update subscribe success');
      done();
    });
  });

  describe('# Update user additional information', () => {
    afterEach(() => {
      mockUpdateUserAdditionalInfoInServerDto = null;
    });

    it('Should not be able to update user additional info when user not found', async (done: jest.DoneCallback) => {
      mockUpdateUserAdditionalInfoInServerDto = {
        desc: 'test',
      };
      try {
        await userRepository.updateUserAdditionalInfo(mockUpdateUserAdditionalInfoInServerDto, uuidv4());
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toEqual('User not found');
      }
      done();
    });

    it('Should be able to update user additional info', async (done: jest.DoneCallback) => {
      mockUpdateUserAdditionalInfoInServerDto = {
        desc: 'test',
      };
      const result = await userRepository.updateUserAdditionalInfo(mockUpdateUserAdditionalInfoInServerDto, id);
      expect(result.desc).toEqual(mockUpdateUserAdditionalInfoInServerDto.desc);
      done();
    });

    it('Should be able to update user additional info with files', async (done: jest.DoneCallback) => {
      mockUpdateUserAdditionalInfoInServerDto = {
        files: [
          {
            fieldname: 'test',
            originalname: 'test',
            encoding: '',
            mimetype: 'image/jpeg',
            size: 1024,
            buffer: Buffer.from([]),
          },
        ],
      };
      const result = await userRepository.updateUserAdditionalInfo(mockUpdateUserAdditionalInfoInServerDto, id);
      expect(result.profileImage).toMatch(/(user|test)/gi);
      done();
    });
  });

  describe('# Soft Delete User', () => {
    it('Should not be able to soft delete user when user not found', async (done: jest.DoneCallback) => {
      try {
        await userRepository.softDeleteUser(uuidv4());
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toEqual('User not found');
      }
      done();
    });

    it('Should be able to soft delete user when user found', async (done: jest.DoneCallback) => {
      const result = await userRepository.softDeleteUser(id);
      expect(result).toEqual(true);
      done();
    });
  });
});
