import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { adminApi } from '@/lib/api-client-unified';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

// Define types for QuickTrade data

interface LeverageOption {
  id: number;
  value: number;
  label: string;
  description?: string | undefined;
  isActive: boolean;
}

interface QuickTradeModuleProps {
  symbol?: string;
  currentPrice?: string;
}

const quickTradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  direction: z.enum(['buy', 'sell']),
  leverage: z.string().min(1, 'Leverage is required'),
  amount: z.string().min(1, 'Amount is required'),
});

type QuickTradeFormData = z.infer<typeof quickTradeSchema>;

function useActiveLeverages() {
  return useQuery<LeverageOption[]>({
    queryKey: ['quick-trade', 'leverages'],
    queryFn: async () => {
      try {
        // QuickTrade 설정 조회 시뮬레이션 (관리자가 설정한 레버리지 옵션)
        const response = await adminApi.getSystemSettings();
        const leverageSettings = (response as any)?.settings?.quickTrade?.leverages;
        
        if (leverageSettings && Array.isArray(leverageSettings)) {
          return leverageSettings.map((item: any, index: number) => ({
            id: index + 1,
            value: item.value || (index + 1),
            label: `${item.value || (index + 1)}x`,
            description: item.description,
            isActive: item.isActive !== false,
          }));
        }
        
        // 기본 레버리지 옵션 반환
        return [
          { id: 1, value: 1, label: '1x', description: 'No leverage', isActive: true },
          { id: 2, value: 2, label: '2x', description: '2x leverage', isActive: true },
          { id: 3, value: 5, label: '5x', description: '5x leverage', isActive: true },
          { id: 4, value: 10, label: '10x', description: '10x leverage', isActive: true },
        ];
      } catch (error) {
        console.error('Failed to fetch leverage options:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

const QuickTradeModule = ({
  symbol = 'BTC/USDT',
  currentPrice = '41255.78',
}: QuickTradeModuleProps) => {
  const { user, getAuthToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: leverageOptions,
    isLoading: _isLoadingLeverages,
    isError: isLeverageError,
  } = useActiveLeverages();

  const form = useForm<QuickTradeFormData>({
    resolver: zodResolver(quickTradeSchema),
    defaultValues: {
      amount: '',
      direction: 'buy',
      leverage: '1',
      symbol: symbol,
    },
  });

  useEffect(() => {
    if (leverageOptions && Array.isArray(leverageOptions) && leverageOptions.length > 0) {
      const currentLeverage = form.getValues('leverage');
      // currentLeverage가 undefined인 경우를 명시적으로 처리
      if (currentLeverage === undefined || currentLeverage === null) {
        form.setValue('leverage', leverageOptions[0]?.value.toString() || '1');
      } else {
        const validLeverage = leverageOptions.find(
          (opt: any) => opt.value.toString() === currentLeverage
        );
        if (!validLeverage) {
          form.setValue('leverage', leverageOptions[0]?.value.toString() || '1');
        }
      }
    }
  }, [leverageOptions, form]);

  useEffect(() => {
    form.setValue('symbol', symbol);
  }, [symbol, form]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    
    if (user && user.id) {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${protocol}://${window.location.host}/ws`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        const token = getAuthToken
          ? getAuthToken()
          : localStorage.getItem('authToken');
        if (ws && token) {
          ws.send(
            JSON.stringify({ type: 'authenticate', token: token })
          );
        }
      };

      ws.onmessage = event => {
        try {
          const message = JSON.parse(event.data as string);

          if (message.type === 'quick_trade_receipt') {
            if (message.payload?.success) {
              form.reset({
                amount: '',
                direction: 'buy',
                leverage: leverageOptions?.[0]?.value.toString() || '1',
                symbol: symbol,
              });
              queryClient.invalidateQueries({
                queryKey: ['quickTradeHistory'],
              });
              toast({
                title: 'Trade Successful',
                description: 'Your quick trade has been executed successfully.',
              });
            } else {
              toast({
                title: 'Trade Failed',
                description:
                  message.payload?.message || 'Failed to execute trade.',
                variant: 'destructive',
              });
            }
          } else if (message.type === 'authenticated') {
            if (!message.success) {
              toast({
                title: 'WebSocket Auth Error',
                description:
                  message.message ||
                  'Failed to authenticate WebSocket connection.',
                variant: 'destructive',
              });
            }
          } else if (message.type === 'balance_update') {
            queryClient.invalidateQueries({
              queryKey: ['user', user?.id, 'profile'],
            });
          } else if (message.type === 'error') {
            toast({
              title: 'WebSocket Error',
              description:
                message.message || 'An error occurred via WebSocket.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          // WebSocket 메시지 처리 에러는 조용히 처리
        }
      };

      ws.onerror = () => {
        toast({
          title: 'WebSocket Connection Error',
          description: 'Could not connect to the trade server.',
          variant: 'destructive',
        });
      };

      // Cleanup function
      return () => {
        if (ws) {
          ws.close();
        }
      };
    }
    // user가 없는 경우에도 명시적으로 undefined 반환
    return undefined;
  }, [user, toast, queryClient, getAuthToken, leverageOptions, symbol, form]);

  const handleSetAmount = (value: string) => {
    const actualValue = value === 'Max' && user ? user.balance : value;
    form.setValue('amount', actualValue);
  };

  const onSubmit: SubmitHandler<QuickTradeFormData> = (data) => {
    const amountNum = parseFloat(data.amount);

    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'User not authenticated. Please log in again.',
        variant: 'destructive',
      });
      return;
    }

    if (parseFloat(user.balance) < amountNum) {
      toast({
        title: 'Insufficient Balance',
        description: "You don't have enough funds for this trade amount.",
        variant: 'destructive',
      });
      return;
    }

    // WebSocket 상태 확인을 위한 로컬 변수 사용
    const checkWebSocketConnection = () => {
      const wsElements = document.querySelectorAll('[data-ws-connected]');
      return wsElements.length > 0 && wsElements[0]?.getAttribute('data-ws-connected') === 'true';
    };

    if (!checkWebSocketConnection()) {
      toast({
        title: 'Connection Error',
        description:
          'Not connected to the trading server. Please wait or try refreshing.',
        variant: 'destructive',
      });
      return;
    }

    const tradePayload = {
      symbol: data.symbol,
      amount: amountNum,
      direction: data.direction,
      leverage: parseFloat(data.leverage),
    };

    // WebSocket을 통한 거래 전송 시뮬레이션
    try {
      // 실제 구현에서는 WebSocket을 통해 거래 주문을 전송
      console.log('Sending trade order:', tradePayload);
      
      toast({
        title: 'Trade Order Sent',
        description: 'Your trade order has been submitted for processing.',
      });
    } catch (error) {
      toast({
        title: 'Trade Failed',
        description: 'Failed to submit trade order.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className='bg-muted'>
      <CardContent className='p-4'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='font-bold text-lg'>Quick Trade</h3>
          <div className='text-sm text-muted-foreground'>
            Instantly buy or sell
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm text-muted-foreground mb-1'>
                    Select Pair
                  </label>
                  <Select value={symbol} disabled>
                    <SelectTrigger>
                      <SelectValue placeholder='Select coin' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='BTC/USDT'>BTC/USDT</SelectItem>
                      <SelectItem value='ETH/USDT'>ETH/USDT</SelectItem>
                      <SelectItem value='SOL/USDT'>SOL/USDT</SelectItem>
                      <SelectItem value='ADA/USDT'>ADA/USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className='block text-sm text-muted-foreground mb-1'>
                    Current Price
                  </label>
                  <div className='relative'>
                    <Input
                      disabled
                      value={currentPrice}
                      className='bg-background/50'
                    />
                    <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                      <span className='text-muted-foreground text-sm'>
                        USDT
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <FormField
                  control={form.control}
                  name='amount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (USDT)</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            placeholder='Enter amount'
                            {...field}
                            onChange={e => {
                              const sanitizedValue = e.target.value.replace(
                                /[^0-9.]/g,
                                ''
                              );
                              field.onChange(sanitizedValue);
                            }}
                            className='pr-16'
                          />
                          <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                            <span className='text-muted-foreground text-sm'>
                              USDT
                            </span>
                          </div>
                        </div>
                      </FormControl>
                      <div className='flex items-center justify-between mt-2'>
                        {['100', '250', '500', '1000', 'Max'].map(value => (
                          <Button
                            key={value}
                            type='button'
                            variant='outline'
                            size='sm'
                            className='px-2 py-1 text-xs'
                            onClick={() => handleSetAmount(value)}
                          >
                            {value === 'Max' ? 'Max' : `$${value}`}
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='direction'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Direction</FormLabel>
                      <FormControl>
                        <div className='grid grid-cols-2 gap-2'>
                          <Button
                            type='button'
                            variant={
                              field.value === 'buy' ? 'default' : 'outline'
                            }
                            className={cn(
                              field.value === 'buy' &&
                                'bg-success/20 text-success border-success hover:bg-success/30 hover:text-success'
                            )}
                            onClick={() => field.onChange('buy')}
                          >
                            <ArrowUp className='h-4 w-4 mr-2' /> Buy
                          </Button>
                          <Button
                            type='button'
                            variant={
                              field.value === 'sell' ? 'default' : 'outline'
                            }
                            className={cn(
                              field.value === 'sell' &&
                                'bg-destructive/20 text-destructive border-destructive hover:bg-destructive/30 hover:text-destructive'
                            )}
                            onClick={() => field.onChange('sell')}
                          >
                            <ArrowDown className='h-4 w-4 mr-2' /> Sell
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='leverage'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leverage</FormLabel>
                      <FormControl>
                        {_isLoadingLeverages ? (
                          <Input disabled placeholder='Loading leverages...' />
                        ) : isLeverageError ? (
                          <Input
                            disabled
                            placeholder='Error loading leverages'
                            className='border-destructive'
                          />
                        ) : leverageOptions && leverageOptions.length > 0 ? (
                          <Select
                            value={field.value}
                            onValueChange={val => field.onChange(val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select leverage' />
                            </SelectTrigger>
                            <SelectContent>
                              {leverageOptions.map(option => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value.toString()}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            disabled
                            placeholder='No leverages available'
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              type='submit'
              className='w-full mt-4'
              disabled={!form.watch('amount') || form.formState.isSubmitting}
            >
              <Zap className='h-4 w-4 mr-2' />
              Execute {form.watch('direction') === 'buy' ? 'Buy' : 'Sell'} Trade
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default QuickTradeModule;
