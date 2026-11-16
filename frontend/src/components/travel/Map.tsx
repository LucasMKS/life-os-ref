"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ItineraryItem, PlaceToVisit } from "@/lib/types";
import { sanitizeUrl } from "@/lib/security";

export interface MapPoint {
  lat: number;
  lng: number;
  title: string;
  address?: string;
  source: "itinerary" | "place" | "both";
  events: Array<{ label: string; dateStr?: string; timeStr?: string }>;
  category?: string;
  googleMapsUrl?: string;
}

interface MapProps {
  destination: string;
  items: ItineraryItem[];
  places?: PlaceToVisit[];
  filterSource?: "ALL" | "ITINERARY" | "PLACES";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Memory & LocalStorage Cache for Geocoding
const geoCache: Record<string, { lat: number; lng: number } | null> = {};

function getCachedCoords(query: string): { lat: number; lng: number } | null | undefined {
  const key = query.toLowerCase().trim();
  if (geoCache[key] !== undefined) return geoCache[key];
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`lifeos_geo_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed === null ||
          (typeof parsed?.lat === "number" && typeof parsed?.lng === "number")
        ) {
          geoCache[key] = parsed;
          return parsed;
        }
      }
    } catch {}
  }
  return undefined;
}

function setCachedCoords(query: string, coords: { lat: number; lng: number } | null) {
  const key = query.toLowerCase().trim();
  geoCache[key] = coords;
  if (typeof window !== "undefined" && coords) {
    try {
      localStorage.setItem(`lifeos_geo_${key}`, JSON.stringify(coords));
    } catch {}
  }
}

// Progressive Geocoder with CEP breakdown and fallback strategies
async function geocodeQuery(
  rawQuery: string,
  destination: string
): Promise<{ lat: number; lng: number } | null> {
  const cleanRaw = rawQuery.trim();
  if (!cleanRaw) return null;

  const cached = getCachedCoords(cleanRaw);
  if (cached !== undefined) return cached;

  const candidates: string[] = [cleanRaw];

  const cepMatch = cleanRaw.match(/\b(\d{5})-?(\d{3})\b/);
  if (cepMatch) {
    const cepDigits = cepMatch[1] + cepMatch[2];
    try {
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const viaCepData = await viaCepRes.json();
      if (viaCepData && !viaCepData.erro) {
        const { logradouro, bairro, localidade, uf } = viaCepData;
        if (bairro && localidade) {
          candidates.push(`${bairro}, ${localidade}, ${uf || "ES"}`);
        }
        if (logradouro && localidade) {
          candidates.push(`${logradouro}, ${localidade}, ${uf || "ES"}`);
        }
      }
    } catch {}
  }

  const withoutCep = cleanRaw
    .replace(/\b\d{5}-?\d{3}\b/g, "")
    .replace(/,\s*,/g, ",")
    .trim();
  const expanded = withoutCep
    .replace(/\bR\.\s*/gi, "Rua ")
    .replace(/\bAv\.\s*/gi, "Avenida ");

  if (expanded && expanded !== cleanRaw) {
    candidates.push(expanded);
  }

  const hyphenParts = withoutCep.split(/[-–—]/);
  if (hyphenParts.length > 1) {
    const afterHyphen = hyphenParts.slice(1).join(" ").trim();
    if (afterHyphen) {
      candidates.push(afterHyphen);
    }
  }

  if (destination && !cleanRaw.toLowerCase().includes(destination.toLowerCase())) {
    candidates.push(`${withoutCep}, ${destination}`);
  }

  const uniqueCandidates = Array.from(new Set(candidates)).filter(Boolean);

  for (const candidate of uniqueCandidates) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(candidate)}&limit=1`,
        {
          headers: {
            "Accept-Language": "pt-BR,pt;q=0.9",
          },
        }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          const coords = { lat, lng };
          setCachedCoords(cleanRaw, coords);
          return coords;
        }
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  if (destination) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          const coords = { lat, lng };
          setCachedCoords(cleanRaw, coords);
          return coords;
        }
      }
    } catch {}
  }

  setCachedCoords(cleanRaw, null);
  return null;
}

