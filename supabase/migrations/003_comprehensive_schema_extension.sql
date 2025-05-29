-- 명세서에 따른 포괄적인 스키마 확장
-- 기존 테이블 확장 및 새로운 테이블 추가

-- 기존 users 테이블에 필드 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nickname VARCHAR(100),
ADD COLUMN IF NOT EXISTS vip_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS assigned_admin_id UUID,
ADD COLUMN IF NOT EXISTS withdrawal_password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45),
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS restricted_trade_types JSONB,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 관리자 사용자 테이블
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 관리자 권한 테이블
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자별 Flash Trade 규칙 테이블
CREATE TABLE IF NOT EXISTS user_flash_trade_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('force_win', 'force_lose', 'random')),
  win_rate DECIMAL(5,2),
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  min_amount_filter DECIMAL(15,2),
  max_amount_filter DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quant AI 투자 테이블
CREATE TABLE IF NOT EXISTS quant_ai_investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  strategy_name VARCHAR(100) NOT NULL,
  investment_amount DECIMAL(15,2) NOT NULL,
  investment_period INTEGER NOT NULL,
  daily_return_rate DECIMAL(5,4) NOT NULL,
  current_value DECIMAL(15,2) NOT NULL,
  total_return DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  auto_reinvest BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기존 wallet_transactions 테이블에 필드 추가
ALTER TABLE wallet_transactions 
ADD COLUMN IF NOT EXISTS screenshot_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS bonus_applied_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS admin_approver_id UUID REFERENCES admin_users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- KYC 문서 테이블
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('id_front', 'id_back', 'selfie', 'address_proof')),
  document_url VARCHAR(500) NOT NULL,
  verification_level INTEGER NOT NULL CHECK (verification_level IN (1, 2)),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_reviewer_id UUID REFERENCES admin_users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 관리자 설정 테이블 (기존 admin_settings 확장)
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS setting_key VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS setting_value JSONB,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 기존 admin_settings 데이터를 새 형식으로 마이그레이션
UPDATE admin_settings SET 
  setting_key = 'flash_trade_default_settings',
  setting_value = jsonb_build_object(
    'win_rate', win_rate,
    'max_profit_rate', max_profit_rate
  )
WHERE setting_key IS NULL;

-- VIP 레벨 설정 테이블
CREATE TABLE IF NOT EXISTS vip_level_settings (
  level INTEGER PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  min_cumulative_trade_volume DECIMAL(20,2),
  trade_fee_discount_percent DECIMAL(5,2) DEFAULT 0,
  withdrawal_priority INTEGER DEFAULT 0,
  custom_benefits_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IP 제한 테이블
CREATE TABLE IF NOT EXISTS ip_restrictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('ALLOW', 'DENY')),
  country_code VARCHAR(2),
  ip_range_start INET,
  ip_range_end INET,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 IP 로그 테이블
