'use client';

import React, { forwardRef, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { buttonVariants, fastTransition } from '@/lib/animations';
import { useMobile } from '@/hooks/useMobile';

// 버튼 변형 타입
type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface EnhancedButtonProps extends Omit<HTMLMotionProps<'button'>, 'variants'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  hapticFeedback?: boolean;
  rippleEffect?: boolean;
}

// 버튼 스타일 매핑
const variantStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-gray-500',
  destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500',
  outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-500',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-500',
  link: 'bg-transparent text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-500'
};

const sizeStyles = {
  sm: 'text-sm px-3 py-1.5 min-h-[32px]',
  md: 'text-sm px-4 py-2 min-h-[40px]',
  lg: 'text-base px-6 py-3 min-h-[48px]',
  xl: 'text-lg px-8 py-4 min-h-[56px]'
};

const LoadingSpinner = ({ size }: { size: ButtonSize }) => {
  const spinnerSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6'
  };

  return (
    <motion.div
      className={cn('animate-spin rounded-full border-2 border-current border-t-transparent', spinnerSize[size])}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fastTransition}
    />
  );
};

const RippleEffect = ({ x, y }: { x: number; y: number }) => (
  <motion.span
    className="absolute rounded-full bg-white bg-opacity-30 pointer-events-none"
    style={{ left: x - 20, top: y - 20 }}
    initial={{ width: 0, height: 0, opacity: 1 }}
    animate={{ width: 40, height: 40, opacity: 0 }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
  />
);

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    children,
    isLoading = false,
    loadingText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled = false,
    className,
    hapticFeedback = true,
    rippleEffect = true,
    onClick,
    ...props
  }, ref) => {
    const { hapticFeedback: triggerHaptic, isMobile } = useMobile();
    const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);
    const rippleId = React.useRef(0);

    // 리플 효과 처리
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;

      // 햅틱 피드백 (모바일)
      if (hapticFeedback && isMobile) {
        triggerHaptic('light');
      }

      // 리플 효과
      if (rippleEffect) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newRipple = { id: rippleId.current++, x, y };
        setRipples(prev => [...prev, newRipple]);

        // 리플 제거
        setTimeout(() => {
          setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
        }, 600);
      }

      onClick?.(e);
    };

    // 기본 클래스
    const baseClasses = cn(
      // 기본 스타일
      'relative inline-flex items-center justify-center',
      'font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'overflow-hidden', // 리플 효과를 위해
      
      // 모바일 최적화
      isMobile && 'active:scale-95 touch-manipulation',
      
      // 크기 및 변형 스타일
      sizeStyles[size],
      variantStyles[variant],
      
      // 전체 너비
      fullWidth && 'w-full',
      
      // 둥근 모서리 (변형에 따라)
      variant === 'link' ? 'rounded-none' : 'rounded-md',
      
      // 커스텀 클래스
      className
    );

    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        className={baseClasses}
        disabled={isDisabled}
        onClick={handleClick}
        variants={buttonVariants}
        initial="rest"
        whileHover={!isDisabled ? "hover" : "rest"}
        whileTap={!isDisabled ? "tap" : "rest"}
        {...props}
      >
        {/* 리플 효과 */}
        {ripples.map(ripple => (
          <RippleEffect key={ripple.id} x={ripple.x} y={ripple.y} />
        ))}

        {/* 로딩 상태 */}
        {isLoading && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={fastTransition}
          >
            <LoadingSpinner size={size} />
            {loadingText && <span>{loadingText}</span>}
          </motion.div>
        )}

        {/* 일반 상태 */}
        {!isLoading && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fastTransition}
          >
            {leftIcon && (
              <motion.span
                className="flex-shrink-0"
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                transition={fastTransition}
              >
                {leftIcon}
              </motion.span>
            )}
            
            <span>{children}</span>
            
            {rightIcon && (
              <motion.span
                className="flex-shrink-0"
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                transition={fastTransition}
              >
                {rightIcon}
              </motion.span>
            )}
          </motion.div>
        )}

        {/* 포커스 인디케이터 (접근성) */}
        <motion.div
          className="absolute inset-0 rounded-md border-2 border-transparent"
          initial={false}
          animate={{
            borderColor: 'transparent'
          }}
          whileFocus={{
            borderColor: 'currentColor',
            borderOpacity: 0.3
          }}
          transition={fastTransition}
        />
      </motion.button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

// 특화된 버튼 변형들
export const PrimaryButton = (props: Omit<EnhancedButtonProps, 'variant'>) => (
  <EnhancedButton variant="primary" {...props} />
);

export const SecondaryButton = (props: Omit<EnhancedButtonProps, 'variant'>) => (
  <EnhancedButton variant="secondary" {...props} />
);

export const DestructiveButton = (props: Omit<EnhancedButtonProps, 'variant'>) => (
  <EnhancedButton variant="destructive" {...props} />
);

export const OutlineButton = (props: Omit<EnhancedButtonProps, 'variant'>) => (
  <EnhancedButton variant="outline" {...props} />
);

export const GhostButton = (props: Omit<EnhancedButtonProps, 'variant'>) => (
  <EnhancedButton variant="ghost" {...props} />
);

export const LinkButton = (props: Omit<EnhancedButtonProps, 'variant'>) => (
  <EnhancedButton variant="link" {...props} />
); 