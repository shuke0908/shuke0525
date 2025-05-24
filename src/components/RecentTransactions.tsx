import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { ArrowDownRight, ArrowUpRight, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Transaction = {
  id: number;
  type: string;
  amount: string;
  status: string;
  timestamp: string;
  details: string;
};

export default function RecentTransactions() {
  const { user } = useAuth();

  // Get transactions for dashboard
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['/api/transactions', 5],
    enabled: !!user,
  });

  // Example placeholder data
  const transactions: Transaction[] = (transactionsData as any)?.transactions || [];

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-md'>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='space-y-3'>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className='space-y-3'>
            {transactions.map(transaction => (
              <div key={transaction.id} className='flex items-center gap-4'>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    transaction.type === 'deposit'
                      ? 'bg-green-100 text-green-600'
                      : transaction.type === 'withdrawal'
                        ? 'bg-red-100 text-red-600'
                        : transaction.type === 'trade'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {transaction.type === 'deposit' ? (
                    <ArrowDownRight className='h-5 w-5' />
                  ) : transaction.type === 'withdrawal' ? (
                    <ArrowUpRight className='h-5 w-5' />
                  ) : (
                    <Clock className='h-5 w-5' />
                  )}
                </div>

                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium truncate'>
                    {transaction.type.charAt(0).toUpperCase() +
                      transaction.type.slice(1)}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {formatDate(transaction.timestamp)}
                  </p>
                </div>

                <div className='text-right'>
                  <p
                    className={`text-sm font-medium ${
                      transaction.type === 'deposit'
                        ? 'text-green-600'
                        : transaction.type === 'withdrawal'
                          ? 'text-red-600'
                          : ''
                    }`}
                  >
                    {transaction.type === 'deposit'
                      ? '+'
                      : transaction.type === 'withdrawal'
                        ? '-'
                        : ''}
                    ${parseFloat(transaction.amount).toFixed(2)}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {transaction.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-6'>
            <Clock className='mx-auto h-8 w-8 text-muted-foreground mb-2' />
            <h3 className='text-sm font-medium'>No transactions yet</h3>
            <p className='text-xs text-muted-foreground mt-1'>
              Your recent transactions will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
