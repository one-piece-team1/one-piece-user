import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { GoogleStrategy, JwtStrategy, FacebookStrategy } from './strategy';
import { config } from '../../config';
import { TripRepository } from '../trips/trip.repository';
import { UserEventSubscribers } from '../subscribers';
import { PostRepository } from '../posts/post.repository';
import { UploadeService } from './uploads/cloudinary.service';

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
  ],
  controllers: [UserController],
  providers: [UserService, JwtStrategy, GoogleStrategy, FacebookStrategy, UserEventSubscribers, UploadeService],
  exports: [PassportModule],
})
export class UserModule {}
