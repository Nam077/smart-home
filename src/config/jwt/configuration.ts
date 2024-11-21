import { registerAs } from '@nestjs/config';
import type { z } from 'zod';

import { JwtConfigSchema } from './validation.schema';

export type JwtConfigType = z.infer<typeof JwtConfigSchema>;

export default registerAs('jwt', () => {
    const config = JwtConfigSchema.parse({
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
    });

    return {
        secret: config.JWT_SECRET,
        expiresIn: config.JWT_EXPIRES_IN,
        refreshSecret: config.JWT_REFRESH_SECRET,
        refreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
    };
});
