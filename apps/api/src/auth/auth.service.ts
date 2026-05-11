import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string; avatarUrl: string | null };
}

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(this.config.get<string>('GOOGLE_CLIENT_ID'));
  }

  async loginWithGoogle(idToken: string): Promise<AuthTokens> {
    const ticket = await this.googleClient
      .verifyIdToken({
        idToken,
        audience: this.config.get<string>('GOOGLE_CLIENT_ID'),
      })
      .catch(() => {
        throw new UnauthorizedException('Invalid Google id token');
      });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      throw new UnauthorizedException('Google token missing required fields');
    }

    const user = await this.prisma.user.upsert({
      where: { email: payload.email },
      update: {
        googleId: payload.sub,
        name: payload.name ?? payload.email,
        avatarUrl: payload.picture ?? null,
      },
      create: {
        email: payload.email,
        googleId: payload.sub,
        name: payload.name ?? payload.email,
        avatarUrl: payload.picture ?? null,
      },
    });

    return this.issueTokens(user.id, user.email, user.name, user.avatarUrl);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let decoded: { sub: string };
    try {
      decoded = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) throw new UnauthorizedException('User no longer exists');

    return this.issueTokens(user.id, user.email, user.name, user.avatarUrl);
  }

  private async issueTokens(
    userId: string,
    email: string,
    name: string,
    avatarUrl: string | null,
  ): Promise<AuthTokens> {
    const accessTtl = (this.config.get<string>('JWT_ACCESS_TTL') ?? '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`;
    const refreshTtl = (this.config.get<string>('JWT_REFRESH_TTL') ?? '30d') as `${number}${'s' | 'm' | 'h' | 'd'}`;

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessTtl,
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: userId },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshTtl,
      },
    );

    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, name, avatarUrl },
    };
  }
}
