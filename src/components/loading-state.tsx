import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = 'Loading...',
}: LoadingStateProps) {
  return (
    <div className='w-full flex flex-col items-center justify-center p-8 rounded-lg border border-border/30 bg-background'>
      <Loader2 className='h-12 w-12 text-primary animate-spin mb-4' />
      <p className='text-sm text-muted-foreground'>{message}</p>
    </div>
  );
}
