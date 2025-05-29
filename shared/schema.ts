import { pgTable, uuid, varchar, decimal, integer, boolean, timestamp, text, jsonb, inet } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 사용자 테이블
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  firstName: varchar('firstName', { length: 100 }).notNull(),
  lastName: varchar('lastName', { length: 100 }).notNull(),
  nickname: varchar('nickname', { length: 100 }),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).default('user').notNull(),
  balance: decimal('balance', { precision: 15, scale: 2 }).default('10000.00'),
  vipLevel: integer('vip_level').default(1),
  assignedAdminId: uuid('assigned_admin_id'),
  withdrawalPasswordHash: varchar('withdrawal_password_hash', { length: 255 }),
  lastLoginIp: varchar('last_login_ip', { length: 45 }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  restrictedTradeTypes: jsonb('restricted_trade_types'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 관리자 사용자 테이블
export const adminUsers = pgTable('admin_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  hashedPassword: varchar('hashed_password', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).default('admin').notNull(), // 'superadmin', 'admin'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 관리자 권한 테이블
export const adminPermissions = pgTable('admin_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id').references(() => adminUsers.id, { onDelete: 'cascade' }).notNull(),
  featureKey: varchar('feature_key', { length: 100 }).notNull(),
  canView: boolean('can_view').default(false),
  canEdit: boolean('can_edit').default(false),
  canCreate: boolean('can_create').default(false),
  canDelete: boolean('can_delete').default(false),
  canApprove: boolean('can_approve').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Flash Trade 테이블
export const flashTrades = pgTable('flash_trades', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  direction: varchar('direction', { length: 10 }).notNull(), // 'up', 'down'
  duration: integer('duration').notNull(), // 초 단위
  startPrice: decimal('start_price', { precision: 15, scale: 8 }).notNull(),
  endPrice: decimal('end_price', { precision: 15, scale: 8 }),
  result: varchar('result', { length: 10 }), // 'win', 'lose'
  profit: decimal('profit', { precision: 15, scale: 2 }),
  status: varchar('status', { length: 20 }).default('active'), // 'active', 'completed', 'cancelled'
  adminOverride: boolean('admin_override').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

// 사용자별 Flash Trade 규칙 테이블
export const userFlashTradeRules = pgTable('user_flash_trade_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  mode: varchar('mode', { length: 20 }).notNull(), // 'force_win', 'force_lose', 'random'
  winRate: decimal('win_rate', { precision: 5, scale: 2 }), // 랜덤 모드일 때 승률
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  minAmountFilter: decimal('min_amount_filter', { precision: 15, scale: 2 }),
  maxAmountFilter: decimal('max_amount_filter', { precision: 15, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Quick Trade 포지션 테이블
export const quickTradePositions = pgTable('quick_trade_positions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  side: varchar('side', { length: 10 }).notNull(), // 'buy', 'sell'
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  leverage: integer('leverage').default(1),
  entryPrice: decimal('entry_price', { precision: 15, scale: 8 }).notNull(),
  exitPrice: decimal('exit_price', { precision: 15, scale: 8 }),
  status: varchar('status', { length: 20 }).default('open'), // 'open', 'closed'
  pnl: decimal('pnl', { precision: 15, scale: 2 }).default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
});

// Quant AI 투자 테이블
export const quantAiInvestments = pgTable('quant_ai_investments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  strategyName: varchar('strategy_name', { length: 100 }).notNull(),
  investmentAmount: decimal('investment_amount', { precision: 15, scale: 2 }).notNull(),
  investmentPeriod: integer('investment_period').notNull(), // 일 단위
  dailyReturnRate: decimal('daily_return_rate', { precision: 5, scale: 4 }).notNull(),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).notNull(),
  totalReturn: decimal('total_return', { precision: 15, scale: 2 }).default('0'),
  status: varchar('status', { length: 20 }).default('active'), // 'active', 'completed', 'cancelled'
  autoReinvest: boolean('auto_reinvest').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 지갑 거래 내역 테이블
export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'deposit', 'withdrawal', 'bonus', 'trade'
  coin: varchar('coin', { length: 10 }).notNull(),
  network: varchar('network', { length: 20 }),
  amount: decimal('amount', { precision: 20, scale: 8 }).notNull(),
  address: varchar('address', { length: 255 }),
  txHash: varchar('tx_hash', { length: 255 }),
  screenshotUrl: varchar('screenshot_url', { length: 500 }),
  bonusAppliedAmount: decimal('bonus_applied_amount', { precision: 15, scale: 2 }),
  adminApproverId: uuid('admin_approver_id').references(() => adminUsers.id),
  rejectionReason: text('rejection_reason'),
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'approved', 'rejected', 'confirmed', 'failed'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});

// KYC 문서 테이블
export const kycDocuments = pgTable('kyc_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(), // 'id_front', 'id_back', 'selfie', 'address_proof'
  documentUrl: varchar('document_url', { length: 500 }).notNull(),
  verificationLevel: integer('verification_level').notNull(), // 1, 2
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'approved', 'rejected'
  adminReviewerId: uuid('admin_reviewer_id').references(() => adminUsers.id),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
});

// 관리자 설정 테이블
export const adminSettings = pgTable('admin_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  settingKey: varchar('setting_key', { length: 100 }).unique().notNull(),
  settingValue: jsonb('setting_value').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// VIP 레벨 설정 테이블
export const vipLevelSettings = pgTable('vip_level_settings', {
  level: integer('level').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  minCumulativeTradeVolume: decimal('min_cumulative_trade_volume', { precision: 20, scale: 2 }),
  tradeFeeDiscountPercent: decimal('trade_fee_discount_percent', { precision: 5, scale: 2 }).default('0'),
  withdrawalPriority: integer('withdrawal_priority').default(0),
  customBenefitsDescription: text('custom_benefits_description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// IP 제한 테이블
export const ipRestrictions = pgTable('ip_restrictions', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: varchar('type', { length: 10 }).notNull(), // 'ALLOW', 'DENY'
  countryCode: varchar('country_code', { length: 2 }),
  ipRangeStart: inet('ip_range_start'),
  ipRangeEnd: inet('ip_range_end'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }), // null이면 전체 적용
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 사용자 IP 로그 테이블
export const userIpLogs = pgTable('user_ip_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  userAgent: text('user_agent'),
  action: varchar('action', { length: 50 }).notNull(), // 'login', 'logout', 'trade', etc.
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 알림 테이블
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'trade', 'deposit', 'withdrawal', 'system', 'promotion'
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false),
  metadata: jsonb('metadata'), // 추가 데이터
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 고객 지원 채팅 테이블
export const supportChats = pgTable('support_chats', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  assignedAdminId: uuid('assigned_admin_id').references(() => adminUsers.id),
  subject: varchar('subject', { length: 200 }),
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'active', 'resolved', 'closed'
  priority: varchar('priority', { length: 20 }).default('normal'), // 'low', 'normal', 'high', 'urgent'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
});

// 채팅 메시지 테이블
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  chatId: uuid('chat_id').references(() => supportChats.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid('sender_id').notNull(), // user_id 또는 admin_id
  senderType: varchar('sender_type', { length: 10 }).notNull(), // 'user', 'admin'
  message: text('message').notNull(),
  attachmentUrl: varchar('attachment_url', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 공지사항 테이블
export const announcements = pgTable('announcements', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  authorId: uuid('author_id').references(() => adminUsers.id).notNull(),
  isPublished: boolean('is_published').default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  targetAudience: varchar('target_audience', { length: 20 }).default('all'), // 'all', 'vip', 'specific'
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 관리자 활동 로그 테이블
export const adminActivityLogs = pgTable('admin_activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id').references(() => adminUsers.id).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  targetType: varchar('target_type', { length: 50 }), // 'user', 'setting', 'trade', etc.
  targetId: uuid('target_id'),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  assignedAdmin: one(adminUsers, {
    fields: [users.assignedAdminId],
    references: [adminUsers.id],
  }),
  flashTrades: many(flashTrades),
  flashTradeRules: many(userFlashTradeRules),
  quickTradePositions: many(quickTradePositions),
  quantAiInvestments: many(quantAiInvestments),
  walletTransactions: many(walletTransactions),
  kycDocuments: many(kycDocuments),
  notifications: many(notifications),
  supportChats: many(supportChats),
  ipLogs: many(userIpLogs),
}));

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  permissions: many(adminPermissions),
  assignedUsers: many(users),
  approvedTransactions: many(walletTransactions),
  reviewedKyc: many(kycDocuments),
  assignedChats: many(supportChats),
  announcements: many(announcements),
  activityLogs: many(adminActivityLogs),
}));

export const flashTradesRelations = relations(flashTrades, ({ one }) => ({
  user: one(users, {
    fields: [flashTrades.userId],
    references: [users.id],
  }),
}));

export const supportChatsRelations = relations(supportChats, ({ one, many }) => ({
  user: one(users, {
    fields: [supportChats.userId],
    references: [users.id],
  }),
  assignedAdmin: one(adminUsers, {
    fields: [supportChats.assignedAdminId],
    references: [adminUsers.id],
  }),
  messages: many(chatMessages),
})); 