import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

console.log("DATABASE_URL from env in drizzle.config.ts:", process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set or not loaded correctly. Please ensure it is configured in your .env file and accessible to drizzle.config.ts.");
}

export default {
  out: "./migrations",
  schema: "./shared/schema.ts",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL as string,
  },
  verbose: true,
  strict: true,
};
