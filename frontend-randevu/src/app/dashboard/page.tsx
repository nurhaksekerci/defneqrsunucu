'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Business {
  id: string;
  name: string;
  slug: string;
  _count?: { staff: number; services: number; customers: number };
}

export default function DashboardPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const res = await api.get('/businesses/my');
      if (res.data.success) setBusinesses(res.data.data);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post('/businesses', { name: newName.trim() });
      setNewName('');
      setShowCreate(false);
      loadBusinesses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'İşletme oluşturulamadı');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">İşletmelerim</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-lg font-medium"
        >
          + Yeni İşletme
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 p-6 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="İşletme adı"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
            >
              {creating ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </form>
      )}

      {businesses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-gray-200 text-gray-500">
          <p className="text-lg mb-2">Henüz işletme eklenmemiş</p>
          <p className="text-sm">Yeni işletme oluştur butonuna tıklayarak başlayın</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {businesses.map((b) => (
            <Link
              key={b.id}
              href={`/dashboard/business/${b.id}`}
              className="block p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all"
            >
              <h2 className="font-semibold text-gray-900 text-lg">{b.name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {b._count?.staff ?? 0} personel · {b._count?.services ?? 0} hizmet · {b._count?.customers ?? 0} müşteri
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
