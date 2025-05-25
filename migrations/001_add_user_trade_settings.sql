-- 사용자 거래 설정 테이블 생성
CREATE TABLE user_trade_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  win_rate INTEGER DEFAULT 50 CHECK (win_rate >= 0 AND win_rate <= 100),
  max_profit INTEGER DEFAULT 85 CHECK (max_profit >= 0 AND max_profit <= 500),
  force_result VARCHAR(10) CHECK (force_result IN ('win', 'lose') OR force_result IS NULL),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 기존 users 테이블에 잔액 컬럼 추가 (이미 있다면 무시)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='balance') THEN
    ALTER TABLE users ADD COLUMN balance DECIMAL(15,2) DEFAULT 1000.00;
  END IF;
END $$;

-- 거래 기록 테이블 생성
CREATE TABLE IF NOT EXISTS trade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('up', 'down')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  result VARCHAR(10) NOT NULL CHECK (result IN ('win', 'lose')),
  profit DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 모든 기존 사용자에게 기본 설정 추가
INSERT INTO user_trade_settings (user_id, win_rate, max_profit)
SELECT id, 50, 85 FROM users
ON CONFLICT (user_id) DO NOTHING;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_trade_settings_user_id ON user_trade_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_user_id ON trade_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_created_at ON trade_history(created_at); 