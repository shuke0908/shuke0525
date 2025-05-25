'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Save, RefreshCw, Plus, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

type TradingSettings = {
  flashTrade: {
    enabled: boolean;
    minAmount: number;
    maxAmount: number;
    timeOptions: number[];
    defaultWinRate: number;
    profitRange: { min: number; max: number };
    availableAssets: string[];
  };
  quickTrade: {
    enabled: boolean;
    minAmount: number;
    maxAmount: number;
    leverageOptions: number[];
    defaultLeverage: number;
    maxLeverage: number;
    tradingPairs: Array<{
      symbol: string;
      enabled: boolean;
      spread: number;
    }>;
    orderTypes: string[];
    defaultWinRate: number;
    profitRange: { min: number; max: number };
  };
  quantAI: {
    enabled: boolean;
    minAmount: number;
    maxAmount: number;
    strategies: Array<{
      name: string;
      label: string;
      enabled: boolean;
      winRate: number;
      profitRange: { min: number; max: number };
      riskLevel: string;
    }>;
    investmentDuration: number[];
    defaultDuration: number;
    availableAssets: string[];
  };
  wallet: {
    enabled: boolean;
    supportedCoins: Array<{
      symbol: string;
      name: string;
      enabled: boolean;
      networks: string[];
      minDeposit: number;
      maxDeposit: number;
      minWithdraw: number;
      maxWithdraw: number;
      depositFee: number;
      withdrawFee: number;
      confirmations: number;
    }>;
  };
  global: {
    maintenanceMode: boolean;
    tradingEnabled: boolean;
    newRegistrationEnabled: boolean;
    kycRequired: boolean;
    maxDailyTrades: number;
    maxDailyVolume: number;
    defaultCurrency: string;
    timezone: string;
  };
};

