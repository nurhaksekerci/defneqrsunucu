export type DistrictId =
  | 'zeytinburnu'
  | 'kadikoy'
  | 'besiktas'
  | 'sisli'
  | 'uskudar';

export type DistrictOption = { id: DistrictId; label: string };

export const DISTRICT_FILTER_OPTIONS: DistrictOption[] = [
  { id: 'zeytinburnu', label: 'Zeytinburnu' },
  { id: 'kadikoy', label: 'Kadıköy' },
  { id: 'besiktas', label: 'Beşiktaş' },
  { id: 'sisli', label: 'Şişli' },
  { id: 'uskudar', label: 'Üsküdar' },
];
