"use client";

import type { AnalysisResult } from "@/types";
import { useEffect, useRef, useState } from "react";

type Props = {
  onMapClick: (lat: number, lon: number, place?: string) => void;
  onPolygonDraw: (coords: number[][]) => void;
  selectedCoords: { lat: number; lon: number } | null;
  mode: "click" | "draw";
  result: AnalysisResult | null;
  loading?: boolean;
};

export default function MapComponent({ onMapClick, onPolygonDraw, selectedCoords, mode, result, loading = false }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const markerInst = useRef<any>(null);
  const polygonInst = useRef<any>(null);
  const drawPointsRef = useRef<number[][]>([]);
  const tempDotsRef = useRef<any[]>([]);
  const [hint, setHint] = useState(true);

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    let mounted = true;
    const init = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (!mounted || !mapRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, { center: [47.0, 67.0], zoom: 4, zoomControl: true, attributionControl: false, doubleClickZoom: false });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { subdomains: "abcd", maxZoom: 19 }).addTo(map);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        opacity: 0.25,
      }).addTo(map);

      const glowIcon = L.divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;border-radius:999px;background:#00c8ff;border:3px solid #fff;box-shadow:0 0 18px rgba(0,200,255,.9),0 0 38px rgba(0,200,255,.25)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const onClick = async (e: any) => {
        const lat = e.latlng.lat as number;
        const lon = e.latlng.lng as number;

        if (mode === "draw") {
          drawPointsRef.current.push([lat, lon]);
          const dot = L.circleMarker([lat, lon], {
            radius: 4,
            color: "#00c8ff",
            fillColor: "#00c8ff",
            fillOpacity: 1,
            weight: 1,
          }).addTo(map);
          tempDotsRef.current.push(dot);
          if (drawPointsRef.current.length >= 3) {
            if (polygonInst.current) polygonInst.current.remove();
            polygonInst.current = L.polygon(drawPointsRef.current as [number, number][], {
              color: "#00c8ff",
              weight: 2,
              fillColor: "#00c8ff",
              fillOpacity: 0.14,
              dashArray: "5 4",
            }).addTo(map);
            // Update selected region/coords while drawing (so it doesn't stay on the default "Almaty").
            onPolygonDraw([...drawPointsRef.current]);
          }
          return;
        }

        if (markerInst.current) markerInst.current.remove();
        markerInst.current = L.marker([lat, lon], { icon: glowIcon }).addTo(map);
        map.flyTo([lat, lon], Math.max(7, map.getZoom()), { duration: 0.6 });

        let place = "";
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`, {
            headers: { "User-Agent": "EcoScanAI/4.0 (contact@ecoscan.ai)" },
          });
          if (r.ok) {
            const data = await r.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.county || "";
            const country = addr.country || "";
            place = [city, country].filter(Boolean).join(", ");
          }
        } catch {
          place = "";
        }
        onMapClick(lat, lon, place || undefined);
      };

      map.on("click", onClick);
      map.on("dblclick", () => {
        if (mode !== "draw") return;
        if (drawPointsRef.current.length < 3) return;
        onPolygonDraw(drawPointsRef.current);
        drawPointsRef.current = [];
        tempDotsRef.current.forEach((d) => d.remove());
        tempDotsRef.current = [];
      });

      mapInst.current = map;
    };

    init();
    const timer = window.setTimeout(() => setHint(false), 4500);
    return () => {
      mounted = false;
      window.clearTimeout(timer);
      if (mapInst.current) {
        mapInst.current.remove();
        mapInst.current = null;
      }
    };
  }, [mode, onMapClick, onPolygonDraw]);

  useEffect(() => {
    if (!selectedCoords || !mapInst.current) return;
    mapInst.current.flyTo([selectedCoords.lat, selectedCoords.lon], Math.max(7, mapInst.current.getZoom()), { duration: 0.6 });
  }, [selectedCoords]);

  useEffect(() => {
    if (mode !== "click") return;
    drawPointsRef.current = [];
    tempDotsRef.current.forEach((d) => d.remove());
    tempDotsRef.current = [];
    if (polygonInst.current) {
      polygonInst.current.remove();
      polygonInst.current = null;
    }
  }, [mode]);

  return (
    <div className="scan-container relative h-full w-full">
      {loading && <div className="scan-line" />}
      <div ref={mapRef} className="h-full w-full" />

      {hint && (
        <div className="absolute left-3 top-3 z-[999] rounded-lg border border-[rgba(0,200,255,0.2)] bg-[#07111be0] px-3 py-2 text-xs font-mono text-[#00c8ff]">
          {mode === "click" ? "Click anywhere to select a location" : "Draw mode: click points, double-click to close"}
        </div>
      )}

      <div className="absolute bottom-3 right-3 z-[999] rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#06101ae6] px-3 py-2 text-[11px] font-mono text-[#93a9b9]">
        <div>Legend</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#00ff87]" /> Forest
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#00c8ff]" /> Water
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#a855f7]" /> Urban
        </div>
      </div>

      {result && (
        <div className="absolute bottom-3 left-3 z-[999] rounded-lg border border-[rgba(0,255,135,0.2)] bg-[#07111be6] px-3 py-2 text-xs font-mono text-[#9dd6b7]">
          NDVI {result.ndvi.toFixed(3)} | Risk {result.riskScore ?? "-"}
        </div>
      )}
    </div>
  );
}
