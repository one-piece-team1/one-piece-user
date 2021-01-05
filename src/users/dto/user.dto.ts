import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import * as EUser from '../enums';

export class UserCreditDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password: string;
}

export class UserThirdDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @IsOptional()
  @IsEmail()
  email: string;
}

export class SigninCreditDto {
  @IsOptional()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password: string;
}

export class UserForgetDto {
  @IsOptional()
  @IsEmail()
  email: string;
}

export class VerifyKeyDto {
  @IsString()
  key: string;
}

export class VerifyUpdatePasswordDto {
  @IsString()
  key: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password: string;
}

export class UserUpdatePassDto {
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  oldPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  newPassword: string;
}
export class UpdateSubscription {
  // user cannot update back to trial or user cannot update to admin
  @IsIn([EUser.EUserRole.USER, EUser.EUserRole.VIP1, EUser.EUserRole.VIP2])
  role: EUser.EUserRole;

  @IsInt()
  @Min(1)
  @Max(12)
  subRange: number;
}
