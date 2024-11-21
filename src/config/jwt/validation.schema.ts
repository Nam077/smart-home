import { z } from 'zod';

export const JwtConfigSchema = z.object({
    JWT_SECRET: z.string().min(32, 'JWT secret should be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('1d'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret should be at least 32 characters').optional(),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
});

export type JwtConfigType = z.infer<typeof JwtConfigSchema>;