export default function TravelMap({
  destination,
  items,
  places = [],
  filterSource = "ALL",
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const formatEventDate = (dateTimeStr?: string) => {
    if (!dateTimeStr) return { label: "Atividade agendada", dateStr: "", timeStr: "" };
    try {
      const date = new Date(dateTimeStr);
      if (isNaN(date.getTime())) {
        return { label: "Atividade agendada", dateStr: "", timeStr: "" };
      }
      const dayOfWeek = date.toLocaleDateString("pt-BR", { weekday: "short" });
      const dayAndMonth = date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      const time = date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const capitalizedDay =
        dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1).replace(".", "");
      return {
        label: `${capitalizedDay}, ${dayAndMonth} às ${time}`,
        dateStr: `${capitalizedDay}, ${dayAndMonth}`,
        timeStr: time,
      };
    } catch {
      return { label: "Atividade agendada", dateStr: "", timeStr: "" };
    }
  };

  useEffect(() => {
    let active = true;

    async function resolveAllPoints() {
      setLoading(true);
      const rawPoints: MapPoint[] = [];

      for (const item of items || []) {
        if (!active) break;
        const eventTime = formatEventDate(item.dateTime);

        if (
          typeof item.latitude === "number" &&
          typeof item.longitude === "number" &&
          !isNaN(item.latitude) &&
          !isNaN(item.longitude)
        ) {
          rawPoints.push({
            lat: item.latitude,
            lng: item.longitude,
            title: item.title || item.locationName || "Atividade",
            address: item.address || item.locationName,
            source: "itinerary",
            events: [eventTime],
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`,
          });
          continue;
        }

        const query = item.address || item.locationName;
        if (query) {
          const coords = await geocodeQuery(query, destination);
          if (coords && active) {
            rawPoints.push({
              lat: coords.lat,
              lng: coords.lng,
              title: item.title || item.locationName || "Atividade",
              address: item.address || item.locationName,
              source: "itinerary",
              events: [eventTime],
              googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`,
            });
          }
        }
      }

      for (const place of places || []) {
        if (!active) break;
        const query =
          place.address ||
          (place.neighborhood
            ? `${place.neighborhood}, ${destination}`
            : `${place.name}, ${destination}`);
        if (query) {
          const coords = await geocodeQuery(query, destination);
          if (coords && active) {
            const safeCustomUrl = sanitizeUrl(place.mapUrl);
            rawPoints.push({
              lat: coords.lat,
              lng: coords.lng,
              title: place.name || "Lugar",
              address: place.address || place.neighborhood,
              category: place.category,
              source: "place",
              events: [
                {
                  label: `Lugar para Ir (${
                    place.priority === "MUST_VISIT" ? "Imperdível" : "Desejo"
                  })`,
                },
              ],
              googleMapsUrl:
                safeCustomUrl ||
                `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`,
            });
          }
        }
      }

      const mergedPoints: MapPoint[] = [];
      const threshold = 0.0003;

      for (const pt of rawPoints) {
        const existing = mergedPoints.find(
          (m) => Math.abs(m.lat - pt.lat) < threshold && Math.abs(m.lng - pt.lng) < threshold
        );

        if (existing) {
          existing.events.push(...pt.events);
          if (existing.source !== pt.source) {
            existing.source = "both";
          }
          if (!existing.address && pt.address) {
            existing.address = pt.address;
          }
        } else {
          mergedPoints.push({
            ...pt,
            events: [...pt.events],
          });
        }
      }

      if (mergedPoints.length === 0 && destination && active) {
        const destCoords = await geocodeQuery(destination, "");
        if (destCoords && active) {
          mergedPoints.push({
            lat: destCoords.lat,
            lng: destCoords.lng,
            title: destination,
            address: destination,
            source: "itinerary",
            events: [{ label: "Destino da Viagem" }],
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              destination
            )}`,
          });
        }
      }

      if (active) {
        setPoints(mergedPoints);
        setLoading(false);
      }
    }

    resolveAllPoints();

    return () => {
      active = false;
    };
  }, [items, places, destination]);

  const visiblePoints = useMemo(() => {
    if (filterSource === "ALL") return points;
    if (filterSource === "ITINERARY") {
      return points.filter((p) => p.source === "itinerary" || p.source === "both");
    }
    if (filterSource === "PLACES") {
      return points.filter((p) => p.source === "place" || p.source === "both");
    }
    return points;
  }, [points, filterSource]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (!mapRef.current) {
      mapRef.current = L.map(container, {
        zoomControl: true,
        attributionControl: false,
      }).setView([0, 0], 2);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (visiblePoints.length > 0) {
      const bounds = L.latLngBounds([]);

      visiblePoints.forEach((point) => {
        const latLng = L.latLng(point.lat, point.lng);
        bounds.extend(latLng);

        const isMultiple = point.events.length > 1;
        let markerBg = "#f4f4f5";
        let markerText = "#09090b";
        let badgeBg = "rgba(255,255,255,0.08)";
        let badgeColor = "#e4e4e7";
        let badgeLabel = "Roteiro";

        if (point.source === "both" || isMultiple) {
          markerBg = "#a78bfa";
          markerText = "#09090b";
          badgeBg = "rgba(167,139,250,0.15)";
          badgeColor = "#c4b5fd";
          badgeLabel = `${point.events.length} visitas agendadas`;
        } else if (point.source === "place") {
          markerBg = "#34d399";
          markerText = "#09090b";
          badgeBg = "rgba(52,211,153,0.15)";
          badgeColor = "#6ee7b7";
          badgeLabel = "Lugar para Ir";
        }

        const customIcon = L.divIcon({
          html: `
            <div style="width:24px;height:24px;border-radius:9999px;background:${markerBg};color:${markerText};border:2px solid #09090b;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10px;box-shadow:0 2px 6px rgba(0,0,0,0.45);cursor:pointer;">
              ${isMultiple ? escapeHtml(String(point.events.length)) : "•"}
            </div>
          `,
          className: "custom-travel-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const eventsHtml = point.events
          .map(
            (e) => `
              <div style="display:flex;align-items:center;gap:6px;margin-top:4px;font-size:11px;color:#d4d4d8;">
                <span>•</span>
                <span>${escapeHtml(e.label || "")}</span>
              </div>
            `
          )
          .join("");

        const safeGoogleMapsUrl = sanitizeUrl(point.googleMapsUrl);

        const popupContent = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:6px 4px;color:#fafafa;min-width:190px;max-width:260px;">
            <div style="margin-bottom:6px;">
              <span style="font-weight:700;font-size:10px;background:${badgeBg};color:${badgeColor};padding:2px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:0.4px;">
                ${escapeHtml(badgeLabel)}
              </span>
            </div>

            <h4 style="margin:0 0 4px 0;font-weight:700;font-size:13px;color:#ffffff;line-height:1.3;">
              ${escapeHtml(point.title || "")}
            </h4>

            ${
              point.address
                ? `<p style="margin:0 0 6px 0;font-size:11px;color:#a1a1aa;line-height:1.4;">
                    ${escapeHtml(point.address)}
                   </p>`
                : ""
            }

            <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:6px 8px;margin:8px 0;">
              ${eventsHtml}
            </div>

            ${
              safeGoogleMapsUrl
                ? `
                  <a href="${escapeHtml(safeGoogleMapsUrl)}" target="_blank" rel="noopener noreferrer"
                     style="display:block;text-align:center;background:#f4f4f5;color:#09090b;font-weight:700;font-size:11px;padding:6px 10px;border-radius:8px;text-decoration:none;margin-top:8px;">
                    Abrir no Google Maps ↗
                  </a>
                `
                : ""
            }
          </div>
        `;

        const marker = L.marker(latLng, { icon: customIcon })
          .addTo(map)
          .bindPopup(popupContent, {
            className: "custom-leaflet-dark-popup",
          });

        markersRef.current.push(marker);
      });

      if (visiblePoints.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } else if (visiblePoints.length === 1) {
        map.setView([visiblePoints[0].lat, visiblePoints[0].lng], 14);
      }
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [visiblePoints]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/[0.06] bg-[#09090b] relative flex flex-col">
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px] sm:min-h-[500px]" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute top-3 left-3 z-[1000] bg-[#111113]/95 border border-white/[0.08] px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-xs text-zinc-200 shadow-lg">
          <div className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
          <span>Localizando pontos no mapa...</span>
        </div>
      )}

      {/* Floating Info Bottom Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-[#111113]/95 border border-white/[0.08] px-3.5 py-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-lg">
        <div className="flex flex-wrap items-center gap-3.5 text-[11px] text-zinc-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-100 inline-block" />
            <span>Roteiro</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span>Lugares para Ir</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block" />
            <span>Múltiplas Visitas</span>
          </span>
        </div>

        <div className="text-[11px] font-mono text-zinc-400">
          {visiblePoints.length}{" "}
          {visiblePoints.length === 1 ? "local demarcado" : "locais demarcados"}
        </div>
      </div>
    </div>
  );
}
