'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gift, Star, Clock, CheckCircle, Trophy, Coins, Calendar, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

interface Bonus {
  id: string;
  type: 'welcome' | 'deposit' | 'referral' | 'trading' | 'loyalty';
  title: string;
  description: string;
  amount: number;
  currency: string;
  requirements: string[];
  status: 'available' | 'claimed' | 'expired' | 'locked';
  expiresAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  referralCode: string;
}

export default function BonusesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("available");

  // Get available bonuses
  const { data: bonusesData, isLoading: bonusesLoading } = useQuery({
    queryKey: ['bonuses'],
    queryFn: async () => {
      const response = await fetch('/api/bonuses');
      if (!response.ok) throw new Error('Failed to fetch bonuses');
      return response.json();
    },
  });

  // Get referral stats
  const { data: referralStats, isLoading: referralLoading } = useQuery({
    queryKey: ['referral', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/referral/stats');
      if (!response.ok) throw new Error('Failed to fetch referral stats');
      return response.json();
    },
  });

  // Claim bonus mutation
  const claimBonusMutation = useMutation({
    mutationFn: async (bonusId: string) => {
      const response = await fetch(`/api/bonuses/${bonusId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to claim bonus');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bonus Claimed!",
        description: `You've successfully claimed ${data.amount} ${data.currency}`,
      });
      queryClient.invalidateQueries({ queryKey: ['bonuses'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim bonus",
        variant: "destructive",
      });
    },
  });

  const bonuses: Bonus[] = bonusesData?.bonuses || [];
  const availableBonuses = bonuses.filter(b => b.status === 'available');
  const claimedBonuses = bonuses.filter(b => b.status === 'claimed');
  const expiredBonuses = bonuses.filter(b => b.status === 'expired');

  const handleClaimBonus = (bonusId: string) => {
    claimBonusMutation.mutate(bonusId);
  };

  const copyReferralCode = () => {
    if (referralStats?.referralCode) {
      navigator.clipboard.writeText(referralStats.referralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const getBonusIcon = (type: string) => {
    switch (type) {
      case 'welcome': return <Gift className="h-5 w-5" />;
      case 'deposit': return <Coins className="h-5 w-5" />;
      case 'referral': return <Users className="h-5 w-5" />;
      case 'trading': return <Trophy className="h-5 w-5" />;
      case 'loyalty': return <Star className="h-5 w-5" />;
      default: return <Gift className="h-5 w-5" />;
    }
  };

  const getBonusTypeColor = (type: string) => {
    switch (type) {
      case 'welcome': return 'bg-blue-100 text-blue-800';
      case 'deposit': return 'bg-green-100 text-green-800';
      case 'referral': return 'bg-purple-100 text-purple-800';
      case 'trading': return 'bg-orange-100 text-orange-800';
      case 'loyalty': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'claimed': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'locked': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  const BonusCard = ({ bonus }: { bonus: Bonus }) => (
    <Card key={bonus.id} className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getBonusIcon(bonus.type)}
            <div>
              <CardTitle className="text-lg">{bonus.title}</CardTitle>
              <CardDescription className="mt-1">{bonus.description}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge className={getBonusTypeColor(bonus.type)}>
              {bonus.type.charAt(0).toUpperCase() + bonus.type.slice(1)}
            </Badge>
            <Badge className={getStatusColor(bonus.status)}>
              {bonus.status.charAt(0).toUpperCase() + bonus.status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Bonus Amount */}
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(bonus.amount, bonus.currency)}
            </div>
            <div className="text-sm text-muted-foreground">Bonus Amount</div>
          </div>

          {/* Progress (if applicable) */}
          {bonus.progress !== undefined && bonus.maxProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{bonus.progress}/{bonus.maxProgress}</span>
              </div>
              <Progress value={(bonus.progress / bonus.maxProgress) * 100} />
            </div>
          )}

          {/* Requirements */}
          <div>
            <h4 className="font-medium mb-2">Requirements:</h4>
            <ul className="space-y-1">
              {bonus.requirements.map((req, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Expiry */}
          {bonus.expiresAt && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Expires: {new Date(bonus.expiresAt).toLocaleDateString()}</span>
            </div>
          )}

          {/* Action Button */}
          {bonus.status === 'available' && (
            <Button 
              onClick={() => handleClaimBonus(bonus.id)}
              disabled={claimBonusMutation.isPending}
              className="w-full"
            >
              {claimBonusMutation.isPending ? "Claiming..." : "Claim Bonus"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bonuses & Rewards</h1>
        <p className="text-muted-foreground">
          Earn bonuses and rewards through trading, referrals, and platform activities
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="claimed">Claimed</TabsTrigger>
          <TabsTrigger value="referral">Referral</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Bonuses</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{availableBonuses.length}</div>
                <p className="text-xs text-muted-foreground">Ready to claim</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${availableBonuses.reduce((sum, bonus) => sum + bonus.amount, 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Available to claim</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Claimed This Month</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{claimedBonuses.length}</div>
                <p className="text-xs text-muted-foreground">Bonuses claimed</p>
              </CardContent>
            </Card>
          </div>

          {/* Available Bonuses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableBonuses.length > 0 ? (
              availableBonuses.map(bonus => <BonusCard key={bonus.id} bonus={bonus} />)
            ) : (
              <div className="col-span-2 text-center py-8">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Available Bonuses</h3>
                <p className="text-muted-foreground">
                  Check back later for new bonus opportunities!
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="claimed" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {claimedBonuses.length > 0 ? (
              claimedBonuses.map(bonus => <BonusCard key={bonus.id} bonus={bonus} />)
            ) : (
              <div className="col-span-2 text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Claimed Bonuses</h3>
                <p className="text-muted-foreground">
                  Start claiming bonuses to see them here!
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="referral" className="space-y-6">
          {/* Referral Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referralStats?.totalReferrals || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referralStats?.activeReferrals || 0}</div>
                <p className="text-xs text-muted-foreground">Currently trading</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${referralStats?.totalEarnings?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">From referrals</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
                <Star className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">10%</div>
                <p className="text-xs text-muted-foreground">Per referral trade</p>
              </CardContent>
            </Card>
          </div>

          {/* Referral Code */}
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Code</CardTitle>
              <CardDescription>
                Share this code with friends to earn referral bonuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-lg">
                  {referralStats?.referralCode || 'Loading...'}
                </div>
                <Button onClick={copyReferralCode} variant="outline">
                  Copy Code
                </Button>
              </div>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium mb-2">How it works:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Share your referral code with friends</li>
                  <li>• They sign up and start trading</li>
                  <li>• You earn 10% commission on their trading fees</li>
                  <li>• They get a 5% bonus on their first deposit</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bonus History</CardTitle>
              <CardDescription>Complete history of all your bonuses and rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bonuses.length > 0 ? (
                  bonuses.map(bonus => (
                    <div key={bonus.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getBonusIcon(bonus.type)}
                        <div>
                          <p className="font-medium">{bonus.title}</p>
                          <p className="text-sm text-muted-foreground">{bonus.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(bonus.amount, bonus.currency)}
                        </div>
                        <Badge className={getStatusColor(bonus.status)} variant="outline">
                          {bonus.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Bonus History</h3>
                    <p className="text-muted-foreground">
                      Your bonus history will appear here once you start claiming bonuses.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 