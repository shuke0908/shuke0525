import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Download, CheckCircle, XCircle, Eye, Loader2, ImageIcon, RefreshCw, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api-client";
import { TIME_CONSTANTS, DEPOSIT_STATUS } from "@/lib/config";
// PAGINATION_LIMITS 대신 상수 직접 정의
const PAGINATION_LIMITS = { DEFAULT: 20, MAX: 100 };
import { debounce } from "@/lib/performance";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 타입 정의
interface Deposit {
  id: string;
  user_id: string;
  username: string;
  email: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  transaction_hash?: string;
  screenshot_url?: string;
  rejection_reason?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

interface DepositStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  processing: number;
  totalAmount: number;
  todayAmount: number;
}

interface DepositFilters {
  search: string;
  status: string;
  currency: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
}

export default function AdminDeposits() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 필터 상태
  const [filters, setFilters] = useState<DepositFilters>({
    search: "",
    status: "all",
    currency: "all",
    page: 1,
    limit: PAGINATION_LIMITS.DEFAULT,
  });
  
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // 디바운스된 검색
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setFilters(prev => ({ ...prev, search: value, page: 1 }));
    }, 500),
    []
  );

  // 입금 통계 조회
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['admin', 'deposits', 'stats', refreshKey],
    queryFn: async (): Promise<DepositStats> => {
      const response = await adminApi.getAnalytics({ type: 'deposits' });
      if (!response.success) throw new Error(response.error || 'Failed to fetch deposit stats');
      
      const stats = response.data;
      return {
        total: stats.total_deposits || 0,
        pending: stats.pending_deposits || 0,
        approved: stats.approved_deposits || 0,
        rejected: stats.rejected_deposits || 0,
        processing: stats.processing_deposits || 0,
        totalAmount: stats.total_deposit_amount || 0,
        todayAmount: stats.today_deposit_amount || 0,
      };
    },
    staleTime: TIME_CONSTANTS.MINUTE * 5,
    refetchInterval: TIME_CONSTANTS.MINUTE * 2,
  });

  // 입금 목록 조회
  const { data: depositsData, isLoading: depositsLoading, error: depositsError } = useQuery({
    queryKey: ['admin', 'deposits', 'list', filters, refreshKey],
    queryFn: async () => {
      const params = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        currency: filters.currency !== 'all' ? filters.currency : undefined,
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
      };
      
      const response = await adminApi.getDeposits(params);
      if (!response.success) throw new Error(response.error || 'Failed to fetch deposits');
      
      return {
        deposits: response.data?.deposits || [],
        pagination: response.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
      };
    },
    staleTime: TIME_CONSTANTS.MINUTE * 2,
    refetchInterval: TIME_CONSTANTS.MINUTE,
  });

  // 입금 승인 뮤테이션
  const approveMutation = useMutation({
    mutationFn: async (depositId: string) => {
      const response = await adminApi.updateDeposit(depositId, { 
        status: 'approved',
        processed_at: new Date().toISOString(),
      });
      if (!response.success) throw new Error(response.error || 'Failed to approve deposit');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'deposits'] });
      toast({
        title: "입금 승인 완료",
        description: "입금이 성공적으로 승인되어 사용자 계정에 반영되었습니다.",
      });
      setApproveDialogOpen(false);
      setSelectedDeposit(null);
    },
    onError: (error: Error) => {
      toast({
        title: "승인 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 입금 거부 뮤테이션
  const rejectMutation = useMutation({
    mutationFn: async ({ depositId, reason }: { depositId: string; reason: string }) => {
      const response = await adminApi.updateDeposit(depositId, {
        status: 'rejected',
        rejection_reason: reason,
        processed_at: new Date().toISOString(),
      });
      if (!response.success) throw new Error(response.error || 'Failed to reject deposit');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'deposits'] });
      toast({
        title: "입금 거부 완료",
        description: "입금이 거부되었습니다.",
      });
      setRejectDialogOpen(false);
      setSelectedDeposit(null);
      setRejectReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "거부 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 새로고침 함수
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // 필터 업데이트 함수
  const updateFilter = (key: keyof DepositFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // 입금 승인 핸들러
  const handleApproveDeposit = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setApproveDialogOpen(true);
  };

  // 입금 거부 핸들러
  const handleRejectDeposit = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setRejectDialogOpen(true);
  };

  // 입금 미리보기 핸들러
  const handlePreviewDeposit = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setPreviewDialogOpen(true);
  };

  // 상태 배지 색상
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'processing': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  // 상태 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'approved': return '승인됨';
      case 'rejected': return '거부됨';
      case 'processing': return '처리중';
      default: return status;
    }
  };

  // 포맷팅 함수들
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  // 로딩 스켈레톤
  const StatCardSkeleton = () => (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );

  const deposits = depositsData?.deposits || [];
  const pagination = depositsData?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

  return (
    <div className="w-full space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">입금 관리</h1>
          <p className="text-muted-foreground">사용자 입금 요청을 관리하고 처리합니다</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={depositsLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${depositsLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* 에러 표시 */}
      {(statsError || depositsError) && (
        <Alert variant="destructive">
          <AlertDescription>
            데이터를 불러오는 중 오류가 발생했습니다: {(statsError || depositsError)?.message}
          </AlertDescription>
        </Alert>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">전체 입금</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData?.total || 0}</div>
                <p className="text-xs text-muted-foreground">총 입금 요청</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">대기중</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{statsData?.pending || 0}</div>
                <p className="text-xs text-muted-foreground">승인 대기</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">승인됨</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{statsData?.approved || 0}</div>
                <p className="text-xs text-muted-foreground">승인 완료</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">거부됨</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{statsData?.rejected || 0}</div>
                <p className="text-xs text-muted-foreground">거부됨</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">총 금액</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statsData?.totalAmount || 0)}</div>
                <p className="text-xs text-muted-foreground">전체 입금액</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            필터 및 검색
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="사용자명, 이메일, 금액 검색..."
                className="pl-10"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
            
            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="pending">대기중</SelectItem>
                <SelectItem value="approved">승인됨</SelectItem>
                <SelectItem value="rejected">거부됨</SelectItem>
                <SelectItem value="processing">처리중</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.currency} onValueChange={(value) => updateFilter('currency', value)}>
              <SelectTrigger>
                <SelectValue placeholder="통화 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 통화</SelectItem>
                <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                <SelectItem value="USDT">Tether (USDT)</SelectItem>
                <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.limit.toString()} onValueChange={(value) => updateFilter('limit', parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="표시 개수" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10개</SelectItem>
                <SelectItem value="20">20개</SelectItem>
                <SelectItem value="50">50개</SelectItem>
                <SelectItem value="100">100개</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 입금 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>입금 목록</CardTitle>
          <p className="text-sm text-muted-foreground">
            총 {pagination.total}개 중 {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
          </p>
        </CardHeader>
        <CardContent>
          {depositsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-4 border rounded">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : deposits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              조건에 맞는 입금 요청이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사용자</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>통화</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>요청일시</TableHead>
                    <TableHead>처리일시</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{deposit.username}</div>
                          <div className="text-sm text-muted-foreground">{deposit.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(deposit.amount, deposit.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{deposit.currency}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(deposit.status)}>
                          {getStatusText(deposit.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(deposit.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {deposit.processed_at ? formatDate(deposit.processed_at) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {deposit.screenshot_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewDeposit(deposit)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {deposit.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApproveDeposit(deposit)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectDeposit(deposit)}
                                disabled={rejectMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            페이지 {pagination.page} / {pagination.totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* 미리보기 다이얼로그 */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>입금 증빙 미리보기</DialogTitle>
            <DialogDescription>
              {selectedDeposit?.username}님의 {formatCurrency(selectedDeposit?.amount || 0, selectedDeposit?.currency)} 입금 요청
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDeposit?.screenshot_url ? (
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={selectedDeposit.screenshot_url}
                  alt="입금 증빙"
                  className="w-full h-auto max-h-96 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden p-8 text-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                  <p>이미지를 불러올 수 없습니다</p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                <p>첨부된 증빙 이미지가 없습니다</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">거래 해시:</span>
                <p className="text-muted-foreground font-mono">
                  {selectedDeposit?.transaction_hash || '없음'}
                </p>
              </div>
              <div>
                <span className="font-medium">요청 시간:</span>
                <p className="text-muted-foreground">
                  {selectedDeposit ? formatDate(selectedDeposit.created_at) : ''}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 승인 확인 다이얼로그 */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>입금 승인 확인</DialogTitle>
            <DialogDescription>
              {selectedDeposit?.username}님의 {formatCurrency(selectedDeposit?.amount || 0, selectedDeposit?.currency)} 입금을 승인하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={() => selectedDeposit && approveMutation.mutate(selectedDeposit.id)}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              승인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 거부 확인 다이얼로그 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>입금 거부</DialogTitle>
            <DialogDescription>
              {selectedDeposit?.username}님의 {formatCurrency(selectedDeposit?.amount || 0, selectedDeposit?.currency)} 입금을 거부하는 이유를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="거부 사유를 입력해주세요..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedDeposit && rejectMutation.mutate({ 
                depositId: selectedDeposit.id, 
                reason: rejectReason 
              })}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              거부
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}