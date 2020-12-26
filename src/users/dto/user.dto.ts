import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsOptional,
} from 'class-validator';

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
