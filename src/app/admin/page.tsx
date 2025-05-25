'use client';

import { useState, useEffect } from 'react';
import { UserList } from '@/components/admin/UserList';
import { UserSettingsPanel } from '@/components/admin/UserSettingsPanel';
import { RealtimeActivity } from '@/components/admin/RealtimeActivity';
import { useSimpleWebSocket } from '@/hooks/useSimpleWebSocket';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  balance: number;
  settings: {
    winRate: number;
    maxProfit: number;
    forceResult?: 'win' | 'lose';
    isActive: boolean;
    updatedAt?: string;
  };
}

export default function AdminDashboard() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // 인증 토큰 로드
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setAuthToken(token);
  }, []);

  // WebSocket 연결 (관리자용)
  const { isConnected, error: wsError } = useSimpleWebSocket({
    token: authToken || undefined,
    isAdmin: true,
    onTradeActivity: (activity) => {
      console.log('📊 Trade activity received:', activity);
      setRecentActivity(prev => [activity, ...prev.slice(0, 9)]); // 최근 10개만 유지
    }
  });

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleSettingsUpdated = (updatedUser: User) => {
    setSelectedUser(updatedUser);
    // 여기서 UserList를 새로고침할 수도 있지만, 
    // 현재는 선택된 사용자만 업데이트
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">관리자 대시보드</h1>
            <p className="text-muted-foreground">
              사용자 거래 설정을 관리하고 플랫폼을 제어하세요.
            </p>
          </div>
          
          {/* WebSocket 연결 상태 */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="default" className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                실시간 모니터링
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                연결 끊김
              </Badge>
            )}
          </div>
        </div>
        
        {wsError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">⚠️ {wsError}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 사용자 목록 */}
        <div className="space-y-6">
          <UserList 
            onSelectUser={handleUserSelect}
            selectedUserId={selectedUser?.id}
          />
        </div>

        {/* 사용자 설정 패널 */}
        <div className="space-y-6">
          {selectedUser ? (
            <UserSettingsPanel 
              user={selectedUser}
              onSettingsUpdated={handleSettingsUpdated}
            />
          ) : (
            <div className="flex items-center justify-center h-96 border-2 border-dashed border-muted rounded-lg">
              <div className="text-center">
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  사용자를 선택하세요
                </h3>
                <p className="text-sm text-muted-foreground">
                  왼쪽 목록에서 사용자를 클릭하면 설정을 관리할 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 실시간 거래 활동 */}
        <div className="space-y-6">
          <RealtimeActivity activities={recentActivity} />
        </div>
      </div>
    </div>
  );
} 