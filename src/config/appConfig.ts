import { z } from 'zod';

const envSchema = z.object({
  VITE_DEMO_MODE: z.enum(['true', 'false']).default('false'),
  VITE_PRODUCT_NAME: z.string().trim().min(1).default('34d-Lernapp'),
  VITE_SUPABASE_URL: z.string().url().default('http://127.0.0.1:54321'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).default('local-placeholder'),
  VITE_PUBLIC_WEB_URL: z.string().url().default('http://localhost:5173'),
  VITE_SUPPORT_EMAIL: z.string().email().default('support@example.invalid'),
  VITE_LEGAL_PROVIDER: z.string().min(1).default('BETREIBERDATEN ERGÄNZEN'),
  VITE_EXAM_ENABLED: z.enum(['true', 'false']).default('false'),
});

const env = envSchema.parse(import.meta.env);

export const appConfig = Object.freeze({
  demoMode: env.VITE_DEMO_MODE === 'true',
  productName: env.VITE_PRODUCT_NAME,
  supabaseUrl: env.VITE_SUPABASE_URL,
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY,
  publicWebUrl: env.VITE_PUBLIC_WEB_URL,
  supportEmail: env.VITE_SUPPORT_EMAIL,
  legalProvider: env.VITE_LEGAL_PROVIDER,
  examEnabled: env.VITE_EXAM_ENABLED === 'true',
  answerSeconds: 45,
});
