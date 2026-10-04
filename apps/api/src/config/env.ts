import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from current directory and fallback to monorepo root .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1).default('postgresql://daydaily:daydaily_password@localhost:5432/daydaily_dev?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('dev-jwt-secret'),
});

export const env = EnvSchema.parse(process.env);
