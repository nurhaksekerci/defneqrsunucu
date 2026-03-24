/** Üst çubuk araması — API öncesi statik indeks */
export type SearchHit = {
  href: string;
  label: string;
  description: string;
  tags?: string[];
};

export const HEADER_SEARCH_INDEX: SearchHit[] = [
  {
    href: "/",
    label: "Pano",
    description: "Özet metrikler, son hareketler ve hızlı işlemler",
    tags: ["dashboard", "ana sayfa", "özet"],
  },
  {
    href: "/etkinlikler",
    label: "Etkinlikler",
    description: "Planlanan ve tamamlanan etkinlik kayıtları",
    tags: [
      "etkinlik",
      "plan",
      "ilçe",
      "kadıköy",
      "bakırköy",
      "şişli",
      "maltepe",
      "üsküdar",
      "fatih",
    ],
  },
  {
    href: "/raporlar",
    label: "Raporlar",
    description: "Etkinlik raporları ve özet metinler",
    tags: ["rapor", "özet", "görsel", "yayın"],
  },
  {
    href: "/ayarlar",
    label: "Ayarlar",
    description: "Hesap ve uygulama tercihleri",
    tags: ["ayar", "profil", "hesap"],
  },
];

export function filterSearchIndex(raw: string, items: SearchHit[]): SearchHit[] {
  const q = raw.trim().toLowerCase();
  if (!q) return [];

  const parts = q.split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const hay = [
      item.label,
      item.description,
      ...(item.tags ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return parts.every((p) => hay.includes(p));
  });
}
