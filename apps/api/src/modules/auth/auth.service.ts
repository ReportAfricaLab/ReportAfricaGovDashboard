import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

interface RegisterDto {
  email: string;
  username: string;
  displayName: string;
  password: string;
  country: string;
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
        const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        const data = await res.json();
        if (data.email) return { email: data.email, name: data.name };
      }
      if (provider === 'apple') {
        // Apple token verification — decode JWT payload
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload.email) return { email: payload.email, name: payload.name };
      }
    } catch {}
    return null;
  }
}
