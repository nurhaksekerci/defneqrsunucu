import { type ReactNode } from 'react';

type Props = {
  /** Üst satır etiketi (modül adı) */
  kicker: string;
  title: string;
  description?: string;
  /** Sağ üst aksiyon (buton vb.) */
  action?: ReactNode;
};

export function CrmPageHeader({ kicker, title, description, action }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
      <div className="min-w-0">
        <p className="crm-page-heading">{kicker}</p>
        <h1 className="crm-h1 mt-1">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
