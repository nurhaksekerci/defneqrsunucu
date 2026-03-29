'use client';

import { useAuth } from '@/components/AuthProvider';

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="chp-page-title">Profil</h1>
      {user ? (
        <div className="chp-card-elevated space-y-4 p-6 sm:p-8">
          <div>
            <p className="chp-section-label">Görünen ad</p>
            <p className="text-lg font-bold text-chp-ink">{user.displayName}</p>
          </div>
          <div>
            <p className="chp-section-label">Kullanıcı adı</p>
            <p className="font-semibold text-chp-ink">{user.username}</p>
          </div>
          {user.email ? (
            <div>
              <p className="chp-section-label">E-posta</p>
              <p className="font-semibold text-chp-ink">{user.email}</p>
            </div>
          ) : null}
          <div className="border-t border-chp-border pt-5">
            <p className="chp-section-label mb-3">Üyelikler</p>
            <ul className="space-y-2 text-sm">
              {(user.memberships ?? []).map((m) => (
                <li
                  key={m.orgUnitId}
                  className="rounded-xl border border-chp-border/80 bg-slate-50/80 p-4">
                  <p className="font-semibold text-chp-ink">{m.label}</p>
                  <p className="mt-0.5 text-chp-inkMuted">
                    {m.roleLabel}
                    {m.isPrimary ? ' · Birincil' : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-sm font-medium text-chp-inkMuted">Profil yüklenemedi.</p>
      )}
      <button
        type="button"
        onClick={() => void refreshUser()}
        className="chp-btn-secondary w-full">
        Bilgileri yenile
      </button>
      <button type="button" onClick={() => logout()} className="chp-btn-primary w-full">
        Çıkış yap
      </button>
    </div>
  );
}
