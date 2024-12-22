import { z } from 'zod';

import { AppConfigSchema } from './app/configuration';
import { DatabaseConfigSchema } from './database/configuration';
import { JwtConfigSchema } from './jwt/configuration';
import { ApiKeysConfigSchema } from '@app/config/api-keys/configuration';

export const EnvSchema = z.object({
    ...AppConfigSchema.shape,
    ...DatabaseConfigSchema.shape,
    ...JwtConfigSchema.shape,
    ...ApiKeysConfigSchema.shape,

    // Additional environment variables...
});
