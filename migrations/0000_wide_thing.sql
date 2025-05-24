CREATE TYPE "public"."bonus_status" AS ENUM('pending', 'active', 'completed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."bonus_type" AS ENUM('first_deposit', 'referral', 'special_promotion', 'loyalty');--> statement-breakpoint
CREATE TYPE "public"."chat_status" AS ENUM('open', 'assigned', 'closed');--> statement-breakpoint
CREATE TYPE "public"."chat_topic" AS ENUM('general', 'deposit', 'withdrawal', 'trading', 'account', 'technical');--> statement-breakpoint
CREATE TYPE "public"."deposit_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."flash_trade_direction" AS ENUM('up', 'down');--> statement-breakpoint
CREATE TYPE "public"."flash_trade_outcome" AS ENUM('default', 'win', 'lose');--> statement-breakpoint
CREATE TYPE "public"."flash_trade_status" AS ENUM('active', 'win', 'lose');--> statement-breakpoint
CREATE TYPE "public"."fluctuation_type" AS ENUM('fixed', 'random', 'pattern');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."platform_setting_category" AS ENUM('general', 'security', 'trading', 'wallet', 'notification');--> statement-breakpoint
CREATE TYPE "public"."quant_ai_investment_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."quant_ai_strategy" AS ENUM('stable', 'balanced', 'aggressive', 'income', 'market_neutral', 'trend_following', 'contrarian');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'superadmin');--> statement-breakpoint
CREATE TYPE "public"."supported_coin" AS ENUM('BTC', 'ETH', 'USDT-ERC20', 'USDT-TRC20');--> statement-breakpoint
CREATE TYPE "public"."trading_type" AS ENUM('quick', 'flash', 'quant');--> statement-breakpoint
CREATE TYPE "public"."vip_level" AS ENUM('1', '2', '3', '4', '5');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "admin_access_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" varchar NOT NULL,
	"admin_email" varchar,
	"action" text NOT NULL,
	"ip" text,
	"user_agent" text,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_market_simulation_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"base_price" numeric(18, 8) NOT NULL,
	"fluctuation_type" "fluctuation_type" DEFAULT 'random' NOT NULL,
	"volatility_percent" numeric(5, 2),
	"update_interval_seconds" integer,
	"spread_percent" numeric(5, 2) DEFAULT '0.1' NOT NULL,
	"order_book_depth" integer DEFAULT 10 NOT NULL,
	"min_order_book_quantity" numeric(18, 8) DEFAULT '0.01' NOT NULL,
	"max_order_book_quantity" numeric(18, 8) DEFAULT '1' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_market_simulation_settings_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "bonus_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"type" "bonus_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"percentage_value" numeric(8, 2),
	"fixed_amount" numeric(18, 8),
	"min_amount" numeric(18, 8),
	"max_amount" numeric(18, 8),
	"conditions" text,
	"code" varchar,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bonus_programs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"coin" "supported_coin" NOT NULL,
	"screenshot_path" text NOT NULL,
	"status" "deposit_status" DEFAULT 'pending' NOT NULL,
	"wallet_address" text,
	"rejection_reason" text,
	"processed_by" varchar,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flash_trade_asset_simulation_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"base_price" numeric(18, 8) NOT NULL,
	"volatility_percent" numeric(5, 2) DEFAULT '1.00' NOT NULL,
	"update_interval_seconds" integer DEFAULT 5 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "flash_trade_asset_simulation_settings_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "flash_trade_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"duration" integer NOT NULL,
	"return_rate" numeric(8, 4) NOT NULL,
	"min_amount" numeric(18, 8) NOT NULL,
	"max_amount" numeric(18, 8) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flash_trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"direction" "flash_trade_direction" NOT NULL,
	"duration" integer NOT NULL,
	"return_rate" numeric(8, 4) NOT NULL,
	"entry_price" numeric(18, 8) NOT NULL,
	"exit_price" numeric(18, 8),
	"potential_profit" numeric(18, 8) NOT NULL,
	"status" "flash_trade_status" DEFAULT 'active' NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"pre_determined_outcome" "flash_trade_status" NOT NULL,
	"outcome_forced_by_admin" boolean DEFAULT false NOT NULL,
	"forced_outcome" "flash_trade_status",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_market_simulation_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"default_update_interval_seconds" integer DEFAULT 10 NOT NULL,
	"default_volatility_percent" numeric(5, 2) DEFAULT '0.5' NOT NULL,
	"default_spread_percent" numeric(5, 2) DEFAULT '0.1' NOT NULL,
	"default_order_book_depth" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kyc_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"id_front_path" text NOT NULL,
	"id_back_path" text NOT NULL,
	"address_proof_path" text NOT NULL,
	"status" "kyc_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"processed_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"category" "platform_setting_category" DEFAULT 'general' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "quant_ai_investments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"strategy_id" integer NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"duration_days" integer NOT NULL,
	"daily_return_rate" numeric(8, 4) NOT NULL,
	"total_return_rate" numeric(8, 4) NOT NULL,
	"current_value" numeric(18, 8) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "quant_ai_investment_status" DEFAULT 'active' NOT NULL,
	"daily_return_history" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quant_ai_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"strategy" "quant_ai_strategy" NOT NULL,
	"duration" integer NOT NULL,
	"daily_return" numeric(8, 4) NOT NULL,
	"total_return" numeric(8, 4) NOT NULL,
	"min_amount" numeric(18, 8) NOT NULL,
	"max_amount" numeric(18, 8) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quick_trade_leverage_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"value" integer NOT NULL,
	"label" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quick_trade_leverage_options_value_unique" UNIQUE("value"),
	CONSTRAINT "quick_trade_leverage_options_label_unique" UNIQUE("label")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"sender_id" varchar NOT NULL,
	"message" text NOT NULL,
	"attachment_path" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"topic" "chat_topic" NOT NULL,
	"title" text NOT NULL,
	"status" "chat_status" DEFAULT 'open' NOT NULL,
	"assigned_to_id" varchar,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supported_coins" (
	"id" serial PRIMARY KEY NOT NULL,
	"coin" "supported_coin" NOT NULL,
	"name" text NOT NULL,
	"symbol" text,
	"logo_url" text,
	"price" numeric(18, 8),
	"is_active" boolean DEFAULT true NOT NULL,
	"withdrawal_fee" numeric(18, 8) DEFAULT '0' NOT NULL,
	"min_withdrawal" numeric(18, 8) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supported_coins_coin_unique" UNIQUE("coin")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"balance_before" numeric(18, 8) NOT NULL,
	"balance_after" numeric(18, 8) NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_bonuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"program_id" integer,
	"bonus_amount" numeric(18, 8) NOT NULL,
	"original_amount" numeric(18, 8) NOT NULL,
	"type" "bonus_type" NOT NULL,
	"status" "bonus_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"completed_at" timestamp,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"password" text,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" "role" DEFAULT 'user' NOT NULL,
	"balance" numeric(18, 8) DEFAULT '0' NOT NULL,
	"kyc_status" "kyc_status" DEFAULT 'pending',
	"vip_level" "vip_level" DEFAULT '1',
	"withdrawal_password" text,
	"last_login_ip" text,
	"last_login_time" timestamp,
	"admin_notes" text,
	"assigned_admin_id" varchar,
	"is_active" boolean DEFAULT true,
	"flash_trade_win_rate" integer,
	"flash_trade_outcome" "flash_trade_outcome" DEFAULT 'default',
	"allowed_trading_types" text[],
	"is_two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" text,
	"two_factor_backup_codes" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"coin" "supported_coin" NOT NULL,
	"destination_address" text NOT NULL,
	"status" "withdrawal_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"processed_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_access_logs" ADD CONSTRAINT "admin_access_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_programs" ADD CONSTRAINT "bonus_programs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flash_trades" ADD CONSTRAINT "flash_trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quant_ai_investments" ADD CONSTRAINT "quant_ai_investments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quant_ai_investments" ADD CONSTRAINT "quant_ai_investments_strategy_id_quant_ai_settings_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."quant_ai_settings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bonuses" ADD CONSTRAINT "user_bonuses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bonuses" ADD CONSTRAINT "user_bonuses_program_id_bonus_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."bonus_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_simulation_symbol_idx" ON "asset_market_simulation_settings" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "flash_asset_simulation_symbol_idx" ON "flash_trade_asset_simulation_settings" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "leverage_option_value_idx" ON "quick_trade_leverage_options" USING btree ("value");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");