import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import GeocoderControl from "leaflet-control-geocoder";
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

function MapClickHandler({ onLocationSelect }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      // Reverse geocode the coordinates
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=18&addressdetails=1`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          // Build a descriptive address from available data
          const addr = data.address || {};
          const addressParts = [];

          if (addr.house_number) addressParts.push(addr.house_number);
          if (addr.road) addressParts.push(addr.road);
          if (addr.suburb) addressParts.push(addr.suburb);
          if (addr.city || addr.town || addr.village) addressParts.push(addr.city || addr.town || addr.village);
          if (addr.state || addr.province) addressParts.push(addr.state || addr.province);
          if (addr.postcode) addressParts.push(addr.postcode);
          if (addr.country) addressParts.push(addr.country);

          const address = addressParts.length > 0 ? addressParts.join(", ") : `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
          onLocationSelect(e.latlng.lat, e.latlng.lng, address);
        })
        .catch(() => {
          // Fallback to coordinates if reverse geocoding fails
          onLocationSelect(e.latlng.lat, e.latlng.lng, `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
        });
    },
  });
  return null;
}

function GeocoderControlComponent() {
  const map = useMap();

  useEffect(() => {
    try {
      const geocoder = GeocoderControl.geocoder();
      L.Control.geocoder({ geocoder }).addTo(map);
    } catch (error) {
      console.warn("Geocoder failed to load:", error);
    }
  }, [map]);

  return null;
}

interface MapPickerProps {
  selectedLocation: { lat: number; lng: number; address: string } | null;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

export default function MapPicker({
  selectedLocation,
  onLocationSelect,
}: MapPickerProps) {
  // Bulgaria bounding box
  const bulgariaBounds = L.latLngBounds(
    L.latLng(41.235, 22.356), // SW corner
    L.latLng(44.215, 28.612)  // NE corner
  );

  return (
    <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={[42.75, 25.5]}
        zoom={7}
        minZoom={6}
        maxZoom={18}
        maxBounds={bulgariaBounds}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler onLocationSelect={onLocationSelect} />
        <GeocoderControlComponent />
        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
            <Popup>{selectedLocation.address}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
