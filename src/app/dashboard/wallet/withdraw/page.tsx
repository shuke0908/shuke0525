'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowUpRight, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Shield,
  Info,
  Calculator
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type SupportedCoin = {
  symbol: string;
  name: string;
  balance: number;
  networks: Array<{
    name: string;
    chainId: string;
    minWithdrawal: number;
    maxWithdrawal: number;
    withdrawalFee: number;
    processingTime: string;
    isActive: boolean;
  }>;
  isActive: boolean;
};

type WithdrawalEstimate = {
  amount: number;
  fee: number;
  receiveAmount: number;
  processingTime: string;
};

function WithdrawPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCoin, setSelectedCoin] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [withdrawalPassword, setWithdrawalPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [estimate, setEstimate] = useState<WithdrawalEstimate | null>(null);

  // Get supported coins with balances
  const { data: coinsData, isLoading: coinsLoading } = useQuery({
    queryKey: ['wallet', 'withdrawal-coins'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to access wallet');

      const response = await fetch('/api/wallet/withdrawal-coins', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch withdrawal coins');
      return response.json();
    },
    enabled: !!user,
  });

  const supportedCoins: SupportedCoin[] = coinsData?.data?.coins || [];

  // Calculate withdrawal estimate
  const calculateEstimate = () => {
    if (!selectedCoin || !selectedNetwork || !withdrawalAmount) {
      setEstimate(null);
      return;
    }

    const coin = getSelectedCoinData();
    const network = getSelectedNetworkData();
    
    if (!coin || !network) {
      setEstimate(null);
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    const fee = network.withdrawalFee;
    const receiveAmount = amount - fee;

    if (receiveAmount <= 0) {
      setEstimate(null);
      return;
    }

    setEstimate({
      amount,
      fee,
      receiveAmount,
      processingTime: network.processingTime
    });
  };

  // Submit withdrawal mutation
  const withdrawalMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to submit withdrawal');

      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit withdrawal');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ 출금 요청 제출 완료",
        description: "출금 요청이 성공적으로 제출되었습니다. 관리자 승인을 기다려주세요.",
      });
      // 폼 초기화
      setSelectedCoin('');
      setSelectedNetwork('');
      setWithdrawalAmount('');
      setWithdrawalAddress('');
      setMemo('');
      setWithdrawalPassword('');
      setNotes('');
      setAgreedToTerms(false);
      setEstimate(null);
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (error: any) => {
      toast({
        title: "출금 요청 실패",
        description: error.message || "출금 요청 제출에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const handleSubmitWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCoin || !selectedNetwork || !withdrawalAmount || !withdrawalAddress) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    if (!withdrawalPassword) {
      toast({
        title: "보안 인증 필요",
        description: "출금 비밀번호를 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: "약관 동의 필요",
        description: "출금 약관에 동의해주세요",
        variant: "destructive",
      });
      return;
    }

    const coin = getSelectedCoinData();
    const network = getSelectedNetworkData();
    const amount = parseFloat(withdrawalAmount);

    if (!coin || !network) return;

    if (amount < network.minWithdrawal) {
      toast({
        title: "최소 출금 금액 미달",
        description: `최소 출금 금액은 ${network.minWithdrawal} ${selectedCoin}입니다`,
        variant: "destructive",
      });
      return;
    }

    if (amount > network.maxWithdrawal) {
      toast({
        title: "최대 출금 금액 초과",
        description: `최대 출금 금액은 ${network.maxWithdrawal} ${selectedCoin}입니다`,
        variant: "destructive",
      });
      return;
    }

    if (amount > coin.balance) {
      toast({
        title: "잔액 부족",
        description: `보유 잔액이 부족합니다. 현재 잔액: ${coin.balance} ${selectedCoin}`,
        variant: "destructive",
      });
      return;
    }

    withdrawalMutation.mutate({
      coin: selectedCoin,
      network: selectedNetwork,
      amount,
      address: withdrawalAddress,
      memo: memo || undefined,
      withdrawalPassword,
      notes: notes || undefined
    });
  };

  const getSelectedCoinData = () => {
    return supportedCoins.find(coin => coin.symbol === selectedCoin);
  };

  const getSelectedNetworkData = () => {
    const coin = getSelectedCoinData();
    return coin?.networks.find(network => network.name === selectedNetwork);
  };

  // 금액 입력 시 자동으로 견적 계산
  React.useEffect(() => {
    calculateEstimate();
  }, [selectedCoin, selectedNetwork, withdrawalAmount]);

  if (coinsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <ArrowUpRight className="h-8 w-8 text-red-600" />
        <h1 className="text-3xl font-bold">암호화폐 출금</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdrawal Form */}
        <Card>
          <CardHeader>
            <CardTitle>출금 정보 입력</CardTitle>
            <CardDescription>
              출금할 암호화폐와 수신 주소를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
              {/* Coin Selection */}
              <div className="space-y-2">
                <Label htmlFor="coin">암호화폐 선택</Label>
                <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                  <SelectTrigger>
                    <SelectValue placeholder="출금할 코인을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedCoins.filter(coin => coin.isActive && coin.balance > 0).map((coin) => (
                      <SelectItem key={coin.symbol} value={coin.symbol}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{coin.symbol}</span>
                            <span className="text-muted-foreground">- {coin.name}</span>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            잔액: {coin.balance.toFixed(8)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCoin && (
                  <p className="text-sm text-muted-foreground">
                    사용 가능 잔액: {getSelectedCoinData()?.balance.toFixed(8)} {selectedCoin}
                  </p>
                )}
              </div>

              {/* Network Selection */}
              {selectedCoin && (
                <div className="space-y-2">
                  <Label htmlFor="network">네트워크 선택</Label>
                  <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                    <SelectTrigger>
                      <SelectValue placeholder="네트워크를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSelectedCoinData()?.networks.filter(network => network.isActive).map((network) => (
                        <SelectItem key={network.name} value={network.name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{network.name}</span>
                            <div className="flex space-x-2">
                              <Badge variant="outline" className="text-xs">
                                수수료: {network.withdrawalFee} {selectedCoin}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {network.processingTime}
                              </Badge>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">출금 금액</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.00000001"
                    placeholder="출금할 금액을 입력하세요"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    required
                  />
                  {selectedCoin && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs"
                      onClick={() => {
                        const coin = getSelectedCoinData();
                        const network = getSelectedNetworkData();
                        if (coin && network) {
                          // 수수료를 제외한 최대 출금 가능 금액
                          const maxAmount = Math.max(0, coin.balance - network.withdrawalFee);
                          setWithdrawalAmount(maxAmount.toString());
                        }
                      }}
                    >
                      최대
                    </Button>
                  )}
                </div>
                {selectedNetwork && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>최소 출금: {getSelectedNetworkData()?.minWithdrawal} {selectedCoin}</p>
                    <p>최대 출금: {getSelectedNetworkData()?.maxWithdrawal} {selectedCoin}</p>
                  </div>
                )}
              </div>

              {/* Address Input */}
              <div className="space-y-2">
                <Label htmlFor="address">수신 주소</Label>
                <Input
                  id="address"
                  placeholder="출금할 지갑 주소를 입력하세요"
                  value={withdrawalAddress}
                  onChange={(e) => setWithdrawalAddress(e.target.value)}
                  className="font-mono text-sm"
                  required
                />
              </div>

              {/* Memo (if applicable) */}
              {selectedCoin && ['XRP', 'XLM', 'EOS'].includes(selectedCoin) && (
                <div className="space-y-2">
                  <Label htmlFor="memo">메모 (Memo/Tag)</Label>
                  <Input
                    id="memo"
                    placeholder="메모를 입력하세요 (필요한 경우)"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                  <p className="text-sm text-yellow-600">
                    ⚠️ 일부 거래소는 메모가 필수입니다. 확인 후 입력하세요.
                  </p>
                </div>
              )}

              {/* Withdrawal Password */}
              <div className="space-y-2">
                <Label htmlFor="withdrawalPassword">출금 비밀번호</Label>
                <Input
                  id="withdrawalPassword"
                  type="password"
                  placeholder="출금 비밀번호를 입력하세요"
                  value={withdrawalPassword}
                  onChange={(e) => setWithdrawalPassword(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  보안을 위해 출금 시 별도의 비밀번호가 필요합니다.
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">추가 메모 (선택사항)</Label>
                <Textarea
                  id="notes"
                  placeholder="추가 설명이 있다면 입력하세요"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Terms Agreement */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm">
                  출금 약관 및 주의사항에 동의합니다
                </Label>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={withdrawalMutation.isPending || !agreedToTerms}
                className="w-full"
              >
                {withdrawalMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    출금 요청 중...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    출금 요청
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Withdrawal Estimate */}
        {estimate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-blue-500" />
                <span>출금 견적</span>
              </CardTitle>
              <CardDescription>
                예상 출금 정보를 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">출금 금액</span>
                  <span className="font-semibold">
                    {estimate.amount.toFixed(8)} {selectedCoin}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">네트워크 수수료</span>
                  <span className="text-red-600">
                    -{estimate.fee.toFixed(8)} {selectedCoin}
                  </span>
                </div>
                
                <hr />
                
                <div className="flex justify-between items-center">
                  <span className="font-semibold">실제 수신 금액</span>
                  <span className="font-bold text-green-600">
                    {estimate.receiveAmount.toFixed(8)} {selectedCoin}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">예상 처리 시간</span>
                  <span>{estimate.processingTime}</span>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  출금 요청 후 관리자 승인이 필요하며, 승인 완료 후 블록체인 네트워크로 전송됩니다.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Important Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-orange-500" />
            <span>출금 주의사항</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-red-600">⚠️ 중요 주의사항</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>반드시 올바른 네트워크와 주소를 확인하세요</li>
                <li>잘못된 주소로 전송 시 자산을 잃을 수 있습니다</li>
                <li>메모가 필요한 경우 반드시 입력하세요</li>
                <li>출금 완료 후 취소가 불가능합니다</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">출금 절차</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>출금 정보 입력 및 확인</li>
                <li>출금 요청 제출</li>
                <li>관리자 승인 대기</li>
                <li>블록체인 네트워크 전송</li>
                <li>수신 확인</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WithdrawPage; 