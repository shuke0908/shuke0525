-- 사용자 거래 설정 테이블 생성
CREATE TABLE IF NOT EXISTS user_trade_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  win_rate INTEGER DEFAULT 50 CHECK (win_rate >= 0 AND win_rate <= 100),
  max_profit INTEGER DEFAULT 85 CHECK (max_profit >= 0 AND max_profit <= 500),
  force_result VARCHAR(10) CHECK (force_result IN ('win', 'lose') OR force_result IS NULL),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 거래 기록 테이블 생성
CREATE TABLE IF NOT EXISTS trade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('up', 'down')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  result VARCHAR(10) NOT NULL CHECK (result IN ('win', 'lose')),
  profit DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quick Trade 포지션 테이블
CREATE TABLE IF NOT EXISTS quick_trade_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  amount DECIMAL(15,2) NOT NULL,
  leverage INTEGER DEFAULT 1,
  entry_price DECIMAL(15,8) NOT NULL,
  exit_price DECIMAL(15,8),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  pnl DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Quant AI 봇 테이블
CREATE TABLE IF NOT EXISTS quant_ai_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  strategy VARCHAR(50) NOT NULL,
  investment_amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  total_return DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 지갑 거래 내역 테이블
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw')),
  coin VARCHAR(10) NOT NULL,
  network VARCHAR(20) NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  address VARCHAR(255),
  tx_hash VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_trade_settings_user_id ON user_trade_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_user_id ON trade_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_created_at ON trade_history(created_at);
CREATE INDEX IF NOT EXISTS idx_quick_trade_positions_user_id ON quick_trade_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_trade_positions_status ON quick_trade_positions(status);
CREATE INDEX IF NOT EXISTS idx_quant_ai_bots_user_id ON quant_ai_bots(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);

-- 업데이트 트리거 적용
CREATE TRIGGER update_user_trade_settings_updated_at BEFORE UPDATE ON user_trade_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quant_ai_bots_updated_at BEFORE UPDATE ON quant_ai_bots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 