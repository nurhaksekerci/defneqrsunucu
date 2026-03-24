/** Django /api/events/ liste öğesi */
export type ApiEvent = {
  id: number;
  title: string;
  description: string;
  starts_at: string;
  status: "planned" | "completed";
  hat_name: string;
  /** Hat koordinasyon kolu etiketi (il yetkilisi panosu vb.) */
  coordination_kolu?: string;
  district_name: string;
  location_kind: "address" | "map";
  address_text: string;
  latitude: string | null;
  longitude: string | null;
  has_report: boolean;
  /** Varsa tamamlanan etkinlik satırından raporlar sayfasına bağlanır */
  report_id: number | null;
  completed_at: string | null;
  created_at: string;
};

/** Rapor detayında görsel id (kaldırmak için); liste yanıtında olmayabilir */
export type ReportImageItem = { id: number; url: string };

/** Django /api/reports/ liste veya detay */
export type ApiReport = {
  id: number;
  etkinlik: string;
  hat: string;
  ilce: string;
  gonderen: string;
  durum: string;
  ozet: string;
  gorseller: string[];
  updated_at: string;
  event_id?: number;
  status_code?: "draft" | "review" | "published";
  can_edit?: boolean;
  /** Sadece GET /api/reports/:id/ */
  image_items?: ReportImageItem[];
};
