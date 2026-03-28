import { useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
  Marker,
} from "@react-google-maps/api";

const LIBRARIES: ("places" | "geometry" | "drawing")[] = ["places"];

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  gestureHandling: "cooperative",
  styles: [
    { featureType: "poi.business", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  ],
};

export interface Stop {
  id: number;
  patientName: string;
  address: string;
  lat: number;
  lng: number;
}

interface GoogleRouteMapProps {
  /** Ordered list of stops (already sorted by caller, or let Google optimize) */
  stops: Stop[];
  /** Index of the active stop (0-based among the stops array) */
  activeStopIndex: number;
  /** Doctor's current position (start of the route) */
  origin: { lat: number; lng: number };
  /** Called when Google returns an optimised waypoint order */
  onRouteOptimized?: (orderedIndices: number[]) => void;
  /** Height of the map container */
  height?: string;
}

export default function GoogleRouteMap({
  stops,
  activeStopIndex,
  origin,
  onRouteOptimized,
  height = "400px",
}: GoogleRouteMapProps) {
  const env = (import.meta as any).env || {};
  const googleMapsKey = (env.VITE_GOOGLE_MAPS_API_KEY || env.GOOGLE_MAPS_API_KEY || "") as string;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsKey,
    libraries: LIBRARIES,
  });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const prevStopsKey = useRef<string>("");

  // Re-calculate directions whenever stops or active stop changes
  const calculateRoute = useCallback(() => {
    if (!isLoaded || stops.length === 0) return;
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }

    // The remaining stops from the active one onward
    const remaining = stops.slice(activeStopIndex);
    if (remaining.length === 0) return;

    const destination = remaining[remaining.length - 1];
    const waypoints = remaining.slice(0, -1).map((s) => ({
      location: { lat: s.lat, lng: s.lng },
      stopover: true,
    }));

    setIsCalculating(true);
    setRouteError(null);

    directionsServiceRef.current.route(
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        waypoints,
        optimizeWaypoints: true, // let Google reorder for shortest drive time
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        setIsCalculating(false);
        if (status === "OK" && result) {
          setDirections(result);
          // Surface the optimised order back to the parent
          if (onRouteOptimized && result.routes[0].waypoint_order) {
            onRouteOptimized(result.routes[0].waypoint_order);
          }
        } else {
          setRouteError(`Маршрутът не може да бъде изчислен: ${status}`);
        }
      }
    );
  }, [isLoaded, stops, activeStopIndex, origin, onRouteOptimized]);

  // Re-run whenever the stops list or active index changes
  useEffect(() => {
    const key = JSON.stringify({ stops: stops.map((s) => s.id), activeStopIndex });
    if (key === prevStopsKey.current) return;
    prevStopsKey.current = key;
    calculateRoute();
  }, [calculateRoute, stops, activeStopIndex]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium" style={{ height }}>
        Неуспешно зареждане на Google Maps. Проверете API ключа.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg" style={{ height }}>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Зареждане на Google Maps...
        </div>
      </div>
    );
  }

  const activeStop = stops[activeStopIndex];
  const center = activeStop
    ? { lat: activeStop.lat, lng: activeStop.lng }
    : origin;

  return (
    <div className="relative" style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={13}
        options={MAP_OPTIONS}
      >
        {/* Doctor origin marker */}
        <Marker
          position={origin}
          title="Вашата локация"
          icon={{
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="#4a4699" stroke="white" stroke-width="3"/>
                <circle cx="16" cy="16" r="5" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16),
          }}
        />

        {/* Patient stop markers */}
        {stops.map((stop, idx) => (
          <Marker
            key={stop.id}
            position={{ lat: stop.lat, lng: stop.lng }}
            title={`${idx + 1}. ${stop.patientName}`}
            label={{
              text: String(idx + 1),
              color: "white",
              fontWeight: "bold",
              fontSize: "12px",
            }}
            icon={{
              url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
                  <path d="M18 0C8.06 0 0 8.06 0 18c0 12 18 26 18 26S36 30 36 18C36 8.06 27.94 0 18 0z"
                    fill="${idx === activeStopIndex ? '#16a34a' : '#4a4699'}" stroke="white" stroke-width="2"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(36, 44),
              anchor: new google.maps.Point(18, 44),
            }}
          />
        ))}

        {/* Route polyline from Directions API */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true, // we draw our own markers
              polylineOptions: {
                strokeColor: "#4a4699",
                strokeWeight: 5,
                strokeOpacity: 0.8,
              },
            }}
          />
        )}
      </GoogleMap>

      {/* Calculating overlay */}
      {isCalculating && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2 bg-white shadow px-4 py-2 rounded-lg text-sm font-medium text-gray-700">
            <svg className="w-4 h-4 animate-spin text-(--clr-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Изчисляване на оптимален маршрут...
          </div>
        </div>
      )}

      {/* Route error */}
      {routeError && (
        <div className="absolute bottom-3 left-3 right-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-2 rounded-lg">
          {routeError}
        </div>
      )}
    </div>
  );
}
