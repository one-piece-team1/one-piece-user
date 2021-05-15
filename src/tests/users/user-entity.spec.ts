import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { Repository, createConnection, getRepository, Connection } from 'typeorm';
import { User } from '../../users/user.entity';
import { Trip } from '../../trips/trip.entity';
import { Post } from '../../posts/post.entity';
import { MockUser } from '../../libs/mock_data';
import { testOrmconfig } from '../../config/orm.config';

describe('# User Entity', () => {
  let connection: Connection;
  let repository: Repository<User>;
  let id: string = '';

  beforeAll(async (done: jest.DoneCallback) => {
    const moudle: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    connection = await createConnection(testOrmconfig([User, Trip, Post]));
    repository = getRepository(User, 'testConnection');

    done();
  });

  afterAll(async (done: jest.DoneCallback) => {
    await connection.close();
    done();
  });

  describe('# Create User', () => {
    it('Should be able to create user', async (done: jest.DoneCallback) => {
      const user = new User();
      const mockUser = await MockUser();
      Object.assign(user, mockUser);
      const result = await repository.save(user);
      expect(result.id).toEqual(mockUser.id);
      expect(result.role).toEqual('user');
      expect(result.expiredDate).toEqual(mockUser.expiredDate);
      expect(result.diamondCoin).toEqual(0);
      expect(result.goldCoin).toEqual(10);
      expect(result.username).toEqual(mockUser.username);
      expect(result.email).toEqual(mockUser.email);
      expect(result.password).toEqual(mockUser.password);
      expect(result.salt).toEqual(mockUser.salt);
      expect(user.expiredDate).toEqual(mockUser.expiredDate);
      expect(typeof result.createdAt).not.toEqual(undefined);
      expect(typeof result.updatedAt).not.toEqual(undefined);
      id = result.id;
      done();
    });
  });

  describe('# Get User By Id', () => {
    it('Should be able to get user', async (done) => {
      const user = await repository.findOne({ where: { id } });
      expect(user.username).toEqual('unit-test1');
      expect(user.email).toEqual('unit-test1@gmail.com');
      done();
    });
  });

  describe('# Update User By Id', () => {
    it('Should be able to update user', async (done) => {
      const user = await repository.findOne({ where: { id } });
      user.username = 'unit-test2';
      const result = await repository.save(user);
      expect(result.username).toEqual('unit-test2');
      expect(result.version).toEqual(2);
      done();
    });
  });

  describe('Validate Hash Password', () => {
    it('Should return true when password is valid', async (done: jest.DoneCallback) => {
      const user = await repository.findOne({ where: { id }, select: ['password', 'salt'] });
      const isValid = await user.validatePassword('Aabc123');
      expect(isValid).toEqual(true);
      done();
    });

    it('Should return false when password is inValid', async (done: jest.DoneCallback) => {
      const user = await repository.findOne({ where: { id }, select: ['password', 'salt'] });
      const isValid = await user.validatePassword('Aabc1234');
      expect(isValid).toEqual(false);
      done();
    });
  });

  describe('# Delete User By Id', () => {
    it('Should be able to delete user', async (done) => {
      const user = await repository.findOne({ where: { id } });
      user.status = false;
      const result = await repository.save(user);
      expect(result.status).toEqual(false);
      expect(result.version).toEqual(3);
      done();
    });
  });
});
