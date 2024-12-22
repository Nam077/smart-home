import { registerAs } from '@nestjs/config';
import { z } from 'zod';

// API Keys configuration schema
export const ApiKeysConfigSchema = z.object({
    GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),
    GROQ_API_KEY: z.string().min(1, 'Groq API key is required'),
    // Add other API keys as needed
    // OPENAI_API_KEY: z.string().optional(),
    // TELEGRAM_BOT_TOKEN: z.string().optional(),
});

export type ApiKeysConfigType = z.infer<typeof ApiKeysConfigSchema>;

export default registerAs('apiKeys', () => {
    // Validate API keys config
    const config = ApiKeysConfigSchema.parse({
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        // Add other API keys here
        // OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        // TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    });

    return {
        geminiApiKey: config.GEMINI_API_KEY,
        groqApiKey: config.GROQ_API_KEY,
        // Add other API keys here
        // openaiApiKey: config.OPENAI_API_KEY,
        // telegramBotToken: config.TELEGRAM_BOT_TOKEN,
    };
});
