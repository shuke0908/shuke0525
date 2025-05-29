'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowDownLeft, 
  Copy, 
  QrCode, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Upload,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

type SupportedCoin = {
  symbol: string;
  name: string;
  networks: Array<{
    name: string;
    chainId: string;
    minDeposit: number;
    confirmations: number;
    isActive: boolean;
  }>;
  isActive: boolean;
};

type DepositAddress = {
  address: string;
  qrCode: string;
  memo?: string;
  expiresAt: string;
};

function DepositPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCoin, setSelectedCoin] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositAddress, setDepositAddress] = useState<DepositAddress | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    txHash: '',
    screenshot: null as File | null,
    notes: ''
  });

  // Get supported coins
  const { data: coinsData, isLoading: coinsLoading } = useQuery({
    queryKey: ['wallet', 'supported-coins'],
    queryFn: async () => {
      const response = await fetch('/api/wallet/supported-coins');
      if (!response.ok) throw new Error('Failed to fetch supported coins');
      return response.json();
    },
  });

  const supportedCoins: SupportedCoin[] = coinsData?.data?.coins || [];

  // Generate deposit address mutation
  const generateAddressMutation = useMutation({
    mutationFn: async (data: { coin: string; network: string }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to generate deposit address');

      const response = await fetch('/api/wallet/deposit/generate-address', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate deposit address');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setDepositAddress(data.data);
      toast({
        title: "✅ 입금 주소 생성 완료",
        description: "입금 주소가 성공적으로 생성되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "주소 생성 실패",
        description: error.message || "입금 주소 생성에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  // Submit deposit proof mutation
  const submitProofMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to submit deposit proof');

      const response = await fetch('/api/wallet/deposit/submit-proof', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit deposit proof');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ 입금 증빙 제출 완료",
        description: "입금 증빙이 성공적으로 제출되었습니다. 관리자 승인을 기다려주세요.",
      });
      setShowUploadForm(false);
      setUploadForm({ txHash: '', screenshot: null, notes: '' });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (error: any) => {
      toast({
        title: "증빙 제출 실패",
        description: error.message || "입금 증빙 제출에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const handleGenerateAddress = () => {
    if (!selectedCoin || !selectedNetwork) {
      toast({
        title: "입력 오류",
        description: "코인과 네트워크를 선택해주세요",
        variant: "destructive",
      });
      return;
    }

    generateAddressMutation.mutate({
      coin: selectedCoin,
      network: selectedNetwork
    });
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadForm.txHash || !uploadForm.screenshot) {
      toast({
        title: "입력 오류",
        description: "트랜잭션 해시와 스크린샷을 모두 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('coin', selectedCoin);
    formData.append('network', selectedNetwork);
    formData.append('amount', depositAmount);
    formData.append('txHash', uploadForm.txHash);
    formData.append('screenshot', uploadForm.screenshot);
    formData.append('notes', uploadForm.notes);
    formData.append('depositAddress', depositAddress?.address || '');

    submitProofMutation.mutate(formData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "복사 완료",
      description: "클립보드에 복사되었습니다",
    });
  };

  const getSelectedCoinData = () => {
    return supportedCoins.find(coin => coin.symbol === selectedCoin);
  };

  const getSelectedNetworkData = () => {
    const coin = getSelectedCoinData();
    return coin?.networks.find(network => network.name === selectedNetwork);
  };

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
        <ArrowDownLeft className="h-8 w-8 text-green-600" />
        <h1 className="text-3xl font-bold">암호화폐 입금</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit Form */}
        <Card>
          <CardHeader>
            <CardTitle>입금 정보 입력</CardTitle>
            <CardDescription>
              입금할 암호화폐와 네트워크를 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Coin Selection */}
            <div className="space-y-2">
              <Label htmlFor="coin">암호화폐 선택</Label>
              <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                <SelectTrigger>
                  <SelectValue placeholder="입금할 코인을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {supportedCoins.filter(coin => coin.isActive).map((coin) => (
                    <SelectItem key={coin.symbol} value={coin.symbol}>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{coin.symbol}</span>
                        <span className="text-muted-foreground">- {coin.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                          <Badge variant="outline" className="ml-2">
                            최소: {network.minDeposit} {selectedCoin}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">입금 금액 (선택사항)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="입금할 금액을 입력하세요"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
              {selectedNetwork && (
                <p className="text-sm text-muted-foreground">
                  최소 입금 금액: {getSelectedNetworkData()?.minDeposit} {selectedCoin}
                </p>
              )}
            </div>

            {/* Generate Address Button */}
            <Button 
              onClick={handleGenerateAddress}
              disabled={!selectedCoin || !selectedNetwork || generateAddressMutation.isPending}
              className="w-full"
            >
              {generateAddressMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  주소 생성 중...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  입금 주소 생성
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Deposit Address Display */}
        {depositAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>입금 주소</span>
              </CardTitle>
              <CardDescription>
                아래 주소로 {selectedCoin}을 전송하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code */}
              <div className="text-center">
                <div className="inline-block p-4 bg-white rounded-lg border">
                  <img 
                    src={depositAddress.qrCode} 
                    alt="QR Code" 
                    className="w-48 h-48 mx-auto"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label>입금 주소</Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    value={depositAddress.address} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(depositAddress.address)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Memo (if applicable) */}
              {depositAddress.memo && (
                <div className="space-y-2">
                  <Label>메모 (Memo/Tag)</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={depositAddress.memo} 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(depositAddress.memo!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Important Notes */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>반드시 {selectedNetwork} 네트워크를 사용하여 전송하세요</li>
                    <li>최소 입금 금액: {getSelectedNetworkData()?.minDeposit} {selectedCoin}</li>
                    <li>입금 확인까지 {getSelectedNetworkData()?.confirmations}회 확인이 필요합니다</li>
                    <li>잘못된 네트워크로 전송 시 자산을 잃을 수 있습니다</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Submit Proof Button */}
              <Button 
                onClick={() => setShowUploadForm(true)}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                입금 증빙 제출
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Proof Modal/Form */}
      {showUploadForm && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>입금 증빙 제출</CardTitle>
            <CardDescription>
              입금 완료 후 트랜잭션 해시와 스크린샷을 제출하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitProof} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="txHash">트랜잭션 해시 (TXID)</Label>
                <Input
                  id="txHash"
                  placeholder="트랜잭션 해시를 입력하세요"
                  value={uploadForm.txHash}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, txHash: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenshot">입금 스크린샷</Label>
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadForm(prev => ({ 
                    ...prev, 
                    screenshot: e.target.files?.[0] || null 
                  }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">추가 메모 (선택사항)</Label>
                <Textarea
                  id="notes"
                  placeholder="추가 설명이 있다면 입력하세요"
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  disabled={submitProofMutation.isPending}
                  className="flex-1"
                >
                  {submitProofMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      제출 중...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      증빙 제출
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowUploadForm(false)}
                >
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-blue-500" />
            <span>입금 안내</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">입금 절차</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>코인과 네트워크 선택</li>
                <li>입금 주소 생성</li>
                <li>지갑에서 해당 주소로 전송</li>
                <li>입금 증빙 제출</li>
                <li>관리자 승인 대기</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">주의사항</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>반드시 올바른 네트워크 사용</li>
                <li>최소 입금 금액 확인</li>
                <li>메모가 있는 경우 반드시 포함</li>
                <li>입금 완료 후 증빙 제출</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DepositPage; 