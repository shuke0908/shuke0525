import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import {
  BrainCircuit,
  TrendingUp,
  BarChart3,
  DollarSign,
  Factory,
  Scale,
  ListChecks,
  CircleDollarSign,
  Ban,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
// 통합 API 클라이언트 사용
import { userApi } from '@/lib/api-client-unified';

// 타입 정의 (관리자 제어 중심)
type QuantAIStrategy = {
  id: string;
  name: string;
  description: string;
  duration: number; // days
  dailyReturnRate: number;
  totalReturnRate: number;
  minAmount: number;
  maxAmount: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  assetClass: string;
  isActive: boolean;
  performanceMetrics?: {
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    volatility: number;
  };
};

type QuantAIInvestment = {
  id: string;
  strategyId: string;
  strategyName: string;
  amount: number;
  duration: number;
  dailyReturnRate: number;
  totalReturnRate: number;
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  currentValue: number;
  totalReturn: number;
  progress: number;
  daysRemaining: number;
};

// Zod 스키마 정의 (관리자 제어 중심)
const quantAIInvestmentSchema = z.object({
  strategyId: z.string().min(1, 'Strategy is required'),
  amount: z
    .number()
    .min(10, 'Minimum investment is $10')
    .max(50000, 'Maximum investment is $50,000'),
});

type QuantAIInvestmentFormData = z.infer<typeof quantAIInvestmentSchema>;

// 유틸리티 함수들
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

const calculateProgress = (startDate: string, endDate: string): number => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return 0;
  if (now > end) return 100;

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();

  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
};

const getDaysRemaining = (endDate: string): number => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// 커스텀 훅: Quant AI 전략 관리
function useQuantAIStrategies() {
  return useQuery({
    queryKey: ['quant-ai', 'strategies'],
    queryFn: async (): Promise<{ strategies: QuantAIStrategy[] }> => {
      try {
        // getQuantAIStrategies가 없으므로 대체 API 사용 또는 샘플 데이터 반환
        // const response = await userApi.getQuantAIStrategies();
        // const strategies = response.strategies || [];

        // 기본 전략 샘플 데이터 반환
        return {
          strategies: [
            {
              id: '1',
              name: 'Conservative Growth',
              description: 'Low-risk strategy focusing on stable returns',
              duration: 30,
              dailyReturnRate: 0.015,
              totalReturnRate: 0.45,
              minAmount: 100,
              maxAmount: 10000,
              riskLevel: 'Low',
              assetClass: 'Crypto',
              isActive: true,
              performanceMetrics: {
                sharpeRatio: 1.2,
                maxDrawdown: 0.05,
                winRate: 0.75,
                volatility: 0.12,
              },
            },
            {
              id: '2',
              name: 'Aggressive Growth',
              description: 'High-risk, high-reward strategy',
              duration: 60,
              dailyReturnRate: 0.025,
              totalReturnRate: 1.5,
              minAmount: 500,
              maxAmount: 25000,
              riskLevel: 'High',
              assetClass: 'Crypto',
              isActive: true,
              performanceMetrics: {
                sharpeRatio: 0.8,
                maxDrawdown: 0.15,
                winRate: 0.65,
                volatility: 0.25,
              },
            },
            {
              id: '3',
              name: 'Balanced Portfolio',
              description: 'Medium-risk strategy with balanced approach',
              duration: 45,
              dailyReturnRate: 0.02,
              totalReturnRate: 0.9,
              minAmount: 250,
              maxAmount: 15000,
              riskLevel: 'Medium',
              assetClass: 'Mixed',
              isActive: true,
              performanceMetrics: {
                sharpeRatio: 1.0,
                maxDrawdown: 0.08,
                winRate: 0.7,
                volatility: 0.18,
              },
            },
          ] as QuantAIStrategy[],
        };
      } catch (error) {
        // 에러 시 빈 배열 반환
        return { strategies: [] };
      }
    },
    staleTime: 60 * 1000, // 1분간 캐시 유지
  });
}

