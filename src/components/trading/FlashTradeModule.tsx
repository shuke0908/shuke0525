'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  ArrowUp,
  ArrowDown,
  Clock,
  TrendingUp,
  Zap,
  Timer,
} from 'lucide-react';
import FlashTradeResultModal from './FlashTradeResultModal';
// 통합 API 클라이언트 사용
import { tradeApi } from '@/lib/api-client-unified';

// 타입 정의 (관리자 제어 중심)
type FlashTradeSetting = {
  id: string;
  duration: number;
  returnRate: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  symbol: string;
};

type ActiveFlashTrade = {
  id: string;
  amount: number;
  direction: 'up' | 'down';
  duration: number;
  returnRate: number;
  entryPrice: number;
  potentialProfit: number;
  startTime: string;
  remainingTime: number;
  symbol: string;
  status: 'active' | 'pending' | 'completed';
};

type FlashTradeResult = {
  isWin: boolean;
  tradeData: {
    amount: string;
    direction: 'up' | 'down';
    duration: number;
    entryPrice: string;
    exitPrice: string;
    potentialProfit: string;
    actualProfit: string;
    returnRate: string;
    symbol: string;
  };
};

type FlashTradeModuleProps = {
  symbol?: string;
  currentPrice?: string;
};

// Zod 스키마 정의 (관리자 제어 중심)
const flashTradeSchema = z.object({
  amount: z
    .number()
    .min(1, 'Amount must be at least $1')
    .max(10000, 'Amount cannot exceed $10,000'),
  direction: z.enum(['up', 'down'], {
    required_error: 'Direction is required',
  }),
  duration: z.number().min(30, 'Duration must be at least 30 seconds'),
});

type FlashTradeFormData = z.infer<typeof flashTradeSchema>;

// 유틸리티 함수들
const formatTimeRemaining = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

// 커스텀 훅: Flash Trade 설정 관리
function useFlashTradeSettings(symbol: string) {
  return useQuery({
    queryKey: ['flash-trade', 'settings', symbol],
    queryFn: async (): Promise<{ settings: FlashTradeSetting[] }> => {
      try {
        const response = await tradeApi.getFlashTradeSettings();
        const settings = response.settings || [];

        // 기본 설정이 없는 경우 샘플 설정 반환
        if (settings.length === 0) {
          return {
            settings: [
              {
                id: '1',
                duration: 30,
                returnRate: 85,
                minAmount: 5,
                maxAmount: 1000,
                isActive: true,
                symbol,
              },
              {
                id: '2',
                duration: 60,
                returnRate: 80,
                minAmount: 10,
                maxAmount: 2000,
                isActive: true,
                symbol,
              },
              {
                id: '3',
                duration: 300,
                returnRate: 75,
                minAmount: 25,
                maxAmount: 5000,
                isActive: true,
                symbol,
              },
            ] as FlashTradeSetting[],
          };
        }

        return { settings };
      } catch (error) {
        // 에러 시 빈 배열 반환
        return { settings: [] };
      }
    },
    staleTime: 60 * 1000, // 1분간 캐시 유지
  });
}

// 커스텀 훅: 활성 Flash Trade 관리
function useActiveFlashTrades() {
  return useQuery({
    queryKey: ['flash-trade', 'active'],
    queryFn: async (): Promise<{ activeTrades: ActiveFlashTrade[] }> => {
      try {
        const response = await tradeApi.getActiveFlashTrades();
        const activeTrades = response.trades || [];
        return { activeTrades };
      } catch (error) {
        // 에러 시 빈 배열 반환
        return { activeTrades: [] };
      }
    },
    staleTime: 5 * 1000, // 5초간 캐시 유지
    refetchInterval: 5 * 1000, // 5초마다 갱신
  });
}

