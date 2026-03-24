import { NextRequest, NextResponse } from "next/server";

/** OpenStreetMap Nominatim — sunucu tarafı proxy (CORS + User-Agent politikası) */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "q gerekli" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "8");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "tr");

  try {
    /** Sadece ASCII: Node fetch basliklari ByteString olmali (Turkce karakter 502 uretir) */
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "CHPIstanbul-CRM/1.0 (+https://github.com/chp-istanbul; contact@localhost)",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Konum servisi yanıt vermedi" },
        { status: 502 },
      );
    }

    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    const results = data
      .map((row) => ({
        lat: parseFloat(row.lat),
        lon: parseFloat(row.lon),
        label: row.display_name,
      }))
      .filter(
        (r) =>
          Number.isFinite(r.lat) &&
          Number.isFinite(r.lon) &&
          r.label?.length > 0,
      );

    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { error: "Ağ hatası — tekrar deneyin" },
      { status: 502 },
    );
  }
}
