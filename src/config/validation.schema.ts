import { z } from 'zod';

import { AppConfigSchema } from './app/configuration';
import { DatabaseConfigSchema } from './database/configuration';
import { JwtConfigSchema } from './jwt/configuration';

export const EnvSchema = z.object({
    ...AppConfigSchema.shape,
    ...DatabaseConfigSchema.shape,
    ...JwtConfigSchema.shape,

    // Additional environment variables...
});
