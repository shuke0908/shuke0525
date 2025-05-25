'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';

interface TradeActivity {
  userId: string;
  userEmail: string;
  direction: 'up' | 'down';
  amount: number;
  result: 'win' | 'lose';
  profit: number;
  timestamp: string;
}

interface RealtimeActivityProps {
  activities: TradeActivity[];
}

export function RealtimeActivity({ activities }: RealtimeActivityProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          실시간 거래 활동
          <Badge variant="secondary" className="ml-auto">
            {activities.length}개 활동
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-96">
          {activities.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">거래 활동이 없습니다</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div
                  key={`${activity.userId}-${activity.timestamp}-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    {/* 방향 아이콘 */}
                    <div className={`p-2 rounded-full ${
                      activity.direction === 'up' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {activity.direction === 'up' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>

                    {/* 거래 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {activity.userEmail}
                        </span>
                        <Badge 
                          variant={activity.result === 'win' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {activity.result === 'win' ? '승리' : '패배'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(activity.amount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 수익/손실 */}
                  <div className="text-right">
                    <div className={`font-bold text-sm ${
                      activity.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {activity.profit >= 0 ? '+' : ''}{formatCurrency(activity.profit)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.direction.toUpperCase()} 예측
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 