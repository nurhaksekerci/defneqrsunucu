/**
 * Etkinlik / rapor listesi API’sine ortak süzgeç parametreleri.
 */
export function appendEventListFilters(
  qs: URLSearchParams,
  opts: {
    district?: string;
    coordinationBucket?: string;
    hat?: string;
  },
): void {
  if (opts.district) qs.set("district", opts.district);
  if (opts.coordinationBucket) {
    qs.set("coordination_bucket", opts.coordinationBucket);
  }
  if (opts.hat) qs.set("hat", opts.hat);
}
