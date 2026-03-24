"use client";

import { SectionCard } from "@/components/crm/section-card";
import { useAuth } from "@/contexts/auth-context";

export default function AyarlarPage() {
  const { user } = useAuth();
  const inputClass =
    "mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none transition-shadow focus:border-border-strong focus:ring-1 focus:ring-chp-navy/12";

  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
    "—";

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <SectionCard title="Profil">
        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Kullanıcı adı
            </label>
            <input
              className={inputClass}
              readOnly
              value={user?.username ?? ""}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Ad Soyad
            </label>
            <input className={inputClass} readOnly value={fullName} />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              E-posta
            </label>
            <input
              className={inputClass}
              readOnly
              value={user?.email ?? ""}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Hat
            </label>
            <input
              className={inputClass}
              readOnly
              value={user?.hat_name ?? "Atanmamış"}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              İlçe
            </label>
            <input
              className={inputClass}
              readOnly
              value={user?.district_name ?? "Atanmamış"}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Örgüt kapsamı
            </label>
            <input
              className={inputClass}
              readOnly
              value={
                user?.is_provincial_official
                  ? user?.hat_is_coordination
                    ? "İl yetkilisi · Ana Kademe (tüm hatlar, isteğe bağlı ilçe süzgeci)"
                    : "İl yetkilisi (kendi hattı, isteğe bağlı ilçe süzgeci)"
                  : user?.hat_is_coordination
                    ? "İlçe koordinasyonu (ilçede tüm hatlar)"
                    : "İlçe hat sorumlusu"
              }
            />
          </div>
          <p className="text-[12px] text-muted">
            Profil düzenleme için yönetici paneli veya ileride açılacak API
            kullanılacaktır.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Güvenlik">
        <div className="px-5 py-5 text-[13px] leading-relaxed text-muted">
          İki aşamalı doğrulama ve şifre sıfırlama backend tarafında
          etkinleştirildiğinde burada gösterilecek.
        </div>
      </SectionCard>
    </div>
  );
}
