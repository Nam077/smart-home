import { z } from 'zod';

import { AppConfigSchema } from './app/validation.schema';
import { DatabaseConfigSchema } from './database/validation.schema';
import { JwtConfigSchema } from './jwt/validation.schema';

export const EnvSchema = z.object({
    ...AppConfigSchema.shape,
    ...DatabaseConfigSchema.shape,
    ...JwtConfigSchema.shape,

    // Additional environment variables...
});
