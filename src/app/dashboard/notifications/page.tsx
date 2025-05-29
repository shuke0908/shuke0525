'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bell, 
  Search, 
  Filter,
  CheckCircle,
  Circle,
  Trash2,
  MoreVertical,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Settings,
  Gift,
  AlertTriangle,
  Info,
  Clock,
  Eye,
  EyeOff
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

type NotificationType = 'trade' | 'deposit' | 'withdrawal' | 'system' | 'promotion' | 'kyc' | 'security';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
};

type NotificationFilter = {
  type: string;
  isRead: string;
  search: string;
};

function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>({
    type: 'all',
    isRead: 'all',
    search: ''
  });

  // Get notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to access notifications');

      const params = new URLSearchParams();
      if (filter.type !== 'all') params.append('type', filter.type);
      if (filter.isRead !== 'all') params.append('isRead', filter.isRead);
      if (filter.search) params.append('search', filter.search);

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    enabled: !!user,
  });

  const notifications: Notification[] = notificationsData?.data || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to mark notifications as read');

      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationIds }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark notifications as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ 알림 읽음 처리 완료",
        description: "선택한 알림이 읽음으로 표시되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelectedNotifications([]);
    },
    onError: (error: any) => {
      toast({
        title: "알림 처리 실패",
        description: error.message || "알림 처리에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  // Delete notifications mutation
  const deleteNotificationsMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to delete notifications');

      const response = await fetch('/api/notifications/delete', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationIds }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete notifications');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ 알림 삭제 완료",
        description: "선택한 알림이 삭제되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelectedNotifications([]);
    },
    onError: (error: any) => {
      toast({
        title: "알림 삭제 실패",
        description: error.message || "알림 삭제에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'trade':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'deposit':
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-5 w-5 text-red-500" />;
      case 'system':
        return <Settings className="h-5 w-5 text-gray-500" />;
      case 'promotion':
        return <Gift className="h-5 w-5 text-purple-500" />;
      case 'kyc':
        return <CheckCircle className="h-5 w-5 text-orange-500" />;
      case 'security':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationTypeBadge = (type: NotificationType) => {
    const typeMap = {
      trade: { label: '거래', color: 'bg-blue-500' },
      deposit: { label: '입금', color: 'bg-green-500' },
      withdrawal: { label: '출금', color: 'bg-red-500' },
      system: { label: '시스템', color: 'bg-gray-500' },
      promotion: { label: '프로모션', color: 'bg-purple-500' },
      kyc: { label: 'KYC', color: 'bg-orange-500' },
      security: { label: '보안', color: 'bg-yellow-500' }
    };

    const typeInfo = typeMap[type] || { label: '기타', color: 'bg-gray-500' };
    return (
      <Badge className={`${typeInfo.color} text-white text-xs`}>
        {typeInfo.label}
      </Badge>
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleMarkAsRead = () => {
    if (selectedNotifications.length === 0) {
      toast({
        title: "선택된 알림 없음",
        description: "읽음 처리할 알림을 선택해주세요",
        variant: "destructive",
      });
      return;
    }
    markAsReadMutation.mutate(selectedNotifications);
  };

  const handleMarkAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) {
      toast({
        title: "읽지 않은 알림 없음",
        description: "모든 알림이 이미 읽음 처리되었습니다",
      });
      return;
    }
    markAsReadMutation.mutate(unreadIds);
  };

  const handleDeleteSelected = () => {
    if (selectedNotifications.length === 0) {
      toast({
        title: "선택된 알림 없음",
        description: "삭제할 알림을 선택해주세요",
        variant: "destructive",
      });
      return;
    }
    deleteNotificationsMutation.mutate(selectedNotifications);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">알림 센터</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}개 안읽음
            </Badge>
          )}
        </div>
        <Button 
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0 || markAsReadMutation.isPending}
          variant="outline"
        >
          <Eye className="h-4 w-4 mr-2" />
          모두 읽음
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>필터 및 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>알림 유형</Label>
              <Select 
                value={filter.type} 
                onValueChange={(value) => setFilter(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="trade">거래</SelectItem>
                  <SelectItem value="deposit">입금</SelectItem>
                  <SelectItem value="withdrawal">출금</SelectItem>
                  <SelectItem value="system">시스템</SelectItem>
                  <SelectItem value="promotion">프로모션</SelectItem>
                  <SelectItem value="kyc">KYC</SelectItem>
                  <SelectItem value="security">보안</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>읽음 상태</Label>
              <Select 
                value={filter.isRead} 
                onValueChange={(value) => setFilter(prev => ({ ...prev, isRead: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="false">안읽음</SelectItem>
                  <SelectItem value="true">읽음</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>검색</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="알림 제목이나 내용으로 검색..."
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {notifications.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Checkbox
                  checked={selectedNotifications.length === notifications.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedNotifications.length > 0 
                    ? `${selectedNotifications.length}개 선택됨` 
                    : '전체 선택'
                  }
                </span>
              </div>
              
              {selectedNotifications.length > 0 && (
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleMarkAsRead}
                    disabled={markAsReadMutation.isPending}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    읽음 처리
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={deleteNotificationsMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">알림이 없습니다</h3>
              <p className="text-muted-foreground">
                {filter.type !== 'all' || filter.isRead !== 'all' || filter.search
                  ? '검색 조건에 맞는 알림이 없습니다'
                  : '새로운 알림이 도착하면 여기에 표시됩니다'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`transition-colors ${
                !notification.isRead 
                  ? 'border-l-4 border-l-blue-500 bg-blue-50/50' 
                  : 'hover:bg-muted/50'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <Checkbox
                    checked={selectedNotifications.includes(notification.id)}
                    onCheckedChange={() => handleSelectNotification(notification.id)}
                  />
                  
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-semibold ${!notification.isRead ? 'text-blue-900' : ''}`}>
                          {notification.title}
                        </h4>
                        {getNotificationTypeBadge(notification.type)}
                        {!notification.isRead && (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                            새 알림
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { 
                            addSuffix: true, 
                            locale: ko 
                          })}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => markAsReadMutation.mutate([notification.id])}
                              disabled={notification.isRead}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              읽음 처리
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteNotificationsMutation.mutate([notification.id])}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <p className={`text-sm ${!notification.isRead ? 'text-blue-800' : 'text-muted-foreground'}`}>
                      {notification.content}
                    </p>
                    
                    {notification.metadata && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(notification.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More or Pagination could be added here */}
    </div>
  );
}

export default NotificationsPage; 