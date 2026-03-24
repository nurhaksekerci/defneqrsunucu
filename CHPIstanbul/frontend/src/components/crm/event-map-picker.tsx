"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPin, Search } from "lucide-react";

/** İstanbul merkez — ilk görünüm */
const IST = { lat: 41.0082, lng: 28.9784 };

function fixLeafletIcons() {
  const proto = L.Icon.Default.prototype as unknown as {
    _getIconUrl?: () => string;
  };
  delete proto._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

type GeocodeHit = { lat: number; lon: number; label: string };

type EventMapPickerProps = {
  onPick: (lat: number, lng: number) => void;
};

export function EventMapPicker({ onPick }: EventMapPickerProps) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const flyTo = useCallback((lat: number, lng: number, zoom = 15) => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    map.flyTo([lat, lng], zoom, { duration: 0.55 });
    marker.setLatLng([lat, lng]);
    onPickRef.current(lat, lng);
  }, []);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    fixLeafletIcons();

    const map = L.map(mapEl.current, {
      scrollWheelZoom: true,
    }).setView([IST.lat, IST.lng], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap katkıcıları",
    }).addTo(map);

    const marker = L.marker([IST.lat, IST.lng], {
      draggable: true,
    }).addTo(map);

    const sync = () => {
      const p = marker.getLatLng();
      onPickRef.current(p.lat, p.lng);
    };

    sync();
    marker.on("dragend", sync);
    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      sync();
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    setHits([]);
    setListOpen(true);
    try {
      const res = await fetch(
        `/api/geocode?q=${encodeURIComponent(q)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setSearchError(
          typeof data.error === "string" ? data.error : "Arama başarısız",
        );
        return;
      }
      const list = Array.isArray(data) ? (data as GeocodeHit[]) : [];
      if (!list.length) {
        setSearchError("Sonuç bulunamadı — farklı anahtar kelime deneyin.");
        return;
      }
      setHits(list);
    } catch {
      setSearchError("Bağlantı hatası.");
    } finally {
      setSearching(false);
    }
  };

  const pickHit = (h: GeocodeHit) => {
    flyTo(h.lat, h.lon, 16);
    setListOpen(false);
    setHits([]);
    setQuery("");
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <label htmlFor="map-search" className="sr-only">
          Adres veya yer ara
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              strokeWidth={2}
              aria-hidden
            />
            <input
              id="map-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void runSearch();
                }
              }}
              onFocus={() => hits.length > 0 && setListOpen(true)}
              placeholder="Mahalle, cadde, meydan ara (ör. Kadıköy iskele)"
              className="h-9 w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-[13px] outline-none focus:border-border-strong focus:ring-1 focus:ring-chp-navy/12"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            disabled={searching || !query.trim()}
            onClick={() => void runSearch()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-chp-navy bg-chp-navy px-3 py-2 text-[12px] font-semibold text-white shadow-crm-sm transition-colors hover:bg-chp-navy-muted disabled:pointer-events-none disabled:opacity-50"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <MapPin className="h-4 w-4" aria-hidden />
            )}
            Ara
          </button>
        </div>

        {searchError ? (
          <p className="mt-1.5 text-[12px] text-chp-red">{searchError}</p>
        ) : null}

        {listOpen && hits.length > 0 ? (
          <ul
            className="absolute left-0 right-0 top-full z-[200] mt-1 max-h-48 overflow-auto rounded-md border border-border bg-surface py-1 text-[12px] shadow-crm"
            role="listbox"
          >
            {hits.map((h, i) => (
              <li key={`${h.lat}-${h.lon}-${i}`}>
                <button
                  type="button"
                  role="option"
                  className="w-full px-3 py-2 text-left leading-snug text-foreground transition-colors hover:bg-slate-50"
                  onClick={() => pickHit(h)}
                >
                  {h.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div
        ref={mapEl}
        className="h-[min(240px,40vh)] w-full min-h-[200px] overflow-hidden rounded-md border border-border"
        role="presentation"
      />
    </div>
  );
}
