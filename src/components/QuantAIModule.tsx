'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import { Brain, Play, TrendingUp, AlertTriangle, Activity, Zap } from 'lucide-react';
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

interface QuantAIModuleProps {
  className?: string;
}

export function QuantAIModule({ className }: QuantAIModuleProps) {
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

      const response = await fetch('/api/quant-ai/strategies', {
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

      const response = await fetch('/api/quant-ai/invest', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          strategyId: investmentData.strategy,
          amount: investmentData.amount,
          duration: 30 // 기본 30일
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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          Quant AI Trading
        </CardTitle>
        <CardDescription>
          AI-powered algorithmic trading strategies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">87.5%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">$12,450</div>
            <div className="text-sm text-muted-foreground">Total Profit</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Active Strategies</span>
            <Badge variant="secondary">3</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Risk Level</span>
            <Badge variant="outline">Medium</Badge>
          </div>
        </div>

        <Button className="w-full" variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          View AI Strategies
        </Button>
      </CardContent>
    </Card>
  );
}
