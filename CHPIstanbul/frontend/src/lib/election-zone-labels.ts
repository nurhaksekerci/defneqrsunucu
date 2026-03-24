/** İstanbul milletvekili seçim bölgesi başlığı (sidebar vb.). */
export function electionZoneLabel(zone: number | null | undefined): string {
  if (zone === 1) return "1. Seçim Bölgesi";
  if (zone === 2) return "2. Seçim Bölgesi";
  if (zone === 3) return "3. Seçim Bölgesi";
  return "Diğer";
}

/** Sidebar sekmeleri: 1. / 2. / 3. Bölge */
export function bolgeTabLabel(zone: 1 | 2 | 3): string {
  return `${zone}. Bölge`;
}

export function groupDistrictsByElectionZone<
  T extends { election_zone?: number | null },
>(districts: T[]): Map<number | "other", T[]> {
  const m = new Map<number | "other", T[]>();
  for (const d of districts) {
    const z = d.election_zone;
    const key =
      z === 1 || z === 2 || z === 3 ? z : ("other" as const);
    const list = m.get(key) ?? [];
    list.push(d);
    m.set(key, list);
  }
  return m;
}

