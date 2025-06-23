import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { IAuthRepository } from '../common/interfaces/auth-repository.interface';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async storeRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  async findRefreshToken(token: string) {
    return this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async deleteRefreshToken(tokenId: string): Promise<void> {
    await this.prisma.refreshToken.delete({
      where: { id: tokenId },
    });
  }

  async deleteAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async deleteUserRefreshTokens(userId: string, token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token,
      },
    });
  }
}
