import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, createConnection, getRepository, Connection } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/user.entity';
import { Trip } from '../../trips/trip.entity';
import { Post } from '../../posts/post.entity';
import { MockUser, MockCreateTrip, MockCreatePost } from '../../libs/mock_data';
import { testOrmconfig } from '../../config/orm.config';

describe('# Post Entity', () => {
  let connection: Connection;
  let userRepository: Repository<User>;
  let tripRepository: Repository<Trip>;
  let postRepository: Repository<Post>;
  let id: string;

  beforeAll(async () => {
    await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(Trip),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Post),
          useClass: Repository,
        },
      ],
    }).compile();
    connection = await createConnection(testOrmconfig([User, Trip, Post]));
    tripRepository = getRepository(Trip, 'testConnection');
    userRepository = getRepository(User, 'testConnection');
    postRepository = getRepository(Post, 'testConnection');
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('# Create Post', () => {
    it('Should be able to create post', async (done: jest.DoneCallback) => {
      const user = new User();
      const mockCreateUser = await MockUser();
      Object.assign(user, mockCreateUser);
      user.salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash('Aabc123', user.salt);
      const userResult = await userRepository.save(user);

      const trip = new Trip();
      const mockCreateTrip = MockCreateTrip();
      Object.assign(trip, mockCreateTrip);
      trip.publisher = userResult;
      const tripResult = await tripRepository.save(trip);

      const post = new Post();
      const mockCreatePost = MockCreatePost();
      Object.assign(post, mockCreatePost);
      post.publisher = userResult;
      post.trip = tripResult;
      const postResult = await postRepository.save(post);
      expect(postResult.id).toEqual(post.id);
      expect(postResult.trip.id).toEqual(tripResult.id);
      expect(postResult.publisher.id).toEqual(userResult.id);
      id = postResult.id;
      done();
    });

    describe('# Get Post by Id', () => {
      it('Should be able to get post', async (done: jest.DoneCallback) => {
        const post = await postRepository.findOne({ where: { id } });
        expect(post).not.toEqual(undefined);
        done();
      });
    });

    describe('# Update Post by Id', () => {
      it('Should be able to update post by id', async (done: jest.DoneCallback) => {
        const post = await postRepository.findOne({ where: { id } });
        post.content = 'test2';
        const result = await postRepository.save(post);
        expect(result.content).toEqual('test2');
        done();
      });
    });

    describe('# Delete Post By Id', () => {
      it('Should be able to delete post by id', async (done: jest.DoneCallback) => {
        await postRepository.delete(id);
        const post = await postRepository.findOne({ where: { id } });
        expect(post).toEqual(undefined);
        done();
      });
    });
  });
});
