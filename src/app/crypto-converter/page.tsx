'use client';

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, TrendingUp, TrendingDown, RefreshCw, Calculator, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CryptoCurrency {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon?: string;
}

interface ConversionRate {
  from: string;
  to: string;
  rate: number;
  timestamp: string;
}

export default function CryptoConverterPage() {
  const { toast } = useToast();
  const [fromCurrency, setFromCurrency] = useState("BTC");
  const [toCurrency, setToCurrency] = useState("USD");
  const [amount, setAmount] = useState("1");
  const [convertedAmount, setConvertedAmount] = useState("0");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Get cryptocurrency prices
  const { data: cryptoData, isLoading: cryptoLoading, refetch: refetchCrypto } = useQuery({
    queryKey: ['crypto', 'prices'],
    queryFn: async () => {
      const response = await fetch('/api/crypto/prices');
      if (!response.ok) throw new Error('Failed to fetch crypto prices');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get conversion rate
  const { data: conversionData, isLoading: conversionLoading, refetch: refetchConversion } = useQuery({
    queryKey: ['crypto', 'conversion', fromCurrency, toCurrency],
    queryFn: async () => {
      const response = await fetch(`/api/crypto/convert?from=${fromCurrency}&to=${toCurrency}`);
      if (!response.ok) throw new Error('Failed to fetch conversion rate');
      return response.json();
    },
    enabled: !!(fromCurrency && toCurrency),
  });

  const cryptocurrencies: CryptoCurrency[] = cryptoData?.currencies || [
    { symbol: "BTC", name: "Bitcoin", price: 45000, change24h: 2.5 },
    { symbol: "ETH", name: "Ethereum", price: 3200, change24h: -1.2 },
    { symbol: "BNB", name: "Binance Coin", price: 320, change24h: 0.8 },
    { symbol: "XRP", name: "Ripple", price: 0.65, change24h: 3.2 },
    { symbol: "SOL", name: "Solana", price: 95, change24h: -2.1 },
    { symbol: "ADA", name: "Cardano", price: 0.45, change24h: 1.5 },
    { symbol: "AVAX", name: "Avalanche", price: 28, change24h: -0.5 },
    { symbol: "DOT", name: "Polkadot", price: 7.2, change24h: 2.8 },
  ];

  const fiatCurrencies = [
    { symbol: "USD", name: "US Dollar" },
    { symbol: "EUR", name: "Euro" },
    { symbol: "GBP", name: "British Pound" },
    { symbol: "JPY", name: "Japanese Yen" },
    { symbol: "KRW", name: "Korean Won" },
    { symbol: "CNY", name: "Chinese Yuan" },
  ];

  const allCurrencies = [...cryptocurrencies, ...fiatCurrencies];

  useEffect(() => {
    if (conversionData?.rate && amount) {
      const result = parseFloat(amount) * conversionData.rate;
      setConvertedAmount(result.toFixed(8));
      setLastUpdated(new Date());
    }
  }, [conversionData, amount]);

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setAmount(convertedAmount);
  };

  const handleRefresh = () => {
    refetchCrypto();
    refetchConversion();
    toast({
      title: "Rates Updated",
      description: "Cryptocurrency rates have been refreshed",
    });
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === "USD") {
      return `$${price.toLocaleString()}`;
    } else if (currency === "EUR") {
      return `€${price.toLocaleString()}`;
    } else if (currency === "GBP") {
      return `£${price.toLocaleString()}`;
    } else if (currency === "JPY") {
      return `¥${price.toLocaleString()}`;
    } else if (currency === "KRW") {
      return `₩${price.toLocaleString()}`;
    } else if (currency === "CNY") {
      return `¥${price.toLocaleString()}`;
    }
    return price.toLocaleString();
  };

  const getCurrencyName = (symbol: string) => {
    const currency = allCurrencies.find(c => c.symbol === symbol);
    return currency ? currency.name : symbol;
  };

  const getCryptoPrice = (symbol: string) => {
    const crypto = cryptocurrencies.find(c => c.symbol === symbol);
    return crypto ? crypto.price : 0;
  };

  const getCryptoChange = (symbol: string) => {
    const crypto = cryptocurrencies.find(c => c.symbol === symbol);
    return crypto ? crypto.change24h : 0;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Crypto Converter</h1>
        <p className="text-muted-foreground">
          Convert between cryptocurrencies and fiat currencies with real-time rates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Converter */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Currency Converter
                </CardTitle>
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <CardDescription>
                Real-time cryptocurrency and fiat currency conversion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* From Currency */}
              <div className="space-y-2">
                <Label htmlFor="fromAmount">From</Label>
                <div className="flex space-x-2">
                  <Input
                    id="fromAmount"
                    type="number"
                    step="any"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={fromCurrency} onValueChange={setFromCurrency}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="font-medium text-sm text-muted-foreground px-2 py-1">
                        Cryptocurrencies
                      </div>
                      {cryptocurrencies.map((crypto) => (
                        <SelectItem key={crypto.symbol} value={crypto.symbol}>
                          <div className="flex items-center justify-between w-full">
                            <span>{crypto.symbol}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {crypto.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      <div className="font-medium text-sm text-muted-foreground px-2 py-1 border-t mt-1 pt-2">
                        Fiat Currencies
                      </div>
                      {fiatCurrencies.map((fiat) => (
                        <SelectItem key={fiat.symbol} value={fiat.symbol}>
                          <div className="flex items-center justify-between w-full">
                            <span>{fiat.symbol}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {fiat.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {cryptocurrencies.find(c => c.symbol === fromCurrency) && (
                  <div className="text-sm text-muted-foreground">
                    Current price: {formatPrice(getCryptoPrice(fromCurrency), "USD")}
                    <span className={`ml-2 ${getCryptoChange(fromCurrency) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {getCryptoChange(fromCurrency) >= 0 ? '+' : ''}{getCryptoChange(fromCurrency).toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleSwapCurrencies}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>

              {/* To Currency */}
              <div className="space-y-2">
                <Label htmlFor="toAmount">To</Label>
                <div className="flex space-x-2">
                  <Input
                    id="toAmount"
                    type="text"
                    value={convertedAmount}
                    readOnly
                    className="flex-1 bg-muted"
                  />
                  <Select value={toCurrency} onValueChange={setToCurrency}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="font-medium text-sm text-muted-foreground px-2 py-1">
                        Cryptocurrencies
                      </div>
                      {cryptocurrencies.map((crypto) => (
                        <SelectItem key={crypto.symbol} value={crypto.symbol}>
                          <div className="flex items-center justify-between w-full">
                            <span>{crypto.symbol}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {crypto.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      <div className="font-medium text-sm text-muted-foreground px-2 py-1 border-t mt-1 pt-2">
                        Fiat Currencies
                      </div>
                      {fiatCurrencies.map((fiat) => (
                        <SelectItem key={fiat.symbol} value={fiat.symbol}>
                          <div className="flex items-center justify-between w-full">
                            <span>{fiat.symbol}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {fiat.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {cryptocurrencies.find(c => c.symbol === toCurrency) && (
                  <div className="text-sm text-muted-foreground">
                    Current price: {formatPrice(getCryptoPrice(toCurrency), "USD")}
                    <span className={`ml-2 ${getCryptoChange(toCurrency) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {getCryptoChange(toCurrency) >= 0 ? '+' : ''}{getCryptoChange(toCurrency).toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Conversion Info */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Exchange Rate</span>
                  <span className="text-sm text-muted-foreground">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-lg font-bold">
                  1 {fromCurrency} = {conversionData?.rate?.toFixed(8) || '0'} {toCurrency}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {getCurrencyName(fromCurrency)} to {getCurrencyName(toCurrency)}
                </div>
              </div>

              {/* Quick Amounts */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Quick Convert</Label>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '10', '100', '1000'].map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(quickAmount)}
                    >
                      {quickAmount}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Overview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Market Overview
              </CardTitle>
              <CardDescription>Top cryptocurrency prices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cryptocurrencies.slice(0, 6).map((crypto) => (
                  <div key={crypto.symbol} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">{crypto.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{crypto.symbol}</div>
                        <div className="text-xs text-muted-foreground">{crypto.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">
                        {formatPrice(crypto.price, "USD")}
                      </div>
                      <div className={`text-xs flex items-center ${
                        crypto.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {crypto.change24h >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Popular Conversions */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Conversions</CardTitle>
              <CardDescription>Frequently used currency pairs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { from: 'BTC', to: 'USD' },
                  { from: 'ETH', to: 'USD' },
                  { from: 'BTC', to: 'EUR' },
                  { from: 'ETH', to: 'BTC' },
                  { from: 'BNB', to: 'USD' },
                ].map((pair, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setFromCurrency(pair.from);
                      setToCurrency(pair.to);
                      setAmount('1');
                    }}
                  >
                    <span className="font-medium">{pair.from}</span>
                    <ArrowUpDown className="h-3 w-3 mx-2" />
                    <span className="font-medium">{pair.to}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conversion History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversions</CardTitle>
              <CardDescription>Your conversion history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No History Yet</h3>
                <p className="text-muted-foreground text-sm">
                  Your conversion history will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 