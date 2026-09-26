import { registerAs } from '@nestjs/config';

export default registerAs('provider', () => ({
  encryptionKey:
    process.env.PROVIDER_ENCRYPTION_KEY,
}));