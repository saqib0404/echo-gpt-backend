import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(
    private readonly configService:
      ConfigService,
  ) {
    const encodedKey =
      this.configService.get<string>(
        'provider.encryptionKey',
      );

    if (!encodedKey) {
      throw new Error(
        'PROVIDER_ENCRYPTION_KEY is not configured',
      );
    }

    this.key = Buffer.from(
      encodedKey,
      'base64',
    );

    if (this.key.length !== 32) {
      throw new Error(
        'PROVIDER_ENCRYPTION_KEY must decode to exactly 32 bytes',
      );
    }
  }

  encrypt(value: string): string {
    const iv = randomBytes(12);

    const cipher = createCipheriv(
      'aes-256-gcm',
      this.key,
      iv,
    );

    const encrypted = Buffer.concat([
      cipher.update(
        value,
        'utf8',
      ),
      cipher.final(),
    ]);

    const authenticationTag =
      cipher.getAuthTag();

    return [
      'v1',
      iv.toString('base64url'),
      authenticationTag.toString(
        'base64url',
      ),
      encrypted.toString('base64url'),
    ].join('.');
  }

  decrypt(payload: string): string {
    try {
      const [
        version,
        ivEncoded,
        tagEncoded,
        encryptedEncoded,
      ] = payload.split('.');

      if (
        version !== 'v1' ||
        !ivEncoded ||
        !tagEncoded ||
        !encryptedEncoded
      ) {
        throw new Error(
          'Invalid encrypted payload',
        );
      }

      const iv = Buffer.from(
        ivEncoded,
        'base64url',
      );

      const authenticationTag =
        Buffer.from(
          tagEncoded,
          'base64url',
        );

      const encrypted = Buffer.from(
        encryptedEncoded,
        'base64url',
      );

      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.key,
        iv,
      );

      decipher.setAuthTag(
        authenticationTag,
      );

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch {
      throw new InternalServerErrorException(
        'Unable to decrypt provider credentials',
      );
    }
  }
}