CREATE TABLE IF NOT EXISTS user_ip_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 고객 지원 채팅 테이블
CREATE TABLE IF NOT EXISTS support_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_admin_id UUID REFERENCES admin_users(id),
  subject VARCHAR(200),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'resolved', 'closed')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES support_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message TEXT NOT NULL,
  attachment_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 공지사항 테이블
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES admin_users(id),
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'vip', 'specific')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 관리자 활동 로그 테이블
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기존 flash_trades 테이블에 필드 추가
ALTER TABLE flash_trades 
ADD COLUMN IF NOT EXISTS admin_override BOOLEAN DEFAULT false;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_assigned_admin ON users(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_users_vip_level ON users(vip_level);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_admin_id ON admin_permissions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_feature ON admin_permissions(feature_key);
CREATE INDEX IF NOT EXISTS idx_user_flash_trade_rules_user_id ON user_flash_trade_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flash_trade_rules_active ON user_flash_trade_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_quant_ai_investments_user_id ON quant_ai_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_quant_ai_investments_status ON quant_ai_investments(status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_ip_restrictions_user_id ON ip_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_restrictions_active ON ip_restrictions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_ip_logs_user_id ON user_ip_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ip_logs_action ON user_ip_logs(action);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_support_chats_user_id ON support_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_admin_id ON support_chats(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_status ON support_chats(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published);
CREATE INDEX IF NOT EXISTS idx_announcements_expires ON announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_target ON admin_activity_logs(target_type, target_id);

-- 업데이트 트리거 적용
CREATE TRIGGER IF NOT EXISTS update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_user_flash_trade_rules_updated_at BEFORE UPDATE ON user_flash_trade_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_quant_ai_investments_updated_at BEFORE UPDATE ON quant_ai_investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_vip_level_settings_updated_at BEFORE UPDATE ON vip_level_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 기본 데이터 삽입

-- 기본 슈퍼 관리자 계정 생성
INSERT INTO admin_users (email, hashed_password, name, role) 
VALUES (
  'superadmin@quanttrade.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
  'Super Admin',
  'superadmin'
) ON CONFLICT (email) DO NOTHING;

-- 기본 VIP 레벨 설정
INSERT INTO vip_level_settings (level, name, min_cumulative_trade_volume, trade_fee_discount_percent, withdrawal_priority) VALUES
(1, 'Bronze', 0, 0, 0),
(2, 'Silver', 10000, 5, 1),
(3, 'Gold', 50000, 10, 2),
(4, 'Platinum', 100000, 20, 3),
(5, 'Diamond', 500000, 30, 4)
ON CONFLICT (level) DO NOTHING;

-- 기본 관리자 설정
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('flash_trade_time_options', '[
  {"duration": 15, "profit_rate": 20, "min_amount": 10, "max_amount": 1000},
  {"duration": 30, "profit_rate": 30, "min_amount": 10, "max_amount": 2000},
  {"duration": 60, "profit_rate": 50, "min_amount": 10, "max_amount": 5000},
  {"duration": 120, "profit_rate": 75, "min_amount": 10, "max_amount": 10000},
  {"duration": 180, "profit_rate": 85, "min_amount": 10, "max_amount": 20000},
  {"duration": 300, "profit_rate": 100, "min_amount": 10, "max_amount": 50000}
]', 'Flash Trade 시간별 옵션 설정'),

('platform_default_win_rate', '30', '플랫폼 기본 승률 (%)'),

('quant_ai_strategies', '[
  {"name": "안정 추구형 AI", "description": "낮은 위험도로 안정적인 수익 추구", "risk_level": "low", "daily_return_rate": 0.5},
  {"name": "균형 성장형 AI", "description": "중간 위험도로 균형잡힌 성장", "risk_level": "medium", "daily_return_rate": 1.0},
  {"name": "공격 투자형 AI", "description": "높은 위험도로 공격적인 투자", "risk_level": "high", "daily_return_rate": 1.5},
  {"name": "프리미엄 AI", "description": "VIP 전용 고수익 전략", "risk_level": "high", "daily_return_rate": 2.0},
  {"name": "보수적 장기형 AI", "description": "장기 투자 전용 보수적 전략", "risk_level": "low", "daily_return_rate": 0.3},
  {"name": "단기 수익형 AI", "description": "단기간 높은 수익률 추구", "risk_level": "medium", "daily_return_rate": 1.2},
  {"name": "다이아몬드 AI", "description": "최고 VIP 전용 최고 수익률", "risk_level": "high", "daily_return_rate": 2.5}
]', 'Quant AI 투자 전략 설정'),

('first_deposit_bonus', '{
  "enabled": true,
  "type": "percentage",
  "value": 100,
  "min_deposit": 100,
  "max_bonus": 1000,
  "conditions": "보너스 금액의 5배 거래량 달성 시 출금 가능"
}', '첫 입금 보너스 설정'),

('supported_coins', '[
  {"coin": "BTC", "networks": ["BTC"], "min_deposit": 0.001, "max_deposit": 10, "deposit_fee": 0, "withdrawal_fee": 0.0005},
  {"coin": "ETH", "networks": ["ERC20"], "min_deposit": 0.01, "max_deposit": 100, "deposit_fee": 0, "withdrawal_fee": 0.005},
  {"coin": "USDT", "networks": ["ERC20", "TRC20"], "min_deposit": 10, "max_deposit": 50000, "deposit_fee": 0, "withdrawal_fee": 5}
]', '지원 코인 및 네트워크 설정'),

('global_settings', '{
  "maintenance_mode": false,
  "new_registrations_enabled": true,
  "kyc_required": false,
  "max_daily_trades": 100,
  "max_daily_trade_volume": 100000,
  "base_currency": "USDT",
  "timezone": "Asia/Seoul"
}', '전역 플랫폼 설정')

ON CONFLICT (setting_key) DO NOTHING; 