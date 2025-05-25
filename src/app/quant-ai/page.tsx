'use client';

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuantAIModule } from "@/components/QuantAIModule";
import { Brain, TrendingUp, Zap, Shield, BarChart3, Clock } from "lucide-react";

export default function QuantAIPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">QuantAI Trading</h1>
        <p className="text-muted-foreground">
          Advanced AI-powered trading algorithms for automated portfolio management
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* AI Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Success Rate</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87.3%</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days performance
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Return</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+24.7%</div>
              <p className="text-xs text-muted-foreground">
                Monthly average return
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Execution Speed</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.3ms</div>
              <p className="text-xs text-muted-foreground">
                Ultra-fast trade execution
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Low</div>
              <p className="text-xs text-muted-foreground">
                Conservative risk management
              </p>
            </CardContent>
          </Card>
        </div>

        {/* QuantAI Module */}
        <QuantAIModule />

        {/* AI Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Trading Features</CardTitle>
              <CardDescription>Advanced algorithmic trading capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Machine Learning Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Advanced neural networks analyze market patterns and predict price movements with high accuracy
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <BarChart3 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Multi-Asset Portfolio</h4>
                  <p className="text-sm text-muted-foreground">
                    Diversified trading across cryptocurrencies, forex, and commodities for optimal risk distribution
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">24/7 Market Monitoring</h4>
                  <p className="text-sm text-muted-foreground">
                    Continuous market surveillance and automated trading execution even while you sleep
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Risk Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Intelligent stop-loss and take-profit mechanisms to protect your capital
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How QuantAI Works</CardTitle>
              <CardDescription>Understanding our AI trading process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Data Collection</h4>
                  <p className="text-sm text-muted-foreground">
                    AI analyzes real-time market data, news sentiment, and technical indicators
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Pattern Recognition</h4>
                  <p className="text-sm text-muted-foreground">
                    Machine learning algorithms identify profitable trading opportunities
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Risk Assessment</h4>
                  <p className="text-sm text-muted-foreground">
                    Each trade is evaluated for risk-reward ratio before execution
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Automated Execution</h4>
                  <p className="text-sm text-muted-foreground">
                    Trades are executed automatically with optimal timing and position sizing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>AI Performance Analytics</CardTitle>
            <CardDescription>Real-time performance metrics and statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">Win Rate by Asset Class</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cryptocurrency</span>
                    <span className="text-sm font-medium">89.2%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '89.2%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Forex</span>
                    <span className="text-sm font-medium">85.7%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '85.7%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Commodities</span>
                    <span className="text-sm font-medium">87.1%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '87.1%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Monthly Returns</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">January</span>
                    <span className="text-sm font-medium text-green-600">+18.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">February</span>
                    <span className="text-sm font-medium text-green-600">+22.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">March</span>
                    <span className="text-sm font-medium text-green-600">+31.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">April</span>
                    <span className="text-sm font-medium text-green-600">+27.8%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Risk Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Max Drawdown</span>
                    <span className="text-sm font-medium">-3.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                    <span className="text-sm font-medium">2.84</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Volatility</span>
                    <span className="text-sm font-medium">12.4%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Beta</span>
                    <span className="text-sm font-medium">0.76</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card>
          <CardContent className="pt-6">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ Important Disclaimer
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Past performance does not guarantee future results. AI trading involves substantial risk and may result in significant losses. 
                The AI algorithms are designed to optimize returns but cannot eliminate market risk entirely. 
                Only invest funds you can afford to lose and consider your risk tolerance carefully.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 