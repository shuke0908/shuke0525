-- Create user_preferences table
CREATE TABLE IF NOT EXISTS "user_preferences" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "theme" varchar(20) NOT NULL DEFAULT 'system',
  "language" varchar(10) NOT NULL DEFAULT 'en',
  "email_notifications" boolean NOT NULL DEFAULT true,
  "push_notifications" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);

-- Add foreign key constraint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX "user_preferences_user_id_idx" ON "user_preferences" ("user_id");

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON "user_preferences"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
