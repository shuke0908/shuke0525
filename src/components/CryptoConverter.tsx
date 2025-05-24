import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type CryptoRate = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
};

type CryptoConverterProps = {
  className?: string;
};

const CryptoConverter = ({ className }: CryptoConverterProps) => {
  const { toast } = useToast();

  // Fetch crypto rates
  const {
    data: cryptoRates,
    isLoading: ratesLoading,
    refetch: refetchRates,
  } = useQuery({
    queryKey: ['/api/crypto/rates'],
    retry: 1,
    queryFn: async () => {
      try {
        const response = await fetch('/api/crypto/rates');
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: response.statusText }));
          throw new Error(
            errorData.message || 'Failed to fetch crypto rates from API'
          );
        }
        const data = await response.json();
        if (!data || !Array.isArray(data.rates)) {
          console.error(
            'Invalid data structure received from /api/crypto/rates:',
            data
          );
          throw new Error('Received invalid data format for crypto rates.');
        }
        return data;
      } catch (error) {
        console.error('Error fetching or processing crypto rates:', error);
        throw error;
      }
    },
  });

  const rates: CryptoRate[] = cryptoRates?.rates || [];
  const isError = !ratesLoading && !cryptoRates;

  const [fromCurrency, setFromCurrency] = useState<string>('bitcoin');
  const [toCurrency, setToCurrency] = useState<string>('ethereum');
  const [amount, setAmount] = useState<string>('1');
  const [convertedAmount, setConvertedAmount] = useState<string>('');
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 정적 rates를 useMemo로 감싸서 의존성 배열 문제 해결
  const staticRates = useMemo(() => ({
    BTC: 41255.78,
    ETH: 2567.89,
    BNB: 342.17,
    SOL: 98.45,
    ADA: 0.52,
    DOT: 7.23,
    MATIC: 0.89,
    AVAX: 36.78,
    LINK: 14.92,
    UNI: 6.75,
  }), []);

  // Conversion logic
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      const fromRate = staticRates[fromCurrency as keyof typeof staticRates];
      const toRate = staticRates[toCurrency as keyof typeof staticRates];

      if (fromRate && toRate) {
        const convertedValue = (parseFloat(amount) * fromRate) / toRate;
        setConvertedAmount(convertedValue.toFixed(8));
      }
    }
  }, [fromCurrency, toCurrency, amount, staticRates]);

  // Handle currency swap with animation
  const handleSwapCurrencies = () => {
    setIsFlipping(true);
    setTimeout(() => {
      const temp = fromCurrency;
      setFromCurrency(toCurrency);
      setToCurrency(temp);
      setIsFlipping(false);
    }, 300);
  };

  // Handle refresh rates
  const handleRefreshRates = async () => {
    try {
      await refetchRates();
      setLastUpdated(new Date());
      toast({
        title: 'Rates Updated',
        description: 'Cryptocurrency rates have been refreshed.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update rates. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Format currency options for display
  const getCurrencyOption = (currency: CryptoRate) => {
    return (
      <div className='flex items-center'>
        <Image
          src={`/crypto-icons/${currency.id.toLowerCase()}.png`}
          alt={currency.id}
          width={24}
          height={24}
          className="rounded-full"
        />
        <span className='mr-1'>{currency.symbol}</span>
        <span className='text-xs text-muted-foreground'>({currency.name})</span>
      </div>
    );
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className='pb-4'>
        <CardTitle className='text-xl flex justify-between items-center'>
          <span>Crypto Converter</span>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleRefreshRates}
            disabled={ratesLoading}
            title='Refresh rates'
            className='h-8 w-8 p-0'
          >
            {ratesLoading ? (
              <span className='animate-spin'>↻</span>
            ) : (
              <span>↻</span>
            )}
          </Button>
        </CardTitle>
        <p className='text-xs text-muted-foreground mt-1'>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </CardHeader>

      <CardContent className='pb-4'>
        <div className='space-y-6'>
          {/* From Currency Section */}
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <label className='text-sm font-medium'>From</label>
              {fromCurrency && rates.find(r => r.id === fromCurrency) && (
                <p className='text-xs text-muted-foreground'>
                  {(() => {
                    const rate = rates.find(r => r.id === fromCurrency);
                    if (rate) {
                      return `1 ${rate.symbol} = $${rate.current_price.toLocaleString()}`;
                    }
                    return '';
                  })()}
                </p>
              )}
            </div>

            <div className='grid grid-cols-3 gap-2'>
              <div className='col-span-2'>
                <Input
                  type='text'
                  value={amount}
                  onChange={e => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    setAmount(value);
                  }}
                  placeholder='Amount'
                  className='w-full'
                />
              </div>

              <AnimatePresence mode='wait'>
                <motion.div
                  key={`from-${isFlipping}`}
                  initial={{
                    opacity: isFlipping ? 0 : 1,
                    y: isFlipping ? -20 : 0,
                  }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className='w-full'
                >
                  <Select
                    value={fromCurrency}
                    onValueChange={setFromCurrency}
                    disabled={isFlipping || ratesLoading || rates.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          ratesLoading
                            ? 'Loading...'
                            : rates.length === 0
                              ? 'No currencies'
                              : 'Select currency'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {ratesLoading ? (
                        <div className='p-4 text-center text-sm text-muted-foreground'>
                          Loading currencies...
                        </div>
                      ) : rates.length > 0 ? (
                        rates.map(currency => (
                          <SelectItem
                            key={`from-${currency.id}`}
                            value={currency.id}
                          >
                            {getCurrencyOption(currency)}
                          </SelectItem>
                        ))
                      ) : (
                        <div className='p-4 text-center text-sm text-muted-foreground'>
                          No currencies available.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Swap Button */}
          <div className='relative h-10 flex justify-center'>
            <div className='absolute inset-0 flex items-center'>
              <motion.div
                className='w-full border-t border-border'
                animate={{
                  borderColor: isFlipping
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--border))',
                  scale: isFlipping ? [1, 1.02, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Button
                variant='outline'
                size='icon'
                className={cn(
                  'relative rounded-full bg-background h-10 w-10 border shadow-sm',
                  isFlipping ? 'border-primary text-primary' : 'border-border'
                )}
                onClick={handleSwapCurrencies}
                disabled={isFlipping}
              >
                <motion.div
                  animate={{
                    rotate: isFlipping ? 180 : 0,
                    scale: isFlipping ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    duration: 0.3,
                    type: isFlipping ? 'spring' : 'tween',
                  }}
                >
                  ⇄
                </motion.div>
              </Button>
            </motion.div>
          </div>

          {/* To Currency Section */}
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <label className='text-sm font-medium'>To</label>
              {toCurrency && rates.find(r => r.id === toCurrency) && (
                <p className='text-xs text-muted-foreground'>
                  {(() => {
                    const rate = rates.find(r => r.id === toCurrency);
                    if (rate) {
                      return `1 ${rate.symbol} = $${rate.current_price.toLocaleString()}`;
                    }
                    return '';
                  })()}
                </p>
              )}
            </div>

            <div className='grid grid-cols-3 gap-2'>
              <div className='col-span-2'>
                <Input
                  type='text'
                  value={convertedAmount}
                  readOnly
                  placeholder='Converted amount'
                  className='w-full bg-muted'
                />
              </div>

              <AnimatePresence mode='wait'>
                <motion.div
                  key={`to-${isFlipping}`}
                  initial={{
                    opacity: isFlipping ? 0 : 1,
                    y: isFlipping ? 20 : 0,
                  }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className='w-full'
                >
                  <Select
                    value={toCurrency}
                    onValueChange={setToCurrency}
                    disabled={isFlipping || ratesLoading || rates.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select currency' />
                    </SelectTrigger>
                    <SelectContent>
                      {ratesLoading ? (
                        <div className='p-4 text-center text-sm text-muted-foreground'>
                          Loading currencies...
                        </div>
                      ) : rates.length > 0 ? (
                        rates.map(currency => (
                          <SelectItem
                            key={`to-${currency.id}`}
                            value={currency.id}
                          >
                            {getCurrencyOption(currency)}
                          </SelectItem>
                        ))
                      ) : (
                        <div className='p-4 text-center text-sm text-muted-foreground'>
                          No currencies available.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {isError && (
            <div className='p-4 border rounded-md bg-destructive/10 text-destructive text-sm mt-4'>
              Unable to load currency rates. Please try again later.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CryptoConverter;
