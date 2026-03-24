export type CoordinationHatRow = {
  id: number;
  name: string;
  coordination_bucket?: string | null;
  coordination_line?: string | null;
};

/** Kol boşken tüm hatlar; kol doluyken yalnızca o koldaki kayıtlar (satır filtresi yok). */
export function filterHatsByBucket(
  hats: CoordinationHatRow[],
  bucket: string,
): CoordinationHatRow[] {
  if (!bucket.trim()) return hats;
  return hats.filter((h) => (h.coordination_bucket ?? "") === bucket);
}

const KOL_ICI_HAT_TURU = new Set([
  "il_baskanligi",
  "ilce_baskanligi",
  "komisyon",
]);

/**
 * Kol seçiliyken hat süzgecinde yalnızca kol içi türü tanımlı satırlar.
 */
export function hatsVisibleUnderKol(
  hats: CoordinationHatRow[],
  bucket: string,
): CoordinationHatRow[] {
  const inCol = hats.filter((h) => (h.coordination_bucket ?? "") === bucket);
  return inCol.filter(
    (h) => h.coordination_line != null && KOL_ICI_HAT_TURU.has(h.coordination_line),
  );
}

export type HatOptionGroup = {
  label: string;
  options: { value: string; label: string }[];
};

export function hatSelectGroupsForKol(
  hats: CoordinationHatRow[],
  bucket: string,
): HatOptionGroup[] {
  const scoped = hatsVisibleUnderKol(hats, bucket);
  const il = scoped.filter((h) => h.coordination_line === "il_baskanligi");
  const ilce = scoped.filter((h) => h.coordination_line === "ilce_baskanligi");
  const kom = scoped.filter((h) => h.coordination_line === "komisyon");
  const mapOpts = (xs: CoordinationHatRow[]) =>
    xs.map((h) => ({ value: String(h.id), label: h.name }));
  const groups: HatOptionGroup[] = [];
  if (il.length)
    groups.push({ label: "İl Başkanlığı", options: mapOpts(il) });
  if (ilce.length)
    groups.push({ label: "İlçe Başkanlıkları", options: mapOpts(ilce) });
  if (kom.length) groups.push({ label: "Komisyonlar", options: mapOpts(kom) });
  return groups;
}
