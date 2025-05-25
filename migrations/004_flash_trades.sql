-- Migration: 004_flash_trades
-- Description: Create flash_trades table for storing trading history
-- Date: 2024-01-08

-- Flash Trade 테이블 생성
CREATE TABLE IF NOT EXISTS flash_trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('up', 'down')),
  duration INTEGER NOT NULL, -- 초 단위 (30, 60, 180, 300)
  start_price DECIMAL(15,8) NOT NULL,
  end_price DECIMAL(15,8),
  result VARCHAR(10) CHECK (result IN ('win', 'lose')),
  profit DECIMAL(15,2),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_flash_trades_user_id ON flash_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_flash_trades_status ON flash_trades(status);
CREATE INDEX IF NOT EXISTS idx_flash_trades_expires_at ON flash_trades(expires_at);
CREATE INDEX IF NOT EXISTS idx_flash_trades_created_at ON flash_trades(created_at); 