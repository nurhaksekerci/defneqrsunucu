'use client';

import { CrmPageHeader } from '@/components/crm/CrmPageHeader';
import { useAuth } from '@/components/AuthProvider';

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <CrmPageHeader kicker="Hesap" title="Profil" />
      {user ? (
        <div className="crm-panel space-y-5 p-6 sm:p-8">
          <div>
            <p className="chp-section-label !mb-1">Görünen ad</p>
            <p className="text-lg font-bold text-slate-900">{user.displayName}</p>
          </div>
          <div>
            <p className="chp-section-label !mb-1">Kullanıcı adı</p>
            <p className="font-semibold text-slate-800">{user.username}</p>
          </div>
          {user.email ? (
            <div>
              <p className="chp-section-label !mb-1">E-posta</p>
              <p className="font-semibold text-slate-800">{user.email}</p>
            </div>
          ) : null}
          <div className="border-t border-slate-100 pt-5">
            <p className="chp-section-label !mb-3">Üyelikler</p>
            <ul className="space-y-2 text-sm">
              {(user.memberships ?? []).map((m) => (
                <li
                  key={m.orgUnitId}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="font-semibold text-slate-900">{m.label}</p>
                  <p className="mt-1 text-slate-600">
                    {m.roleLabel}
                    {m.isPrimary ? ' · Birincil' : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="crm-panel py-12 text-center text-slate-600">Profil yüklenemedi.</div>
      )}
      <button
        type="button"
        onClick={() => void refreshUser()}
        className="chp-btn-secondary w-full py-3">
        Bilgileri yenile
      </button>
      <button type="button" onClick={() => logout()} className="chp-btn-primary w-full py-3">
        Çıkış yap
      </button>
    </div>
  );
}
