import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Calendar, DollarSign, BarChart3 } from 'lucide-react';
// 통합 API 클라이언트 사용
import { userApi } from '@/lib/api-client-unified';

// 타입 정의 (관리자 제어 중심)
type ActiveInvestment = {
  id: string;
  strategyName: string;
  amount: number;
  duration: number;
  dailyReturnRate: number;
  totalReturnRate: number;
  currentValue: number;
  totalReturn: number;
  startDate: string;
  endDate: string;
  daysCompleted: number;
  daysRemaining: number;
  progress: number;
  status: 'active' | 'pending' | 'matured';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
};

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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

// 커스텀 훅: 활성 투자 관리
function useActiveInvestments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-investments', user?.id],
    queryFn: async (): Promise<{ investments: ActiveInvestment[] }> => {
      try {
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

export default function ActiveInvestments() {
  // 커스텀 훅 사용
  const { data: investmentsData, isLoading } = useActiveInvestments();
  const activeInvestments = investmentsData?.investments || [];

  // 유틸리티 함수들
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'matured':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAPY = (dailyRate: number): number => {
    return dailyRate * 365;
  };

  // 렌더링 유틸리티 함수들
  const renderInvestmentCard = (investment: ActiveInvestment) => (
    <div
      key={investment.id}
      className='space-y-3 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors'
    >
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <BarChart3 className='h-4 w-4 text-muted-foreground' />
          <h4 className='font-semibold'>{investment.strategyName}</h4>
        </div>
        <div className='flex items-center gap-2'>
          <Badge
            className={getRiskLevelColor(investment.riskLevel)}
            variant='outline'
          >
            {investment.riskLevel}
          </Badge>
          <Badge
            className={getStatusColor(investment.status)}
            variant='outline'
          >
            {investment.status.charAt(0).toUpperCase() +
              investment.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Investment Details */}
      <div className='grid grid-cols-2 gap-4 text-sm'>
        <div>
          <div className='text-muted-foreground'>Initial Investment</div>
          <div className='font-medium'>{formatCurrency(investment.amount)}</div>
        </div>
        <div>
          <div className='text-muted-foreground'>Current Value</div>
          <div className='font-medium'>
            {formatCurrency(investment.currentValue)}
          </div>
        </div>
        <div>
          <div className='text-muted-foreground'>Total Return</div>
          <div
            className={cn(
              'font-medium',
              investment.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {investment.totalReturn >= 0 ? '+' : ''}
            {formatCurrency(investment.totalReturn)}
          </div>
        </div>
        <div>
          <div className='text-muted-foreground'>Return Rate</div>
          <div
            className={cn(
              'font-medium',
              investment.totalReturnRate >= 0
                ? 'text-green-600'
                : 'text-red-600'
            )}
          >
            {investment.totalReturnRate >= 0 ? '+' : ''}
            {formatPercentage(investment.totalReturnRate)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>Progress</span>
          <span className='font-medium'>{investment.progress.toFixed(1)}%</span>
        </div>
        <Progress value={investment.progress} className='h-2' />
        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <span>{investment.daysCompleted} days completed</span>
          <span>{investment.daysRemaining} days remaining</span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className='bg-muted/50 p-3 rounded-md'>
        <div className='grid grid-cols-2 gap-3 text-xs'>
          <div className='flex items-center gap-1'>
            <TrendingUp className='h-3 w-3 text-green-600' />
            <span className='text-muted-foreground'>Daily:</span>
            <span className='font-medium text-green-600'>
              +{formatPercentage(investment.dailyReturnRate)}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <Calendar className='h-3 w-3 text-blue-600' />
            <span className='text-muted-foreground'>APY:</span>
            <span className='font-medium text-blue-600'>
              +{formatPercentage(calculateAPY(investment.dailyReturnRate))}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <Calendar className='h-3 w-3 text-muted-foreground' />
            <span className='text-muted-foreground'>Start:</span>
            <span className='font-medium'>
              {formatDate(investment.startDate)}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <Calendar className='h-3 w-3 text-muted-foreground' />
            <span className='text-muted-foreground'>End:</span>
            <span className='font-medium'>
              {formatDate(investment.endDate)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoadingState = () => (
    <div className='space-y-4'>
      {Array(2)
        .fill(0)
        .map((_, i) => (
          <div key={i} className='space-y-3 p-4 border rounded-lg'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-4 w-1/3' />
              <div className='flex gap-2'>
                <Skeleton className='h-6 w-16' />
                <Skeleton className='h-6 w-16' />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1'>
                <Skeleton className='h-3 w-20' />
                <Skeleton className='h-4 w-16' />
              </div>
              <div className='space-y-1'>
                <Skeleton className='h-3 w-20' />
                <Skeleton className='h-4 w-16' />
              </div>
            </div>
            <Skeleton className='h-2 w-full' />
            <Skeleton className='h-16 w-full' />
          </div>
        ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className='text-center py-8'>
      <DollarSign className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
      <h3 className='text-lg font-medium mb-2'>No Active Investments</h3>
      <p className='text-sm text-muted-foreground mb-4'>
        Start investing with Quant AI to see your active investments here
      </p>
      <div className='text-xs text-muted-foreground'>
        Visit the Quant AI section to explore available strategies
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-md flex items-center gap-2'>
          <BarChart3 className='h-4 w-4' />
          Active Investments
          {activeInvestments.length > 0 && (
            <Badge variant='secondary' className='ml-auto'>
              {activeInvestments.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          renderLoadingState()
        ) : activeInvestments.length > 0 ? (
          <div className='space-y-4'>
            {activeInvestments.map(renderInvestmentCard)}
          </div>
        ) : (
          renderEmptyState()
        )}
      </CardContent>
    </Card>
  );
}
