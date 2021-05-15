import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { JwtStrategy } from '../../users/strategy/jwt-strategy';
import { User } from '../../users/user.entity';
import { UserRepository } from '../../users/user.repository';
import * as IUser from '../../users/interfaces';

function MockUser(): User {
  const user = new User();
  user.id = uuidv4();
  user.username = 'unit-test1';
  user.email = 'unit-test1@gmail.com';
  user.password = 'Aabc123';
  user.salt = '123';
  user.expiredDate = new Date();
  return user;
}

describe('# JWT Strategy', () => {
  let jwtStrategy: JwtStrategy;
  let userRepository: UserRepository;
  const mockRequest = {
    headers: {
      authorization: 'mockToken',
    },
  } as Request;
  let mockPayload: IUser.JwtPayload;
  let mockUser: User;

  beforeEach(async () => {
    const moudle: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();
    jwtStrategy = moudle.get<JwtStrategy>(JwtStrategy);
    userRepository = moudle.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('# JwtStrategy should be created', () => {
    expect(jwtStrategy).toBeDefined();
  });

  describe('# Validate', () => {
    it('Should be able to throw exception when exp is expired', async (done: jest.DoneCallback) => {
      mockPayload = {
        username: 'lib1',
        exp: new Date('2000/01/01').getTime() / 1000,
      };
      try {
        await jwtStrategy.validate(mockRequest, mockPayload);
      } catch (error) {
        expect(error.message).toEqual('Token is expired');
      }
      done();
    });

    it('Should be able to throw exception when token is blacklisted', async (done: jest.DoneCallback) => {
      mockPayload = {
        username: 'lib1',
        exp: new Date('2050/01/01').getTime(),
      };
      jwtStrategy.redisClient.lrange = jest.fn().mockReturnValue(['mockToken']);
      try {
        await jwtStrategy.validate(mockRequest, mockPayload);
      } catch (error) {
        expect(error.message).toEqual('Token is invalid');
      }
      done();
    });

    it('Should be able to throw exception when user is not found', async (done: jest.DoneCallback) => {
      mockPayload = {
        username: 'lib1',
        exp: new Date('2050/01/01').getTime(),
      };
      userRepository.findOne = jest.fn().mockReturnValue(undefined);
      try {
        await jwtStrategy.validate(mockRequest, mockPayload);
      } catch (error) {
        expect(error.message).toEqual('User not found');
      }
      done();
    });

    it('Should be able to throw exception when user is not found', async (done: jest.DoneCallback) => {
      mockPayload = {
        username: 'lib1',
        exp: new Date('2050/01/01').getTime(),
        licence: 'test',
      };
      mockUser = MockUser();
      userRepository.findOne = jest.fn().mockReturnValue(mockUser);
      const user = await jwtStrategy.validate(mockRequest, mockPayload);
      expect(user.id).toEqual(mockUser.id);
      expect(user.username).toEqual(mockUser.username);
      expect(user.email).toEqual(mockUser.email);
      expect(user['licence']).toEqual('test');
      done();
    });
  });
});
