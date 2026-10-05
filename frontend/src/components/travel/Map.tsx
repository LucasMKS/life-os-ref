"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ItineraryItem, PlaceToVisit } from "@/lib/types";
import { MapPin, ExternalLink, Calendar, Compass, Layers } from "lucide-react";

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
        geoCache[key] = parsed;
        return parsed;
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

  // Build candidate queries in priority order
  const candidates: string[] = [];

  // Candidate 1: Raw query
  candidates.push(cleanRaw);

  // Check if query contains Brazilian CEP format: 12345-678 or 12345678
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

  // Candidate 2: Address without CEP and expanding abbreviations (R. -> Rua, Av. -> Avenida)
  const withoutCep = cleanRaw.replace(/\b\d{5}-?\d{3}\b/g, "").replace(/,\s*,/g, ",").trim();
  const expanded = withoutCep
    .replace(/\bR\.\s*/gi, "Rua ")
    .replace(/\bAv\.\s*/gi, "Avenida ");

  if (expanded && expanded !== cleanRaw) {
    candidates.push(expanded);
  }

  // Candidate 3: Extract neighborhood from hyphen pattern: "R. Marcílio Dias - Muquiçaba, Guarapari..."
  const hyphenParts = withoutCep.split(/[-–—]/);
  if (hyphenParts.length > 1) {
    const afterHyphen = hyphenParts.slice(1).join(" ").trim();
    if (afterHyphen) {
      candidates.push(afterHyphen);
    }
  }

  // Candidate 4: Destination appended
  if (destination && !cleanRaw.toLowerCase().includes(destination.toLowerCase())) {
    candidates.push(`${withoutCep}, ${destination}`);
  }

  // Deduplicate candidates
  const uniqueCandidates = Array.from(new Set(candidates)).filter(Boolean);

  // Try each candidate with Nominatim
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
      if (data && data.length > 0) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        setCachedCoords(cleanRaw, coords);
        return coords;
      }
    } catch (e) {
      console.warn("Geocoding candidate failed for:", candidate, e);
    }

    // Small polite throttle for Nominatim rate limits
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  // Fallback: destination center
  if (destination) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        setCachedCoords(cleanRaw, coords);
        return coords;
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

  // Format date and time for itinerary occurrences
  const formatEventDate = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      const dayOfWeek = date.toLocaleDateString("pt-BR", { weekday: "short" });
      const dayAndMonth = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1).replace(".", "");
      return {
        label: `${capitalizedDay}, ${dayAndMonth} às ${time}`,
        dateStr: `${capitalizedDay}, ${dayAndMonth}`,
        timeStr: time,
      };
    } catch {
      return { label: "Atividade agendada", dateStr: "", timeStr: "" };
    }
  };

  // Resolve all locations for Itinerary and Places
  useEffect(() => {
    let active = true;

    async function resolveAllPoints() {
      setLoading(true);
      const rawPoints: MapPoint[] = [];

      // 1. Process Itinerary Items
      for (const item of items) {
        if (!active) break;
        const eventTime = formatEventDate(item.dateTime);

        if (item.latitude && item.longitude) {
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

      // 2. Process Places to Visit (Wishlist)
      for (const place of places) {
        if (!active) break;
        const query = place.address || (place.neighborhood ? `${place.neighborhood}, ${destination}` : `${place.name}, ${destination}`);
        if (query) {
          const coords = await geocodeQuery(query, destination);
          if (coords && active) {
            rawPoints.push({
              lat: coords.lat,
              lng: coords.lng,
              title: place.name,
              address: place.address || place.neighborhood,
              category: place.category,
              source: "place",
              events: [{ label: `Lugar para Ir (${place.priority === "MUST_VISIT" ? "Imperdível" : "Desejo"})` }],
              googleMapsUrl: place.mapUrl || `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`,
            });
          }
        }
      }

      // 3. Smart Deduplication: Merge locations that share the exact same or very close coordinates (~20m)
      const mergedPoints: MapPoint[] = [];
      const threshold = 0.0003; // ~30 meters

      for (const pt of rawPoints) {
        const existing = mergedPoints.find(
          (m) => Math.abs(m.lat - pt.lat) < threshold && Math.abs(m.lng - pt.lng) < threshold
        );

        if (existing) {
          // Merge events list (e.g. Sábado and Quarta for the same market!)
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

      // 4. Fallback if no points resolved: center on general destination
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
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`,
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

  // Filter points according to user selection
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

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([0, 0], 2);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (visiblePoints.length === 0) return;

    const bounds = L.latLngBounds([]);

    visiblePoints.forEach((point) => {
      const latLng = L.latLng(point.lat, point.lng);
      bounds.extend(latLng);

      // Distinct Marker styling based on source and count
      const isMultiple = point.events.length > 1;
      let markerColorClass = "bg-sky-500 shadow-sky-500/50";
      let pingColorClass = "bg-sky-500/30";
      let badgeLabel = "Roteiro";

      if (point.source === "both" || isMultiple) {
        markerColorClass = "bg-purple-500 shadow-purple-500/50";
        pingColorClass = "bg-purple-500/30";
        badgeLabel = `${point.events.length} visitas agendadas`;
      } else if (point.source === "place") {
        markerColorClass = "bg-amber-500 shadow-amber-500/50";
        pingColorClass = "bg-amber-500/30";
        badgeLabel = "Lugar para Ir";
      }

      const customIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="absolute w-8 h-8 rounded-full ${pingColorClass} animate-ping opacity-75"></div>
            <div class="relative w-6 h-6 ${markerColorClass} rounded-full border-2 border-[#09090b] flex items-center justify-center shadow-lg font-bold text-[10px] text-black">
              ${isMultiple ? point.events.length : "•"}
            </div>
          </div>
        `,
        className: "custom-travel-marker",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Events / Occurrences list in popup
      const eventsHtml = point.events
        .map(
          (e) => `
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 11px; color: #d4d4d8;">
              <span style="color: #38bdf8;">🗓️</span>
              <span>${e.label}</span>
            </div>
          `
        )
        .join("");

      const popupContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 8px 4px; color: #fafafa; min-width: 200px; max-width: 280px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 800; font-size: 10px; background: ${
              point.source === "place" ? "#78350f" : "#0c4a6e"
            }; color: ${
              point.source === "place" ? "#fde047" : "#38bdf8"
            }; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
              ${badgeLabel}
            </span>
          </div>

          <h4 style="margin: 0 0 4px 0; font-weight: 700; font-size: 14px; color: #ffffff; line-height: 1.3;">
            ${point.title}
          </h4>

          ${
            point.address
              ? `<p style="margin: 0 0 6px 0; font-size: 11px; color: #a1a1aa; line-height: 1.4;">
                  📍 ${point.address}
                 </p>`
              : ""
          }

          <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 6px 8px; margin: 8px 0;">
            ${eventsHtml}
          </div>

          ${
            point.googleMapsUrl
              ? `
                <a href="${point.googleMapsUrl}" target="_blank" rel="noopener noreferrer"
                   style="display: block; text-align: center; background: #38bdf8; color: #000; font-weight: 800; font-size: 11px; padding: 6px 10px; border-radius: 8px; text-decoration: none; margin-top: 8px;">
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

    // Fit map view bounds
    if (visiblePoints.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (visiblePoints.length === 1) {
      map.setView([visiblePoints[0].lat, visiblePoints[0].lng], 14);
    }
  }, [visiblePoints]);

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 relative shadow-inner flex flex-col">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "500px" }} />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute top-4 left-4 z-[1000] bg-zinc-900/90 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-2xl flex items-center gap-2.5 text-xs text-white shadow-xl">
          <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span>Localizando pontos e endereços no mapa...</span>
        </div>
      )}

      {/* Floating Info Bottom Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-zinc-900/90 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xl">
        <div className="flex items-center gap-4 text-[11px] text-zinc-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block shadow-sm shadow-sky-400/50" />
            <span>Roteiro & Atividades</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400/50" />
            <span>Lugares para Ir</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block shadow-sm shadow-purple-400/50" />
            <span>Múltiplas Visitas / Recorrente</span>
          </span>
        </div>

        <div className="text-[11px] font-mono text-zinc-400">
          {visiblePoints.length} {visiblePoints.length === 1 ? "local demarcado" : "locais demarcados"}
        </div>
      </div>
    </div>
  );
}
