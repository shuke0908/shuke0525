'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Key,
  Globe,
  Bell,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  Camera,
  Upload
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  language?: string;
  avatarUrl?: string;
  vipLevel: number;
  kycStatus: string;
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  tradingNotifications: boolean;
  createdAt: string;
  lastLoginAt?: string;
};

type SecuritySettings = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  withdrawalPassword: string;
  newWithdrawalPassword: string;
  confirmWithdrawalPassword: string;
};

function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({});
  const [securityData, setSecurityData] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    withdrawalPassword: '',
    newWithdrawalPassword: '',
    confirmWithdrawalPassword: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Get user profile
  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ['profile', 'user'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to access profile');

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    enabled: !!user,
    onSuccess: (data) => {
      setProfileData(data.data);
    }
  });

  const profile: UserProfile = profileResponse?.data || {};

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to update profile');

      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ 프로필 업데이트 완료",
        description: "프로필 정보가 성공적으로 업데이트되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "프로필 업데이트 실패",
        description: error.message || "프로필 업데이트에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to update password');

      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update password');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ 비밀번호 변경 완료",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        withdrawalPassword: '',
        newWithdrawalPassword: '',
        confirmWithdrawalPassword: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "비밀번호 변경 실패",
        description: error.message || "비밀번호 변경에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to upload avatar');

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload avatar');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ 프로필 사진 업데이트 완료",
        description: "프로필 사진이 성공적으로 업데이트되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setAvatarFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "프로필 사진 업로드 실패",
        description: error.message || "프로필 사진 업로드에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다",
        variant: "destructive",
      });
      return;
    }

    if (securityData.newPassword.length < 8) {
      toast({
        title: "비밀번호 길이 부족",
        description: "비밀번호는 최소 8자 이상이어야 합니다",
        variant: "destructive",
      });
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword: securityData.currentPassword,
      newPassword: securityData.newPassword
    });
  };

  const handleWithdrawalPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (securityData.newWithdrawalPassword !== securityData.confirmWithdrawalPassword) {
      toast({
        title: "출금 비밀번호 불일치",
        description: "새 출금 비밀번호와 확인 비밀번호가 일치하지 않습니다",
        variant: "destructive",
      });
      return;
    }

    updatePasswordMutation.mutate({
      currentWithdrawalPassword: securityData.withdrawalPassword,
      newWithdrawalPassword: securityData.newWithdrawalPassword,
      type: 'withdrawal'
    });
  };

  const handleAvatarUpload = () => {
    if (avatarFile) {
      uploadAvatarMutation.mutate(avatarFile);
    }
  };

  const getVipBadge = (level: number) => {
    const colors = {
      1: "bg-gray-500",
      2: "bg-green-500", 
      3: "bg-blue-500",
      4: "bg-purple-500",
      5: "bg-yellow-500"
    };
    return (
      <Badge className={`${colors[level as keyof typeof colors] || colors[1]} text-white`}>
        VIP {level}
      </Badge>
    );
  };

  const getKycBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600 text-white">인증완료</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">검토중</Badge>;
      case 'rejected':
        return <Badge variant="destructive">거부됨</Badge>;
      default:
        return <Badge variant="secondary">미인증</Badge>;
    }
  };

  if (isLoading) {
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
        <User className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">회원정보 관리</h1>
      </div>

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>프로필 요약</span>
            <div className="flex space-x-2">
              {getVipBadge(profile.vipLevel || 1)}
              {getKycBadge(profile.kycStatus || 'not_verified')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatarUrl} alt="Profile" />
              <AvatarFallback className="text-lg">
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">
                {profile.firstName} {profile.lastName}
                {profile.nickname && <span className="text-muted-foreground ml-2">({profile.nickname})</span>}
              </h3>
              <p className="text-muted-foreground">{profile.email}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                <span>가입일: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('ko-KR') : '-'}</span>
                <span>최근 로그인: {profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString('ko-KR') : '-'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">기본정보</TabsTrigger>
          <TabsTrigger value="security">보안설정</TabsTrigger>
          <TabsTrigger value="preferences">환경설정</TabsTrigger>
          <TabsTrigger value="notifications">알림설정</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>프로필 사진</CardTitle>
              <CardDescription>프로필 사진을 변경할 수 있습니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatarUrl} alt="Profile" />
                  <AvatarFallback className="text-xl">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    className="w-64"
                  />
                  <Button 
                    onClick={handleAvatarUpload}
                    disabled={!avatarFile || uploadAvatarMutation.isPending}
                    size="sm"
                  >
                    {uploadAvatarMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        업로드 중...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        사진 업로드
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>개인 정보를 수정할 수 있습니다</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">이름</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName || profile.firstName || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">성</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName || profile.lastName || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nickname">닉네임</Label>
                    <Input
                      id="nickname"
                      placeholder="닉네임을 입력하세요"
                      value={profileData.nickname || profile.nickname || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, nickname: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">전화번호</Label>
                    <Input
                      id="phone"
                      placeholder="전화번호를 입력하세요"
                      value={profileData.phone || profile.phone || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">이메일 (변경 불가)</Label>
                  <Input
                    id="email"
                    value={profile.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">생년월일</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profileData.dateOfBirth || profile.dateOfBirth || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">국적</Label>
                    <Select 
                      value={profileData.nationality || profile.nationality || ''} 
                      onValueChange={(value) => setProfileData(prev => ({ ...prev, nationality: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="국적을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KR">대한민국</SelectItem>
                        <SelectItem value="US">미국</SelectItem>
                        <SelectItem value="JP">일본</SelectItem>
                        <SelectItem value="CN">중국</SelectItem>
                        <SelectItem value="OTHER">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">주소</Label>
                  <Input
                    id="address"
                    placeholder="주소를 입력하세요"
                    value={profileData.address || profile.address || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">도시</Label>
                    <Input
                      id="city"
                      placeholder="도시를 입력하세요"
                      value={profileData.city || profile.city || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">국가</Label>
                    <Select 
                      value={profileData.country || profile.country || ''} 
                      onValueChange={(value) => setProfileData(prev => ({ ...prev, country: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="국가를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KR">대한민국</SelectItem>
                        <SelectItem value="US">미국</SelectItem>
                        <SelectItem value="JP">일본</SelectItem>
                        <SelectItem value="CN">중국</SelectItem>
                        <SelectItem value="OTHER">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  className="w-full"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      업데이트 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      프로필 업데이트
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>로그인 비밀번호 변경</CardTitle>
              <CardDescription>계정 보안을 위해 정기적으로 비밀번호를 변경하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">현재 비밀번호</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={securityData.currentPassword}
                      onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">새 비밀번호</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={securityData.newPassword}
                      onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    최소 8자, 영문, 숫자, 특수문자 포함 권장
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={securityData.confirmPassword}
                    onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={updatePasswordMutation.isPending}
                  className="w-full"
                >
                  {updatePasswordMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      변경 중...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      비밀번호 변경
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>출금 비밀번호 설정</CardTitle>
              <CardDescription>출금 시 사용할 별도의 비밀번호를 설정하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdrawalPasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawalPassword">현재 출금 비밀번호</Label>
                  <Input
                    id="withdrawalPassword"
                    type="password"
                    placeholder="현재 출금 비밀번호 (없으면 공백)"
                    value={securityData.withdrawalPassword}
                    onChange={(e) => setSecurityData(prev => ({ ...prev, withdrawalPassword: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newWithdrawalPassword">새 출금 비밀번호</Label>
                  <Input
                    id="newWithdrawalPassword"
                    type="password"
                    value={securityData.newWithdrawalPassword}
                    onChange={(e) => setSecurityData(prev => ({ ...prev, newWithdrawalPassword: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmWithdrawalPassword">새 출금 비밀번호 확인</Label>
                  <Input
                    id="confirmWithdrawalPassword"
                    type="password"
                    value={securityData.confirmWithdrawalPassword}
                    onChange={(e) => setSecurityData(prev => ({ ...prev, confirmWithdrawalPassword: e.target.value }))}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={updatePasswordMutation.isPending}
                  className="w-full"
                >
                  {updatePasswordMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      설정 중...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      출금 비밀번호 설정
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2단계 인증 (2FA)</CardTitle>
              <CardDescription>계정 보안을 강화하기 위해 2단계 인증을 설정하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Google Authenticator</h4>
                  <p className="text-sm text-muted-foreground">
                    {profile.twoFactorEnabled ? '2단계 인증이 활성화되어 있습니다' : '2단계 인증이 비활성화되어 있습니다'}
                  </p>
                </div>
                <Switch 
                  checked={profile.twoFactorEnabled || false}
                  onCheckedChange={(checked) => {
                    // TODO: Implement 2FA toggle
                    toast({
                      title: "개발 중",
                      description: "2단계 인증 기능은 현재 개발 중입니다",
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>언어 및 지역 설정</CardTitle>
              <CardDescription>사용할 언어와 시간대를 설정하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">언어</Label>
                  <Select 
                    value={profileData.language || profile.language || 'ko'} 
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">시간대</Label>
                  <Select 
                    value={profileData.timezone || profile.timezone || 'Asia/Seoul'} 
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Seoul">서울 (UTC+9)</SelectItem>
                      <SelectItem value="America/New_York">뉴욕 (UTC-5)</SelectItem>
                      <SelectItem value="Europe/London">런던 (UTC+0)</SelectItem>
                      <SelectItem value="Asia/Tokyo">도쿄 (UTC+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>알림 설정</CardTitle>
              <CardDescription>받고 싶은 알림을 선택하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">이메일 알림</h4>
                  <p className="text-sm text-muted-foreground">
                    중요한 계정 활동에 대한 이메일 알림
                  </p>
                </div>
                <Switch 
                  checked={profileData.emailNotifications ?? profile.emailNotifications ?? true}
                  onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, emailNotifications: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">SMS 알림</h4>
                  <p className="text-sm text-muted-foreground">
                    보안 관련 SMS 알림
                  </p>
                </div>
                <Switch 
                  checked={profileData.smsNotifications ?? profile.smsNotifications ?? false}
                  onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, smsNotifications: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">거래 알림</h4>
                  <p className="text-sm text-muted-foreground">
                    거래 체결 및 포지션 변동 알림
                  </p>
                </div>
                <Switch 
                  checked={profileData.tradingNotifications ?? profile.tradingNotifications ?? true}
                  onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, tradingNotifications: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProfilePage; 