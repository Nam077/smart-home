import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const JwtConfigSchema = z.object({
    JWT_SECRET: z.string().min(32, 'JWT secret should be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('1d'),
});

export type JwtConfigType = z.infer<typeof JwtConfigSchema>;

export default registerAs('jwt', () => {
    const config = JwtConfigSchema.parse({
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    });

    return {
        secret: config.JWT_SECRET,
        expiresIn: config.JWT_EXPIRES_IN,
    };
});
