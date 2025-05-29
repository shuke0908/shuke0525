import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Download, CheckCircle, XCircle, Eye, Loader2, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Withdrawal = {
  id: number;
  userId: string;
  username: string;
  amount: string;
  coin: string;
  destinationAddress: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  reason: string | null;
};

export default function AdminWithdrawals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [transactionHash, setTransactionHash] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // Fetch withdrawals
  const { data: withdrawalsData, isLoading: isWithdrawalsLoading } = useQuery({
    queryKey: ["/api/admin/withdrawals"],
  });

  // Withdrawal statistics
  const withdrawals = withdrawalsData?.withdrawals || [];
  const pendingCount = withdrawals.filter((w: Withdrawal) => w.status === "pending").length;
  const approvedCount = withdrawals.filter((w: Withdrawal) => w.status === "approved").length;
  const rejectedCount = withdrawals.filter((w: Withdrawal) => w.status === "rejected").length;
  const totalAmount = withdrawals.reduce((sum: number, w: Withdrawal) => sum + parseFloat(w.amount), 0);

  // Filter withdrawals
  const filteredWithdrawals = withdrawals.filter((withdrawal: Withdrawal) => {
    const matchesSearch = search === "" || 
      withdrawal.username.toLowerCase().includes(search.toLowerCase()) ||
      withdrawal.amount.includes(search) ||
      withdrawal.destinationAddress.toLowerCase().includes(search.toLowerCase()) ||
      withdrawal.coin.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || withdrawal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Approve withdrawal mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, transactionHash }: { id: number; transactionHash: string }) => {
      const response = await fetch(`/api/admin/withdrawals/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ transactionHash })
      });
      
      if (!response.ok) {
        throw new Error("Failed to approve withdrawal");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({
        title: "Withdrawal approved",
        description: "The withdrawal has been successfully processed."
      });
      setApproveDialogOpen(false);
      setTransactionHash("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve withdrawal",
        variant: "destructive"
      });
    }
  });

  // Reject withdrawal mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await fetch(`/api/admin/withdrawals/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason })
      });
      
      if (!response.ok) {
        throw new Error("Failed to reject withdrawal");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({
        title: "Withdrawal rejected",
        description: "The withdrawal has been rejected successfully."
      });
      setRejectDialogOpen(false);
      setRejectReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject withdrawal",
        variant: "destructive"
      });
    }
  });

  // Handle withdrawal approval
  const handleApproveWithdrawal = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setApproveDialogOpen(true);
  };

  // Handle withdrawal rejection
  const handleRejectWithdrawal = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectDialogOpen(true);
  };

  // Handle address dialog
  const handleViewAddress = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setAddressDialogOpen(true);
  };

  // Copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    });
  };

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Withdrawal Management</h1>
          <p className="text-muted-foreground">Process and manage user withdrawal requests</p>
        </div>
      </div>
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{withdrawals.length}</div>
              <p className="text-xs text-muted-foreground">Withdrawal requests</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Awaiting processing</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">Successfully processed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">In all requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search withdrawals by username, ID, or address..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Coin</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isWithdrawalsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2">Loading withdrawals...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !withdrawalsData?.withdrawals || withdrawalsData.withdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No withdrawal requests found
                    </TableCell>
                  </TableRow>
                ) : filteredWithdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No withdrawals match your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWithdrawals.map((withdrawal: Withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>{withdrawal.id}</TableCell>
                      <TableCell>{withdrawal.username}</TableCell>
                      <TableCell>${parseFloat(withdrawal.amount).toFixed(2)}</TableCell>
                      <TableCell>{withdrawal.coin}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-mono"
                          onClick={() => handleViewAddress(withdrawal)}
                        >
                          {`${withdrawal.destinationAddress.substring(0, 6)}...${withdrawal.destinationAddress.substring(
                            withdrawal.destinationAddress.length - 4
                          )}`}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            withdrawal.status === "approved"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : withdrawal.status === "rejected"
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          }
                        >
                          {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(withdrawal.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end items-center space-x-2">
                          {withdrawal.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleApproveWithdrawal(withdrawal)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleRejectWithdrawal(withdrawal)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdrawal Address</DialogTitle>
            <DialogDescription>
              Verify the destination address for this withdrawal
            </DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md overflow-x-auto">
                <code className="text-sm break-all font-mono">
                  {selectedWithdrawal.destinationAddress}
                </code>
              </div>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium">Coin:</p>
                  <p className="text-sm">{selectedWithdrawal.coin}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Network:</p>
                  <p className="text-sm">{selectedWithdrawal.coin === 'USDT' ? 'TRC-20' : 'Native'}</p>
                </div>
              </div>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => copyToClipboard(selectedWithdrawal.destinationAddress)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Address
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Withdrawal</DialogTitle>
            <DialogDescription>
              Enter transaction hash for this withdrawal. This will mark the withdrawal as approved.
            </DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Amount:</p>
                    <p className="font-medium">${parseFloat(selectedWithdrawal.amount).toFixed(2)} {selectedWithdrawal.coin}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">User:</p>
                    <p className="font-medium">{selectedWithdrawal.username}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Destination Address:</p>
                    <p className="font-mono text-xs truncate">{selectedWithdrawal.destinationAddress}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="txHash" className="text-sm font-medium">
                  Transaction Hash:
                </label>
                <Input
                  id="txHash"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  placeholder="Enter blockchain transaction hash"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setApproveDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    selectedWithdrawal &&
                    approveMutation.mutate({
                      id: selectedWithdrawal.id,
                      transactionHash,
                    })
                  }
                  disabled={approveMutation.isPending || !transactionHash}
                >
                  {approveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    "Approve Withdrawal"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this withdrawal request.
            </DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Amount:</p>
                    <p className="font-medium">${parseFloat(selectedWithdrawal.amount).toFixed(2)} {selectedWithdrawal.coin}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">User:</p>
                    <p className="font-medium">{selectedWithdrawal.username}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="reason" className="text-sm font-medium">
                  Reason for rejection:
                </label>
                <Textarea
                  id="reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection"
                  className="resize-none"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setRejectDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    selectedWithdrawal &&
                    rejectMutation.mutate({
                      id: selectedWithdrawal.id,
                      reason: rejectReason,
                    })
                  }
                  disabled={rejectMutation.isPending || !rejectReason}
                >
                  {rejectMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    "Reject Withdrawal"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}