import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { StrictThrottlerGuard } from '../../common/guards/throttle.guard';
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
  @IsString()
  phone?: string;

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

class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

@Controller('auth')
@UseGuards(StrictThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('oauth')
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  oauth(@Body() dto: OAuthDto) {
    return this.authService.oauthLogin(dto.provider, dto.token, dto.country);
  }

  @Post('forgot-password')
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
