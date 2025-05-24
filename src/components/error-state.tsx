import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title: string;
  message: string;
  retryAction?: () => void;
}

export default function ErrorState({
  title,
  message,
  retryAction,
}: ErrorStateProps) {
  return (
    <div className='w-full flex flex-col items-center justify-center p-8 rounded-lg border border-destructive/20 bg-destructive/5'>
      <AlertCircle className='h-12 w-12 text-destructive mb-4' />
      <h3 className='text-lg font-semibold mb-2'>{title}</h3>
      <p className='text-sm text-muted-foreground text-center mb-4'>
        {message}
      </p>
      {retryAction && (
        <Button onClick={retryAction} variant='outline'>
          Try Again
        </Button>
      )}
    </div>
  );
}
