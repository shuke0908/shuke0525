import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary-500 text-white hover:bg-primary-600 shadow-soft hover:shadow-medium',
        destructive: 'bg-error-500 text-white hover:bg-error-600 shadow-soft hover:shadow-medium',
        outline: 'border border-border-primary bg-background-tertiary text-text-primary hover:bg-background-hover hover:border-border-secondary',
        secondary: 'bg-background-tertiary text-text-primary border border-border-primary hover:bg-background-hover',
        ghost: 'text-text-primary hover:bg-background-hover hover:text-text-primary',
        link: 'text-primary-400 underline-offset-4 hover:underline hover:text-primary-300',
        success: 'bg-success-500 text-white hover:bg-success-600 shadow-soft hover:shadow-medium',
        warning: 'bg-warning-500 text-white hover:bg-warning-600 shadow-soft hover:shadow-medium',
        info: 'bg-info-500 text-white hover:bg-info-600 shadow-soft hover:shadow-medium',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-xl px-6 text-base',
        xl: 'h-14 rounded-xl px-8 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
