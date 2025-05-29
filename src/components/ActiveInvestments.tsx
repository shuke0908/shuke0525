'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface ActiveInvestmentsProps {
  className?: string;
}

export function ActiveInvestments({ className }: ActiveInvestmentsProps) {
  const mockInvestments = [
    {
      id: '1',
      symbol: 'BTC/USD',
      amount: 1000,
      currentValue: 1150,
      pnl: 150,
      pnlPercentage: 15,
      status: 'active'
    },
    {
      id: '2',
      symbol: 'ETH/USD',
      amount: 500,
      currentValue: 475,
      pnl: -25,
      pnlPercentage: -5,
      status: 'active'
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Active Investments
        </CardTitle>
        <CardDescription>
          Your current investment positions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockInvestments.map((investment) => (
            <div key={investment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div>
                  <p className="font-medium">{investment.symbol}</p>
                  <p className="text-sm text-muted-foreground">${investment.amount}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`flex items-center space-x-1 ${
                  investment.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {investment.pnl >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="text-sm font-medium">
                    {investment.pnl >= 0 ? '+' : ''}${investment.pnl}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {investment.pnlPercentage >= 0 ? '+' : ''}{investment.pnlPercentage}%
                </Badge>
              </div>
            </div>
          ))}
          
          <Button variant="outline" className="w-full">
            View All Investments
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
