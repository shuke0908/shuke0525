'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import { Brain, Play, TrendingUp, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface QuantAISettings {
  isActive: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  maxInvestment: string;
  targetReturn: string;
  stopLoss: string;
  assets: string[];
}

export function QuantAIModule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<QuantAISettings>({
    isActive: false,
    riskLevel: 'medium',
    maxInvestment: '',
    targetReturn: '15',
    stopLoss: '5',
    assets: ['BTC', 'ETH']
  });

  // Get AI status and performance
  const { data: aiData, isLoading: statusLoading } = useQuery({
    queryKey: ['quant-ai', 'data'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to access AI features');

      const response = await fetch('/api/quant-ai', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch AI data');
      return response.json();
    },
  });

  // Start AI investment mutation
  const startAIMutation = useMutation({
    mutationFn: async (investmentData: any) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to start AI investment');

      const response = await fetch('/api/quant-ai', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'start',
          amount: investmentData.amount,
          strategy: investmentData.strategy,
          riskLevel: investmentData.riskLevel
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start AI investment');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const result = data.data.result;
      const profit = data.data.profit;
      const isWin = result === 'win';
      
      toast({
        title: isWin ? "🤖 AI Investment Successful!" : "🤖 AI Investment Completed",
        description: data.message,
        variant: isWin ? "default" : "destructive",
      });
      
      queryClient.invalidateQueries({ queryKey: ['quant-ai'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setSettings(prev => ({ ...prev, maxInvestment: '' }));
    },
    onError: (error: any) => {
      toast({
        title: "AI Investment Failed",
        description: error.message || "Failed to start AI investment",
        variant: "destructive",
      });
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: QuantAISettings) => {
      const response = await fetch('/api/quant-ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your QuantAI settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['quant-ai'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleStartAI = () => {
    if (!settings.maxInvestment || parseFloat(settings.maxInvestment) <= 0) {
      toast({
        title: "Invalid Investment Amount",
        description: "Please set a valid investment amount",
        variant: "destructive",
      });
      return;
    }
    
    startAIMutation.mutate({
      amount: parseFloat(settings.maxInvestment),
      strategy: settings.riskLevel === 'low' ? 'conservative' : 
                settings.riskLevel === 'high' ? 'aggressive' : 'balanced',
      riskLevel: settings.riskLevel
    });
  };

  const handleUpdateSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleAssetToggle = (asset: string) => {
    setSettings(prev => ({
      ...prev,
      assets: prev.assets.includes(asset)
        ? prev.assets.filter(a => a !== asset)
        : [...prev.assets, asset]
    }));
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const availableAssets = ['BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'ADA', 'AVAX', 'DOT'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          QuantAI Trading Bot
        </CardTitle>
        <CardDescription>
          AI-powered automated trading with advanced risk management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${settings.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
            <div>
              <p className="font-medium">
                AI Status: {settings.isActive ? 'Active' : 'Inactive'}
              </p>
              <p className="text-sm text-muted-foreground">
                {settings.isActive 
                  ? 'AI is actively monitoring and trading' 
                  : 'AI trading is currently paused'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleStartAI}
            disabled={startAIMutation.isPending}
            variant="default"
          >
            {startAIMutation.isPending ? (
              <>
                <Brain className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start AI Investment
              </>
            )}
          </Button>
        </div>

        {/* Performance Metrics */}
        {aiData?.data?.statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Investments</span>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold mt-2">{aiData.data.statistics.totalInvestments}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Win Rate</span>
                <Brain className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold mt-2">{aiData.data.statistics.winRate}%</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Profit</span>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div className={`text-2xl font-bold mt-2 ${aiData.data.statistics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(aiData.data.statistics.totalProfit).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Investment Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maxInvestment">Investment Amount (USD)</Label>
            <Input
              id="maxInvestment"
              type="number"
              step="0.01"
              min="10"
              placeholder="Enter investment amount"
              value={settings.maxInvestment}
              onChange={(e) => setSettings(prev => ({ ...prev, maxInvestment: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="riskLevel">Risk Level</Label>
            <Select value={settings.riskLevel} onValueChange={(value) => setSettings(prev => ({ ...prev, riskLevel: value as 'low' | 'medium' | 'high' }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Risk (Conservative)</SelectItem>
                <SelectItem value="medium">Medium Risk (Balanced)</SelectItem>
                <SelectItem value="high">High Risk (Aggressive)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Recent AI Investments */}
        {aiData?.data?.investments && aiData.data.investments.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Recent AI Investments</h4>
            <div className="space-y-2">
              {aiData.data.investments.slice(0, 5).map((investment: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${investment.result === 'win' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-sm font-medium">${investment.amount}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(investment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${investment.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {investment.profit >= 0 ? '+' : ''}${investment.profit.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{investment.result}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Warning */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                AI Investment Risks
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                AI investments involve substantial risk and may result in significant losses. 
                Past performance does not guarantee future results. Only invest what you can afford to lose.
              </p>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-muted-foreground text-sm">Active Assets: </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {settings.assets.map((asset) => (
                <Badge key={asset} variant="outline" className="text-xs">
                  {asset}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
