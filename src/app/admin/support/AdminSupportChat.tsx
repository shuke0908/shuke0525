import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/query-client";
import { format } from "date-fns";

import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  SendHorizontal,
  Loader2,
  FileText,
  MoreVertical,
  Bell,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Filter,
  Search,
  RefreshCcw,
} from "lucide-react";

// Define a ChatTicket type for consistent typing
type ChatTicket = {
  id: number;
  userId: string;
  topic: string;
  title: string;
  status: 'open' | 'assigned' | 'closed';
  assignedToId: string | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

// Define a ChatMessage type for consistent typing
type ChatMessage = {
  id: number;
  ticketId: number;
  senderId: string;
  message: string;
  attachmentPath: string | null;
  isRead: boolean;
  createdAt: string;
};

// Define a User type for consistent typing
type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
};

// Status badge for tickets
function TicketStatusBadge({ status }: { status: string }) {
  let variant: 'default' | 'outline' | 'secondary' | 'destructive' = 'default';
  
  switch (status) {
    case 'open':
      variant = 'destructive';
      break;
    case 'assigned':
      variant = 'secondary';
      break;
    case 'closed':
      variant = 'outline';
      break;
    default:
      variant = 'default';
  }
  
  return (
    <Badge variant={variant} className="ml-2">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// Ticket list component
function TicketList({ tab, onSelectTicket }: { 
  tab: string, 
  onSelectTicket: (ticket: ChatTicket) => void 
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  
  // Query for tickets
  const { data: tickets = [], isLoading, isError } = useQuery({
    queryKey: ['/api/admin/support-tickets', tab],
    queryFn: async () => {
      const endpoint = tab === 'assigned' 
        ? '/api/admin/support-tickets/assigned' 
        : '/api/admin/support-tickets/open';
      const res = await apiRequest('GET', endpoint);
      if (!res.ok) throw new Error('Failed to fetch tickets');
      return await res.json();
    }
  });
  
  const filteredTickets = tickets.filter((ticket: ChatTicket) =>
    ticket.title.toLowerCase().includes(search.toLowerCase()) ||
    ticket.topic.toLowerCase().includes(search.toLowerCase())
  );

  // For refreshing tickets
  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ['/api/admin/support-tickets', tab],
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-destructive">
        <p>Error loading tickets. Please try again.</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={handleRefresh}
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search tickets..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
      
      {filteredTickets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>No tickets found</p>
          <p className="text-sm">
            {search ? 'Try a different search term' : 'You will see tickets here once customers create them'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTickets.map((ticket: ChatTicket) => (
            <Card 
              key={ticket.id} 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onSelectTicket(ticket)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium flex-1">{ticket.title}</h3>
                  <TicketStatusBadge status={ticket.status} />
                </div>
                <div className="text-sm text-muted-foreground flex justify-between">
                  <span>{ticket.topic}</span>
                  <span>{format(new Date(ticket.lastMessageAt), 'MMM d, h:mm a')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Chat conversation component
function ChatConversation({ ticket, onStatusChange }: { 
  ticket: ChatTicket; 
  onStatusChange: (ticketId: number, status: string) => void;
}) {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Get all messages for this ticket
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/admin/support-tickets', ticket.id, 'messages'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/admin/support-tickets/${ticket.id}/messages`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return await res.json();
    }
  });
  
  // Get user details for the ticket creator
  const { data: ticketUser, isLoading: userLoading } = useQuery({
    queryKey: ['/api/admin/users', ticket.userId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/admin/users/${ticket.userId}`);
      if (!res.ok) throw new Error('Failed to fetch user details');
      return await res.json();
    },
    enabled: !!ticket.userId
  });
  
  // Mutation for sending a message
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest('POST', `/api/admin/support-tickets/${ticket.id}/messages`, { 
        message,
      });
      if (!res.ok) throw new Error('Failed to send message');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/support-tickets', ticket.id, 'messages'],
      });
      setNewMessage('');
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for changing ticket status
  const changeStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest('PATCH', `/api/admin/support-tickets/${ticket.id}`, {
        status,
      });
      if (!res.ok) throw new Error('Failed to update ticket status');
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/support-tickets'],
      });
      onStatusChange(ticket.id, data.status);
      toast({
        title: "Status updated",
        description: `Ticket status updated to ${data.status}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    
    // If ticket is open, assign it to the current admin when they first reply
    if (ticket.status === 'open') {
      changeStatusMutation.mutate('assigned');
    }
    
    sendMessageMutation.mutate(newMessage);
  };
  
  const handleChangeStatus = (status: string) => {
    setShowStatusOptions(false);
    changeStatusMutation.mutate(status);
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Ticket info header */}
      <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
        <div className="flex items-center">
          <div className="space-y-1">
            <div className="flex items-center">
              <span className="font-medium">{ticket.title}</span>
              <TicketStatusBadge status={ticket.status} />
            </div>
            <div className="text-sm text-muted-foreground">
              {userLoading ? (
                <span>Loading user info...</span>
              ) : (
                <span>
                  Customer: {ticketUser?.email || 'Unknown user'} • 
                  Created: {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <XCircle className="h-4 w-4 mr-2" />
                Close Ticket
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Close this support ticket?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark the ticket as resolved. The customer can still reopen it by sending a new message.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleChangeStatus('closed')}
                >
                  Close Ticket
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ticket Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ticket.status === 'open' && (
                <DropdownMenuItem onClick={() => handleChangeStatus('assigned')}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Assign to me
                </DropdownMenuItem>
              )}
              {ticket.status === 'assigned' && (
                <DropdownMenuItem onClick={() => handleChangeStatus('open')}>
                  <Bell className="h-4 w-4 mr-2" />
                  Return to queue
                </DropdownMenuItem>
              )}
              {ticket.status !== 'closed' && (
                <DropdownMenuItem onClick={() => handleChangeStatus('closed')}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Close ticket
                </DropdownMenuItem>
              )}
              {ticket.status === 'closed' && (
                <DropdownMenuItem onClick={() => handleChangeStatus('open')}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Reopen ticket
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium">No messages yet</h3>
            <p className="text-muted-foreground">
              Send a message to start helping the customer.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message: ChatMessage) => {
              const isAdmin = message.senderId !== ticket.userId;
              return (
                <div 
                  key={message.id}
                  className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isAdmin 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    <div className="mb-1 text-xs opacity-70">
                      {isAdmin ? 'Support Agent' : 'Customer'} • 
                      {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                    </div>
                    <div>{message.message}</div>
                    {message.attachmentPath && (
                      <a 
                        href={`/uploads/${message.attachmentPath}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center mt-2 text-sm underline"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Attachment
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 min-h-[80px]"
          />
          <Button
            type="submit"
            className="self-end"
            disabled={sendMessageMutation.isPending || newMessage.trim() === ''}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <SendHorizontal className="h-5 w-5 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function AdminSupportChat() {
  const [selectedTicket, setSelectedTicket] = useState<ChatTicket | null>(null);
  const [activeTab, setActiveTab] = useState<string>('open');
  const queryClient = useQueryClient();
  
  const handleTicketStatusChange = (ticketId: number, status: string) => {
    // If the ticket is closed or returned to queue, and it was selected, deselect it
    if ((status === 'closed' || status === 'open') && selectedTicket?.id === ticketId) {
      setSelectedTicket(null);
    }
    
    // Invalidate queries
    queryClient.invalidateQueries({
      queryKey: ['/api/admin/support-tickets'],
    });
    
    // If on assigned tab, also refetch assigned tickets
    if (activeTab === 'assigned') {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/support-tickets/assigned'],
      });
    }
  };
  
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
            <CardDescription>Manage customer support requests</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="open" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="open" 
                  onClick={() => setActiveTab('open')}
                >
                  Open Tickets
                </TabsTrigger>
                <TabsTrigger 
                  value="assigned" 
                  onClick={() => setActiveTab('assigned')}
                >
                  Assigned to Me
                </TabsTrigger>
              </TabsList>
              <TabsContent value="open" className="p-4">
                <TicketList 
                  tab="open" 
                  onSelectTicket={setSelectedTicket} 
                />
              </TabsContent>
              <TabsContent value="assigned" className="p-4">
                <TicketList 
                  tab="assigned" 
                  onSelectTicket={setSelectedTicket} 
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-0 h-[700px]">
            {selectedTicket ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedTicket(null)}
                    className="mr-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h2 className="text-lg font-medium">Support Chat</h2>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatConversation 
                    ticket={selectedTicket} 
                    onStatusChange={handleTicketStatusChange}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No Ticket Selected</h3>
                <p className="text-muted-foreground mb-6">
                  Select a support ticket from the list to view the conversation and help the customer.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}