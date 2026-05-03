import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

dotenv.config();

const envSchema = z.object({
  CVG_URL: z.string().url('CVG_URL must be a valid URL'),
  CVG_USERNAME: z.string().min(1, 'CVG_USERNAME is required'),
  CVG_PASSWORD: z.string().min(1, 'CVG_PASSWORD is required'),
  OPENAI_API_KEY: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
  TELEGRAM_CHAT_ID: z.string().min(1, 'TELEGRAM_CHAT_ID is required'),
  SCRAPE_INTERVAL_MINUTES: z.coerce.number().positive().default(60),
  DEBUG_MODE: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
  PLAYWRIGHT_HEADLESS: z.enum(['true', 'false']).default('true').transform(v => v === 'true'),
  DATABASE_URL: z.string().default('file:./prisma/dev.db'),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

const envResult = envSchema.safeParse(process.env);
if (!envResult.success) {
  console.error('❌ Environment validation failed:');
  envResult.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}
env = envResult.data;

export const config = {
  cvg: {
    url: env.CVG_URL,
    username: env.CVG_USERNAME,
    password: env.CVG_PASSWORD,
  },
  openai: {
    apiKey: env.OPENAI_API_KEY || '',
    enabled: !!env.OPENAI_API_KEY,
  },
  telegram: {
    botToken: env.TELEGRAM_BOT_TOKEN,
    chatId: env.TELEGRAM_CHAT_ID,
  },
  scraping: {
    intervalMinutes: Math.floor(env.SCRAPE_INTERVAL_MINUTES),
  },
  storage: {
    sessionPath: path.join(process.cwd(), 'storage', 'cvg-session.json'),
    storageDirPath: path.join(process.cwd(), 'storage'),
  },
  debug: {
    mode: env.DEBUG_MODE,
    headless: env.PLAYWRIGHT_HEADLESS,
  },
  database: {
    url: env.DATABASE_URL,
  },
};

export default config;
