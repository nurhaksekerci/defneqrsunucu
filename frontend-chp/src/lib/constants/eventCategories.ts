export type EventCategoryId =
  | 'mahalle_saha'
  | 'toplanti'
  | 'miting'
  | 'egitim'
  | 'kampanya'
  | 'ziyaret'
  | 'diger';

export type EventCategory = { id: EventCategoryId; label: string };

export const EVENT_CATEGORIES: EventCategory[] = [
  { id: 'mahalle_saha', label: 'Mahalle / saha çalışması' },
  { id: 'toplanti', label: 'Toplantı / örgüt' },
  { id: 'miting', label: 'Miting / açık alan etkinliği' },
  { id: 'egitim', label: 'Eğitim / seminer' },
  { id: 'kampanya', label: 'Kampanya / tanıtım' },
  { id: 'ziyaret', label: 'Ziyaret' },
  { id: 'diger', label: 'Diğer' },
];
