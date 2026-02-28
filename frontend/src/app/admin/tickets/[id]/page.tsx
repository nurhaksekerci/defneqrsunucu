'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ticketService, type SupportTicket, type TicketMessage, STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS, type TicketStatus, type TicketPriority } from '@/lib/ticketService';
import api from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  WAITING_CUSTOMER: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

interface UserOption {
  id: string;
  fullName: string;
  email: string;
}

export default function AdminTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [staffUsers, setStaffUsers] = useState<UserOption[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [priority, setPriority] = useState<TicketPriority | ''>('');
  const [assignedToId, setAssignedToId] = useState('');
  const [resolution, setResolution] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadTicket();
    loadStaffUsers();
  }, [id]);

  const loadTicket = async () => {
    try {
      setIsLoading(true);
      const res = await ticketService.getTicket(id);
      const t = res.data.data;
      setTicket(t);
      setStatus(t.status);
      setPriority(t.priority);
      setAssignedToId(t.assignedTo?.id || '');
      setResolution(t.resolution || '');
    } catch (error) {
      console.error('Talep yüklenemedi:', error);
      router.push('/admin/tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaffUsers = async () => {
    try {
      const res = await api.get('/users', { params: { limit: 50 } });
      const users = (res.data.data || []).filter(
        (u: { role: string }) => u.role === 'ADMIN' || u.role === 'STAFF'
      );
      setStaffUsers(users.map((u: { id: string; fullName: string; email: string }) => ({ id: u.id, fullName: u.fullName, email: u.email })));
    } catch {
      setStaffUsers([]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ticket) return;
    const canReply = ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED';
    if (!canReply) return;

    try {
      setIsSending(true);
      await ticketService.addMessage(id, { message: newMessage.trim(), isInternal });
      setNewMessage('');
      loadTicket();
    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
      alert('Mesaj gönderilemedi.');
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateTicket = async () => {
    try {
      setIsUpdating(true);
      await ticketService.updateTicket(id, {
        status: status || undefined,
        priority: priority || undefined,
        assignedToId: assignedToId || undefined,
        resolution: resolution || undefined,
      });
      loadTicket();
    } catch (error) {
      console.error('Talep güncellenemedi:', error);
      alert('Talep güncellenemedi.');
    } finally {
      setIsUpdating(false);
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

  if (isLoading || !ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const canReply = ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED';
  const messages = (ticket as SupportTicket & { messages?: TicketMessage[] }).messages || [];

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/tickets')}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          ← Taleplere Dön
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-mono text-sm text-gray-500">{ticket.ticketNumber}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[ticket.status] || 'bg-gray-100'}`}>
                {STATUS_LABELS[ticket.status]}
              </span>
              <span className="text-sm text-gray-500">
                {CATEGORY_LABELS[ticket.category]} • {PRIORITY_LABELS[ticket.priority]}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {ticket.user.fullName} ({ticket.user.email})
              {ticket.restaurant && ` • ${ticket.restaurant.name}`}
            </p>
          </div>

          <Card>
            <CardContent className="py-4">
              <h3 className="font-semibold text-gray-900 mb-2">Açıklama</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              <p className="text-xs text-gray-500 mt-2">{formatDate(ticket.createdAt)}</p>
            </CardContent>
          </Card>

          <h3 className="font-semibold text-gray-900">Mesajlar</h3>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg ${msg.isInternal ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900">
                    {msg.author.fullName}
                    {msg.isInternal && <span className="ml-2 text-amber-600 text-xs">(İç not)</span>}
                  </span>
                  <span className="text-sm text-gray-500">{formatDate(msg.createdAt)}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))}
          </div>

          {canReply && (
            <Card>
              <CardContent className="py-4">
                <form onSubmit={handleSendMessage}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yanıt Yaz</label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    maxLength={5000}
                  />
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="isInternal"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="isInternal" className="text-sm text-gray-600">İç not (müşteri görmez)</label>
                  </div>
                  <Button type="submit" isLoading={isSending} disabled={!newMessage.trim() || isSending}>
                    Gönder
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Talep Yönetimi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TicketStatus)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Öncelik</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              {staffUsers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Atanan</label>
                  <select
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="">Atanmadı</option>
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Çözüm Notu</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Çözüm açıklaması..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  maxLength={5000}
                />
              </div>
              <Button onClick={handleUpdateTicket} isLoading={isUpdating} className="w-full">
                Güncelle
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
