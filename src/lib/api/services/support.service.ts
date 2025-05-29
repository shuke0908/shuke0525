import { BaseApiClient } from '../core/base-client';
import type { PaginationParams, PaginatedResponse } from '../core/types';

export class SupportService extends BaseApiClient {
  constructor(customBaseURL?: string) {
    super(customBaseURL);
  }

  async getTickets(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.getPaginated<any>('/api/support/tickets', params);
  }

  async createTicket(data: any): Promise<{ ticket: any; message: string }> {
    return this.post<{ ticket: any; message: string }>(
      '/api/support/tickets',
      data,
      {
        showSuccessToast: true,
      }
    );
  }

  async getTicket(ticketId: number): Promise<any> {
    return this.get<any>(`/api/support/tickets/${ticketId}`);
  }

  async getTicketMessages(ticketId: number): Promise<{ messages: any[] }> {
    return this.get<{ messages: any[] }>(`/api/support/tickets/${ticketId}/messages`);
  }

  async getMessages(ticketId: number): Promise<any> {
    return this.get<any>(`/api/support/tickets/${ticketId}/messages`);
  }

  async sendMessage(
    ticketId: number,
    message: string
  ): Promise<{ message: string }> {
    return this.post<{ message: string }>(
      `/api/support/tickets/${ticketId}/messages`,
      { message },
      {
        showSuccessToast: true,
      }
    );
  }

  async addMessage(
    ticketId: number,
    data: { message: string }
  ): Promise<{ message: string }> {
    return this.post<{ message: string }>(
      `/api/support/tickets/${ticketId}/messages`,
      data,
      {
        showSuccessToast: true,
      }
    );
  }

  // 티켓 상태 관리
  async closeTicket(ticketId: number): Promise<{ message: string }> {
    return this.patch<{ message: string }>(
      `/api/support/tickets/${ticketId}/close`,
      undefined,
      {
        showSuccessToast: true,
      }
    );
  }

  async reopenTicket(ticketId: number): Promise<{ message: string }> {
    return this.patch<{ message: string }>(
      `/api/support/tickets/${ticketId}/reopen`,
      undefined,
      {
        showSuccessToast: true,
      }
    );
  }

  // 파일 첨부
  async uploadAttachment(
    ticketId: number,
    file: File
  ): Promise<{ url: string; message: string }> {
    return this.uploadFile<{ url: string; message: string }>(
      `/api/support/tickets/${ticketId}/attachments`,
      file,
      undefined,
      undefined,
      {
        showSuccessToast: true,
      }
    );
  }

  // FAQ 관련
  async getFAQs(): Promise<{ faqs: any[] }> {
    return this.get<{ faqs: any[] }>('/api/support/faqs');
  }

  async getFAQCategories(): Promise<{ categories: any[] }> {
    return this.get<{ categories: any[] }>('/api/support/faq-categories');
  }

  // 공지사항
  async getAnnouncements(): Promise<{ announcements: any[] }> {
    return this.get<{ announcements: any[] }>('/api/support/announcements');
  }
} 