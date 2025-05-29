'use client';

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickTradeModule } from "@/components/trading/QuickTradeModule";
import { TrendingUp, BarChart3, Clock, DollarSign } from "lucide-react";
import Layout from "@/components/layout/Layout";

export default function QuickTradePage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">일반 거래</h1>
          <p className="text-muted-foreground">
            시장 선택, 실시간 가격 피드, 거래 폼, 주문 유형, 실시간 차트 분석 도구
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Instant Execution</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">&lt; 1s</div>
                <p className="text-xs text-muted-foreground">
                  Lightning-fast trade execution
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leverage</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1:100</div>
                <p className="text-xs text-muted-foreground">
                  Maximum leverage available
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Min Trade</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$1</div>
                <p className="text-xs text-muted-foreground">
                  Start trading with just $1
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Markets</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">50+</div>
                <p className="text-xs text-muted-foreground">
                  Crypto, Forex, and Commodities
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Trade Module */}
          <QuickTradeModule />

          {/* Trading Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>How Quick Trade Works</CardTitle>
                <CardDescription>Simple steps to start trading</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Select Asset</h4>
                    <p className="text-sm text-muted-foreground">
                      Choose from 50+ trading pairs including crypto, forex, and commodities
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Set Parameters</h4>
                    <p className="text-sm text-muted-foreground">
                      Define your trade amount, leverage, and direction (Buy/Sell)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Execute Trade</h4>
                    <p className="text-sm text-muted-foreground">
                      Click to execute and watch your trade in real-time
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">Manage Position</h4>
                    <p className="text-sm text-muted-foreground">
                      Monitor and close your position when you're ready to take profits
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Management</CardTitle>
                <CardDescription>Important trading guidelines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    ⚠️ High Risk Warning
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Trading with leverage involves substantial risk and may result in the loss of your entire investment. 
                    Only trade with money you can afford to lose.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Risk Management Tips</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                      <li>• Start with small amounts to learn the platform</li>
                      <li>• Use stop-loss orders to limit potential losses</li>
                      <li>• Never risk more than 2-5% of your account per trade</li>
                      <li>• Diversify across different assets and timeframes</li>
                      <li>• Keep emotions in check and stick to your strategy</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Market Overview</CardTitle>
              <CardDescription>Current market conditions and popular assets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">BTC/USD</span>
                    <span className="text-sm text-green-600">+2.4%</span>
                  </div>
                  <div className="text-2xl font-bold">$41,255.78</div>
                  <div className="text-sm text-muted-foreground">Bitcoin</div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">ETH/USD</span>
                    <span className="text-sm text-green-600">+1.8%</span>
                  </div>
                  <div className="text-2xl font-bold">$2,456.32</div>
                  <div className="text-sm text-muted-foreground">Ethereum</div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">EUR/USD</span>
                    <span className="text-sm text-red-600">-0.3%</span>
                  </div>
                  <div className="text-2xl font-bold">1.0842</div>
                  <div className="text-sm text-muted-foreground">Euro Dollar</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 