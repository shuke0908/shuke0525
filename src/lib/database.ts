import { Pool } from 'pg';

// 데이터베이스 연결 풀
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 사용자 거래 설정 타입
export interface UserTradeSettings {
  user_id: string;
  win_rate: number;
  max_profit: number;
  force_result?: 'win' | 'lose' | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// 거래 기록 타입
export interface TradeHistory {
  id: string;
  user_id: string;
  direction: 'up' | 'down';
  amount: number;
  result: 'win' | 'lose';
  profit: number;
  created_at: Date;
}

// 사용자 거래 설정 조회
export async function getUserTradeSettings(userId: string): Promise<UserTradeSettings | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM user_trade_settings WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user trade settings:', error);
    throw error;
  }
}

// 사용자 거래 설정 업데이트
export async function updateUserTradeSettings(
  userId: string, 
  settings: Partial<Pick<UserTradeSettings, 'win_rate' | 'max_profit' | 'force_result' | 'is_active'>>
): Promise<UserTradeSettings> {
  try {
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (settings.win_rate !== undefined) {
      updateFields.push(`win_rate = $${paramIndex++}`);
      values.push(settings.win_rate);
    }
    if (settings.max_profit !== undefined) {
      updateFields.push(`max_profit = $${paramIndex++}`);
      values.push(settings.max_profit);
    }
    if (settings.force_result !== undefined) {
      updateFields.push(`force_result = $${paramIndex++}`);
      values.push(settings.force_result);
    }
    if (settings.is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      values.push(settings.is_active);
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE user_trade_settings 
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      // 설정이 없으면 새로 생성
      const insertResult = await pool.query(
        `INSERT INTO user_trade_settings (user_id, win_rate, max_profit, force_result, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          userId,
          settings.win_rate || 50,
          settings.max_profit || 85,
          settings.force_result || null,
          settings.is_active !== undefined ? settings.is_active : true
        ]
      );
      return insertResult.rows[0];
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error updating user trade settings:', error);
    throw error;
  }
}

// 사용자 잔액 조회
export async function getUserBalance(userId: string): Promise<number> {
  try {
    const result = await pool.query(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0]?.balance || 0;
  } catch (error) {
    console.error('Error fetching user balance:', error);
    throw error;
  }
}

// 사용자 잔액 업데이트
export async function updateUserBalance(userId: string, amount: number): Promise<number> {
  try {
    const result = await pool.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance',
      [amount, userId]
    );
    return result.rows[0]?.balance || 0;
  } catch (error) {
    console.error('Error updating user balance:', error);
    throw error;
  }
}

// 거래 기록 저장
export async function saveTradeHistory(trade: Omit<TradeHistory, 'id' | 'created_at'>): Promise<TradeHistory> {
  try {
    const result = await pool.query(
      `INSERT INTO trade_history (user_id, direction, amount, result, profit)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [trade.user_id, trade.direction, trade.amount, trade.result, trade.profit]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error saving trade history:', error);
    throw error;
  }
}

// 사용자 거래 기록 조회
export async function getUserTradeHistory(userId: string, limit: number = 50): Promise<TradeHistory[]> {
  try {
    const result = await pool.query(
      'SELECT * FROM trade_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching user trade history:', error);
    throw error;
  }
}

// 모든 사용자 목록 조회 (관리자용)
export async function getAllUsersWithSettings() {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.balance,
        uts.win_rate,
        uts.max_profit,
        uts.force_result,
        uts.is_active,
        uts.updated_at as settings_updated_at
      FROM users u
      LEFT JOIN user_trade_settings uts ON u.id = uts.user_id
      ORDER BY u.created_at DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('Error fetching all users with settings:', error);
    throw error;
  }
}

// 데이터베이스 연결 테스트
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export { pool }; 