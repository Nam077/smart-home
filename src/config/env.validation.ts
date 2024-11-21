import { z } from 'zod';

const envValidationSchema = z.object({
    // Application
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    API_PREFIX: z.string().default('api'),
    APP_NAME: z.string().default('Smart Home Backend'),
    APP_DESCRIPTION: z.string().default('Smart Home Backend API'),
    APP_VERSION: z.string().default('0.1.0'),

    // Database
    DB_TYPE: z.enum(['postgres', 'mysql', 'better-sqlite3']).default('better-sqlite3'),
    DB_DATABASE: z.string().default('smart_home.db'),
    DB_SYNCHRONIZE: z.coerce.boolean().default(false),
    DB_LOGGING: z.coerce.boolean().default(false),

    // JWT
    JWT_SECRET: z.string().min(32, 'JWT secret should be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('1d'),

    // Swagger
    SWAGGER_TITLE: z.string().default('Smart Home API'),
    SWAGGER_DESCRIPTION: z.string().default('Smart Home Backend API Documentation'),
    SWAGGER_VERSION: z.string().default('0.1.0'),
    SWAGGER_PATH: z.string().default('docs'),
});

/**
 * Validates the environment variables.
 *
 * @param {Record<string, unknown>} config - The environment variables.
 * @returns {Record<string, unknown>} - The validated environment variables.
 * @throws {Error} - If the environment variables are invalid.
 */
export function validateConfig(config: Record<string, unknown>) {
    try {
        const result = envValidationSchema.safeParse(config);

        if (!result.success) {
            console.error('❌ Invalid environment variables:', result.error.format());
            throw new Error('Invalid environment variables');
        }

        return result.data;
    } catch (error) {
        console.error('❌ Config validation error:', error);
        throw error;
    }
}
