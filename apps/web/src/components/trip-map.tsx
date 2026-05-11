'use client';

import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  time?: string | null;
}

const inkIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50% 50% 50% 0;
    background:#0C1A22;border:3px solid #fff;
    transform:rotate(-45deg);box-shadow:0 2px 6px rgba(12,26,34,0.4);
    display:flex;align-items:center;justify-content:center;
  "><span style="color:#B8DBD9;transform:rotate(45deg);font-weight:700;font-size:11px">●</span></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export function TripMap({ points }: { points: MapPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-card bg-bg text-[12px] text-ink-3">
        Aucune étape géolocalisée
      </div>
    );
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const center: [number, number] = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];
  const polyline: [number, number][] = points.map((p) => [p.lat, p.lng]);

  return (
    <div className="overflow-hidden rounded-card-lg" style={{ height: 280 }}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        bounds={
          points.length > 1
            ? L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]))
            : undefined
        }
        boundsOptions={{ padding: [20, 20] }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {polyline.length > 1 ? (
          <Polyline positions={polyline} pathOptions={{ color: '#0C1A22', weight: 3, opacity: 0.6, dashArray: '6 6' }} />
        ) : null}
        {points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={inkIcon}>
            <Popup>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                <strong>{p.title}</strong>
                {p.time ? <div style={{ fontSize: 11, color: '#586F7C' }}>{p.time}</div> : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
