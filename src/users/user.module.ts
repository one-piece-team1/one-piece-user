import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { JwtStrategy } from './jwt-strategy';
import { config } from '../../config';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false,
    }),
    JwtModule.register({
      secret: config.JWT.SECRET,
      signOptions: {
        algorithm: 'HS256',
        expiresIn: '7d',
        issuer: 'one-piece',
      },
      verifyOptions: {
        algorithms: ['HS256'],
      },
    }),
    TypeOrmModule.forFeature([UserRepository]),
  ],
  controllers: [UserController],
  providers: [UserService, JwtStrategy],
  exports: [PassportModule],
})
export class UserModule {}
