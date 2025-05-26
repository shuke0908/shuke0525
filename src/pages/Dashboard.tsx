import React from "react";
import { AppLayout } from "@/components/layout";
import StatCard from "@/components/StatCard";
import TradingChart from "@/components/TradingChart";
import { QuickTradeModule } from "@/components/trading/QuickTradeModule";
import { FlashTradeModule } from "@/components/trading/FlashTradeModule";
import { QuantAIModule } from "@/components/QuantAIModule";
import ActiveInvestments from "@/components/ActiveInvestments";
import RecentTransactions from "@/components/RecentTransactions";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpFromLine, PieChart, ArrowDownToLine, Trophy, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation(['trading']);
  
  // Get transactions for dashboard
  const { data: transactionsData } = useQuery({
    queryKey: ['/api/transactions', 5],
    enabled: !!user,
  });

  return (
    <AppLayout 
      title={t('trading:dashboard.title')} 
      description={t('trading:dashboard.welcomeMessage', {
        name: user?.firstName || user?.email?.split('@')[0] || t('common:user')
      })}
      variant="user"
    >
      <div className="mb-6 flex justify-end">
        <Button asChild>
          <Link href="/flash-trade">
            <ArrowUpFromLine className="mr-2 h-4 w-4" /> {t('trading:dashboard.newTrade')}
          </Link>
        </Button>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Portfolio Value"
          value={`$${parseFloat(user?.balance || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={{ value: "2.4%", label: "vs yesterday", positive: true }}
          icon={PieChart}
          iconBgClass="bg-primary/20"
          iconColorClass="text-primary"
        />
        
        <StatCard
          title="Total Trades"
          value="145"
          trend={{ value: "12.8%", label: "this week", positive: true }}
          icon={ArrowDownToLine}
          iconBgClass="bg-secondary/20"
          iconColorClass="text-secondary"
        />
        
        <StatCard
          title="Win Rate"
          value="68.2%"
          trend={{ value: "3.1%", label: "this month", positive: false }}
          icon={Trophy}
          iconBgClass="bg-success/20"
          iconColorClass="text-success"
        />
        
        <StatCard
          title="Available Balance"
          value={`$${parseFloat(user?.balance || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Wallet}
          iconBgClass="bg-accent/20"
          iconColorClass="text-accent"
          actions={
            <div className="flex items-center mt-2">
              <Button variant="link" className="text-xs text-primary px-0" asChild>
                <Link href="/wallet">Deposit <ArrowDownToLine className="h-3 w-3 ml-1" /></Link>
              </Button>
              <span className="mx-2 text-muted-foreground">|</span>
              <Button variant="link" className="text-xs text-primary px-0" asChild>
                <Link href="/wallet">Withdraw <ArrowUpFromLine className="h-3 w-3 ml-1" /></Link>
              </Button>
            </div>
          }
        />
      </div>

      {/* Trading Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main trading area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Trading View Chart */}
          <TradingChart />
          
          {/* Quick Trade Module */}
          <QuickTradeModule />
          
          {/* Flash Trade Module */}
          <FlashTradeModule />
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quant AI Module */}
          <QuantAIModule />
          
          {/* Active Investments */}
          <ActiveInvestments />
          
          {/* Recent Transactions */}
          <RecentTransactions />
        </div>
      </div>
    </AppLayout>
  );
} 