import { IsString, MinLength, MaxLength, Matches, IsEmail, IsOptional, IsInt, Min, Max, IsIn, IsUUID, IsNumber } from 'class-validator';
import * as EUser from '../enums';
import * as IUser from '../interfaces';

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

export class UpdatePasswordEventDto {
  @IsUUID()
  id: string;

  @IsString()
  salt: string;

  @IsString()
  password: string;
}

export class DeleteUserEventDto {
  @IsUUID()
  id: string;
}

export class UpdateUserAdditionalInfoDto {
  @IsOptional()
  gender?: EUser.EUserGender;

  @IsOptional()
  age?: number;

  @IsOptional()
  desc?: string;
}

export class UpdateUserAdditionalInfoInServerDto extends UpdateUserAdditionalInfoDto {
  @IsOptional()
  files?: IUser.BufferedFile[];
}

export class UpdateUserAdditionalInfoPublishDto extends UpdateUserAdditionalInfoDto {
  @IsUUID()
  id: string;

  @IsOptional()
  profileImage?: string;
}

export class UserSearchDto {
  @IsOptional()
  @IsNumber()
  take?: number;

  @IsOptional()
  @IsNumber()
  skip?: number;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  sort?: 'ASC' | 'DESC';
}
