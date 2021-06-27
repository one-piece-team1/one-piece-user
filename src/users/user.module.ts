import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CqrsModule } from '@nestjs/cqrs';
import { EventStoreDBModule } from '../domains/databases/event-store-db.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { GoogleStrategy, JwtStrategy, FacebookStrategy } from './strategy';
import { config } from '../../config';
import { TripRepository } from '../trips/trip.repository';
import { UserEventSubscribers } from '../subscribers';
import { PostRepository } from '../posts/post.repository';
import { UploadeService } from './uploads/cloudinary.service';
import { UserEventStoreHandlers } from '../domains/user-events/commands/handlers';
import { UserEventStoreRepository } from '../domains/user-events/stores/user-event.store';
import { UserEventStoreProvider } from '../domains/user-events/providers/user-event.provider';
import { UserKafkaProudcerService } from '../publishers/userevent.producer';
import { UserKakfaConsumerService } from '../consumers/user.consumer';
import { UserResponseKafkaService } from '../domains/user-events/handlers/user-response.handler';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: true,
    }),
    JwtModule.register({
      secret: config.JWT.SECRET,
      signOptions: {
        algorithm: 'HS256',
        expiresIn: '1h',
        issuer: 'one-piece',
      },
      verifyOptions: {
        algorithms: ['HS256'],
      },
    }),
    TypeOrmModule.forFeature([UserRepository, TripRepository, PostRepository]),
    CqrsModule,
    EventStoreDBModule,
  ],
  controllers: [UserController],
  providers: [UserService, JwtStrategy, GoogleStrategy, FacebookStrategy, UserEventSubscribers, UploadeService, ...UserEventStoreHandlers, UserEventStoreRepository, ...UserEventStoreProvider, UserKafkaProudcerService, UserKakfaConsumerService, UserResponseKafkaService],
  exports: [PassportModule],
})
export class UserModule {}
