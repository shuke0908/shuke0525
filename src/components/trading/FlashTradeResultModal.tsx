import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

type FlashTradeResultModalProps = {
  open: boolean;
  onClose: () => void;
  result: {
    isWin: boolean; // true for win, false for loss
    tradeData: {
      amount: string;
      direction: 'up' | 'down';
      duration: number;
      entryPrice: string;
      exitPrice: string;
      potentialProfit: string;
      actualProfit?: string;
      returnRate: string;
    };
  } | null;
};

const FlashTradeResultModal = ({
  open,
  onClose,
  result,
}: FlashTradeResultModalProps) => {
  // 디버깅을 위한 로깅 추가
  useEffect(() => {
    if (open && result) {
      console.log(
        '[FlashTradeResultModal] 트레이드 결과 표시 - 승리여부:',
        result.isWin
      );
      console.log(
        '[FlashTradeResultModal] 트레이드 상세:',
        JSON.stringify(result.tradeData)
      );

      // Show data type information to help with debugging
      console.log(
        '[FlashTradeResultModal] 결과 값 타입:',
        typeof result.isWin,
        '/ 실제 값:',
        result.isWin ? 'true(승리)' : 'false(패배)'
      );
    }
  }, [open, result]);

  // Launch confetti effect on win
  useEffect(() => {
    if (open && result) {
      // 확실한 타입 확인
      console.log(
        '[FlashTradeResultModal] isWin 타입 확인:',
        typeof result.isWin,
        '값:',
        result.isWin
      );

      // 명시적으로 boolean true와 비교하여 확인
      const isWinBoolean = result.isWin === true;

      if (isWinBoolean) {
        console.log(
          '[FlashTradeResultModal] 승리 효과 시작! (isWin 확인됨 === true)'
        );
        setTimeout(() => {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#00ff00', '#26ff00', '#80ff00', '#ccff00', '#00ffaa'],
          });

          // Add a second burst for more effect
          setTimeout(() => {
            confetti({
              particleCount: 80,
              angle: 60,
              spread: 55,
              origin: { x: 0, y: 0.65 },
            });

            confetti({
              particleCount: 80,
              angle: 120,
              spread: 55,
              origin: { x: 1, y: 0.65 },
            });
          }, 300);
        }, 300);
      } else {
        console.log(
          '[FlashTradeResultModal] 패배 UI 표시 중 (isWin === false)'
        );
      }
    }
  }, [open, result]);

  if (!result) return null;

  // 트레이드 결과를 정확히 표시하기 위해 서버에서 받은 isWin 값을 그대로 사용
  let { isWin, tradeData } = result;

  // 명시적으로 boolean 값으로 변환하여 타입 불일치 문제 해결
  // 추가적인 안전장치: 값이 정확히 boolean true인 경우에만 승리로 처리
  isWin = Boolean(isWin === true); // 명시적으로 boolean 타입으로 확인

  // 정확한 수익 계산: 수익률에 따른 투자 금액의 추가 수익
  const calculatedProfit = (
    (parseFloat(tradeData.amount) * parseFloat(tradeData.returnRate)) /
    100
  ).toFixed(2);
  // 승리 시 전체 받는 금액은 원금 + 수익금
  tradeData = {
    ...tradeData,
    actualProfit: tradeData.actualProfit || calculatedProfit,
  };

  // 강화된 디버그 로깅
  console.log('[FlashTradeResultModal] 트레이드 결과 표시 - 승리여부:', isWin);
  console.log(
    '[FlashTradeResultModal] 원본 승리여부 타입:',
    typeof result.isWin
  );
  console.log('[FlashTradeResultModal] 변환 후 승리여부 타입:', typeof isWin);
  console.log(
    '[FlashTradeResultModal] 트레이드 상세:',
    JSON.stringify(tradeData)
  );
  console.log(
    '[FlashTradeResultModal] 결과 값 타입:',
    typeof isWin,
    '/ 실제 값:',
    isWin ? 'true(승리)' : 'false(패배)'
  );
  console.log(
    '[FlashTradeResultModal] 사용자 설정에 따른 결과 UI가 표시되고 있습니다.'
  );

  const {
    amount,
    direction,
    duration,
    entryPrice,
    exitPrice,
    returnRate,
  } = tradeData;

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center text-xl'>
            Trade Result
          </DialogTitle>
          <DialogDescription className='text-center'>
            Your {duration}s flash trade is complete
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col items-center justify-center py-6'>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className={cn(
              'w-24 h-24 rounded-full flex items-center justify-center mb-4',
              isWin ? 'bg-success/20' : 'bg-destructive/20'
            )}
          >
            {isWin ? (
              <span className='text-4xl text-success'>✓</span>
            ) : (
              <span className='text-4xl text-destructive'>✗</span>
            )}
          </motion.div>

          <motion.h3
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className={cn(
              'text-2xl font-bold mb-3',
              isWin === true ? 'text-success' : 'text-destructive'
            )}
          >
            {isWin === true ? 'SUCCESS!' : 'BETTER LUCK NEXT TIME'}
          </motion.h3>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className={cn(
              'text-2xl font-bold mb-3 py-2 px-6 rounded-lg shadow-md',
              isWin === true
                ? 'bg-success/20 text-success border border-success/50'
                : 'bg-destructive/20 text-destructive border border-destructive/50'
            )}
          >
            {isWin === true
              ? `+${(parseFloat(amount) + parseFloat(tradeData.actualProfit || '0')).toFixed(2)} USDT`
              : `-${parseFloat(amount).toFixed(2)} USDT`}
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className='text-lg mb-3'
          >
            {isWin && (
              <span className='text-success font-medium'>
                {parseInt(parseFloat(returnRate).toString())}% return
              </span>
            )}
          </motion.div>

          <p className='text-sm text-muted-foreground mb-6'>
            {isWin
              ? 'Trade completed successfully!'
              : 'Your prediction was incorrect. Try again!'}
          </p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className='w-full bg-muted rounded-lg p-4 space-y-3'
          >
            <div className='flex justify-between items-center border-b border-border pb-2'>
              <div className='flex items-center'>
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center mr-2',
                    direction === 'up'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  )}
                >
                  {direction === 'up' ? <span>↑</span> : <span>↓</span>}
                </div>
                <span className='text-sm font-medium'>
                  {direction === 'up' ? 'UP' : 'DOWN'} Prediction
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-medium flex items-center px-2 py-1 rounded-full',
                  direction === 'up'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                )}
              >
                {duration}s
              </span>
            </div>

            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>
                Trade Amount
              </span>
              <span className='text-sm font-medium flex items-center'>
                {parseFloat(amount).toFixed(2)} USDT
              </span>
            </div>

            <div className='p-3 rounded-lg bg-background'>
              <div className='flex justify-between mb-2'>
                <span className='text-xs text-muted-foreground'>
                  Entry Price
                </span>
                <span className='text-xs font-mono font-medium'>
                  {parseFloat(entryPrice).toFixed(2)} USDT
                </span>
              </div>

              <div className='flex justify-between'>
                <span className='text-xs text-muted-foreground'>
                  Exit Price
                </span>
                <span className='text-xs font-mono font-medium'>
                  {parseFloat(exitPrice || '0').toFixed(2)} USDT
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <DialogFooter className='flex-col sm:flex-row sm:justify-center gap-2'>
          <Button
            variant='default'
            onClick={onClose}
            className='w-full sm:w-auto'
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FlashTradeResultModal;
