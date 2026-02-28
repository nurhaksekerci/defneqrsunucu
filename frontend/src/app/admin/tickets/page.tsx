'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ticketService, type SupportTicket, STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS } from '@/lib/ticketService';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  WAITING_CUSTOMER: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export default function AdminTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });

  useEffect(() => {
    loadTickets();
  }, [statusFilter, search]);

  const loadTickets = async (page = 1) => {
    try {
      setIsLoading(true);
      const params: Record<string, string | number> = { page };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await ticketService.getAllTickets(params);
      setTickets(res.data.data || []);
      setPagination(res.data.pagination || { currentPage: 1, totalPages: 1, totalCount: 0 });
    } catch (error) {
      console.error('Talepler yüklenemedi:', error);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Destek Talepleri</h1>
        <p className="text-gray-600">Tüm destek taleplerini yönetin</p>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Talep no, konu veya email ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadTickets()}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Tüm Durumlar</option>
          <option value="OPEN">Açık</option>
          <option value="IN_PROGRESS">İşlemde</option>
          <option value="WAITING_CUSTOMER">Müşteri Bekleniyor</option>
          <option value="RESOLVED">Çözüldü</option>
          <option value="CLOSED">Kapatıldı</option>
        </select>
        <Button variant="secondary" size="sm" onClick={() => loadTickets()}>
          Ara
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Henüz destek talebi bulunmuyor.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
            >
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-sm text-gray-500">{ticket.ticketNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[ticket.status] || 'bg-gray-100'}`}>
                        {STATUS_LABELS[ticket.status]}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${PRIORITY_COLORS[ticket.priority] || 'bg-gray-100'}`}>
                        {PRIORITY_LABELS[ticket.priority]}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">{ticket.subject}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {ticket.user.fullName} ({ticket.user.email}) • {CATEGORY_LABELS[ticket.category]} • {ticket._count?.messages ?? 0} mesaj
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 shrink-0">
                    {formatDate(ticket.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.currentPage <= 1}
                onClick={() => loadTickets(pagination.currentPage - 1)}
              >
                Önceki
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => loadTickets(pagination.currentPage + 1)}
              >
                Sonraki
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
