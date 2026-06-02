import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';

interface RegisterDto {
  email: string;
  username: string;
  displayName: string;
  password: string;
  country: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const existingUsername = await this.usersService.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });

    const token = this.generateToken(user.id, user.email, user.country);
    return { user: { id: user.id, email: user.email, username: user.username, country: user.country }, token };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.email, user.country);
    return { user: { id: user.id, email: user.email, username: user.username, country: user.country }, token };
  }

  private generateToken(userId: string, email: string, country: string): string {
    return this.jwtService.sign({ sub: userId, email, country });
  }

  async oauthLogin(provider: string, token: string, country?: string) {
    // Verify token with provider
    const profile = await this.verifyOAuthToken(provider, token);
    if (!profile) throw new UnauthorizedException('Invalid OAuth token');

    // Find or create user
    let user = await this.usersService.findByEmail(profile.email);
    if (!user) {
      const username = profile.email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 6);
      user = await this.usersService.create({
        email: profile.email,
        username,
        displayName: profile.name || username,
        password: '', // OAuth users don't have passwords
        country: country || 'NG',
      });
    }

    const jwt = this.generateToken(user.id, user.email, user.country);
    return { user: { id: user.id, email: user.email, username: user.username, country: user.country }, token: jwt };
  }

  private async verifyOAuthToken(provider: string, token: string): Promise<{ email: string; name?: string } | null> {
    try {
      if (provider === 'google') {
        // Try as ID token first
        let res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        let data = await res.json();
        if (data.email) return { email: data.email, name: data.name };

        // Fallback: try as access token
        res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        data = await res.json();
        if (data.email) return { email: data.email, name: data.name };
      }
      if (provider === 'apple') {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload.email) return { email: payload.email, name: payload.name };
      }
    } catch {}
    return null;
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent' };

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.usersService.setPasswordResetToken(user.id, resetToken, resetExpires);

    // TODO: Send email with reset link (integrate email service later)
    // For now, log the token (remove in production with real email service)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { message: 'If that email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);
    if (!user) throw new BadRequestException('Invalid or expired reset token');

    if (user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePassword(user.id, hashedPassword);

    return { message: 'Password reset successful. You can now login.' };
  }
}
