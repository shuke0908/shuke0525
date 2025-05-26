'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Zap,
  Timer,
  Target,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Ban
} from 'lucide-react';
import { AppLayout } from '@/components/layout';

type FlashTrade = {
  id: string;
  user_id: string;
  amount: number;
  direction: 'up' | 'down';
  duration: number;
  return_rate: number;
  entry_price: number;
  current_price?: number;
  exit_price?: number;
  status: 'active' | 'completed' | 'cancelled';
  result?: 'win' | 'loss';
  profit?: number;
  created_at: string;
  expires_at: string;
  admin_intervention?: boolean;
  admin_reason?: string;
  users: {
    id: string;
    email: string;
    username: string;
    balance: string;
  };
};

type AdminAction = {
  action: 'force_result' | 'cancel_trade' | 'extend_time' | 'adjust_amount';
  tradeId: string;
  result?: 'win' | 'loss';
  reason: string;
  adminId: string;
  additionalSeconds?: number;
  newAmount?: number;
};

function FlashTradeControlPage() {
  const [selectedTrade, setSelectedTrade] = useState<FlashTrade | null>(null);
  const [actionType, setActionType] = useState<AdminAction['action']>('force_result');
  const [actionReason, setActionReason] = useState('');
  const [forceResult, setForceResult] = useState<'win' | 'loss'>('win');
  const [additionalTime, setAdditionalTime] = useState(30);
  const [newAmount, setNewAmount] = useState(0);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 실시간 FlashTrade 데이터 조회
  const { data: controlData, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'flash-trade-control'],
    queryFn: async () => {
      const response = await fetch('/api/admin/flash-trade-control');
      if (!response.ok) throw new Error('Failed to fetch flash trade data');
      return response.json();
    },
    refetchInterval: 2000, // 2초마다 자동 갱신
  });

  // 관리자 액션 실행
  const actionMutation = useMutation({
    mutationFn: async (actionData: AdminAction) => {
      const response = await fetch('/api/admin/flash-trade-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionData),
      });
      if (!response.ok) throw new Error('Failed to execute action');
      return response.json();
    },
    onSuccess: (data, _variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flash-trade-control'] });
      toast({
        title: '액션 실행 완료',
        description: data.message || '관리자 액션이 성공적으로 실행되었습니다.',
      });
      setIsActionDialogOpen(false);
      setSelectedTrade(null);
      setActionReason('');
    },
    onError: (error: Error) => {
      toast({
        title: '액션 실행 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const activeTrades = controlData?.activeTrades || [];
  const statistics = controlData?.statistics || {};

  // 남은 시간 계산
  const getRemainingTime = (trade: FlashTrade) => {
    const now = new Date().getTime();
    const expiry = new Date(trade.expires_at).getTime();
    const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
    return remaining;
  };

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 관리자 액션 실행
  const executeAction = () => {
    if (!selectedTrade || !actionReason.trim()) {
      toast({
        title: '입력 오류',
        description: '거래를 선택하고 사유를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    const actionData: AdminAction = {
      action: actionType,
      tradeId: selectedTrade.id,
      reason: actionReason,
      adminId: 'admin-user-id', // 실제로는 현재 관리자 ID
    };

    if (actionType === 'force_result') {
      actionData.result = forceResult;
    } else if (actionType === 'extend_time') {
      actionData.additionalSeconds = additionalTime;
    } else if (actionType === 'adjust_amount') {
      actionData.newAmount = newAmount;
    }

    actionMutation.mutate(actionData);
  };

  // 액션 다이얼로그 열기
  const openActionDialog = (trade: FlashTrade, action: AdminAction['action']) => {
    setSelectedTrade(trade);
    setActionType(action);
    setNewAmount(trade.amount);
    setIsActionDialogOpen(true);
  };

  return (
    <AppLayout 
      title="FlashTrade 실시간 제어" 
      description="실시간으로 FlashTrade를 모니터링하고 관리자 권한으로 제어합니다"
      variant="admin"
    >
      <div className="mb-6">
        <div className="flex items-center justify-end">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 실시간 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 거래</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalActiveTrades || 0}</div>
            <p className="text-xs text-muted-foreground">
              UP: {statistics.upTrades || 0} | DOWN: {statistics.downTrades || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 거래 금액</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(statistics.totalActiveAmount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">활성 거래 총액</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24시간 완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.completed24h?.total || 0}</div>
            <p className="text-xs text-green-600">
              승리: {statistics.completed24h?.won || 0} | 패배: {statistics.completed24h?.lost || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24시간 수익</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(statistics.completed24h?.totalProfit || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              거래량: ${(statistics.completed24h?.totalVolume || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 활성 거래 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            활성 FlashTrade 목록 ({activeTrades.length})
          </CardTitle>
          <CardDescription>
            현재 진행 중인 모든 FlashTrade를 실시간으로 모니터링하고 제어할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : activeTrades.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">활성 거래 없음</h3>
              <p className="text-muted-foreground">현재 진행 중인 FlashTrade가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사용자</TableHead>
                    <TableHead>방향</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>수익률</TableHead>
                    <TableHead>진입가</TableHead>
                    <TableHead>현재가</TableHead>
                    <TableHead>남은시간</TableHead>
                    <TableHead>잠재수익</TableHead>
                    <TableHead>관리자 제어</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeTrades.map((trade) => {
                    const remainingTime = getRemainingTime(trade);
                    const potentialProfit = (trade.amount * trade.return_rate) / 100;
                    const currentPrice = trade.current_price || trade.entry_price;
                    const priceChange = ((currentPrice - trade.entry_price) / trade.entry_price) * 100;
                    const isWinning = 
                      (trade.direction === 'up' && currentPrice > trade.entry_price) ||
                      (trade.direction === 'down' && currentPrice < trade.entry_price);

                    return (
                      <TableRow key={trade.id} className={remainingTime < 30 ? 'bg-red-50' : ''}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{trade.users.username || trade.users.email}</div>
                            <div className="text-sm text-muted-foreground">
                              잔액: ${parseFloat(trade.users.balance).toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={trade.direction === 'up' ? 'default' : 'destructive'}>
                            {trade.direction === 'up' ? (
                              <ArrowUp className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDown className="h-3 w-3 mr-1" />
                            )}
                            {trade.direction.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${trade.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{trade.return_rate}%</Badge>
                        </TableCell>
                        <TableCell>${trade.entry_price.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className={`font-medium ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${currentPrice.toLocaleString()}
                            <div className="text-xs">
                              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-mono ${remainingTime < 30 ? 'text-red-600 font-bold' : ''}`}>
                            {formatTime(remainingTime)}
                          </div>
                          {remainingTime < 30 && (
                            <Badge variant="destructive" className="text-xs">
                              마감임박
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className={`font-medium ${isWinning ? 'text-green-600' : 'text-red-600'}`}>
                            {isWinning ? '+' : '-'}${potentialProfit.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isWinning ? '승리 예상' : '패배 예상'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openActionDialog(trade, 'force_result')}
                              className="text-xs"
                            >
                              <Target className="h-3 w-3 mr-1" />
                              결과설정
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openActionDialog(trade, 'extend_time')}
                              className="text-xs"
                            >
                              <Timer className="h-3 w-3 mr-1" />
                              시간연장
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openActionDialog(trade, 'adjust_amount')}
                              className="text-xs"
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              금액조정
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openActionDialog(trade, 'cancel_trade')}
                              className="text-xs"
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              취소
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 관리자 액션 다이얼로그 */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>관리자 액션 실행</DialogTitle>
            <DialogDescription>
              선택한 거래에 대해 관리자 권한으로 액션을 실행합니다.
            </DialogDescription>
          </DialogHeader>

          {selectedTrade && (
            <div className="space-y-4">
              {/* 거래 정보 */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">거래 정보</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>사용자: {selectedTrade.users.username}</div>
                  <div>금액: ${selectedTrade.amount.toLocaleString()}</div>
                  <div>방향: {selectedTrade.direction.toUpperCase()}</div>
                  <div>수익률: {selectedTrade.return_rate}%</div>
                </div>
              </div>

              {/* 액션 타입 선택 */}
              <div>
                <label className="text-sm font-medium">액션 타입</label>
                <Select value={actionType} onValueChange={(value: AdminAction['action']) => setActionType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="force_result">거래 결과 강제 설정</SelectItem>
                    <SelectItem value="extend_time">거래 시간 연장</SelectItem>
                    <SelectItem value="adjust_amount">거래 금액 조정</SelectItem>
                    <SelectItem value="cancel_trade">거래 취소 및 환불</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 액션별 추가 옵션 */}
              {actionType === 'force_result' && (
                <div>
                  <label className="text-sm font-medium">강제 결과</label>
                  <Select value={forceResult} onValueChange={(value: 'win' | 'loss') => setForceResult(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="win">승리 (사용자가 수익)</SelectItem>
                      <SelectItem value="loss">패배 (사용자가 손실)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {actionType === 'extend_time' && (
                <div>
                  <label className="text-sm font-medium">추가 시간 (초)</label>
                  <Input
                    type="number"
                    value={additionalTime}
                    onChange={(e) => setAdditionalTime(parseInt(e.target.value) || 0)}
                    min={1}
                    max={300}
                  />
                </div>
              )}

              {actionType === 'adjust_amount' && (
                <div>
                  <label className="text-sm font-medium">새로운 금액 ($)</label>
                  <Input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
                    min={1}
                    step={0.01}
                  />
                </div>
              )}

              {/* 사유 입력 */}
              <div>
                <label className="text-sm font-medium">액션 사유 (필수)</label>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="관리자 액션의 사유를 입력해주세요..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
              취소
            </Button>
            <Button 
              onClick={executeAction} 
              disabled={actionMutation.isPending || !actionReason.trim()}
            >
              {actionMutation.isPending ? '실행 중...' : '액션 실행'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// Dynamic import로 SSR 문제 해결
import dynamic from 'next/dynamic';
export default dynamic(() => Promise.resolve(FlashTradeControlPage), { ssr: false }); 