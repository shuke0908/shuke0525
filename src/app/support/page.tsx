'use client';

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, MessageCircle, User, Bot, Paperclip, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'support' | 'bot';
  timestamp: string;
  isRead: boolean;
  attachments?: string[];
}

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  assignedAgent?: string;
}

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get support tickets
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['support', 'tickets'],
    queryFn: async () => {
      const response = await fetch('/api/support/tickets');
      if (!response.ok) throw new Error('Failed to fetch tickets');
      return response.json();
    },
  });

  // Get FAQ data
  const { data: faqData, isLoading: faqLoading } = useQuery({
    queryKey: ['support', 'faq'],
    queryFn: async () => {
      const response = await fetch('/api/support/faq');
      if (!response.ok) throw new Error('Failed to fetch FAQ');
      return response.json();
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
      scrollToBottom();
    },
    onError: (error: any) => {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });
      if (!response.ok) throw new Error('Failed to create ticket');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Ticket Created",
        description: "Your support ticket has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
      setSelectedTicket(data.id);
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      });
    },
  });

  const tickets: SupportTicket[] = ticketsData?.tickets || [];
  const currentTicket = tickets.find(t => t.id === selectedTicket);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentTicket?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;
    
    sendMessageMutation.mutate({
      ticketId: selectedTicket,
      content: newMessage.trim()
    });
  };

  const handleCreateTicket = () => {
    const subject = prompt("Enter ticket subject:");
    const category = prompt("Enter category (general, technical, billing, trading):");
    const initialMessage = prompt("Enter your message:");
    
    if (subject && category && initialMessage) {
      createTicketMutation.mutate({
        subject,
        category,
        priority: 'medium',
        initialMessage
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case 'user': return <User className="h-4 w-4" />;
      case 'support': return <MessageCircle className="h-4 w-4" />;
      case 'bot': return <Bot className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Support Center</h1>
        <p className="text-muted-foreground">
          Get help with your account, trading, and platform questions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Support Tickets
                </CardTitle>
                <Button onClick={handleCreateTicket} size="sm">
                  New Ticket
                </Button>
              </div>
              <CardDescription>Your support conversations</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Tickets List */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map(ticket => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTicket === ticket.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm truncate">{ticket.subject}</h4>
                          <div className="flex space-x-1">
                            <Badge className={getStatusColor(ticket.status)} variant="outline">
                              {ticket.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{ticket.category}</span>
                          <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                            {ticket.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {ticket.messages.length} messages
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Tickets Found</h3>
                      <p className="text-muted-foreground text-sm">
                        {searchQuery ? 'No tickets match your search.' : 'Create your first support ticket to get started.'}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          {currentTicket ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{currentTicket.subject}</CardTitle>
                    <CardDescription className="flex items-center space-x-2 mt-1">
                      <span>Ticket #{currentTicket.id}</span>
                      <Badge className={getStatusColor(currentTicket.status)}>
                        {currentTicket.status}
                      </Badge>
                      <Badge className={getPriorityColor(currentTicket.priority)}>
                        {currentTicket.priority}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentTicket.assignedAgent && (
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{currentTicket.assignedAgent}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {currentTicket.messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : message.sender === 'bot'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          {getSenderIcon(message.sender)}
                          <span className="text-xs font-medium">
                            {message.sender === 'user' ? 'You' : 
                             message.sender === 'bot' ? 'AI Assistant' : 'Support Agent'}
                          </span>
                          <span className="text-xs opacity-70">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center space-x-1 text-xs">
                                <Paperclip className="h-3 w-3" />
                                <span>{attachment}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Select a Ticket</h3>
                <p className="text-muted-foreground mb-4">
                  Choose a support ticket from the sidebar to view the conversation
                </p>
                <Button onClick={handleCreateTicket}>
                  Create New Ticket
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqData?.faqs?.slice(0, 6).map((faq: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">{faq.question}</h4>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              )) || (
                <>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">How do I deposit funds?</h4>
                    <p className="text-sm text-muted-foreground">
                      Go to your wallet page and click on "Deposit". Choose your preferred payment method and follow the instructions.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">How do I start trading?</h4>
                    <p className="text-sm text-muted-foreground">
                      After depositing funds, navigate to Flash Trade or Quick Trade to begin trading with our AI-powered platform.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">What is KYC verification?</h4>
                    <p className="text-sm text-muted-foreground">
                      KYC (Know Your Customer) is a verification process required to ensure platform security and compliance.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">How do withdrawals work?</h4>
                    <p className="text-sm text-muted-foreground">
                      Withdrawals are processed within 24-48 hours after verification. Ensure your account is fully verified.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">What are the trading fees?</h4>
                    <p className="text-sm text-muted-foreground">
                      Our platform charges competitive fees based on your trading volume and account tier.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Is my data secure?</h4>
                    <p className="text-sm text-muted-foreground">
                      Yes, we use bank-level encryption and security measures to protect your personal and financial data.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 