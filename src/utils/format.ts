// 통화 포맷팅
export function formatCurrency(
  amount: number | string,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    return '0';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

// 숫자 포맷팅 (천 단위 구분)
export function formatNumber(
  value: number | string,
  decimals: number = 2,
  locale: string = 'en-US'
): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return '0';
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numericValue);
}

// 퍼센트 포맷팅
export function formatPercentage(
  value: number | string,
  decimals: number = 2,
  locale: string = 'en-US'
): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return '0%';
  }

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numericValue / 100);
}

// 크기 축약 포맷팅 (1K, 1M, 1B 등)
export function formatCompactNumber(
  value: number | string,
  locale: string = 'en-US'
): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return '0';
  }

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(numericValue);
}

// 날짜 포맷팅
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {},
  locale: string = 'en-US'
): string {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat(locale, {
    ...defaultOptions,
    ...options,
  }).format(dateObj);
}

// 상대 시간 포맷팅 (1분 전, 2시간 전 등)
export function formatRelativeTime(
  date: Date | string | number,
  locale: string = 'en-US'
): string {
  const dateObj = new Date(date);
  const now = new Date();

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const intervals = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
  ] as const;

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count !== 0) {
      return rtf.format(-count, interval.unit);
    }
  }

  return rtf.format(-diffInSeconds, 'second');
}

// 시간 포맷팅 (HH:MM:SS)
export function formatTime(
  date: Date | string | number,
  includeSeconds: boolean = true,
  locale: string = 'en-US'
): string {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Time';
  }

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  if (includeSeconds) {
    options.second = '2-digit';
  }

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

// 기간 포맷팅 (초를 시:분:초로 변환)
export function formatDuration(seconds: number): string {
  if (seconds < 0) {
    return '00:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 파일 크기 포맷팅
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// P&L 색상 결정
export function getPnLColor(
  value: number
): 'success' | 'destructive' | 'muted' {
  if (value > 0) return 'success';
  if (value < 0) return 'destructive';
  return 'muted';
}

// 거래 상태 라벨
export function getTradeStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    active: '활성',
    pending: '대기중',
    completed: '완료',
    cancelled: '취소',
    expired: '만료',
    win: '수익',
    lose: '손실',
  };

  return statusLabels[status] || status;
}

// 거래 상태 색상
export function getTradeStatusColor(
  status: string
): 'success' | 'destructive' | 'warning' | 'muted' {
  const statusColors: Record<
    string,
    'success' | 'destructive' | 'warning' | 'muted'
  > = {
    active: 'warning',
    pending: 'muted',
    completed: 'success',
    cancelled: 'muted',
    expired: 'muted',
    win: 'success',
    lose: 'destructive',
  };

  return statusColors[status] || 'muted';
}
