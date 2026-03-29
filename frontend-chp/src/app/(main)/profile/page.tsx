'use client';

import { useAuth } from '@/components/AuthProvider';

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-3xl font-bold text-neutral-900">Profil</h1>
      {user ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-2">
          <p className="text-sm text-neutral-500">Görünen ad</p>
          <p className="text-lg font-bold text-neutral-900">{user.displayName}</p>
          <p className="text-sm text-neutral-500">Kullanıcı adı</p>
          <p className="font-semibold">{user.username}</p>
          {user.email ? (
            <>
              <p className="text-sm text-neutral-500">E-posta</p>
              <p className="font-semibold">{user.email}</p>
            </>
          ) : null}
          <div className="pt-4 border-t border-neutral-100">
            <p className="text-sm font-bold text-neutral-700 mb-2">Üyelikler</p>
            <ul className="space-y-2 text-sm">
              {(user.memberships ?? []).map((m) => (
                <li key={m.orgUnitId} className="rounded-lg bg-neutral-50 p-3">
                  <p className="font-semibold">{m.label}</p>
                  <p className="text-neutral-600">
                    {m.roleLabel}
                    {m.isPrimary ? ' · Birincil' : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-neutral-500">Profil yüklenemedi.</p>
      )}
      <button
        type="button"
        onClick={() => void refreshUser()}
        className="w-full rounded-xl border border-neutral-200 py-3 font-semibold text-neutral-800">
        Bilgileri yenile
      </button>
      <button
        type="button"
        onClick={() => logout()}
        className="w-full rounded-xl bg-chp-red py-3 font-bold text-white">
        Çıkış yap
      </button>
    </div>
  );
}
