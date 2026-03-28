import { useEffect, useRef } from "react";

export interface Stop {
  id: number;
  patientName: string;
  address: string;
  lat: number;
  lng: number;
}

interface RouteMapProps {
  stops: Stop[];
  activeStopIndex: number;
  origin: { lat: number; lng: number };
  height?: string;
}

// Pure-Leaflet map — no API key required. Free and works everywhere.
// When Google Maps billing is enabled, replace this component with GoogleRouteMap.
export default function RouteMap({ stops, activeStopIndex, origin, height = "400px" }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css" as any).catch(() => {}),
    ]).then(([L]) => {
      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current!, { zoomControl: true, scrollWheelZoom: true });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);
      }

      const map = mapRef.current;

      // Remove old markers + polyline
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null; }

      const points: [number, number][] = [];

      // Doctor origin marker
      const doctorIcon = L.divIcon({
        className: "",
        html: `<div style="width:20px;height:20px;background:#4a4699;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const originMarker = L.marker([origin.lat, origin.lng], { icon: doctorIcon })
        .addTo(map)
        .bindPopup("<strong>Вашата локация</strong>");
      markersRef.current.push(originMarker);
      points.push([origin.lat, origin.lng]);

      // Stop markers
      stops.forEach((stop, idx) => {
        const isActive = idx === activeStopIndex;
        const color = isActive ? "#16a34a" : "#4a4699";
        const icon = L.divIcon({
          className: "",
          html: `
            <div style="position:relative;width:32px;height:40px">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">
                <path d="M16 0C7.16 0 0 7.16 0 16c0 10 16 24 16 24S32 26 32 16C32 7.16 24.84 0 16 0z"
                  fill="${color}" stroke="white" stroke-width="2"/>
              </svg>
              <span style="position:absolute;top:5px;left:50%;transform:translateX(-50%);color:white;font-weight:bold;font-size:12px;font-family:sans-serif">${idx + 1}</span>
            </div>`,
          iconSize: [32, 40],
          iconAnchor: [16, 40],
          popupAnchor: [0, -40],
        });
        const marker = L.marker([stop.lat, stop.lng], { icon })
          .addTo(map)
          .bindPopup(`<strong>${stop.patientName}</strong><br/><small>${stop.address}</small>`);
        markersRef.current.push(marker);
        points.push([stop.lat, stop.lng]);

        // Open popup for active stop
        if (isActive) marker.openPopup();
      });

      // Draw route polyline
      if (points.length > 1) {
        polylineRef.current = L.polyline(points, {
          color: "#4a4699",
          weight: 4,
          opacity: 0.75,
          dashArray: "8, 6",
        }).addTo(map);
      }

      // Fit map to all points
      if (points.length > 0) {
        map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
      }
    });

    return () => {
      // Don't destroy on every re-render, only on unmount
    };
  }, [stops, activeStopIndex, origin]);

  // Destroy on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} style={{ height, width: "100%" }} />;
}
