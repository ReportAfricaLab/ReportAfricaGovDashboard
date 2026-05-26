import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsNumber } from 'class-validator';

class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @IsString()
  @MinLength(2)
  displayName: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MaxLength(2)
  country: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

class OAuthDto {
  @IsString()
  provider: string; // google, apple

  @IsString()
  token: string;

  @IsString()
  @IsOptional()
  country?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('oauth')
  oauth(@Body() dto: OAuthDto) {
    return this.authService.oauthLogin(dto.provider, dto.token, dto.country);
  }
}
