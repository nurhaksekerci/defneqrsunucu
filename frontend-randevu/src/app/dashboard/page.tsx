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

  if (loading) return <div className="py-8 text-center text-gray-500">Yükleniyor...</div>;

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">İşletmelerim</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Yeni İşletme
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-white rounded-lg border">
          <input
            type="text"
            placeholder="İşletme adı"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full max-w-xs px-4 py-2 border rounded-lg mr-2"
          />
          <button type="submit" disabled={creating} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
            Oluştur
          </button>
        </form>
      )}

      {businesses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border text-gray-500">
          Henüz işletme eklenmemiş. Yeni işletme oluşturun.
        </div>
      ) : (
        <div className="grid gap-4">
          {businesses.map((b) => (
            <Link
              key={b.id}
              href={`/dashboard/business/${b.id}`}
              className="block p-4 bg-white rounded-lg border hover:border-indigo-300"
            >
              <h2 className="font-semibold">{b.name}</h2>
              <p className="text-sm text-gray-500">
                {b._count?.staff ?? 0} personel · {b._count?.services ?? 0} hizmet · {b._count?.customers ?? 0} müşteri
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
