-- 초기 사용자 데이터 삽입
INSERT INTO users (
  id,
  email,
  password,
  first_name,
  last_name,
  nickname,
  role,
  balance,
  vip_level,
  is_active,
  created_at,
  updated_at
) VALUES 
-- 관리자 계정 (비밀번호: michael112)
(
  'super-admin-001',
  'shuke0525@jjk.app',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.FGm', -- michael112 해시
  'Super',
  'Admin',
  'SuperAdmin',
  'superadmin',
  1000000.00,
  10,
  true,
  NOW(),
  NOW()
),
-- 테스트 계정 (비밀번호: test123)
(
  'test-user-001',
  'test@jjk.app',
  '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- test123 해시
  'Test',
  'User',
  'TestUser',
  'user',
  10000.00,
  1,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING; 