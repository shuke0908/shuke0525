'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface TradingChartProps {
  symbol?: string;
  className?: string;
}

export function TradingChart({ symbol = 'BTC/USD', className }: TradingChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          {symbol} Chart
        </CardTitle>
        <CardDescription>
          Real-time price chart and technical analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Chart will be displayed here</p>
            <Badge variant="outline" className="mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
