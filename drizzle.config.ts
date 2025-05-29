import type { Config } from 'drizzle-kit';

export default {
  schema: './shared/schema.ts',
  out: './supabase/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config; 