'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Settings, TrendingUp, DollarSign, Users, AlertTriangle } from 'lucide-react';
import { AppLayout } from '@/components/layout';

interface AdminSettings {
  id: string;
  userId?: string;
  winRate: number;
  maxProfitRate: number;
  forceResult?: 'win' | 'lose' | null;
  minAmount: number;
  maxAmount: number;
  availableDurations: number[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function FlashTradeSettingsPage() {
  const [globalSettings, setGlobalSettings] = useState<AdminSettings | null>(null);
  const [userSettings, setUserSettings] = useState<AdminSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('global');
  
  const { toast } = useToast();

  // 설정 로드
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // 전체 기본 설정 조회
      const globalResponse = await fetch('/api/admin/flash-trade-settings', {
        credentials: 'include'
      });
      
      if (globalResponse.ok) {
        const globalData = await globalResponse.json();
        setGlobalSettings(globalData.settings);
      }

      // 모든 설정 조회
      const allResponse = await fetch('/api/admin/flash-trade-settings', {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (allResponse.ok) {
        const allData = await allResponse.json();
        setUserSettings(allData.allSettings.filter((s: AdminSettings) => s.userId));
      }

    } catch (error) {
      console.error('Settings load error:', error);
      setError('설정을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 설정 저장
  const saveSettings = async (settings: Partial<AdminSettings>) => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch('/api/admin/flash-trade-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Settings save failed');
      }

      toast({
        title: '설정 저장 완료',
        description: 'FlashTrade 설정이 성공적으로 저장되었습니다.',
      });

      // 설정 다시 로드
      await loadSettings();

    } catch (error) {
      console.error('Settings save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      toast({
        title: '설정 저장 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 컴포넌트 마운트 시 설정 로드
  useEffect(() => {
    loadSettings();
  }, []);

  // 전체 설정 폼
  const GlobalSettingsForm = () => {
    const [formData, setFormData] = useState<Partial<AdminSettings>>({
      winRate: 45,
      maxProfitRate: 85,
      forceResult: null,
      minAmount: 10,
      maxAmount: 10000,
      availableDurations: [30, 60, 120, 300],
      isActive: true
    });

    useEffect(() => {
      if (globalSettings) {
        setFormData(globalSettings);
      }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      saveSettings(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 승률 설정 */}
          <div className="space-y-2">
            <Label htmlFor="winRate">기본 승률 (%)</Label>
            <Input
              id="winRate"
              type="number"
              min="0"
              max="100"
              value={formData.winRate || 45}
              onChange={(e) => setFormData({ ...formData, winRate: parseInt(e.target.value) })}
              disabled={isSaving}
            />
            <p className="text-sm text-muted-foreground">
              사용자가 승리할 확률 (0-100%)
            </p>
          </div>

          {/* 수익률 설정 */}
          <div className="space-y-2">
            <Label htmlFor="maxProfitRate">최대 수익률 (%)</Label>
            <Input
              id="maxProfitRate"
              type="number"
              min="10"
              max="200"
              value={formData.maxProfitRate || 85}
              onChange={(e) => setFormData({ ...formData, maxProfitRate: parseInt(e.target.value) })}
              disabled={isSaving}
            />
            <p className="text-sm text-muted-foreground">
              승리 시 지급할 수익률 (10-200%)
            </p>
          </div>

          {/* 최소 거래 금액 */}
          <div className="space-y-2">
            <Label htmlFor="minAmount">최소 거래 금액 ($)</Label>
            <Input
              id="minAmount"
              type="number"
              min="1"
              value={formData.minAmount || 10}
              onChange={(e) => setFormData({ ...formData, minAmount: parseInt(e.target.value) })}
              disabled={isSaving}
            />
          </div>

          {/* 최대 거래 금액 */}
          <div className="space-y-2">
            <Label htmlFor="maxAmount">최대 거래 금액 ($)</Label>
            <Input
              id="maxAmount"
              type="number"
              min="1"
              value={formData.maxAmount || 10000}
              onChange={(e) => setFormData({ ...formData, maxAmount: parseInt(e.target.value) })}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* 강제 결과 설정 */}
        <div className="space-y-2">
          <Label htmlFor="forceResult">강제 결과 설정</Label>
          <Select
            value={formData.forceResult || 'none'}
            onValueChange={(value) => setFormData({ 
              ...formData, 
              forceResult: value === 'none' ? null : value as 'win' | 'lose'
            })}
            disabled={isSaving}
          >
            <SelectTrigger>
              <SelectValue placeholder="강제 결과 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">없음 (승률 기반)</SelectItem>
              <SelectItem value="win">항상 승리</SelectItem>
              <SelectItem value="lose">항상 패배</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            설정 시 승률을 무시하고 항상 지정된 결과로 처리됩니다.
          </p>
        </div>

        {/* 사용 가능한 거래 시간 */}
        <div className="space-y-2">
          <Label>사용 가능한 거래 시간 (초)</Label>
          <div className="flex flex-wrap gap-2">
            {[15, 30, 60, 120, 300, 600].map((duration) => (
              <Badge
                key={duration}
                variant={formData.availableDurations?.includes(duration) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const current = formData.availableDurations || [];
                  const updated = current.includes(duration)
                    ? current.filter(d => d !== duration)
                    : [...current, duration];
                  setFormData({ ...formData, availableDurations: updated });
                }}
              >
                {duration}초
              </Badge>
            ))}
          </div>
        </div>

        {/* 서비스 활성화 */}
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive || false}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            disabled={isSaving}
          />
          <Label htmlFor="isActive">FlashTrade 서비스 활성화</Label>
        </div>

        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? '저장 중...' : '설정 저장'}
        </Button>
      </form>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout 
      title="FlashTrade 설정 관리" 
      description="FlashTrade 가상 거래 시스템의 승률, 수익률 등을 관리합니다"
      variant="admin"
    >

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="global">전체 기본 설정</TabsTrigger>
          <TabsTrigger value="users">사용자별 설정</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2" />
                전체 기본 설정
              </CardTitle>
              <CardDescription>
                모든 사용자에게 적용되는 기본 FlashTrade 설정입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GlobalSettingsForm />
            </CardContent>
          </Card>

          {/* 현재 설정 요약 */}
          {globalSettings && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2" />
                  현재 설정 요약
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{globalSettings.winRate}%</div>
                    <div className="text-sm text-muted-foreground">승률</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{globalSettings.maxProfitRate}%</div>
                    <div className="text-sm text-muted-foreground">수익률</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      ${globalSettings.minAmount}-${globalSettings.maxAmount}
                    </div>
                    <div className="text-sm text-muted-foreground">거래 금액</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {globalSettings.availableDurations.length}개
                    </div>
                    <div className="text-sm text-muted-foreground">거래 시간</div>
                  </div>
                </div>
                
                {globalSettings.forceResult && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>강제 결과 활성화:</strong> 모든 거래가 &ldquo;{globalSettings.forceResult === 'win' ? '승리' : '패배'}&rdquo;로 처리됩니다.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2" />
                사용자별 설정
              </CardTitle>
              <CardDescription>
                특정 사용자에게만 적용되는 개별 설정입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userSettings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    설정된 사용자별 설정이 없습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userSettings.map((setting) => (
                    <div key={setting.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">사용자 ID: {setting.userId}</h4>
                          <p className="text-sm text-muted-foreground">
                            승률: {setting.winRate}% | 수익률: {setting.maxProfitRate}%
                          </p>
                        </div>
                        <Badge variant={setting.isActive ? "default" : "secondary"}>
                          {setting.isActive ? '활성' : '비활성'}
                        </Badge>
                      </div>
                      {setting.forceResult && (
                        <Badge variant="outline" className="mt-2">
                          강제 결과: {setting.forceResult === 'win' ? '승리' : '패배'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
} 