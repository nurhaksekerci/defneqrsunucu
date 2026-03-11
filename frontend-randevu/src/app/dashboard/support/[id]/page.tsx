'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ticketService, type SupportTicket, type TicketMessage, STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS } from '@/lib/ticketService';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  WAITING_CUSTOMER: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [isRating, setIsRating] = useState(false);

  useEffect(() => {
    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    try {
      setIsLoading(true);
      const res = await ticketService.getTicket(id);
      setTicket(res.data.data);
    } catch (error) {
      console.error('Talep yüklenemedi:', error);
      router.push('/dashboard/support');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRate = async () => {
    if (!rating || rating < 1 || rating > 10) return;
    try {
      setIsRating(true);
      await ticketService.rateTicket(id, { rating });
      loadTicket();
    } catch (error) {
      console.error('Değerlendirme gönderilemedi:', error);
      alert('Değerlendirme kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsRating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ticket) return;
    const canReply = ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED';
    if (!canReply) return;

    try {
      setIsSending(true);
      await ticketService.addMessage(id, { message: newMessage.trim() });
      setNewMessage('');
      loadTicket();
    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
      alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSending(false);
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
          onClick={() => router.push('/dashboard/support')}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          ← Taleplere Dön
        </button>
      </div>

      <div className="mb-6">
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
        {ticket.restaurant && (
          <p className="text-sm text-gray-500 mt-1">İlgili restoran: {ticket.restaurant.name}</p>
        )}
      </div>

      <Card className="mb-6">
        <CardContent className="py-4">
          <h3 className="font-semibold text-gray-900 mb-2">Açıklama</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          <p className="text-xs text-gray-500 mt-2">{formatDate(ticket.createdAt)}</p>
        </CardContent>
      </Card>

      {ticket.resolution && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="py-4">
            <h3 className="font-semibold text-green-900 mb-2">Çözüm</h3>
            <p className="text-green-800 whitespace-pre-wrap">{ticket.resolution}</p>
            {ticket.resolvedAt && (
              <p className="text-xs text-green-600 mt-2">{formatDate(ticket.resolvedAt)}</p>
            )}
          </CardContent>
        </Card>
      )}

      <h3 className="font-semibold text-gray-900 mb-3">Mesajlar</h3>
      <div className="space-y-4 mb-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-4 rounded-lg ${msg.isInternal ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-gray-900">{msg.author.fullName}</span>
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
              <Button type="submit" isLoading={isSending} disabled={!newMessage.trim() || isSending}>
                Gönder
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!canReply && ticket.status === 'RESOLVED' && ticket.rating == null && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="py-6">
            <h3 className="font-semibold text-amber-900 mb-2">Cevabı değerlendirin</h3>
            <p className="text-sm text-amber-800 mb-4">Destek ekibimizin cevabını 1 ile 10 arasında yıldız ile değerlendirin.</p>
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`w-10 h-10 rounded-lg text-lg font-bold transition-all ${
                    rating >= star
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-xs text-amber-700 mb-4">
              Seçili: {rating > 0 ? `${rating} / 10` : '—'}
            </p>
            <Button
              onClick={handleRate}
              isLoading={isRating}
              disabled={rating < 1 || rating > 10 || isRating}
            >
              Değerlendirmeyi Gönder
            </Button>
          </CardContent>
        </Card>
      )}

      {!canReply && ticket.status === 'RESOLVED' && ticket.rating != null && (
        <p className="text-green-600 text-sm font-medium">Değerlendirmeniz için teşekkür ederiz ({ticket.rating}/10 ★)</p>
      )}
      {!canReply && ticket.status === 'CLOSED' && (
        <p className="text-gray-500 text-sm">Bu talep kapatıldığı için yeni mesaj eklenemez.</p>
      )}
    </div>
  );
}
