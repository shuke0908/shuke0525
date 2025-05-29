import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 통화 형식으로 숫자를 포맷팅합니다
 */
export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

/**
 * 숫자를 천 단위 구분자와 함께 포맷팅합니다
 */
export function formatNumber(num: number | string): string {
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(numValue)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US').format(numValue);
}

/**
 * 퍼센트 형식으로 숫자를 포맷팅합니다
 */
export function formatPercentage(num: number | string): string {
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(numValue)) {
    return '0.00%';
  }

  return `${numValue.toFixed(2)}%`;
}
