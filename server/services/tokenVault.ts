import { storage } from '../storage';
import type { InsertToken, Token } from '@shared/schema';
import crypto from 'crypto';

// Require a stable encryption key - use development key in dev mode, fail fast in production
let ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  if (process.env.NODE_ENV === 'development') {
    // Use a stable development key (DO NOT USE IN PRODUCTION)
    ENCRYPTION_KEY = 'a'.repeat(64);
    console.warn('[TokenVault] Using development encryption key. Set TOKEN_ENCRYPTION_KEY for production.');
  } else {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable must be set and at least 64 characters (32 bytes hex)');
  }
}

if (ENCRYPTION_KEY.length < 64) {
  throw new Error('TOKEN_ENCRYPTION_KEY must be at least 64 characters (32 bytes hex)');
}

const ALGORITHM = 'aes-256-gcm';

class TokenVault {
  private encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  private decrypt(encrypted: string, iv: string, tag: string): string {
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async storeToken(
    userId: string,
    provider: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date
  ): Promise<Token> {
    const encryptedAccess = this.encrypt(accessToken);
    const encryptedRefresh = refreshToken ? this.encrypt(refreshToken) : null;

    const existingToken = await storage.getTokenByUserAndProvider(userId, provider);
    
    if (existingToken) {
      return storage.updateToken(existingToken.id, {
        accessToken: JSON.stringify(encryptedAccess),
        refreshToken: encryptedRefresh ? JSON.stringify(encryptedRefresh) : null,
        expiresAt,
        updatedAt: new Date()
      });
    }

    const tokenData: InsertToken = {
      userId,
      provider,
      accessToken: JSON.stringify(encryptedAccess),
      refreshToken: encryptedRefresh ? JSON.stringify(encryptedRefresh) : null,
      expiresAt
    };

    return storage.createToken(tokenData);
  }

  async getToken(userId: string, provider: string): Promise<{ 
    accessToken: string; 
    refreshToken?: string;
    expiresAt?: Date;
  } | null> {
    const token = await storage.getTokenByUserAndProvider(userId, provider);
    
    if (!token) return null;

    try {
      const accessData = JSON.parse(token.accessToken);
      const decryptedAccess = this.decrypt(
        accessData.encrypted,
        accessData.iv,
        accessData.tag
      );

      let decryptedRefresh: string | undefined;
      if (token.refreshToken) {
        const refreshData = JSON.parse(token.refreshToken);
        decryptedRefresh = this.decrypt(
          refreshData.encrypted,
          refreshData.iv,
          refreshData.tag
        );
      }

      return {
        accessToken: decryptedAccess,
        refreshToken: decryptedRefresh,
        expiresAt: token.expiresAt || undefined
      };
    } catch (error) {
      console.error('Error decrypting token:', error);
      return null;
    }
  }

  async refreshToken(userId: string, provider: string): Promise<Token | null> {
    const tokenData = await this.getToken(userId, provider);
    
    if (!tokenData?.refreshToken) {
      return null;
    }

    return null;
  }

  async revokeToken(userId: string, provider: string): Promise<boolean> {
    const token = await storage.getTokenByUserAndProvider(userId, provider);
    
    if (!token) return false;

    await storage.deleteToken(token.id);
    return true;
  }

  async getAllUserTokens(userId: string): Promise<Array<{ provider: string; expiresAt?: Date }>> {
    const tokens = await storage.getTokensByUserId(userId);
    
    return tokens.map(token => ({
      provider: token.provider,
      expiresAt: token.expiresAt || undefined
    }));
  }
}

export const tokenVault = new TokenVault();
