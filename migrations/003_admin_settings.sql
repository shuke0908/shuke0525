-- Migration: 003_admin_settings
-- Description: Create admin_settings table for managing user-specific trading settings
-- Date: 2024-01-08

-- 관리자 설정 테이블 생성
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR, -- 외래키 제약조건 없이 VARCHAR 타입 (애플리케이션 레벨에서 관리)
  win_rate DECIMAL(5,2) DEFAULT 30.00,
  max_profit_rate DECIMAL(5,2) DEFAULT 85.00,
  force_result VARCHAR(10) CHECK (force_result IN ('win', 'lose')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_settings_user_id ON admin_settings(user_id);

-- 기본 관리자 설정 (전체 기본값 - user_id가 NULL이면 모든 사용자에게 적용)
INSERT INTO admin_settings (user_id, win_rate, max_profit_rate)
VALUES (NULL, 30.00, 85.00)
ON CONFLICT DO NOTHING;

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 적용
DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER update_admin_settings_updated_at 
    BEFORE UPDATE ON admin_settings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 