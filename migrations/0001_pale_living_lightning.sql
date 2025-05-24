CREATE TYPE "public"."support_ticket_status" AS ENUM('open', 'pending', 'assigned', 'resolved', 'closed', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."transaction_entity_type" AS ENUM('deposit', 'withdrawal', 'quick_trade', 'flash_trade', 'quant_ai_investment', 'user_bonus', 'support_ticket', 'none');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'quick_trade_profit', 'quick_trade_loss', 'quick_trade_fee', 'flash_trade_profit', 'flash_trade_loss', 'flash_trade_fee', 'quant_investment', 'quant_profit', 'quant_fee', 'quant_cancel', 'bonus_claim', 'fee_charge', 'adjustment_credit', 'adjustment_debit', 'deposit_approved', 'withdrawal_approved', 'withdrawal_rejected', 'profit_realized', 'bonus_credit', 'refund');--> statement-breakpoint
ALTER TYPE "public"."flash_trade_status" ADD VALUE 'closed';--> statement-breakpoint
ALTER TYPE "public"."kyc_status" ADD VALUE 'resubmit_required';--> statement-breakpoint
ALTER TYPE "public"."withdrawal_status" ADD VALUE 'processing';--> statement-breakpoint
ALTER TYPE "public"."withdrawal_status" ADD VALUE 'failed';--> statement-breakpoint
ALTER TABLE "flash_trades" ALTER COLUMN "pre_determined_outcome" SET DATA TYPE flash_trade_outcome USING "pre_determined_outcome"::text::flash_trade_outcome;--> statement-breakpoint
ALTER TABLE "flash_trades" ALTER COLUMN "pre_determined_outcome" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "flash_trades" ALTER COLUMN "forced_outcome" SET DATA TYPE flash_trade_outcome USING "forced_outcome"::text::flash_trade_outcome;--> statement-breakpoint
ALTER TABLE "quick_trade_leverage_options" ALTER COLUMN "label" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_access_logs" ADD COLUMN "details" text;--> statement-breakpoint
ALTER TABLE "deposits" ADD COLUMN "admin_notes" text;--> statement-breakpoint
ALTER TABLE "flash_trade_asset_simulation_settings" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "flash_trades" ADD COLUMN "pnl" numeric(18, 8);--> statement-breakpoint
ALTER TABLE "quant_ai_investments" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "quant_ai_investments" ADD COLUMN "pnl" numeric(18, 8);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "failed_login_attempts" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lockout_until" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "permissions" text[];--> statement-breakpoint
ALTER TABLE "flash_trade_asset_simulation_settings" DROP COLUMN "is_enabled";