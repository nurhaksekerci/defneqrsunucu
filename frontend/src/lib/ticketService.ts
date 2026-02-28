import api from './api';

export type TicketCategory = 'TECHNICAL' | 'BILLING' | 'FEATURE_REQUEST' | 'BUG_REPORT' | 'GENERAL';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';

export interface TicketUser {
  id: string;
  fullName: string;
  email: string;
}

export interface TicketRestaurant {
  id: string;
  name: string;
  slug: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  restaurantId?: string;
  user: TicketUser;
  restaurant?: TicketRestaurant;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: TicketUser;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  author: TicketUser;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  TECHNICAL: 'Teknik',
  BILLING: 'Faturalama',
  FEATURE_REQUEST: 'Özellik Talebi',
  BUG_REPORT: 'Hata Bildirimi',
  GENERAL: 'Genel',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
  URGENT: 'Acil',
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Açık',
  IN_PROGRESS: 'İşlemde',
  WAITING_CUSTOMER: 'Müşteri Bekleniyor',
  RESOLVED: 'Çözüldü',
  CLOSED: 'Kapatıldı',
};

export const ticketService = {
  getMyTickets: (params?: { page?: number; status?: TicketStatus; category?: TicketCategory }) =>
    api.get('/tickets/my', { params }),

  getAllTickets: (params?: { page?: number; status?: TicketStatus; category?: TicketCategory; priority?: TicketPriority; search?: string }) =>
    api.get('/tickets', { params }),

  getTicket: (id: string) => api.get(`/tickets/${id}`),

  createTicket: (data: { subject: string; description: string; category: TicketCategory; priority?: TicketPriority; restaurantId?: string }) =>
    api.post('/tickets', data),

  updateTicket: (id: string, data: { status?: TicketStatus; priority?: TicketPriority; assignedToId?: string; resolution?: string }) =>
    api.put(`/tickets/${id}`, data),

  addMessage: (id: string, data: { message: string; isInternal?: boolean }) =>
    api.post(`/tickets/${id}/messages`, data),
};
