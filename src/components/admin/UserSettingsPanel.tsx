'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, RefreshCw, User } from 'lucide-react';

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

interface UserSettingsPanelProps {
  user: User;
  onSettingsUpdated?: (user: User) => void;
}

export function UserSettingsPanel({ user, onSettingsUpdated }: UserSettingsPanelProps) {
  const [settings, setSettings] = useState({
    winRate: user.settings.winRate,
    maxProfit: user.settings.maxProfit,
    forceResult: user.settings.forceResult || '',
    isActive: user.settings.isActive
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 사용자가 변경될 때 설정 초기화
  useEffect(() => {
    setSettings({
      winRate: user.settings.winRate,
      maxProfit: user.settings.maxProfit,
      forceResult: user.settings.forceResult || '',
      isActive: user.settings.isActive
    });
    setError(null);
    setSuccess(null);
  }, [user]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const requestBody = {
        winRate: settings.winRate,
        maxProfit: settings.maxProfit,
        forceResult: settings.forceResult || null,
        isActive: settings.isActive
      };

      console.log('📝 Updating user settings:', requestBody);

      const response = await fetch(`/api/admin/user-settings/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || '설정 업데이트에 실패했습니다.');
      }

      setSuccess('설정이 성공적으로 업데이트되었습니다.');
      
      // 부모 컴포넌트에 업데이트 알림
      if (onSettingsUpdated) {
        const updatedUser = {
          ...user,
          settings: {
            ...user.settings,
            winRate: data.settings.winRate,
            maxProfit: data.settings.maxProfit,
            forceResult: data.settings.forceResult,
            isActive: data.settings.isActive,
            updatedAt: data.settings.updatedAt
          }
        };
        onSettingsUpdated(updatedUser);
      }

      console.log('✅ Settings updated successfully');

    } catch (err) {
      console.error('❌ Failed to update settings:', err);
      setError(err instanceof Error ? err.message : '설정 업데이트 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      winRate: user.settings.winRate,
      maxProfit: user.settings.maxProfit,
      forceResult: user.settings.forceResult || '',
      isActive: user.settings.isActive
    });
    setError(null);
    setSuccess(null);
  };

  const hasChanges = 
    settings.winRate !== user.settings.winRate ||
    settings.maxProfit !== user.settings.maxProfit ||
    settings.forceResult !== (user.settings.forceResult || '') ||
    settings.isActive !== user.settings.isActive;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          사용자 설정
        </CardTitle>
        
        {/* 사용자 정보 */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">잔액: ${user.balance}</Badge>
              {user.role === 'admin' && (
                <Badge variant="secondary">관리자</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 활성화 상태 */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">거래 활성화</Label>
            <p className="text-sm text-muted-foreground">
              사용자의 거래 기능을 활성화/비활성화합니다.
            </p>
          </div>
          <Switch
            checked={settings.isActive}
            onCheckedChange={(checked) => setSettings({ ...settings, isActive: checked })}
            disabled={loading}
          />
        </div>

        {/* 승률 설정 */}
        <div className="space-y-2">
          <Label htmlFor="winRate" className="text-base font-medium">
            승률 (%)
          </Label>
          <Input
            id="winRate"
            type="number"
            min="0"
            max="100"
            value={settings.winRate}
            onChange={(e) => setSettings({ ...settings, winRate: Number(e.target.value) })}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            0-100 사이의 값으로 설정하세요. 높을수록 사용자가 더 자주 승리합니다.
          </p>
        </div>

        {/* 최대 수익률 설정 */}
        <div className="space-y-2">
          <Label htmlFor="maxProfit" className="text-base font-medium">
            최대 수익률 (%)
          </Label>
          <Input
            id="maxProfit"
            type="number"
            min="0"
            max="500"
            value={settings.maxProfit}
            onChange={(e) => setSettings({ ...settings, maxProfit: Number(e.target.value) })}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            승리 시 받을 수 있는 최대 수익률을 설정합니다. (예: 85% = 100달러 → 185달러)
          </p>
        </div>

        {/* 강제 결과 설정 */}
        <div className="space-y-2">
          <Label className="text-base font-medium">강제 결과</Label>
          <Select
            value={settings.forceResult}
            onValueChange={(value) => setSettings({ ...settings, forceResult: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="자동 (승률에 따라)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">자동 (승률에 따라)</SelectItem>
              <SelectItem value="win">항상 승리</SelectItem>
              <SelectItem value="lose">항상 패배</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            강제 결과를 설정하면 승률 설정을 무시하고 항상 지정된 결과가 나옵니다.
          </p>
        </div>

        {/* 에러/성공 메시지 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">❌ {error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">✅ {success}</p>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={loading || !hasChanges}
            className="flex-1"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                저장 중...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                설정 저장
              </div>
            )}
          </Button>

          <Button
            onClick={handleReset}
            variant="outline"
            disabled={loading || !hasChanges}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* 현재 설정 미리보기 */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-3">현재 설정 미리보기</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">상태:</span>
              <Badge 
                variant={settings.isActive ? "default" : "destructive"}
                className="ml-2"
              >
                {settings.isActive ? "활성" : "비활성"}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">승률:</span>
              <span className="ml-2 font-medium">{settings.winRate}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">수익률:</span>
              <span className="ml-2 font-medium">{settings.maxProfit}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">강제 결과:</span>
              <span className="ml-2 font-medium">
                {settings.forceResult ? 
                  (settings.forceResult === 'win' ? '항상 승리' : '항상 패배') : 
                  '자동'
                }
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 