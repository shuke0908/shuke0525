'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface RecentTransactionsProps {
  className?: string;
}

export function RecentTransactions({ className }: RecentTransactionsProps) {
  const mockTransactions = [
    {
      id: '1',
      type: 'buy',
      symbol: 'BTC/USD',
      amount: 0.025,
      price: 41250,
      total: 1031.25,
      status: 'completed',
      timestamp: '2024-01-15 14:30'
    },
    {
      id: '2',
      type: 'sell',
      symbol: 'ETH/USD',
      amount: 2.5,
      price: 2650,
      total: 6625,
      status: 'completed',
      timestamp: '2024-01-15 13:15'
    },
    {
      id: '3',
      type: 'buy',
      symbol: 'XRP/USD',
      amount: 1000,
      price: 0.62,
      total: 620,
      status: 'pending',
      timestamp: '2024-01-15 12:45'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">완료</Badge>;
      case 'pending':
        return <Badge variant="secondary">대기중</Badge>;
      case 'failed':
        return <Badge variant="destructive">실패</Badge>;
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Recent Transactions
        </CardTitle>
        <CardDescription>
          Your latest trading activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTransactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  transaction.type === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {transaction.type === 'buy' ? (
                    <ArrowDownLeft className="h-3 w-3" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{transaction.symbol}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.amount} @ ${transaction.price}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">${transaction.total}</p>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(transaction.status)}
                  <span className="text-xs text-muted-foreground">
                    {transaction.timestamp.split(' ')[1]}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          <Button variant="outline" className="w-full">
            View All Transactions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