// 커스텀 훅: Quant AI 투자 관리
function useQuantAIInvestments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quant-ai', 'investments', user?.id],
    queryFn: async (): Promise<{ investments: QuantAIInvestment[] }> => {
      try {
        // getQuantAIInvestments가 없으므로 getActiveInvestments 사용
        const response = await userApi.getActiveInvestments();
        const investments = (response as any).investments || [];

        // 투자 데이터에 계산된 값들 추가
        const processedInvestments = investments.map((investment: any) => ({
          ...investment,
          progress: calculateProgress(investment.startDate, investment.endDate),
          daysRemaining: getDaysRemaining(investment.endDate),
        }));

        return { investments: processedInvestments };
      } catch (error) {
        // 에러 시 빈 배열 반환
        return { investments: [] };
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30초간 캐시 유지
    refetchInterval: 60 * 1000, // 1분마다 갱신
  });
}

// 커스텀 훅: Quant AI 투자 생성
function useCreateQuantAIInvestment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: QuantAIInvestmentFormData) => {
      // createQuantAIInvestment가 없으므로 대체 API 사용 또는 임시 구현
      return await (userApi as any).createInvestment({
        strategyId: data.strategyId,
        amount: data.amount,
        type: 'quant-ai',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['quant-ai', 'investments', user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      toast({
        title: 'Investment Created',
        description: 'Your Quant AI investment has been started successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Investment Failed',
        description: error.message || 'Failed to create Quant AI investment.',
        variant: 'destructive',
      });
    },
  });
}

// 커스텀 훅: Quant AI 투자 취소
function useCancelQuantAIInvestment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (investmentId: string) => {
      // cancelQuantAIInvestment가 없으므로 대체 API 사용 또는 임시 구현
      return await (userApi as any).cancelInvestment(investmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['quant-ai', 'investments', user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      toast({
        title: 'Investment Cancelled',
        description:
          'Your Quant AI investment has been cancelled successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel Quant AI investment.',
        variant: 'destructive',
      });
    },
  });
}

