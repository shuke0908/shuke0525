'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, CheckCircle, Clock, XCircle, FileText, Camera, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { kycApi } from "@/lib/api-client-unified";

type KycDocument = {
  id: number;
  type: 'identity' | 'address' | 'selfie';
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  rejectionReason?: string;
};

type KycStatus = {
  status: 'not_started' | 'pending' | 'approved' | 'rejected';
  documents: KycDocument[];
};

export default function KycVerificationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
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

  // Get KYC status
  const { data: kycData, isLoading: kycLoading } = useQuery({
    queryKey: ['kyc', 'status'],
    queryFn: () => kycApi.getKycStatus(),
  });

  const kycStatus: KycStatus = kycData || { status: 'not_started', documents: [] };

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, type }: { file: File; type: string }) => 
      kycApi.uploadKycDocument(file, type),
    onSuccess: () => {
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully and is under review.",
      });
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  // Submit KYC documents mutation
  const submitMutation = useMutation({
    mutationFn: (data: any) => kycApi.submitKycDocuments(data),
    onSuccess: () => {
      toast({
        title: "KYC Submitted",
        description: "Your KYC documents have been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit KYC documents",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (file: File, type: string) => {
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, or PDF file",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ file, type });
  };

  const handleSubmitPersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(personalInfo);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
      not_started: "outline"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getDocumentByType = (type: string) => {
    return kycStatus.documents.find(doc => doc.type === type);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">KYC Verification</h1>
        <p className="text-muted-foreground">
          Complete your identity verification to unlock all platform features
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KYC Status Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verification Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(kycStatus.status)}
                {getStatusBadge(kycStatus.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                {kycStatus.status === 'approved' && "Your account is fully verified"}
                {kycStatus.status === 'pending' && "Your documents are under review"}
                {kycStatus.status === 'rejected' && "Some documents need to be resubmitted"}
                {kycStatus.status === 'not_started' && "Start your verification process"}
              </p>
            </CardContent>
          </Card>

          {/* Verification Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Process</CardTitle>
              <CardDescription>Complete these steps to verify your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Personal Information</h4>
                  <p className="text-sm text-muted-foreground">
                    Provide your basic personal details and contact information
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Identity Document</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload a clear photo of your government-issued ID (passport, driver's license, or national ID)
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Proof of Address</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload a recent utility bill, bank statement, or official document showing your address
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Selfie Verification</h4>
                  <p className="text-sm text-muted-foreground">
                    Take a clear selfie holding your ID document for final verification
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Benefits</CardTitle>
              <CardDescription>Unlock these features after completing KYC</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Higher withdrawal limits</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Access to all trading features</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Enhanced account security</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Priority customer support</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Provide your personal details for verification</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPersonalInfo} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      value={personalInfo.firstName}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      value={personalInfo.lastName}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={personalInfo.dateOfBirth}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Select value={personalInfo.nationality} onValueChange={(value) => setPersonalInfo(prev => ({ ...prev, nationality: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="JP">Japan</SelectItem>
                        <SelectItem value="KR">South Korea</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter your full address"
                    value={personalInfo.address}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Enter your city"
                      value={personalInfo.city}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, city: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      placeholder="Enter postal code"
                      value={personalInfo.postalCode}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select value={personalInfo.country} onValueChange={(value) => setPersonalInfo(prev => ({ ...prev, country: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="JP">Japan</SelectItem>
                        <SelectItem value="KR">South Korea</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? "Saving..." : "Save Personal Information"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          {/* Identity Document */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Identity Document
              </CardTitle>
              <CardDescription>
                Upload a clear photo of your government-issued ID
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getDocumentByType('identity') ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(getDocumentByType('identity')!.status)}
                      <div>
                        <p className="font-medium">Identity Document</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded on {new Date(getDocumentByType('identity')!.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(getDocumentByType('identity')!.status)}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Click to upload or drag and drop
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'identity');
                      }}
                      className="hidden"
                      id="identity-upload"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('identity-upload')?.click()}
                      disabled={uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? "Uploading..." : "Choose File"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address Document */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Proof of Address
              </CardTitle>
              <CardDescription>
                Upload a recent utility bill or bank statement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getDocumentByType('address') ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(getDocumentByType('address')!.status)}
                      <div>
                        <p className="font-medium">Address Document</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded on {new Date(getDocumentByType('address')!.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(getDocumentByType('address')!.status)}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Click to upload or drag and drop
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'address');
                      }}
                      className="hidden"
                      id="address-upload"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('address-upload')?.click()}
                      disabled={uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? "Uploading..." : "Choose File"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selfie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Selfie Verification
              </CardTitle>
              <CardDescription>
                Take a clear selfie holding your ID document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getDocumentByType('selfie') ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(getDocumentByType('selfie')!.status)}
                      <div>
                        <p className="font-medium">Selfie Verification</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded on {new Date(getDocumentByType('selfie')!.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(getDocumentByType('selfie')!.status)}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Take a selfie holding your ID document
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'selfie');
                      }}
                      className="hidden"
                      id="selfie-upload"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('selfie-upload')?.click()}
                      disabled={uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? "Uploading..." : "Take Selfie"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription>Track the progress of your KYC verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(kycStatus.status)}
                    <div>
                      <p className="font-medium">Overall Status</p>
                      <p className="text-sm text-muted-foreground">
                        Current verification status
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(kycStatus.status)}
                </div>

                {kycStatus.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(doc.status)}
                      <div>
                        <p className="font-medium capitalize">{doc.type} Document</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                        {doc.rejectionReason && (
                          <p className="text-sm text-red-600 mt-1">
                            Reason: {doc.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>
                ))}

                {kycStatus.documents.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No documents uploaded yet</p>
                    <Button 
                      onClick={() => setActiveTab("documents")} 
                      className="mt-2"
                    >
                      Start Uploading Documents
                    </Button>
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