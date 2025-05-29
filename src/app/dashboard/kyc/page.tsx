'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Shield, 
  Upload, 
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Camera,
  User,
  MapPin,
  Calendar,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

type KYCStatus = 'not_started' | 'pending' | 'approved' | 'rejected' | 'incomplete';

type KYCData = {
  status: KYCStatus;
  level: number;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  personalInfo?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  documents?: {
    idType: string;
    idNumber: string;
    idFrontUrl?: string;
    idBackUrl?: string;
    selfieUrl?: string;
    proofOfAddressUrl?: string;
  };
};

function KYCPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    address: '',
    city: '',
    postalCode: '',
    country: ''
  });
  
  const [documentInfo, setDocumentInfo] = useState({
    idType: '',
    idNumber: '',
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null,
    proofOfAddress: null as File | null
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Get KYC status
  const { data: kycData, isLoading } = useQuery({
    queryKey: ['kyc', 'status'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to access KYC');

      const response = await fetch('/api/kyc/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch KYC status');
      return response.json();
    },
    enabled: !!user,
  });

  const kyc: KYCData = kycData?.data || { status: 'not_started', level: 0 };

  // Submit personal info mutation
  const submitPersonalInfoMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to submit personal info');

      const response = await fetch('/api/kyc/personal-info', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit personal info');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ 개인정보 저장 완료",
        description: "개인정보가 성공적으로 저장되었습니다.",
      });
      setCurrentStep(2);
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
    },
    onError: (error: any) => {
      toast({
        title: "개인정보 저장 실패",
        description: error.message || "개인정보 저장에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  // Submit documents mutation
  const submitDocumentsMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to submit documents');

      const response = await fetch('/api/kyc/documents', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit documents');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ KYC 인증 제출 완료",
        description: "KYC 인증이 성공적으로 제출되었습니다. 관리자 검토를 기다려주세요.",
      });
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
    },
    onError: (error: any) => {
      toast({
        title: "KYC 제출 실패",
        description: error.message || "KYC 인증 제출에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const handlePersonalInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 필드 검증
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'nationality', 'address', 'city', 'country'];
    const missingFields = requiredFields.filter(field => !personalInfo[field as keyof typeof personalInfo]);
    
    if (missingFields.length > 0) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    submitPersonalInfoMutation.mutate(personalInfo);
  };

  const handleDocumentsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentInfo.idType || !documentInfo.idNumber) {
      toast({
        title: "입력 오류",
        description: "신분증 종류와 번호를 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    if (!documentInfo.idFront || !documentInfo.selfie) {
      toast({
        title: "파일 업로드 필요",
        description: "신분증 앞면과 셀피 사진을 업로드해주세요",
        variant: "destructive",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: "약관 동의 필요",
        description: "KYC 약관에 동의해주세요",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('idType', documentInfo.idType);
    formData.append('idNumber', documentInfo.idNumber);
    formData.append('idFront', documentInfo.idFront);
    if (documentInfo.idBack) formData.append('idBack', documentInfo.idBack);
    formData.append('selfie', documentInfo.selfie);
    if (documentInfo.proofOfAddress) formData.append('proofOfAddress', documentInfo.proofOfAddress);

    submitDocumentsMutation.mutate(formData);
  };

  const getStatusBadge = (status: KYCStatus) => {
    switch (status) {
      case 'not_started':
        return <Badge variant="secondary">미시작</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">검토중</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">승인완료</Badge>;
      case 'rejected':
        return <Badge variant="destructive">거부됨</Badge>;
      case 'incomplete':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">미완료</Badge>;
      default:
        return <Badge variant="secondary">알 수 없음</Badge>;
    }
  };

  const getProgressPercentage = () => {
    if (kyc.status === 'approved') return 100;
    if (kyc.status === 'pending') return 80;
    if (currentStep === 2 || kyc.personalInfo) return 50;
    if (currentStep === 1) return 25;
    return 0;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // 이미 승인된 경우
  if (kyc.status === 'approved') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold">KYC 인증</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span>KYC 인증 완료</span>
            </CardTitle>
            <CardDescription>
              귀하의 신원 인증이 성공적으로 완료되었습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>인증 레벨</Label>
                <p className="font-semibold">레벨 {kyc.level}</p>
              </div>
              <div>
                <Label>승인 일시</Label>
                <p className="font-semibold">
                  {kyc.approvedAt ? new Date(kyc.approvedAt).toLocaleString('ko-KR') : '-'}
                </p>
              </div>
            </div>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                KYC 인증이 완료되어 모든 거래 기능을 이용하실 수 있습니다.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 거부된 경우
  if (kyc.status === 'rejected') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold">KYC 인증</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <span>KYC 인증 거부</span>
            </CardTitle>
            <CardDescription>
              제출하신 KYC 인증이 거부되었습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>거부 사유:</strong> {kyc.rejectionReason || '제출된 서류에 문제가 있습니다.'}
              </AlertDescription>
            </Alert>
            
            <div>
              <Label>거부 일시</Label>
              <p className="font-semibold">
                {kyc.rejectedAt ? new Date(kyc.rejectedAt).toLocaleString('ko-KR') : '-'}
              </p>
            </div>

            <Button 
              onClick={() => {
                setCurrentStep(1);
                queryClient.invalidateQueries({ queryKey: ['kyc'] });
              }}
              className="w-full"
            >
              다시 인증하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">KYC 인증</h1>
        {getStatusBadge(kyc.status)}
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>인증 진행 상황</CardTitle>
          <CardDescription>
            신원 인증을 위해 아래 단계를 완료해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={getProgressPercentage()} className="w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                <User className="h-5 w-5" />
                <span className="font-semibold">1. 개인정보</span>
                {kyc.personalInfo && <CheckCircle className="h-4 w-4 text-green-600" />}
              </div>
              <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                <FileText className="h-5 w-5" />
                <span className="font-semibold">2. 서류 제출</span>
                {kyc.documents && <CheckCircle className="h-4 w-4 text-green-600" />}
              </div>
              <div className={`flex items-center space-x-2 ${kyc.status === 'approved' ? 'text-green-600' : 'text-muted-foreground'}`}>
                <Shield className="h-5 w-5" />
                <span className="font-semibold">3. 검토 완료</span>
                {kyc.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Personal Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-6 w-6" />
              <span>1단계: 개인정보 입력</span>
            </CardTitle>
            <CardDescription>
              정확한 개인정보를 입력해주세요. 제출된 서류와 일치해야 합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">이름 *</Label>
                  <Input
                    id="firstName"
                    placeholder="이름을 입력하세요"
                    value={personalInfo.firstName}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">성 *</Label>
                  <Input
                    id="lastName"
                    placeholder="성을 입력하세요"
                    value={personalInfo.lastName}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">생년월일 *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={personalInfo.dateOfBirth}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">국적 *</Label>
                  <Select 
                    value={personalInfo.nationality} 
                    onValueChange={(value) => setPersonalInfo(prev => ({ ...prev, nationality: value }))}
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
                <Label htmlFor="address">주소 *</Label>
                <Input
                  id="address"
                  placeholder="상세 주소를 입력하세요"
                  value={personalInfo.address}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">도시 *</Label>
                  <Input
                    id="city"
                    placeholder="도시명"
                    value={personalInfo.city}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, city: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">우편번호</Label>
                  <Input
                    id="postalCode"
                    placeholder="우편번호"
                    value={personalInfo.postalCode}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">국가 *</Label>
                  <Select 
                    value={personalInfo.country} 
                    onValueChange={(value) => setPersonalInfo(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="국가 선택" />
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
                disabled={submitPersonalInfoMutation.isPending}
                className="w-full"
              >
                {submitPersonalInfoMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    다음 단계
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Document Upload */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span>2단계: 서류 제출</span>
            </CardTitle>
            <CardDescription>
              신분증과 셀피 사진을 업로드해주세요. 모든 정보가 명확하게 보여야 합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDocumentsSubmit} className="space-y-6">
              {/* ID Type and Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idType">신분증 종류 *</Label>
                  <Select 
                    value={documentInfo.idType} 
                    onValueChange={(value) => setDocumentInfo(prev => ({ ...prev, idType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="신분증 종류 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passport">여권</SelectItem>
                      <SelectItem value="id_card">주민등록증</SelectItem>
                      <SelectItem value="driver_license">운전면허증</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idNumber">신분증 번호 *</Label>
                  <Input
                    id="idNumber"
                    placeholder="신분증 번호를 입력하세요"
                    value={documentInfo.idNumber}
                    onChange={(e) => setDocumentInfo(prev => ({ ...prev, idNumber: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Document Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="idFront">신분증 앞면 * (필수)</Label>
                  <Input
                    id="idFront"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDocumentInfo(prev => ({ 
                      ...prev, 
                      idFront: e.target.files?.[0] || null 
                    }))}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    신분증 앞면이 명확하게 보이는 사진을 업로드하세요
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idBack">신분증 뒷면 (선택)</Label>
                  <Input
                    id="idBack"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDocumentInfo(prev => ({ 
                      ...prev, 
                      idBack: e.target.files?.[0] || null 
                    }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    뒷면이 있는 경우 업로드하세요
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selfie">셀피 사진 * (필수)</Label>
                  <Input
                    id="selfie"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDocumentInfo(prev => ({ 
                      ...prev, 
                      selfie: e.target.files?.[0] || null 
                    }))}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    신분증을 들고 있는 셀피 사진을 업로드하세요
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proofOfAddress">주소 증명서 (선택)</Label>
                  <Input
                    id="proofOfAddress"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setDocumentInfo(prev => ({ 
                      ...prev, 
                      proofOfAddress: e.target.files?.[0] || null 
                    }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    공과금 고지서, 은행 명세서 등
                  </p>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="kycTerms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <Label htmlFor="kycTerms" className="text-sm">
                  KYC 인증 약관 및 개인정보 처리방침에 동의합니다
                </Label>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  제출된 서류는 신원 확인 목적으로만 사용되며, 관련 법규에 따라 안전하게 보관됩니다.
                </AlertDescription>
              </Alert>

              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1"
                >
                  이전 단계
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitDocumentsMutation.isPending || !agreedToTerms}
                  className="flex-1"
                >
                  {submitDocumentsMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      제출 중...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      KYC 제출
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending Status */}
      {kyc.status === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-6 w-6 text-yellow-600" />
              <span>검토 중</span>
            </CardTitle>
            <CardDescription>
              제출하신 KYC 인증을 검토하고 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                일반적으로 1-3 영업일 내에 검토가 완료됩니다. 추가 서류가 필요한 경우 별도로 연락드리겠습니다.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4">
              <Label>제출 일시</Label>
              <p className="font-semibold">
                {kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleString('ko-KR') : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-blue-500" />
            <span>KYC 인증 안내</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">필요한 서류</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>정부 발급 신분증 (여권, 주민등록증, 운전면허증)</li>
                <li>신분증을 들고 있는 셀피 사진</li>
                <li>주소 증명서 (선택사항)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">사진 촬영 팁</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>충분한 조명에서 촬영</li>
                <li>모든 정보가 명확하게 보이도록</li>
                <li>반사나 그림자 없이</li>
                <li>고해상도로 촬영</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default KYCPage; 