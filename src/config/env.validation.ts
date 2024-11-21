import { EnvSchema } from './validation.schema';

/**
 * Validates the environment variables.
 *
 * @param {Record<string, unknown>} config - The environment variables.
 * @returns {Record<string, unknown>} - The validated environment variables.
 * @throws {Error} - If the environment variables are invalid.
 */
export function validateConfig(config: Record<string, unknown>) {
    try {
        const parsedConfig = {
            ...config,
            PORT: config.PORT ? parseInt(config.PORT as string, 10) : undefined,
        };

        const result = EnvSchema.safeParse(parsedConfig);

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
