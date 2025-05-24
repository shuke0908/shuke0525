import { pgTable, text, serial, timestamp, integer, boolean, decimal, varchar, jsonb, date, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum('role', ['user', 'admin', 'superadmin']);
export const tradingTypeEnum = pgEnum('trading_type', ['quick', 'flash', 'quant']);
export const kycStatusEnum = pgEnum('kyc_status', ['pending', 'approved', 'rejected', 'resubmit_required']);
export const depositStatusEnum = pgEnum('deposit_status', ['pending', 'approved', 'rejected']);
export const withdrawalStatusEnum = pgEnum('withdrawal_status', ['pending', 'approved', 'rejected', 'processing', 'failed']);
export const vipLevelEnum = pgEnum('vip_level', ['1', '2', '3', '4', '5']);
export const flashTradeDirectionEnum = pgEnum('flash_trade_direction', ['up', 'down']);
export const flashTradeStatusEnum = pgEnum('flash_trade_status', ['active', 'win', 'lose', 'closed']);
export const flashTradeOutcomeEnum = pgEnum('flash_trade_outcome', ['default', 'win', 'lose']);
export const quantAIStrategyEnum = pgEnum('quant_ai_strategy', ['stable', 'balanced', 'aggressive', 'income', 'market_neutral', 'trend_following', 'contrarian']);
export const supportedCoinEnum = pgEnum('supported_coin', ['BTC', 'ETH', 'USDT-ERC20', 'USDT-TRC20']);
export const chatStatusEnum = pgEnum('chat_status', ['open', 'assigned', 'closed']);
export const chatTopicEnum = pgEnum('chat_topic', ['general', 'deposit', 'withdrawal', 'trading', 'account', 'technical']);
export const bonusTypeEnum = pgEnum('bonus_type', ['first_deposit', 'referral', 'special_promotion', 'loyalty']);
export const bonusStatusEnum = pgEnum('bonus_status', ['pending', 'active', 'completed', 'expired', 'cancelled']);
export const platformSettingCategoryEnum = pgEnum('platform_setting_category', ['general', 'security', 'trading', 'wallet', 'notification']);
export const fluctuationTypeEnum = pgEnum('fluctuation_type', ['fixed', 'random', 'pattern']);
export const quantAIInvestmentStatusEnum = pgEnum('quant_ai_investment_status', ['active', 'completed', 'cancelled']);
export const supportTicketStatusEnum = pgEnum('support_ticket_status', ['open', 'pending', 'assigned', 'resolved', 'closed', 'escalated']);
export const transactionTypeEnum = pgEnum('transaction_type', [
  'deposit', 'withdrawal', 'transfer_in', 'transfer_out', 
  'quick_trade_profit', 'quick_trade_loss', 'quick_trade_fee', 
  'flash_trade_profit', 'flash_trade_loss', 'flash_trade_fee',
  'quant_investment', 'quant_profit', 'quant_fee', 'quant_cancel',
  'bonus_claim', 'fee_charge', 'adjustment_credit', 'adjustment_debit',
  'deposit_approved', 'withdrawal_approved', 'withdrawal_rejected',
  'profit_realized', 'bonus_credit', 'refund'
]);
export const transactionEntityTypeEnum = pgEnum('transaction_entity_type', [
  'deposit', 'withdrawal', 'quick_trade', 'flash_trade', 'quant_ai_investment', 'user_bonus', 'support_ticket', 'none'
]);

export interface DailyReturnHistoryEntry {
  date: string; 
  amount: string; 
  description?: string;
}

export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: platformSettingCategoryEnum("category").default('general').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adminAccessLogs = pgTable("admin_access_logs", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  adminEmail: varchar("admin_email"),
  action: text("action").notNull(),
  details: text("details"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  theme: varchar("theme", { length: 20 }).default('system').notNull(),
  language: varchar("language", { length: 10 }).default('en').notNull(),
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  pushNotifications: boolean("push_notifications").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  password: text("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: roleEnum("role").default('user').notNull(),
  balance: decimal("balance", { precision: 18, scale: 8 }).default("0").notNull(),
  kycStatus: kycStatusEnum("kyc_status").default('pending'),
  vipLevel: vipLevelEnum("vip_level").default('1'),
  withdrawalPassword: text("withdrawal_password"),
  lastLoginIp: text("last_login_ip"),
  lastLoginTime: timestamp("last_login_time"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockoutUntil: timestamp("lockout_until"),
  adminNotes: text("admin_notes"),
  assignedAdminId: varchar("assigned_admin_id"),
  isActive: boolean("is_active").default(true).notNull(),
  flashTradeWinRate: integer("flash_trade_win_rate"),
  flashTradeOutcome: flashTradeOutcomeEnum("flash_trade_outcome").default('default'),
  allowedTradingTypes: text("allowed_trading_types").array(),
  isTwoFactorEnabled: boolean("is_two_factor_enabled").default(false).notNull(),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorBackupCodes: text("two_factor_backup_codes").array(),
  permissions: text("permissions").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const kycDocuments = pgTable("kyc_documents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  idFrontPath: text("id_front_path").notNull(),
  idBackPath: text("id_back_path").notNull(),
  addressProofPath: text("address_proof_path").notNull(),
  status: kycStatusEnum("status").default('pending').notNull(),
  rejectionReason: text("rejection_reason"),
  processedBy: varchar("processed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deposits = pgTable("deposits", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  coin: supportedCoinEnum("coin").notNull(),
  screenshotPath: text("screenshot_path").notNull(),
  status: depositStatusEnum("status").default('pending').notNull(),
  walletAddress: text("wallet_address"),
  rejectionReason: text("rejection_reason"),
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  coin: supportedCoinEnum("coin").notNull(),
  destinationAddress: text("destination_address").notNull(),
  status: withdrawalStatusEnum("status").default('pending').notNull(),
  rejectionReason: text("rejection_reason"),
  processedBy: varchar("processed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flashTradeSettings = pgTable("flash_trade_settings", {
  id: serial("id").primaryKey(),
  duration: integer("duration").notNull(),
  returnRate: decimal("return_rate", { precision: 8, scale: 4 }).notNull(),
  minAmount: decimal("min_amount", { precision: 18, scale: 8 }).notNull(),
  maxAmount: decimal("max_amount", { precision: 18, scale: 8 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flashTrades = pgTable("flash_trades", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  direction: flashTradeDirectionEnum("direction").notNull(),
  duration: integer("duration").notNull(),
  returnRate: decimal("return_rate", { precision: 8, scale: 4 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 18, scale: 8 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 18, scale: 8 }),
  potentialProfit: decimal("potential_profit", { precision: 18, scale: 8 }).notNull(),
  status: flashTradeStatusEnum("status").default('active').notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  preDeterminedOutcome: flashTradeOutcomeEnum("pre_determined_outcome"),
  outcomeForcedByAdmin: boolean("outcome_forced_by_admin").default(false).notNull(),
  forcedOutcome: flashTradeOutcomeEnum("forced_outcome"),
  pnl: decimal("pnl", { precision: 18, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quantAISettings = pgTable("quant_ai_settings", {
  id: serial("id").primaryKey(),
  strategy: quantAIStrategyEnum("strategy").notNull(),
  duration: integer("duration").notNull(),
  dailyReturn: decimal("daily_return", { precision: 8, scale: 4 }).notNull(),
  totalReturn: decimal("total_return", { precision: 8, scale: 4 }).notNull(),
  minAmount: decimal("min_amount", { precision: 18, scale: 8 }).notNull(),
  maxAmount: decimal("max_amount", { precision: 18, scale: 8 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quantAIInvestments = pgTable("quant_ai_investments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  strategyId: integer("strategy_id").notNull().references(() => quantAISettings.id),
  name: text("name"),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  durationDays: integer("duration_days").notNull(),
  dailyReturnRate: decimal("daily_return_rate", { precision: 8, scale: 4 }).notNull(),
  totalReturnRate: decimal("total_return_rate", { precision: 8, scale: 4 }).notNull(),
  currentValue: decimal("current_value", { precision: 18, scale: 8 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: quantAIInvestmentStatusEnum("status").default('active').notNull(),
  dailyReturnHistory: jsonb("daily_return_history").notNull().default('[]'),
  pnl: decimal("pnl", { precision: 18, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  balanceBefore: decimal("balance_before", { precision: 18, scale: 8 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 18, scale: 8 }).notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  link: text("link"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supportedCoins = pgTable("supported_coins", {
  id: serial("id").primaryKey(),
  coin: supportedCoinEnum("coin").notNull().unique(),
  name: text("name").notNull(),
  symbol: text("symbol"),
  logoUrl: text("logo_url"),
  price: decimal("price", { precision: 18, scale: 8 }),
  isActive: boolean("is_active").default(true).notNull(),
  withdrawalFee: decimal("withdrawal_fee", { precision: 18, scale: 8 }).default("0").notNull(),
  minWithdrawal: decimal("min_withdrawal", { precision: 18, scale: 8 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  topic: chatTopicEnum("topic").notNull(),
  title: text("title").notNull(),
  status: chatStatusEnum("status").default('open').notNull(),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bonusPrograms = pgTable("bonus_programs", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  type: bonusTypeEnum("type").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  percentageValue: decimal("percentage_value", { precision: 8, scale: 2 }),
  fixedAmount: decimal("fixed_amount", { precision: 18, scale: 8 }),
  minAmount: decimal("min_amount", { precision: 18, scale: 8 }),
  maxAmount: decimal("max_amount", { precision: 18, scale: 8 }),
  conditions: text("conditions"),
  code: varchar("code").unique(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userBonuses = pgTable("user_bonuses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  programId: integer("program_id").references(() => bonusPrograms.id),
  bonusAmount: decimal("bonus_amount", { precision: 18, scale: 8 }).notNull(),
  originalAmount: decimal("original_amount", { precision: 18, scale: 8 }).notNull(),
  type: bonusTypeEnum("type").notNull(),
  status: bonusStatusEnum("status").default('pending').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  completedAt: timestamp("completed_at"),
  metadata: text("metadata"),
});

export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => supportTickets.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  attachmentPath: text("attachment_path"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
  failedLoginAttempts: true,
  lockoutUntil: true
});

export const insertKycDocumentSchema = createInsertSchema(kycDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDepositSchema = createInsertSchema(deposits).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFlashTradeSettingSchema = createInsertSchema(flashTradeSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFlashTradeSchema = createInsertSchema(flashTrades).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertQuantAISettingSchema = createInsertSchema(quantAISettings, {
  strategy: z.enum(quantAIStrategyEnum.enumValues),
  dailyReturn: z.string().refine(val => !isNaN(parseFloat(val)), { message: "Daily return must be a number" }),
  totalReturn: z.string().refine(val => !isNaN(parseFloat(val)), { message: "Total return must be a number" }),
  minAmount: z.string().refine(val => !isNaN(parseFloat(val)), { message: "Min amount must be a number" }),
  maxAmount: z.string().refine(val => !isNaN(parseFloat(val)), { message: "Max amount must be a number" }),
});

export const insertQuantAIInvestmentSchema = createInsertSchema(quantAIInvestments, {
  userId: z.string(),
  strategyId: z.number(),
  amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Amount must be a positive number" }),
  durationDays: z.number().int().positive(),
  dailyReturnRate: z.string().refine(val => !isNaN(parseFloat(val)), { message: "Daily return rate must be a number" }),
  totalReturnRate: z.string().refine(val => !isNaN(parseFloat(val)), { message: "Total return rate must be a number" }),
  currentValue: z.string().refine(val => !isNaN(parseFloat(val)), { message: "Current value must be a number" }).optional(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  status: z.enum(quantAIInvestmentStatusEnum.enumValues).optional(),
  dailyReturnHistory: z.array(z.object({
    date: z.string().date(),
    returnAmount: z.string().refine(val => !isNaN(parseFloat(val)), { message: "Return amount must be a number" }),
    notes: z.string().optional(),
  })).optional(),
  name: z.string().optional(),
});

export const insertTransactionSchema = createInsertSchema(transactions);

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

export const insertSupportedCoinSchema = createInsertSchema(supportedCoins).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  id: true,
  createdAt: true
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true
});

export const insertBonusProgramSchema = createInsertSchema(bonusPrograms).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserBonusSchema = createInsertSchema(userBonuses).omit({
  id: true,
  createdAt: true
});

export const insertAdminAccessLogSchema = createInsertSchema(adminAccessLogs, {
  action: z.string(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.any().optional(),
}).omit({ id: true, timestamp: true });

export const insertPlatformSettingSchema = createInsertSchema(platformSettings, {
  value: z.string(),
  description: z.string().optional(),
  category: z.enum(platformSettingCategoryEnum.enumValues)
}).omit({ id: true, createdAt: true, updatedAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = Omit<typeof users.$inferInsert, 'failedLoginAttempts' | 'lockoutUntil'> & {
  failedLoginAttempts?: number;
  lockoutUntil?: Date | null;
};

export type KycDocument = typeof kycDocuments.$inferSelect;
export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;

export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;

export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;

export type FlashTradeSetting = typeof flashTradeSettings.$inferSelect;
export type InsertFlashTradeSetting = z.infer<typeof insertFlashTradeSettingSchema>;

export type FlashTrade = typeof flashTrades.$inferSelect;
export type InsertFlashTrade = z.infer<typeof insertFlashTradeSchema>;

export type QuantAISetting = typeof quantAISettings.$inferSelect;
export type InsertQuantAISetting = z.infer<typeof insertQuantAISettingSchema>;

export type QuantAIInvestment = typeof quantAIInvestments.$inferSelect;
export type InsertQuantAIInvestment = z.infer<typeof insertQuantAIInvestmentSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type SupportedCoin = typeof supportedCoins.$inferSelect;
export type InsertSupportedCoin = z.infer<typeof insertSupportedCoinSchema>;

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;

export type BonusProgram = typeof bonusPrograms.$inferSelect;
export type InsertBonusProgram = z.infer<typeof insertBonusProgramSchema>;

export type UserBonus = typeof userBonuses.$inferSelect;
export type InsertUserBonus = z.infer<typeof insertUserBonusSchema>;

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type InsertPlatformSetting = z.infer<typeof insertPlatformSettingSchema>;

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

export type AdminAccessLog = typeof adminAccessLogs.$inferSelect;
export type InsertAdminAccessLog = z.infer<typeof insertAdminAccessLogSchema>;

export const globalMarketSimulationSettings = pgTable("global_market_simulation_settings", {
  id: serial("id").primaryKey(),
  defaultUpdateIntervalSeconds: integer("default_update_interval_seconds").notNull().default(10),
  defaultVolatilityPercent: decimal("default_volatility_percent", { precision: 5, scale: 2 }).notNull().default("0.5"),
  defaultSpreadPercent: decimal("default_spread_percent", { precision: 5, scale: 2 }).notNull().default("0.1"),
  defaultOrderBookDepth: integer("default_order_book_depth").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assetMarketSimulationSettings = pgTable("asset_market_simulation_settings", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull().unique(),
  basePrice: decimal("base_price", { precision: 18, scale: 8 }).notNull(),
  fluctuationType: fluctuationTypeEnum("fluctuation_type").notNull().default('random'),
  volatilityPercent: decimal("volatility_percent", { precision: 5, scale: 2 }),
  updateIntervalSeconds: integer("update_interval_seconds"),
  spreadPercent: decimal("spread_percent", { precision: 5, scale: 2 }).notNull().default("0.1"),
  orderBookDepth: integer("order_book_depth").notNull().default(10),
  minOrderBookQuantity: decimal("min_order_book_quantity", { precision: 18, scale: 8 }).notNull().default("0.01"),
  maxOrderBookQuantity: decimal("max_order_book_quantity", { precision: 18, scale: 8 }).notNull().default("1"),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    symbolIndex: index("asset_simulation_symbol_idx").on(table.symbol),
  };
});

export const insertGlobalMarketSimulationSettingSchema = createInsertSchema(globalMarketSimulationSettings);
export const insertAssetMarketSimulationSettingSchema = createInsertSchema(assetMarketSimulationSettings, {
  symbol: z.string().min(3).max(20).regex(/^[A-Z0-9]+[/][A-Z0-9]+$/, "Symbol must be in format XXX/YYY"),
  basePrice: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Base price must be a positive number"}),
  volatilityPercent: z.string().optional().refine(val => val === undefined || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100), { message: "Volatility must be between 0 and 100, or empty"}),
  updateIntervalSeconds: z.number().int().positive().optional(),
  spreadPercent: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100, { message: "Spread must be between 0 and 100"}),
  orderBookDepth: z.number().int().positive(),
  minOrderBookQuantity: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Min quantity must be a non-negative number"}),
  maxOrderBookQuantity: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Max quantity must be a non-negative number"}),
}).refine(data => !data.maxOrderBookQuantity || !data.minOrderBookQuantity || parseFloat(data.maxOrderBookQuantity) >= parseFloat(data.minOrderBookQuantity), {
  message: "Max order book quantity must be greater than or equal to min quantity",
  path: ["maxOrderBookQuantity"],
});

export type GlobalMarketSimulationSetting = typeof globalMarketSimulationSettings.$inferSelect;
export type AssetMarketSimulationSetting = typeof assetMarketSimulationSettings.$inferSelect;

export type InsertGlobalMarketSimulationSetting = z.infer<typeof insertGlobalMarketSimulationSettingSchema>;
export type InsertAssetMarketSimulationSetting = z.infer<typeof insertAssetMarketSimulationSettingSchema>;

export const flashTradeAssetSimulationSettings = pgTable("flash_trade_asset_simulation_settings", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull().unique(),
  basePrice: decimal("base_price", { precision: 18, scale: 8 }).notNull(),
  volatilityPercent: decimal("volatility_percent", { precision: 5, scale: 2 }).notNull().default("1.00"),
  updateIntervalSeconds: integer("update_interval_seconds").notNull().default(5),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    flashSymbolIndex: index("flash_asset_simulation_symbol_idx").on(table.symbol),
  };
});

export const insertFlashTradeAssetSimulationSettingSchema = createInsertSchema(flashTradeAssetSimulationSettings, {
  symbol: z.string().min(3).max(20).regex(/^[A-Z0-9]+[/][A-Z0-9]+$/, "Symbol must be in format XXX/YYY (e.g., BTC/USD)"),
  basePrice: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Base price must be a positive number" }),
  volatilityPercent: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100, { message: "Volatility must be between 0 and 100" }),
  updateIntervalSeconds: z.number().int().positive("Update interval must be a positive integer"),
  isActive: z.boolean().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type FlashTradeAssetSimulationSetting = typeof flashTradeAssetSimulationSettings.$inferSelect;
export type InsertFlashTradeAssetSimulationSetting = z.infer<typeof insertFlashTradeAssetSimulationSettingSchema>;

export const securitySettingsDataSchema = z.object({
  enableGlobal2FA: z.boolean().default(false).optional(),
  loginAttemptLimit: z.number().int().min(1).default(5).optional(),
  lockoutDurationMinutes: z.number().int().min(1).default(15).optional(),
  sessionDurationMinutes: z.number().int().min(5, "Session duration must be at least 5 minutes.").default(60).optional(),
  captchaEnabled: z.boolean().default(false).optional(),
  captchaType: z.enum(['recaptcha_v2']).default('recaptcha_v2').optional().nullable(),
  ipRestrictionEnabled: z.boolean().default(false).optional(),
  allowedCountries: z.array(z.string().length(2, { message: "Country codes must be 2 characters long." })).default([]).optional(),
  blockedCountries: z.array(z.string().length(2, { message: "Country codes must be 2 characters long." })).default([]).optional(),
  allowedIPs: z.array(z.string().ip({ message: "Invalid IP address format." })).default([]).optional(),
  blockedIPs: z.array(z.string().ip({ message: "Invalid IP address format." })).default([]).optional(),
});

export type SecuritySettingsData = z.infer<typeof securitySettingsDataSchema>;

export const quickTradeLeverageOptions = pgTable("quick_trade_leverage_options", {
  id: serial("id").primaryKey(),
  value: integer("value").notNull().unique(),
  label: varchar("label", { length: 50 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    valueIndex: index("leverage_option_value_idx").on(table.value),
  };
});

export const insertQuickTradeLeverageOptionSchema = createInsertSchema(quickTradeLeverageOptions, {
  value: z.number().int(),
  label: z.string(),
  isActive: z.boolean().optional(),
});

export type QuickTradeLeverageOption = typeof quickTradeLeverageOptions.$inferSelect;
export type InsertQuickTradeLeverageOption = z.infer<typeof insertQuickTradeLeverageOptionSchema>;

export const flashTradeStatusValuesSchema = z.enum(flashTradeStatusEnum.enumValues);
export type FlashTradeStatusEnumValues = z.infer<typeof flashTradeStatusValuesSchema>;

export const supportTicketStatusValuesSchema = z.enum(supportTicketStatusEnum.enumValues);
export type SupportTicketStatusEnumValues = z.infer<typeof supportTicketStatusValuesSchema>;

export const transactionTypeValuesSchema = z.enum(transactionTypeEnum.enumValues);
export type TransactionTypeEnumValues = z.infer<typeof transactionTypeValuesSchema>;

export const transactionEntityTypeValuesSchema = z.enum(transactionEntityTypeEnum.enumValues);
export type TransactionEntityTypeEnumValues = z.infer<typeof transactionEntityTypeValuesSchema>;

export const quantAIInvestmentStatusValuesSchema = z.enum(quantAIInvestmentStatusEnum.enumValues);
export type QuantAIInvestmentStatusEnumValues = z.infer<typeof quantAIInvestmentStatusValuesSchema>;

export const platformSettingCategoryValuesSchema = z.enum(platformSettingCategoryEnum.enumValues);
export type PlatformSettingCategoryEnumValues = z.infer<typeof platformSettingCategoryValuesSchema>;

export const bonusTypeValuesSchema = z.enum(bonusTypeEnum.enumValues);
export type BonusTypeEnumValues = z.infer<typeof bonusTypeValuesSchema>;

export const bonusStatusValuesSchema = z.enum(bonusStatusEnum.enumValues);
export type BonusStatusEnumValues = z.infer<typeof bonusStatusValuesSchema>;
