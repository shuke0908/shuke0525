'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, AlertCircle, Copy, QrCode, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppLayout } from "@/components/layout";

type Transaction = {
  id: string;
  transaction_type: 'deposit' | 'withdrawal';
  coin: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  tx_hash?: string;
  address?: string;
  deposit_address?: string;
  network: string;
  fee: number;
};

type SupportedCoin = {
  id: number;
  symbol: string;
  name: string;
  icon: string;
  networks: Array<{
    name: string;
    chainId: string;
    minDeposit: number;
    minWithdrawal: number;
    withdrawalFee: number;
    confirmations: number;
    isActive: boolean;
  }>;
  currentPrice: number;
  priceChange24h: number;
  isActive: boolean;
};

type DepositResponse = {
  id: string;
  deposit_address: string;
  qr_code: string;
  instructions: string[];
  expires_at: string;
};

function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [depositForm, setDepositForm] = useState({
    coin: '',
    amount: '',
    network: ''
  });
  const [withdrawalForm, setWithdrawalForm] = useState({
    coin: '',
    amount: '',
    address: '',
    network: ''
  });
  const [depositResult, setDepositResult] = useState<DepositResponse | null>(null);

  // Get wallet balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to access wallet');

      const response = await fetch('/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch balance');
      return response.json();
    },
  });

  // Get transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to access transactions');

      const response = await fetch('/api/wallet/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
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

  const transactions: Transaction[] = transactionsData?.data?.transactions || [];
  const supportedCoins: SupportedCoin[] = coinsData?.data?.coins || [];
  const balance = balanceData?.balance || '0';

  // Create deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to make deposits');

      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create deposit');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Deposit Address Generated",
        description: "Your deposit address has been generated successfully.",
      });
      setDepositResult(data.data);
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (error: any) => {
      toast({
        title: "Deposit Failed",
        description: error.message || "Failed to generate deposit address",
        variant: "destructive",
      });
    },
  });

  // Create withdrawal mutation
  const withdrawalMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to make withdrawals');

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
        throw new Error(errorData.error || 'Failed to create withdrawal');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Withdrawal Submitted",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setWithdrawalForm({ coin: '', amount: '', address: '', network: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to submit withdrawal",
        variant: "destructive",
      });
    },
  });

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositForm.coin || !depositForm.amount || !depositForm.network) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    depositMutation.mutate(depositForm);
  };

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawalForm.coin || !withdrawalForm.amount || !withdrawalForm.address || !withdrawalForm.network) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    withdrawalMutation.mutate(withdrawalForm);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const getSelectedCoin = (symbol: string) => {
    return supportedCoins.find(coin => coin.symbol === symbol);
  };

  const getSelectedNetwork = (coin: SupportedCoin | undefined, networkName: string) => {
    return coin?.networks.find(network => network.name === networkName);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      cancelled: "outline"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <AppLayout 
      title="💰 Wallet" 
      description="Manage your deposits, withdrawals, and account balance"
      variant="user"
    >

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Balance Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
              <WalletIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">
                  ${parseFloat(balance).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Available for trading and withdrawal
              </p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowDownLeft className="h-5 w-5 mr-2 text-green-600" />
                  Quick Deposit
                </CardTitle>
                <CardDescription>Add funds to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setActiveTab("deposit")} 
                  className="w-full"
                >
                  Make Deposit
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowUpRight className="h-5 w-5 mr-2 text-blue-600" />
                  Quick Withdrawal
                </CardTitle>
                <CardDescription>Withdraw funds from your account</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setActiveTab("withdraw")} 
                  variant="outline" 
                  className="w-full"
                >
                  Make Withdrawal
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest wallet activity</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(transaction.status)}
                        <div>
                          <p className="font-medium">
                            {transaction.transaction_type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.coin} • {transaction.network} • {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {transaction.transaction_type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposit" className="space-y-6">
          {!depositResult ? (
            <Card>
              <CardHeader>
                <CardTitle>💳 Make a Deposit</CardTitle>
                <CardDescription>Generate a deposit address for your chosen cryptocurrency</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDeposit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deposit-coin">Cryptocurrency</Label>
                      <Select value={depositForm.coin} onValueChange={(value) => setDepositForm(prev => ({ ...prev, coin: value, network: '' }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cryptocurrency" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedCoins.map((coin) => (
                            <SelectItem key={coin.id} value={coin.symbol}>
                              <div className="flex items-center space-x-2">
                                <span>{coin.icon}</span>
                                <span>{coin.name} ({coin.symbol})</span>
                                <span className="text-xs text-muted-foreground">${coin.currentPrice.toFixed(2)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="deposit-network">Network</Label>
                      <Select 
                        value={depositForm.network} 
                        onValueChange={(value) => setDepositForm(prev => ({ ...prev, network: value }))}
                        disabled={!depositForm.coin}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select network" />
                        </SelectTrigger>
                        <SelectContent>
                          {getSelectedCoin(depositForm.coin)?.networks.map((network) => (
                            <SelectItem key={network.chainId} value={network.name}>
                              <div className="flex items-center justify-between w-full">
                                <span>{network.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  Min: {network.minDeposit} {depositForm.coin}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="deposit-amount">Amount ({depositForm.coin || 'Coin'})</Label>
                    <Input
                      id="deposit-amount"
                      type="number"
                      step="0.00000001"
                      min={getSelectedNetwork(getSelectedCoin(depositForm.coin), depositForm.network)?.minDeposit || 0}
                      placeholder="Enter amount"
                      value={depositForm.amount}
                      onChange={(e) => setDepositForm(prev => ({ ...prev, amount: e.target.value }))}
                    />
                    {depositForm.coin && depositForm.network && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum deposit: {getSelectedNetwork(getSelectedCoin(depositForm.coin), depositForm.network)?.minDeposit} {depositForm.coin}
                      </p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={depositMutation.isPending}
                  >
                    {depositMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating Address...
                      </>
                    ) : (
                      "Generate Deposit Address"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  Deposit Address Generated
                </CardTitle>
                <CardDescription>Send exactly {depositForm.amount} {depositForm.coin} to the address below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Deposit Address</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input 
                        value={depositResult.deposit_address} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(depositResult.deposit_address)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <img 
                      src={depositResult.qr_code} 
                      alt="QR Code" 
                      className="w-32 h-32 border rounded-lg"
                    />
                  </div>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {depositResult.instructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={() => {
                    setDepositResult(null);
                    setDepositForm({ coin: '', amount: '', network: '' });
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Generate New Address
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>💸 Make a Withdrawal</CardTitle>
              <CardDescription>Withdraw funds from your account to an external wallet</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdrawal} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="withdraw-coin">Cryptocurrency</Label>
                    <Select value={withdrawalForm.coin} onValueChange={(value) => setWithdrawalForm(prev => ({ ...prev, coin: value, network: '' }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cryptocurrency" />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedCoins.map((coin) => (
                          <SelectItem key={coin.id} value={coin.symbol}>
                            <div className="flex items-center space-x-2">
                              <span>{coin.icon}</span>
                              <span>{coin.name} ({coin.symbol})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="withdraw-network">Network</Label>
                    <Select 
                      value={withdrawalForm.network} 
                      onValueChange={(value) => setWithdrawalForm(prev => ({ ...prev, network: value }))}
                      disabled={!withdrawalForm.coin}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSelectedCoin(withdrawalForm.coin)?.networks.map((network) => (
                          <SelectItem key={network.chainId} value={network.name}>
                            <div className="flex items-center justify-between w-full">
                              <span>{network.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                Fee: {network.withdrawalFee} {withdrawalForm.coin}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="withdraw-amount">Amount ({withdrawalForm.coin || 'Coin'})</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    step="0.00000001"
                    min={getSelectedNetwork(getSelectedCoin(withdrawalForm.coin), withdrawalForm.network)?.minWithdrawal || 0}
                    placeholder="Enter amount"
                    value={withdrawalForm.amount}
                    onChange={(e) => setWithdrawalForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                  {withdrawalForm.coin && withdrawalForm.network && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum withdrawal: {getSelectedNetwork(getSelectedCoin(withdrawalForm.coin), withdrawalForm.network)?.minWithdrawal} {withdrawalForm.coin} • 
                      Fee: {getSelectedNetwork(getSelectedCoin(withdrawalForm.coin), withdrawalForm.network)?.withdrawalFee} {withdrawalForm.coin}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="withdraw-address">Destination Address</Label>
                  <Input
                    id="withdraw-address"
                    placeholder="Enter destination wallet address"
                    value={withdrawalForm.address}
                    onChange={(e) => setWithdrawalForm(prev => ({ ...prev, address: e.target.value }))}
                    className="font-mono"
                  />
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Double-check the destination address - transactions cannot be reversed</li>
                      <li>Ensure the address matches the selected network</li>
                      <li>Withdrawals are processed within 1-2 hours</li>
                      <li>Network fees will be deducted from your balance</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={withdrawalMutation.isPending}
                >
                  {withdrawalMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Submit Withdrawal Request"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📊 Transaction History</CardTitle>
              <CardDescription>Complete history of your deposits and withdrawals</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Coin</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>TX Hash</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center">
                            {transaction.transaction_type === 'deposit' ? (
                              <ArrowDownLeft className="h-4 w-4 mr-2 text-green-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 mr-2 text-blue-600" />
                            )}
                            {transaction.transaction_type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                          </div>
                        </TableCell>
                        <TableCell>{transaction.coin}</TableCell>
                        <TableCell>{transaction.network}</TableCell>
                        <TableCell>{transaction.amount.toFixed(8)} {transaction.coin}</TableCell>
                        <TableCell>{transaction.fee.toFixed(8)} {transaction.coin}</TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {transaction.tx_hash ? (
                            <code className="text-xs">{transaction.tx_hash.slice(0, 10)}...</code>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <WalletIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No transactions found</p>
                  <p className="text-sm text-muted-foreground">Your deposit and withdrawal history will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

// Dynamic import로 SSR 문제 해결
import dynamic from 'next/dynamic';
export default dynamic(() => Promise.resolve(WalletPage), { ssr: false }); 