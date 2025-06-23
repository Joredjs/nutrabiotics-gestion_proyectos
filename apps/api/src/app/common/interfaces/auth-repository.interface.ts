export interface IAuthRepository {
  storeRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<void>;
  findRefreshToken(token: string): Promise<any | null>;
  deleteRefreshToken(tokenId: string): Promise<void>;
  deleteAllRefreshTokens(userId: string): Promise<void>;
  deleteUserRefreshTokens(userId: string, token: string): Promise<void>;
}