// 커스텀 훅: Flash Trade 생성
function useCreateFlashTrade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (
      data: FlashTradeFormData & { symbol: string; entryPrice: number }
    ) => {
      return await tradeApi.createFlashTrade({
        amount: data.amount,
        direction: data.direction,
        duration: data.duration,
        symbol: data.symbol,
        entryPrice: data.entryPrice,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flash-trade', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      toast({
        title: 'Flash Trade Created',
        description: `Your ${variables.duration}s ${variables.direction.toUpperCase()} trade has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Trade Failed',
        description: error.message || 'Failed to create flash trade.',
        variant: 'destructive',
      });
    },
  });
}

// 커스텀 훅: 로컬 타이머 (시각적 카운트다운만)
function useLocalTimer(activeTradesFromServer: ActiveFlashTrade[]) {
  const [localTrades, setLocalTrades] = useState<ActiveFlashTrade[]>([]);

  useEffect(() => {
    setLocalTrades(activeTradesFromServer);
  }, [activeTradesFromServer]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTrades(currentTrades => {
        return currentTrades.map(trade => {
          const elapsed = Math.floor(
            (Date.now() - new Date(trade.startTime).getTime()) / 1000
          );
          const remainingTime = Math.max(0, trade.duration - elapsed);
          return { ...trade, remainingTime };
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return localTrades;
}

// 메인 컴포넌트
const FlashTradeModule = ({
  symbol = 'BTC/USDT',
  currentPrice: propCurrentPrice = '41255.78',
}: FlashTradeModuleProps) => {
  const [currentPrice, setCurrentPrice] = useState<string>(propCurrentPrice);
  const [showResultModal, setShowResultModal] = useState(false);
  const [tradeResult, setTradeResult] = useState<FlashTradeResult | null>(null);
  const [activeTrades, setActiveTrades] = useState<ActiveFlashTrade[]>([]);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 커스텀 훅들 사용
  const { data: settingsData, isLoading: settingsLoading } =
    useFlashTradeSettings(symbol);
  const { data: activeTradesData, isLoading: activeTradesLoading } =
    useActiveFlashTrades();
  const createMutation = useCreateFlashTrade();

  const settings = useMemo(() => settingsData?.settings || [], [settingsData?.settings]);
  const timerTrades = useLocalTimer(activeTradesData?.activeTrades || []);

  // React Hook Form 설정
  const form = useForm<FlashTradeFormData>({
    resolver: zodResolver(flashTradeSchema),
    defaultValues: {
      amount: 0,
      direction: 'up',
      duration: settings[0]?.duration || 30,
    },
  });

  // 설정이 로드되면 기본 지속시간 설정
  useEffect(() => {
    if (settings.length > 0 && settings[0]) {
      const currentDuration = form.getValues('duration') ?? 0;
      if (!currentDuration || currentDuration === 0) {
        form.setValue('duration', settings[0].duration);
      }
    }
  }, [settings, form]);

  // WebSocket 연결 및 메시지 처리
  const webSocketResult = useWebSocket({
    onMessage: (data: any) => {
      if (data.type === 'flash_price_update') {
        if (data.data.symbol === symbol) {
          setCurrentPrice(data.data.price);
        }
      } else if (data.type === 'flash_trade_completed') {
        const resultData = data.data;
        const isWin = resultData.finalOutcome === 'win';

        setTradeResult({
          isWin,
          tradeData: {
            amount: String(resultData.amount),
            direction: resultData.direction,
            duration: resultData.durationSeconds || resultData.duration,
            entryPrice: String(resultData.entryPrice),
            exitPrice: String(resultData.exitPrice),
            potentialProfit: String(resultData.potentialProfit),
            actualProfit: String(isWin ? resultData.profit : 0),
            returnRate: String(resultData.returnRate),
            symbol: resultData.symbol,
          },
        });
        setShowResultModal(true);

        queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
        queryClient.invalidateQueries({ queryKey: ['flash-trade', 'active'] });
        queryClient.invalidateQueries({ queryKey: ['flash-trade', 'history'] });
      } else if (data.type === 'flash_trade_outcome_forced') {
        toast({
          title: 'Trade Update',
          description:
            data.data.message ||
            'An administrator has updated the outcome of one of your trades.',
        });
        queryClient.invalidateQueries({ queryKey: ['flash-trade', 'active'] });
        queryClient.invalidateQueries({ queryKey: ['flash-trade', 'history'] });
      } else if (data.type === 'flash_trade_error') {
        toast({
          title: 'Flash Trade Error',
          description:
            data.message || 'An error occurred with your flash trade.',
          variant: 'destructive',
        });
      }
    },
  } as any);

  const isConnected = (webSocketResult as any)?.isConnected || false;

  // 이벤트 핸들러들
  const onSubmit = (data: FlashTradeFormData) => {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'User not authenticated. Please log in again.',
        variant: 'destructive',
      });
      return;
    }

    const userBalance = parseFloat(user.balance || '0');
    if (userBalance < data.amount) {
      toast({
        title: 'Insufficient Balance',
        description: "You don't have enough funds for this trade amount.",
        variant: 'destructive',
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: 'Connection Error',
        description:
          'Not connected to the trading server. Please wait or try refreshing.',
        variant: 'destructive',
      });
      return;
    }

    const entryPrice = parseFloat(currentPrice);
    createMutation.mutate({
      ...data,
      symbol,
      entryPrice,
    });
  };

  const handleQuickAmount = (value: number | 'max') => {
    if (value === 'max' && user) {
      form.setValue('amount', parseFloat(user.balance || '0'));
    } else if (typeof value === 'number') {
      form.setValue('amount', value);
    }
  };

  // 선택된 설정 가져오기
  const selectedSetting = settings.find(
    s => s.duration === form.watch('duration')
  );
  const potentialProfit = selectedSetting
    ? (form.watch('amount') * selectedSetting.returnRate) / 100
    : 0;

  // 타이머 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTrades(prev => 
        prev.map(trade => {
          if (trade.status === 'active' && Date.now() >= trade.remainingTime) {
            // 거래 완료 - 랜덤하게 승/패 결정 (실제로는 실제 가격 비교)
            const currentPriceNum = parseFloat(currentPrice);
            const priceChange = (Math.random() - 0.5) * 0.02; // -1% ~ +1% 변화
            const finalPrice = trade.entryPrice * (1 + priceChange);
            
            const won = (trade.direction === 'up' && finalPrice > trade.entryPrice) ||
                        (trade.direction === 'down' && finalPrice < trade.entryPrice);
            
            const newStatus = won ? 'completed' : 'pending';
            
            // 결과 알림
            toast({
              title: won ? "Trade Won! 🎉" : "Trade Lost 😔",
              description: won 
                ? `You won $${(trade.amount * trade.returnRate / 100).toFixed(2)}!`
                : `You lost $${trade.amount.toFixed(2)}`,
              variant: won ? "default" : "destructive",
            });
            
            return { ...trade, status: newStatus };
          }
          return trade;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPrice, toast]);

  // 남은 시간 계산
  const getRemainingTime = (trade: ActiveFlashTrade) => {
    if (trade.status !== 'active') return 0;
    return Math.max(0, trade.duration - trade.remainingTime);
  };

  // 진행률 계산
  const getProgress = (trade: ActiveFlashTrade) => {
    if (trade.status !== 'active') return 100;
    const totalTime = trade.duration;
    const elapsed = totalTime - trade.remainingTime;
    return Math.min(100, (elapsed / totalTime) * 100);
  };

  // 렌더링 유틸리티 함수들
  const renderQuickAmountButtons = () => (
    <div className='flex flex-wrap gap-2 mb-4'>
      {[10, 25, 50, 100].map(amount => (
        <Button
          key={amount}
          type='button'
          variant='outline'
          size='sm'
          onClick={() => handleQuickAmount(amount)}
          disabled={createMutation.isPending}
        >
          ${amount}
        </Button>
      ))}
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => handleQuickAmount('max')}
        disabled={createMutation.isPending}
      >
        Max
      </Button>
    </div>
  );

  const renderDirectionButtons = () => (
    <div className='grid grid-cols-2 gap-2'>
      <Button
        type='button'
        variant={form.watch('direction') === 'up' ? 'default' : 'outline'}
        onClick={() => form.setValue('direction', 'up')}
        disabled={createMutation.isPending}
        className='h-12'
      >
        <ArrowUp className='mr-2 h-4 w-4' />
        Higher
      </Button>
      <Button
        type='button'
        variant={form.watch('direction') === 'down' ? 'default' : 'outline'}
        onClick={() => form.setValue('direction', 'down')}
        disabled={createMutation.isPending}
        className='h-12'
      >
        <ArrowDown className='mr-2 h-4 w-4' />
        Lower
      </Button>
    </div>
  );

  const renderActiveTradeCard = (trade: ActiveFlashTrade) => (
    <Card key={trade.id} className='mb-4'>
      <CardContent className='p-4'>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-2'>
            <Badge
              variant={trade.direction === 'up' ? 'default' : 'destructive'}
            >
              {trade.direction === 'up' ? (
                <ArrowUp className='h-3 w-3' />
              ) : (
                <ArrowDown className='h-3 w-3' />
              )}
              {trade.direction.toUpperCase()}
            </Badge>
            <span className='font-medium'>{formatCurrency(trade.amount)}</span>
          </div>
          <div className='text-right'>
            <div className='text-sm text-muted-foreground'>Time Left</div>
            <div className='font-mono text-lg'>
              {formatTimeRemaining(getRemainingTime(trade))}
            </div>
          </div>
        </div>

        <div className='grid grid-cols-3 gap-4 text-sm'>
          <div>
            <div className='text-muted-foreground'>Entry Price</div>
            <div className='font-medium'>
              ${trade.entryPrice.toLocaleString()}
            </div>
          </div>
          <div>
            <div className='text-muted-foreground'>Return Rate</div>
            <div className='font-medium'>{trade.returnRate}%</div>
          </div>
          <div>
            <div className='text-muted-foreground'>Potential Profit</div>
            <div className='font-medium text-green-600'>
              +{formatCurrency(trade.potentialProfit)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Zap className='h-5 w-5' />
                Flash Trade
              </CardTitle>
              <CardDescription>
                Quick trades with fixed time and return rates
              </CardDescription>
            </div>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Current Price Display */}
          <div className='bg-muted p-4 rounded-lg mb-6'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-sm text-muted-foreground'>{symbol}</div>
                <div className='text-2xl font-bold'>
                  ${parseFloat(currentPrice).toLocaleString()}
                </div>
              </div>
              <TrendingUp className='h-8 w-8 text-muted-foreground' />
            </div>
          </div>

          {/* Active Trades */}
          {timerTrades.length > 0 && (
            <div className='mb-6'>
              <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                <Timer className='h-4 w-4' />
                Active Trades ({timerTrades.length})
              </h3>
              {activeTradesLoading ? (
                <div className='space-y-2'>
                  {Array(2)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className='h-20 w-full' />
                    ))}
                </div>
              ) : (
                timerTrades.map(renderActiveTradeCard)
              )}
            </div>
          )}

          {/* Trade Form */}
          {settingsLoading ? (
            <div className='space-y-4'>
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-20 w-full' />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                {/* Amount Input */}
                <FormField
                  control={form.control}
                  name='amount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trade Amount</FormLabel>
                      <FormControl>
                        <div className='space-y-2'>
                          <Input
                            type='number'
                            placeholder='Enter amount...'
                            {...field}
                            onChange={e =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                            min={selectedSetting?.minAmount || 1}
                            max={selectedSetting?.maxAmount || 10000}
                          />
                          {renderQuickAmountButtons()}
                        </div>
                      </FormControl>
                      <FormMessage />
                      {selectedSetting && (
                        <div className='text-xs text-muted-foreground'>
                          Min: {formatCurrency(selectedSetting.minAmount)} |
                          Max: {formatCurrency(selectedSetting.maxAmount)}
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                {/* Duration Selection */}
                <FormField
                  control={form.control}
                  name='duration'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Select
                        value={field.value.toString()}
                        onValueChange={value => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select duration' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {settings.map(setting => (
                            <SelectItem
                              key={setting.id}
                              value={setting.duration.toString()}
                            >
                              <div className='flex items-center justify-between w-full'>
                                <span>{setting.duration}s</span>
                                <Badge variant='outline' className='ml-2'>
                                  {setting.returnRate}%
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Direction Selection */}
                <FormField
                  control={form.control}
                  name='direction'
                  render={() => (
                    <FormItem>
                      <FormLabel>Direction Prediction</FormLabel>
                      <FormControl>{renderDirectionButtons()}</FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Trade Summary */}
                {selectedSetting && form.watch('amount') > 0 && (
                  <div className='bg-muted p-4 rounded-lg'>
                    <div className='text-sm font-medium mb-2'>
                      Trade Summary
                    </div>
                    <div className='grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <div className='text-muted-foreground'>Investment</div>
                        <div className='font-medium'>
                          {formatCurrency(form.watch('amount'))}
                        </div>
                      </div>
                      <div>
                        <div className='text-muted-foreground'>
                          Potential Profit
                        </div>
                        <div className='font-medium text-green-600'>
                          +{formatCurrency(potentialProfit)}
                        </div>
                      </div>
                      <div>
                        <div className='text-muted-foreground'>Return Rate</div>
                        <div className='font-medium'>
                          {selectedSetting.returnRate}%
                        </div>
                      </div>
                      <div>
                        <div className='text-muted-foreground'>Duration</div>
                        <div className='font-medium'>
                          {selectedSetting.duration}s
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type='submit'
                  className='w-full h-12'
                  disabled={
                    createMutation.isPending ||
                    !isConnected ||
                    form.watch('amount') <= 0
                  }
                >
                  {createMutation.isPending ? (
                    <>
                      <Clock className='mr-2 h-4 w-4 animate-spin' />
                      Creating Trade...
                    </>
                  ) : (
                    <>
                      <Zap className='mr-2 h-4 w-4' />
                      Create Flash Trade
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Result Modal */}
      {showResultModal && tradeResult && (
        <FlashTradeResultModal
          open={showResultModal}
          onClose={() => {
            setShowResultModal(false);
            setTradeResult(null);
          }}
          result={tradeResult}
        />
      )}
    </>
  );
};

export { FlashTradeModule };