// 메인 컴포넌트
const QuantAIModule: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // 커스텀 훅들 사용
  const { data: strategiesData, isLoading: strategiesLoading } =
    useQuantAIStrategies();
  const { data: investmentsData, isLoading: investmentsLoading } =
    useQuantAIInvestments();
  const createMutation = useCreateQuantAIInvestment();
  const cancelMutation = useCancelQuantAIInvestment();

  const strategies = useMemo(() => strategiesData?.strategies || [], [strategiesData?.strategies]);
  const investments = investmentsData?.investments || [];
  const activeInvestments = investments.filter(inv => inv.status === 'active');

  // React Hook Form 설정
  const form = useForm<QuantAIInvestmentFormData>({
    resolver: zodResolver(quantAIInvestmentSchema),
    defaultValues: {
      strategyId: '',
      amount: 0,
    },
  });

  // 선택된 전략 정보를 위한 strategyId 변수 분리
  const strategyId = form.watch('strategyId');

  const selectedStrategy = useMemo(() => {
    return strategies.find(s => s.id === strategyId) || null;
  }, [strategies, strategyId]);

  // 이벤트 핸들러들
  const onSubmit = (data: QuantAIInvestmentFormData) => {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to create an investment.',
        variant: 'destructive',
      });
      return;
    }

    const userBalance = parseFloat(user.balance || '0');
    if (userBalance < data.amount) {
      toast({
        title: 'Insufficient Balance',
        description: "You don't have enough funds for this investment.",
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(data, {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  const handleQuickAmount = (value: number | 'max') => {
    if (value === 'max' && user) {
      const maxValue = selectedStrategy
        ? Math.min(parseFloat(user.balance || '0'), selectedStrategy.maxAmount)
        : parseFloat(user.balance || '0');
      form.setValue('amount', maxValue);
    } else if (typeof value === 'number') {
      form.setValue('amount', value);
    }
  };

  const handleCancelInvestment = (investmentId: string) => {
    cancelMutation.mutate(investmentId);
  };

  // 유틸리티 함수들
  const getStrategyIcon = (strategyName: string) => {
    if (strategyName.toLowerCase().includes('conservative'))
      return <Scale className='h-6 w-6' />;
    if (strategyName.toLowerCase().includes('aggressive'))
      return <TrendingUp className='h-6 w-6' />;
    if (strategyName.toLowerCase().includes('balanced'))
      return <BarChart3 className='h-6 w-6' />;
    if (strategyName.toLowerCase().includes('income'))
      return <DollarSign className='h-6 w-6' />;
    if (strategyName.toLowerCase().includes('index'))
      return <Factory className='h-6 w-6' />;
    return <BrainCircuit className='h-6 w-6' />;
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Very High':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 렌더링 유틸리티 함수들
  const renderQuickAmountButtons = () => (
    <div className='flex flex-wrap gap-2 mb-4'>
      {[100, 500, 1000, 2500].map(amount => (
        <Button
          key={amount}
          type='button'
          variant='outline'
          size='sm'
          onClick={() => handleQuickAmount(amount)}
          disabled={
            createMutation.isPending ||
            !selectedStrategy ||
            amount > selectedStrategy.maxAmount
          }
        >
          ${amount}
        </Button>
      ))}
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => handleQuickAmount('max')}
        disabled={createMutation.isPending || !selectedStrategy}
      >
        Max
      </Button>
    </div>
  );

  const renderStrategyCard = (strategy: QuantAIStrategy) => (
    <div
      key={strategy.id}
      className='p-4 border rounded-lg hover:bg-muted/50 transition-colors'
    >
      <div className='flex items-start justify-between mb-3'>
        <div className='flex items-center gap-3'>
          {getStrategyIcon(strategy.name)}
          <div>
            <h4 className='font-semibold'>{strategy.name}</h4>
            <p className='text-sm text-muted-foreground'>
              {strategy.description}
            </p>
          </div>
        </div>
        <Badge className={getRiskLevelColor(strategy.riskLevel)}>
          {strategy.riskLevel}
        </Badge>
      </div>

      <div className='grid grid-cols-2 gap-4 mb-3'>
        <div>
          <div className='text-xs text-muted-foreground'>Duration</div>
          <div className='font-medium'>{strategy.duration} days</div>
        </div>
        <div>
          <div className='text-xs text-muted-foreground'>Total Return</div>
          <div className='font-medium text-green-600'>
            +{formatPercentage(strategy.totalReturnRate)}
          </div>
        </div>
        <div>
          <div className='text-xs text-muted-foreground'>Min Investment</div>
          <div className='font-medium'>
            {formatCurrency(strategy.minAmount)}
          </div>
        </div>
        <div>
          <div className='text-xs text-muted-foreground'>Max Investment</div>
          <div className='font-medium'>
            {formatCurrency(strategy.maxAmount)}
          </div>
        </div>
      </div>

      {strategy.performanceMetrics && (
        <div className='grid grid-cols-2 gap-2 text-xs'>
          <div>
            <span className='text-muted-foreground'>Sharpe Ratio:</span>{' '}
            {strategy.performanceMetrics.sharpeRatio}
          </div>
          <div>
            <span className='text-muted-foreground'>Win Rate:</span>{' '}
            {formatPercentage(strategy.performanceMetrics.winRate)}
          </div>
        </div>
      )}
    </div>
  );

  const renderActiveInvestmentCard = (investment: QuantAIInvestment) => (
    <Card key={investment.id} className='mb-4'>
      <CardContent className='p-4'>
        <div className='flex items-center justify-between mb-3'>
          <div>
            <h4 className='font-semibold'>{investment.strategyName}</h4>
            <p className='text-sm text-muted-foreground'>
              {formatCurrency(investment.amount)} invested
            </p>
          </div>
          <Badge className={getStatusColor(investment.status)}>
            {investment.status.charAt(0).toUpperCase() +
              investment.status.slice(1)}
          </Badge>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Progress</span>
            <span>{investment.progress.toFixed(1)}%</span>
          </div>
          <Progress value={investment.progress} className='h-2' />

          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <div className='text-muted-foreground'>Current Value</div>
              <div className='font-medium'>
                {formatCurrency(investment.currentValue)}
              </div>
            </div>
            <div>
              <div className='text-muted-foreground'>Total Return</div>
              <div className='font-medium text-green-600'>
                +{formatCurrency(investment.totalReturn)}
              </div>
            </div>
            <div>
              <div className='text-muted-foreground'>Days Remaining</div>
              <div className='font-medium'>{investment.daysRemaining}</div>
            </div>
            <div>
              <div className='text-muted-foreground'>Daily Return</div>
              <div className='font-medium'>
                {formatPercentage(investment.dailyReturnRate)}
              </div>
            </div>
          </div>

          {investment.status === 'active' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full mt-2'
                  onClick={() => handleCancelInvestment(investment.id)}
                >
                  <Ban className='mr-2 h-4 w-4' />
                  Cancel Investment
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Investment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this investment? You will
                    receive your initial amount back, but you&apos;ll lose any
                    accrued returns.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => handleCancelInvestment(investment.id)}
                  >
                    Keep Investment
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleCancelInvestment(investment.id)}
                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Investment'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <BrainCircuit className='h-5 w-5' />
          Quant AI
        </CardTitle>
        <CardDescription>
          AI-powered investment strategies with automated trading
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Active Investments */}
        {activeInvestments.length > 0 && (
          <div className='mb-6'>
            <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
              <ListChecks className='h-4 w-4' />
              Active Investments ({activeInvestments.length})
            </h3>
            {investmentsLoading ? (
              <div className='space-y-2'>
                {Array(2)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className='h-32 w-full' />
                  ))}
              </div>
            ) : (
              activeInvestments.map(renderActiveInvestmentCard)
            )}
          </div>
        )}

        {/* Investment Form */}
        <div className='space-y-6'>
          <h3 className='text-lg font-semibold'>Start New Investment</h3>

          {strategiesLoading ? (
            <div className='space-y-4'>
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-24 w-full' />
              <Skeleton className='h-10 w-full' />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                {/* Strategy Selection */}
                <FormField
                  control={form.control}
                  name='strategyId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Strategy</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select an AI strategy' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {strategies.map(strategy => (
                            <SelectItem key={strategy.id} value={strategy.id}>
                              <div className='flex items-center justify-between w-full'>
                                <div>
                                  <span className='font-medium'>
                                    {strategy.name}
                                  </span>
                                  <span className='text-sm text-muted-foreground ml-2'>
                                    ({strategy.duration}d, +
                                    {formatPercentage(strategy.totalReturnRate)}
                                    )
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Strategy Details */}
                {selectedStrategy && (
                  <div className='bg-muted p-4 rounded-lg'>
                    <h4 className='font-semibold mb-2'>
                      {selectedStrategy.name}
                    </h4>
                    <p className='text-sm text-muted-foreground mb-3'>
                      {selectedStrategy.description}
                    </p>
                    {renderStrategyCard(selectedStrategy)}
                  </div>
                )}

                {/* Amount Input */}
                {selectedStrategy && (
                  <FormField
                    control={form.control}
                    name='amount'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investment Amount</FormLabel>
                        <FormControl>
                          <div className='space-y-2'>
                            <Input
                              type='number'
                              placeholder='Enter amount...'
                              {...field}
                              onChange={e =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                              min={selectedStrategy.minAmount}
                              max={selectedStrategy.maxAmount}
                            />
                            {renderQuickAmountButtons()}
                          </div>
                        </FormControl>
                        <FormMessage />
                        <div className='text-xs text-muted-foreground'>
                          Min: {formatCurrency(selectedStrategy.minAmount)} |
                          Max: {formatCurrency(selectedStrategy.maxAmount)}
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                {/* Investment Summary */}
                {selectedStrategy && form.watch('amount') > 0 && (
                  <div className='bg-muted p-4 rounded-lg'>
                    <div className='text-sm font-medium mb-2'>
                      Investment Summary
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
                          Expected Return
                        </div>
                        <div className='font-medium text-green-600'>
                          +
                          {formatCurrency(
                            form.watch('amount') *
                              selectedStrategy.totalReturnRate
                          )}
                        </div>
                      </div>
                      <div>
                        <div className='text-muted-foreground'>Duration</div>
                        <div className='font-medium'>
                          {selectedStrategy.duration} days
                        </div>
                      </div>
                      <div>
                        <div className='text-muted-foreground'>Risk Level</div>
                        <div className='font-medium'>
                          {selectedStrategy.riskLevel}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type='submit'
                  className='w-full'
                  disabled={
                    createMutation.isPending ||
                    !selectedStrategy ||
                    form.watch('amount') <= 0
                  }
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Creating Investment...
                    </>
                  ) : (
                    <>
                      <CircleDollarSign className='mr-2 h-4 w-4' />
                      Start AI Investment
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {/* Strategy List */}
          {strategies.length > 0 && !form.watch('strategyId') && (
            <div>
              <h4 className='text-sm font-semibold mb-3'>
                Available Strategies
              </h4>
              <div className='space-y-3'>
                {strategies.slice(0, 3).map(renderStrategyCard)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuantAIModule;
