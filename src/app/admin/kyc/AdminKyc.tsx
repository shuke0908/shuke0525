import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Eye, Loader2, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import type { KycDocument, KycResponse, User } from "@/lib/api-types";
import { queryClient } from "@/lib/query-client";

type KycStatus = "pending" | "approved" | "rejected";

export default function AdminKyc() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<KycStatus>("pending");
  const [selectedDocument, setSelectedDocument] = useState<KycDocument | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch KYC documents
  const {
    data: kycData,
    isLoading,
    error,
    refetch
  } = useQuery<KycResponse>({
    queryKey: ["/api/admin/kyc"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch users for additional info
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers
  } = useQuery<{ users: User[] }>({
    queryKey: ["/api/admin/users"],
  });

  // Action Mutations
  const approveKycMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await apiRequest("POST", `/api/admin/kyc/approve/${documentId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document Approved",
        description: "The KYC document has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc"] });
      setApproveDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Failed to approve document",
        variant: "destructive",
      });
    },
  });

  const rejectKycMutation = useMutation({
    mutationFn: async ({ documentId, reason }: { documentId: number; reason: string }) => {
      const response = await apiRequest("POST", `/api/admin/kyc/reject/${documentId}`, { reason });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document Rejected",
        description: "The KYC document has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc"] });
      setRejectDialogOpen(false);
      setRejectReason("");
    },
    onError: (error) => {
      toast({
        title: "Rejection Failed",
        description: error instanceof Error ? error.message : "Failed to reject document",
        variant: "destructive",
      });
    },
  });

  // Event Handlers
  const handleApprove = (document: KycDocument) => {
    setSelectedDocument(document);
    setApproveDialogOpen(true);
  };

  const handleReject = (document: KycDocument) => {
    setSelectedDocument(document);
    setRejectDialogOpen(true);
  };

  const handleConfirmApprove = () => {
    if (selectedDocument) {
      approveKycMutation.mutate(selectedDocument.id);
    }
  };

  const handleConfirmReject = () => {
    if (selectedDocument && rejectReason.trim()) {
      rejectKycMutation.mutate({
        documentId: selectedDocument.id,
        reason: rejectReason,
      });
    }
  };

  const handlePreview = (documentUrl: string, documentType: string) => {
    setPreviewUrl(documentUrl);
  };

  // Helper function to get user details by ID
  const getUserById = (userId: string): { email: string, firstName: string | null, lastName: string | null } => {
    if (!usersData?.users) return { email: "Unknown", firstName: null, lastName: null };
    const user = usersData.users.find((u) => u.id === userId);
    if (!user) return { email: "Unknown", firstName: null, lastName: null };
    return { 
      email: user.email || "Unknown", 
      firstName: user.firstName, 
      lastName: user.lastName 
    };
  };

  // Filter documents by status
  const getFilteredDocuments = (status: KycStatus): KycDocument[] => {
    if (!kycData?.documents) return [];
    return kycData.documents.filter(doc => doc.status === status);
  };

  const pendingDocuments = getFilteredDocuments("pending");
  const approvedDocuments = getFilteredDocuments("approved");
  const rejectedDocuments = getFilteredDocuments("rejected");

  return (
    <div className="space-y-6">
      {/* KYC Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              Documents awaiting review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Verifications</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              Total approved documents
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Verifications</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              Documents that failed verification
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KYC Tabs */}
      <div className="space-y-4">
        <Tabs defaultValue="pending" value={activeTab} onValueChange={(value) => setActiveTab(value as KycStatus)}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          {/* Pending KYC Documents */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Verifications</CardTitle>
                <CardDescription>Review and verify user submitted documents</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading || isLoadingUsers ? (
                  <LoadingState message="Loading documents..." />
                ) : error || usersError ? (
                  <ErrorState 
                    title="Error Loading Data" 
                    message={(error || usersError) instanceof Error ? (error || usersError).message : "Failed to load data"}
                    retryAction={() => {
                      refetch();
                      refetchUsers();
                    }}
                  />
                ) : pendingDocuments.length === 0 ? (
                  <EmptyState 
                    icon={AlertCircle}
                    title="No pending verifications"
                    description="All KYC submissions have been processed"
                  />
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Document Type</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingDocuments.map((doc) => {
                          const user = getUserById(doc.userId);
                          return (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium">
                                {user.email}
                                {user.firstName && user.lastName && (
                                  <div className="text-xs text-muted-foreground">
                                    {user.firstName} {user.lastName}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{doc.documentType}</TableCell>
                              <TableCell>
                                {new Date(doc.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                  Pending
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePreview(doc.frontImageUrl, doc.documentType)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApprove(doc)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleReject(doc)}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approved KYC Documents */}
          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Approved Verifications</CardTitle>
                <CardDescription>List of approved KYC documents</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading || isLoadingUsers ? (
                  <LoadingState message="Loading documents..." />
                ) : error || usersError ? (
                  <ErrorState 
                    title="Error Loading Data" 
                    message={(error || usersError) instanceof Error ? (error || usersError).message : "Failed to load data"}
                    retryAction={() => {
                      refetch();
                      refetchUsers();
                    }}
                  />
                ) : approvedDocuments.length === 0 ? (
                  <EmptyState 
                    icon={CheckCircle}
                    title="No approved verifications"
                    description="No KYC documents have been approved yet"
                  />
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Document Type</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedDocuments.map((doc) => {
                          const user = getUserById(doc.userId);
                          return (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium">
                                {user.email}
                                {user.firstName && user.lastName && (
                                  <div className="text-xs text-muted-foreground">
                                    {user.firstName} {user.lastName}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{doc.documentType}</TableCell>
                              <TableCell>
                                {new Date(doc.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  Approved
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePreview(doc.frontImageUrl, doc.documentType)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rejected KYC Documents */}
          <TabsContent value="rejected">
            <Card>
              <CardHeader>
                <CardTitle>Rejected Verifications</CardTitle>
                <CardDescription>List of rejected KYC documents</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading || isLoadingUsers ? (
                  <LoadingState message="Loading documents..." />
                ) : error || usersError ? (
                  <ErrorState 
                    title="Error Loading Data" 
                    message={(error || usersError) instanceof Error ? (error || usersError).message : "Failed to load data"}
                    retryAction={() => {
                      refetch();
                      refetchUsers();
                    }}
                  />
                ) : rejectedDocuments.length === 0 ? (
                  <EmptyState 
                    icon={X}
                    title="No rejected verifications"
                    description="No KYC documents have been rejected yet"
                  />
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Document Type</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rejectedDocuments.map((doc) => {
                          const user = getUserById(doc.userId);
                          return (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium">
                                {user.email}
                                {user.firstName && user.lastName && (
                                  <div className="text-xs text-muted-foreground">
                                    {user.firstName} {user.lastName}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{doc.documentType}</TableCell>
                              <TableCell>
                                {new Date(doc.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-red-600 border-red-600">
                                  Rejected
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {doc.rejectionReason || "No reason provided"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePreview(doc.frontImageUrl, doc.documentType)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve KYC Verification</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this verification? This will grant the user KYC verified status.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmApprove}
              className="bg-green-600 hover:bg-green-700"
              disabled={approveKycMutation.isPending}
            >
              {approveKycMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC Verification</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this verification.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide detailed information about why this document was rejected."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmReject}
              disabled={rejectKycMutation.isPending || !rejectReason.trim()}
            >
              {rejectKycMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      {previewUrl && (
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center p-6">
              <img src={previewUrl} alt="Document" className="max-w-full max-h-96 object-contain" />
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setPreviewUrl(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}