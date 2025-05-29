'use client';

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  MessageCircle, 
  Send, 
  Paperclip,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Bot,
  Phone,
  Mail,
  FileText,
  Image,
  Download,
  Smile,
  MoreVertical
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

type ChatStatus = 'pending' | 'active' | 'resolved' | 'closed';
type MessageSender = 'user' | 'admin' | 'system';

type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  senderType: MessageSender;
  senderName: string;
  message: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
};

type SupportChat = {
  id: string;
  subject: string;
  status: ChatStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedAdminName?: string;
  createdAt: string;
  lastMessageAt: string;
  messages: ChatMessage[];
};

function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newChatSubject, setNewChatSubject] = useState('');
  const [newChatPriority, setNewChatPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // Get support chats
  const { data: chatsData, isLoading } = useQuery({
    queryKey: ['support', 'chats'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to access support');

      const response = await fetch('/api/support/chats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch support chats');
      return response.json();
    },
    enabled: !!user,
    refetchInterval: 5000, // 5초마다 새 메시지 확인
  });

  const chats: SupportChat[] = chatsData?.data || [];
  const currentChat = chats.find(chat => chat.id === selectedChat);

  // Create new chat mutation
  const createChatMutation = useMutation({
    mutationFn: async (data: { subject: string; priority: string; initialMessage: string }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to create support chat');

      const response = await fetch('/api/support/chats', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create support chat');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ 상담 요청 생성 완료",
        description: "새로운 상담이 시작되었습니다.",
      });
      setSelectedChat(data.data.id);
      setShowNewChatForm(false);
      setNewChatSubject('');
      setNewChatPriority('normal');
      queryClient.invalidateQueries({ queryKey: ['support'] });
    },
    onError: (error: any) => {
      toast({
        title: "상담 요청 실패",
        description: error.message || "상담 요청 생성에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { chatId: string; message: string; attachment?: File }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to send message');

      const formData = new FormData();
      formData.append('chatId', data.chatId);
      formData.append('message', data.message);
      if (data.attachment) {
        formData.append('attachment', data.attachment);
      }

      const response = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setNewMessage('');
      setAttachedFile(null);
      queryClient.invalidateQueries({ queryKey: ['support'] });
      scrollToBottom();
    },
    onError: (error: any) => {
      toast({
        title: "메시지 전송 실패",
        description: error.message || "메시지 전송에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const handleCreateChat = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newChatSubject.trim()) {
      toast({
        title: "제목 입력 필요",
        description: "상담 제목을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    createChatMutation.mutate({
      subject: newChatSubject,
      priority: newChatPriority,
      initialMessage: `안녕하세요. ${newChatSubject}에 대해 문의드립니다.`
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedChat) return;
    
    if (!newMessage.trim() && !attachedFile) {
      toast({
        title: "메시지 입력 필요",
        description: "메시지를 입력하거나 파일을 첨부해주세요",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      chatId: selectedChat,
      message: newMessage,
      attachment: attachedFile || undefined
    });
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB 제한
        toast({
          title: "파일 크기 초과",
          description: "파일 크기는 10MB 이하여야 합니다",
          variant: "destructive",
        });
        return;
      }
      setAttachedFile(file);
    }
  };

  const getStatusBadge = (status: ChatStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">대기중</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-green-600">상담중</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">해결됨</Badge>;
      case 'closed':
        return <Badge variant="secondary">종료됨</Badge>;
      default:
        return <Badge variant="secondary">알 수 없음</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">긴급</Badge>;
      case 'high':
        return <Badge variant="outline" className="text-red-600 border-red-600">높음</Badge>;
      case 'normal':
        return <Badge variant="outline">보통</Badge>;
      case 'low':
        return <Badge variant="secondary">낮음</Badge>;
      default:
        return <Badge variant="outline">보통</Badge>;
    }
  };

  const getMessageIcon = (senderType: MessageSender) => {
    switch (senderType) {
      case 'admin':
        return <User className="h-4 w-4" />;
      case 'system':
        return <Bot className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full" />
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageCircle className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">고객센터</h1>
        </div>
        <Button onClick={() => setShowNewChatForm(true)}>
          <MessageCircle className="h-4 w-4 mr-2" />
          새 상담 시작
        </Button>
      </div>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle>연락처 정보</CardTitle>
          <CardDescription>
            다양한 방법으로 고객 지원을 받으실 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-semibold">실시간 채팅</h4>
                <p className="text-sm text-muted-foreground">24시간 지원</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <Mail className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-semibold">이메일</h4>
                <p className="text-sm text-muted-foreground">support@quanttrade.com</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <Phone className="h-5 w-5 text-purple-600" />
              <div>
                <h4 className="font-semibold">전화</h4>
                <p className="text-sm text-muted-foreground">1588-0000</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <Card>
          <CardHeader>
            <CardTitle>상담 내역</CardTitle>
            <CardDescription>
              진행 중인 상담과 이전 상담을 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {chats.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">상담 내역이 없습니다</h3>
                  <p className="text-muted-foreground mb-4">
                    새로운 상담을 시작해보세요
                  </p>
                  <Button onClick={() => setShowNewChatForm(true)}>
                    상담 시작하기
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedChat === chat.id
                          ? 'bg-blue-100 border-blue-500 border'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedChat(chat.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm truncate">{chat.subject}</h4>
                        {getStatusBadge(chat.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        {getPriorityBadge(chat.priority)}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(chat.lastMessageAt), { 
                            addSuffix: true, 
                            locale: ko 
                          })}
                        </span>
                      </div>
                      {chat.assignedAdminName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          담당자: {chat.assignedAdminName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {showNewChatForm ? (
            <Card>
              <CardHeader>
                <CardTitle>새 상담 시작</CardTitle>
                <CardDescription>
                  상담 제목과 우선순위를 설정하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateChat} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">상담 제목</Label>
                    <Input
                      id="subject"
                      placeholder="상담 제목을 입력하세요"
                      value={newChatSubject}
                      onChange={(e) => setNewChatSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">우선순위</Label>
                    <Select value={newChatPriority} onValueChange={(value: any) => setNewChatPriority(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">낮음</SelectItem>
                        <SelectItem value="normal">보통</SelectItem>
                        <SelectItem value="high">높음</SelectItem>
                        <SelectItem value="urgent">긴급</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      type="submit" 
                      disabled={createChatMutation.isPending}
                      className="flex-1"
                    >
                      {createChatMutation.isPending ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          생성 중...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          상담 시작
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowNewChatForm(false)}
                    >
                      취소
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : selectedChat && currentChat ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center justify-between">
                  <span>{currentChat.subject}</span>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(currentChat.status)}
                    {getPriorityBadge(currentChat.priority)}
                  </div>
                </CardTitle>
                {currentChat.assignedAdminName && (
                  <CardDescription>
                    담당자: {currentChat.assignedAdminName}
                  </CardDescription>
                )}
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {currentChat.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderType === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.senderType === 'user'
                              ? 'bg-blue-600 text-white'
                              : message.senderType === 'admin'
                              ? 'bg-gray-100 text-gray-900'
                              : 'bg-yellow-100 text-yellow-900'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {getMessageIcon(message.senderType)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-semibold">
                              {message.senderName}
                            </span>
                            <span className="text-xs opacity-70">
                              {formatDistanceToNow(new Date(message.createdAt), { 
                                addSuffix: true, 
                                locale: ko 
                              })}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                          {message.attachmentUrl && (
                            <div className="mt-2 p-2 bg-black/10 rounded flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-xs">{message.attachmentName}</span>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                {currentChat.status === 'active' || currentChat.status === 'pending' ? (
                  <div className="border-t p-4">
                    <form onSubmit={handleSendMessage} className="space-y-2">
                      {attachedFile && (
                        <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{attachedFile.name}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setAttachedFile(null)}
                            className="h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <Textarea
                          placeholder="메시지를 입력하세요..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1 min-h-[60px] resize-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                            }
                          }}
                        />
                        <div className="flex flex-col space-y-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleFileAttach}
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={sendMessageMutation.isPending}
                            size="sm"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </form>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                  </div>
                ) : (
                  <div className="border-t p-4 text-center text-muted-foreground">
                    이 상담은 종료되었습니다.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">상담을 선택하세요</h3>
                <p className="text-muted-foreground mb-4">
                  왼쪽에서 상담을 선택하거나 새로운 상담을 시작하세요
                </p>
                <Button onClick={() => setShowNewChatForm(true)}>
                  새 상담 시작
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>자주 묻는 질문</CardTitle>
          <CardDescription>
            일반적인 질문과 답변을 확인해보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">입금이 반영되지 않아요</h4>
                <p className="text-sm text-muted-foreground">
                  입금 후 네트워크 확인이 완료되면 자동으로 반영됩니다. 
                  일반적으로 10-30분 소요되며, 증빙 자료 제출 시 더 빠른 처리가 가능합니다.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">출금은 얼마나 걸리나요?</h4>
                <p className="text-sm text-muted-foreground">
                  출금 요청 후 관리자 승인까지 1-24시간, 
                  블록체인 전송까지 추가로 10-60분이 소요됩니다.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">거래 수수료는 얼마인가요?</h4>
                <p className="text-sm text-muted-foreground">
                  VIP 등급에 따라 0-30% 할인이 적용됩니다. 
                  자세한 수수료는 각 거래 페이지에서 확인하실 수 있습니다.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">KYC 인증이 필요한가요?</h4>
                <p className="text-sm text-muted-foreground">
                  기본 거래는 KYC 없이 가능하지만, 
                  고액 거래나 특정 기능 이용 시 KYC 인증이 필요할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SupportPage; 