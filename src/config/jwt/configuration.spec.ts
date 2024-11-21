import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import jwtConfig from './configuration';
import { JwtConfigSchema } from './validation.schema';

describe('JWT Configuration', () => {
    let configService: ConfigService;

    beforeEach(() => {
        // Reset environment variables before each test
        process.env.JWT_SECRET = undefined;
        process.env.JWT_EXPIRES_IN = undefined;
        process.env.JWT_REFRESH_SECRET = undefined;
        process.env.JWT_REFRESH_EXPIRES_IN = undefined;
    });

    it('should validate schema', () => {
        // Arrange
        const validConfig = {
            JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing',
            JWT_EXPIRES_IN: '2h',
            JWT_REFRESH_SECRET: 'this-is-a-very-long-refresh-secret-key',
            JWT_REFRESH_EXPIRES_IN: '30d',
        };

        // Act
        const result = JwtConfigSchema.safeParse(validConfig);

        // Assert
        expect(result.success).toBe(true);
    });

    it('should throw error if JWT secret is too short', () => {
        // Arrange
        const invalidConfig = {
            JWT_SECRET: 'short',
            JWT_EXPIRES_IN: '1d',
        };

        // Act
        const result = JwtConfigSchema.safeParse(invalidConfig);

        // Assert
        expect(result.success).toBe(false);

        if (!result.success) {
            expect(result.error.errors[0].message).toBe('JWT secret should be at least 32 characters');
        }
    });

    it('should allow missing refresh token config', () => {
        // Arrange
        const configWithoutRefresh = {
            JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing',
            JWT_EXPIRES_IN: '2h',
        };

        // Act
        const result = JwtConfigSchema.safeParse(configWithoutRefresh);

        // Assert
        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.JWT_REFRESH_SECRET).toBeUndefined();
            expect(result.data.JWT_REFRESH_EXPIRES_IN).toBe('7d');
        }
    });

    it('should register jwt config', async () => {
        // Arrange
        process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-for-testing';
        process.env.JWT_EXPIRES_IN = '2h';
        process.env.JWT_REFRESH_SECRET = 'this-is-a-very-long-refresh-secret-key';

        const moduleRef = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    load: [jwtConfig],
                    ignoreEnvFile: true,
                    ignoreEnvVars: false,
                }),
            ],
        }).compile();

        configService = moduleRef.get<ConfigService>(ConfigService);

        // Act
        const config = configService.get('jwt');

        // Assert
        expect(config).toBeDefined();
        expect(config.secret).toBe('this-is-a-very-long-secret-key-for-testing');
        expect(config.expiresIn).toBe('2h');
        expect(config.refreshSecret).toBe('this-is-a-very-long-refresh-secret-key');
    });
});