export default function TradingSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("flash-trade");
  const [editingPair, setEditingPair] = useState<string | null>(null);
  const [newPair, setNewPair] = useState({ symbol: '', enabled: true, spread: 0.1 });

  // 거래 설정 조회
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['admin', 'trading-settings'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch('/api/admin/trading-settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
  });

  const settings: TradingSettings = settingsData?.data;

  // 설정 업데이트 뮤테이션
  const updateSettingsMutation = useMutation({
    mutationFn: async ({ section, data }: { section: string; data: any }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch('/api/admin/trading-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ section, settings: data }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update settings');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "✅ 설정 업데이트 완료",
        description: `${variables.section} 설정이 성공적으로 업데이트되었습니다.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'trading-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "설정 업데이트 실패",
        description: error.message || "설정 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateSettings = (section: string, data: any) => {
    updateSettingsMutation.mutate({ section, data });
  };

  const handleToggleAsset = (section: 'flashTrade' | 'quantAI', asset: string) => {
    if (!settings) return;
    
    const currentAssets = settings[section].availableAssets;
    const updatedAssets = currentAssets.includes(asset)
      ? currentAssets.filter(a => a !== asset)
      : [...currentAssets, asset];
    
    handleUpdateSettings(section, {
      availableAssets: updatedAssets
    });
  };

  const handleToggleTradingPair = (symbol: string) => {
    if (!settings) return;
    
    const updatedPairs = settings.quickTrade.tradingPairs.map(pair =>
      pair.symbol === symbol ? { ...pair, enabled: !pair.enabled } : pair
    );
    
    handleUpdateSettings('quickTrade', {
      tradingPairs: updatedPairs
    });
  };

  const handleUpdateTradingPair = (symbol: string, field: string, value: any) => {
    if (!settings) return;
    
    const updatedPairs = settings.quickTrade.tradingPairs.map(pair =>
      pair.symbol === symbol ? { ...pair, [field]: value } : pair
    );
    
    handleUpdateSettings('quickTrade', {
      tradingPairs: updatedPairs
    });
  };

  const handleAddTradingPair = () => {
    if (!settings || !newPair.symbol) return;
    
    const updatedPairs = [...settings.quickTrade.tradingPairs, newPair];
    
    handleUpdateSettings('quickTrade', {
      tradingPairs: updatedPairs
    });
    
    setNewPair({ symbol: '', enabled: true, spread: 0.1 });
  };

  const handleRemoveTradingPair = (symbol: string) => {
    if (!settings) return;
    
    const updatedPairs = settings.quickTrade.tradingPairs.filter(pair => pair.symbol !== symbol);
    
    handleUpdateSettings('quickTrade', {
      tradingPairs: updatedPairs
    });
  };

  const handleToggleCoin = (symbol: string) => {
    if (!settings) return;
    
    const updatedCoins = settings.wallet.supportedCoins.map(coin =>
      coin.symbol === symbol ? { ...coin, enabled: !coin.enabled } : coin
    );
    
    handleUpdateSettings('wallet', {
      supportedCoins: updatedCoins
    });
  };

  const handleUpdateCoin = (symbol: string, field: string, value: any) => {
    if (!settings) return;
    
    const updatedCoins = settings.wallet.supportedCoins.map(coin =>
      coin.symbol === symbol ? { ...coin, [field]: value } : coin
    );
    
    handleUpdateSettings('wallet', {
      supportedCoins: updatedCoins
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            거래 설정을 불러올 수 없습니다. 페이지를 새로고침해 주세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Settings className="mr-3" />
          🎛️ 고급 거래 설정
        </h1>
        <p className="text-muted-foreground">모든 거래 시스템의 세부 설정을 관리합니다</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="flash-trade">Flash Trade</TabsTrigger>
          <TabsTrigger value="quick-trade">Quick Trade</TabsTrigger>
          <TabsTrigger value="quant-ai">Quant AI</TabsTrigger>
          <TabsTrigger value="wallet">지갑 설정</TabsTrigger>
          <TabsTrigger value="global">전역 설정</TabsTrigger>
        </TabsList>

        {/* Flash Trade 설정 */}
        <TabsContent value="flash-trade" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>⚡ Flash Trade 설정</CardTitle>
              <CardDescription>30초~5분 단기 거래 시스템 설정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.flashTrade.enabled}
                  onCheckedChange={(checked) => 
                    handleUpdateSettings('flashTrade', { enabled: checked })
                  }
                />
                <Label>Flash Trade 활성화</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>최소 거래 금액 ($)</Label>
                  <Input
                    type="number"
                    value={settings.flashTrade.minAmount}
                    onChange={(e) => 
                      handleUpdateSettings('flashTrade', { minAmount: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>최대 거래 금액 ($)</Label>
                  <Input
                    type="number"
                    value={settings.flashTrade.maxAmount}
                    onChange={(e) => 
                      handleUpdateSettings('flashTrade', { maxAmount: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>거래 시간 옵션 (초)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[30, 60, 120, 180, 300, 600].map((time) => (
                    <Badge
                      key={time}
                      variant={settings.flashTrade.timeOptions.includes(time) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const currentOptions = settings.flashTrade.timeOptions;
                        const updatedOptions = currentOptions.includes(time)
                          ? currentOptions.filter(t => t !== time)
                          : [...currentOptions, time].sort((a, b) => a - b);
                        handleUpdateSettings('flashTrade', { timeOptions: updatedOptions });
                      }}
                    >
                      {time}초
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>기본 승률 (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.flashTrade.defaultWinRate}
                    onChange={(e) => 
                      handleUpdateSettings('flashTrade', { defaultWinRate: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>최소 수익률 (%)</Label>
                  <Input
                    type="number"
                    value={settings.flashTrade.profitRange.min}
                    onChange={(e) => 
                      handleUpdateSettings('flashTrade', { 
                        profitRange: { ...settings.flashTrade.profitRange, min: parseFloat(e.target.value) }
                      })
                    }
                  />
                </div>
                <div>
                  <Label>최대 수익률 (%)</Label>
                  <Input
                    type="number"
                    value={settings.flashTrade.profitRange.max}
                    onChange={(e) => 
                      handleUpdateSettings('flashTrade', { 
                        profitRange: { ...settings.flashTrade.profitRange, max: parseFloat(e.target.value) }
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>사용 가능한 자산</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'SOL', 'ADA', 'AVAX'].map((asset) => (
                    <Badge
                      key={asset}
                      variant={settings.flashTrade.availableAssets.includes(asset) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleToggleAsset('flashTrade', asset)}
                    >
                      {asset}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Trade 설정 */}
        <TabsContent value="quick-trade" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Quick Trade 설정</CardTitle>
              <CardDescription>즉시 거래 실행 시스템 설정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.quickTrade.enabled}
                  onCheckedChange={(checked) => 
                    handleUpdateSettings('quickTrade', { enabled: checked })
                  }
                />
                <Label>Quick Trade 활성화</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>최소 거래 금액 ($)</Label>
                  <Input
                    type="number"
                    value={settings.quickTrade.minAmount}
                    onChange={(e) => 
                      handleUpdateSettings('quickTrade', { minAmount: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>최대 거래 금액 ($)</Label>
                  <Input
                    type="number"
                    value={settings.quickTrade.maxAmount}
                    onChange={(e) => 
                      handleUpdateSettings('quickTrade', { maxAmount: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>레버리지 옵션</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[1, 2, 5, 10, 20, 50, 100, 200].map((leverage) => (
                    <Badge
                      key={leverage}
                      variant={settings.quickTrade.leverageOptions.includes(leverage) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const currentOptions = settings.quickTrade.leverageOptions;
                        const updatedOptions = currentOptions.includes(leverage)
                          ? currentOptions.filter(l => l !== leverage)
                          : [...currentOptions, leverage].sort((a, b) => a - b);
                        handleUpdateSettings('quickTrade', { leverageOptions: updatedOptions });
                      }}
                    >
                      1:{leverage}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>기본 레버리지</Label>
                  <Select
                    value={settings.quickTrade.defaultLeverage.toString()}
                    onValueChange={(value) => 
                      handleUpdateSettings('quickTrade', { defaultLeverage: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.quickTrade.leverageOptions.map((leverage) => (
                        <SelectItem key={leverage} value={leverage.toString()}>
                          1:{leverage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>최대 레버리지</Label>
                  <Input
                    type="number"
                    value={settings.quickTrade.maxLeverage}
                    onChange={(e) => 
                      handleUpdateSettings('quickTrade', { maxLeverage: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-semibold">거래 쌍 관리</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="예: DOGE/USDT"
                      value={newPair.symbol}
                      onChange={(e) => setNewPair({ ...newPair, symbol: e.target.value })}
                      className="w-32"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="스프레드"
                      value={newPair.spread}
                      onChange={(e) => setNewPair({ ...newPair, spread: parseFloat(e.target.value) })}
                      className="w-24"
                    />
                    <Button onClick={handleAddTradingPair} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>거래 쌍</TableHead>
                      <TableHead>활성화</TableHead>
                      <TableHead>스프레드 (%)</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings.quickTrade.tradingPairs.map((pair) => (
                      <TableRow key={pair.symbol}>
                        <TableCell className="font-medium">{pair.symbol}</TableCell>
                        <TableCell>
                          <Switch
                            checked={pair.enabled}
                            onCheckedChange={() => handleToggleTradingPair(pair.symbol)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={pair.spread}
                            onChange={(e) => 
                              handleUpdateTradingPair(pair.symbol, 'spread', parseFloat(e.target.value))
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveTradingPair(pair.symbol)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quant AI 설정 */}
        <TabsContent value="quant-ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🤖 Quant AI 설정</CardTitle>
              <CardDescription>AI 투자 시뮬레이션 시스템 설정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.quantAI.enabled}
                  onCheckedChange={(checked) => 
                    handleUpdateSettings('quantAI', { enabled: checked })
                  }
                />
                <Label>Quant AI 활성화</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>최소 투자 금액 ($)</Label>
                  <Input
                    type="number"
                    value={settings.quantAI.minAmount}
                    onChange={(e) => 
                      handleUpdateSettings('quantAI', { minAmount: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>최대 투자 금액 ($)</Label>
                  <Input
                    type="number"
                    value={settings.quantAI.maxAmount}
                    onChange={(e) => 
                      handleUpdateSettings('quantAI', { maxAmount: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="text-lg font-semibold">투자 전략 설정</Label>
                <div className="space-y-4 mt-4">
                  {settings.quantAI.strategies.map((strategy, index) => (
                    <Card key={strategy.name}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={strategy.enabled}
                              onCheckedChange={(checked) => {
                                const updatedStrategies = [...settings.quantAI.strategies];
                                updatedStrategies[index] = { ...strategy, enabled: checked };
                                handleUpdateSettings('quantAI', { strategies: updatedStrategies });
                              }}
                            />
                            <Label className="font-semibold">{strategy.label} ({strategy.name})</Label>
                            <Badge variant="outline">{strategy.riskLevel}</Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>승률 (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={strategy.winRate}
                              onChange={(e) => {
                                const updatedStrategies = [...settings.quantAI.strategies];
                                updatedStrategies[index] = { ...strategy, winRate: parseFloat(e.target.value) };
                                handleUpdateSettings('quantAI', { strategies: updatedStrategies });
                              }}
                            />
                          </div>
                          <div>
                            <Label>최소 수익률 (%)</Label>
                            <Input
                              type="number"
                              value={strategy.profitRange.min}
                              onChange={(e) => {
                                const updatedStrategies = [...settings.quantAI.strategies];
                                updatedStrategies[index] = { 
                                  ...strategy, 
                                  profitRange: { ...strategy.profitRange, min: parseFloat(e.target.value) }
                                };
                                handleUpdateSettings('quantAI', { strategies: updatedStrategies });
                              }}
                            />
                          </div>
                          <div>
                            <Label>최대 수익률 (%)</Label>
                            <Input
                              type="number"
                              value={strategy.profitRange.max}
                              onChange={(e) => {
                                const updatedStrategies = [...settings.quantAI.strategies];
                                updatedStrategies[index] = { 
                                  ...strategy, 
                                  profitRange: { ...strategy.profitRange, max: parseFloat(e.target.value) }
                                };
                                handleUpdateSettings('quantAI', { strategies: updatedStrategies });
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <Label>투자 기간 옵션 (일)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[1, 3, 7, 14, 30, 60, 90].map((duration) => (
                    <Badge
                      key={duration}
                      variant={settings.quantAI.investmentDuration.includes(duration) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const currentDurations = settings.quantAI.investmentDuration;
                        const updatedDurations = currentDurations.includes(duration)
                          ? currentDurations.filter(d => d !== duration)
                          : [...currentDurations, duration].sort((a, b) => a - b);
                        handleUpdateSettings('quantAI', { investmentDuration: updatedDurations });
                      }}
                    >
                      {duration}일
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>사용 가능한 자산</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'SOL', 'ADA', 'AVAX'].map((asset) => (
                    <Badge
                      key={asset}
                      variant={settings.quantAI.availableAssets.includes(asset) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleToggleAsset('quantAI', asset)}
                    >
                      {asset}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 지갑 설정 */}
        <TabsContent value="wallet" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>💰 지갑 설정</CardTitle>
              <CardDescription>암호화폐 지갑 시스템 설정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.wallet.enabled}
                  onCheckedChange={(checked) => 
                    handleUpdateSettings('wallet', { enabled: checked })
                  }
                />
                <Label>지갑 시스템 활성화</Label>
              </div>

              <div>
                <Label className="text-lg font-semibold">지원 암호화폐 관리</Label>
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>코인</TableHead>
                      <TableHead>활성화</TableHead>
                      <TableHead>최소 입금</TableHead>
                      <TableHead>최대 입금</TableHead>
                      <TableHead>최소 출금</TableHead>
                      <TableHead>최대 출금</TableHead>
                      <TableHead>출금 수수료</TableHead>
                      <TableHead>확인 횟수</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings.wallet.supportedCoins.map((coin) => (
                      <TableRow key={coin.symbol}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{coin.symbol}</div>
                            <div className="text-sm text-muted-foreground">{coin.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={coin.enabled}
                            onCheckedChange={() => handleToggleCoin(coin.symbol)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.00000001"
                            value={coin.minDeposit}
                            onChange={(e) => 
                              handleUpdateCoin(coin.symbol, 'minDeposit', parseFloat(e.target.value))
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.00000001"
                            value={coin.maxDeposit}
                            onChange={(e) => 
                              handleUpdateCoin(coin.symbol, 'maxDeposit', parseFloat(e.target.value))
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.00000001"
                            value={coin.minWithdraw}
                            onChange={(e) => 
                              handleUpdateCoin(coin.symbol, 'minWithdraw', parseFloat(e.target.value))
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.00000001"
                            value={coin.maxWithdraw}
                            onChange={(e) => 
                              handleUpdateCoin(coin.symbol, 'maxWithdraw', parseFloat(e.target.value))
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.00000001"
                            value={coin.withdrawFee}
                            onChange={(e) => 
                              handleUpdateCoin(coin.symbol, 'withdrawFee', parseFloat(e.target.value))
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={coin.confirmations}
                            onChange={(e) => 
                              handleUpdateCoin(coin.symbol, 'confirmations', parseInt(e.target.value))
                            }
                            className="w-20"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 전역 설정 */}
        <TabsContent value="global" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🌐 전역 설정</CardTitle>
              <CardDescription>플랫폼 전체 설정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.global.maintenanceMode}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings('global', { maintenanceMode: checked })
                      }
                    />
                    <Label>유지보수 모드</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.global.tradingEnabled}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings('global', { tradingEnabled: checked })
                      }
                    />
                    <Label>거래 활성화</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.global.newRegistrationEnabled}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings('global', { newRegistrationEnabled: checked })
                      }
                    />
                    <Label>신규 가입 허용</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.global.kycRequired}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings('global', { kycRequired: checked })
                      }
                    />
                    <Label>KYC 필수</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>일일 최대 거래 횟수</Label>
                    <Input
                      type="number"
                      value={settings.global.maxDailyTrades}
                      onChange={(e) => 
                        handleUpdateSettings('global', { maxDailyTrades: parseInt(e.target.value) })
                      }
                    />
                  </div>

                  <div>
                    <Label>일일 최대 거래량 ($)</Label>
                    <Input
                      type="number"
                      value={settings.global.maxDailyVolume}
                      onChange={(e) => 
                        handleUpdateSettings('global', { maxDailyVolume: parseFloat(e.target.value) })
                      }
                    />
                  </div>

                  <div>
                    <Label>기본 통화</Label>
                    <Select
                      value={settings.global.defaultCurrency}
                      onValueChange={(value) => 
                        handleUpdateSettings('global', { defaultCurrency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="KRW">KRW</SelectItem>
                        <SelectItem value="JPY">JPY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>시간대</Label>
                    <Select
                      value={settings.global.timezone}
                      onValueChange={(value) => 
                        handleUpdateSettings('global', { timezone: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Asia/Seoul">Asia/Seoul</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 