import { beforeAll, afterAll } from '@jest/globals';
import { config } from 'dotenv';

import { validateConfig } from '../config/env.validation';

// Load environment variables from .env.test file
const envConfig = config({ path: '.env.test' });

// Validate environment variables
if (envConfig.error) {
    throw new Error('❌ Error loading .env.test file');
}

// Validate environment configuration
validateConfig(process.env);

// Add any global test setup here
beforeAll(async () => {
    // Setup test database or other test resources
});

afterAll(async () => {
    // Cleanup test resources
});
