'use client';

import { useEffect, useRef } from 'react';
import type { Checkin } from '@/lib/bail-types';
import L from 'leaflet';

interface CheckinWithUrl extends Checkin {
  selfie_url: string | null;
}

interface LocationMapProps {
  checkins: CheckinWithUrl[];
  height?: number;
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function createNumberedIcon(num: number, isLast: boolean) {
  const size = isLast ? 32 : 24;
  const bg = isLast ? '#fbbf24' : '#3b82f6';
  const border = isLast ? '#92400e' : '#1e3a5f';
  const textColor = isLast ? '#0a0a0a' : '#ffffff';

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};border:2px solid ${border};
      border-radius:50%;display:flex;align-items:center;justify-content:center;
      font-size:${isLast ? 14 : 11}px;font-weight:700;color:${textColor};
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
    ">${num}</div>`,
  });
}

export default function LocationMap({ checkins, height = 400 }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Filter to only check-ins with GPS data, sort chronologically
  const gpsCheckins = checkins
    .filter((ci) => ci.latitude != null && ci.longitude != null)
    .sort((a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime());

  useEffect(() => {
    if (!mapRef.current || gpsCheckins.length === 0) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    });
    mapInstanceRef.current = map;

    // Dark tile layer to match admin theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    const markers: L.LatLng[] = [];
    const trailCoords: [number, number][] = [];

    gpsCheckins.forEach((ci, idx) => {
      const lat = ci.latitude!;
      const lng = ci.longitude!;
      const isLast = idx === gpsCheckins.length - 1;
      const num = idx + 1;

      const latlng = L.latLng(lat, lng);
      markers.push(latlng);
      trailCoords.push([lat, lng]);

      // Accuracy circle
      if (ci.accuracy && ci.accuracy > 0) {
        L.circle(latlng, {
          radius: ci.accuracy,
          color: isLast ? '#fbbf24' : '#3b82f6',
          fillColor: isLast ? '#fbbf24' : '#3b82f6',
          fillOpacity: 0.08,
          weight: 1,
          opacity: 0.3,
        }).addTo(map);
      }

      // Marker
      const marker = L.marker(latlng, {
        icon: createNumberedIcon(num, isLast),
        zIndexOffset: isLast ? 1000 : 0,
      }).addTo(map);

      // Popup content
      const selfieHtml = ci.selfie_url
        ? `<img src="${ci.selfie_url}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;margin-bottom:8px;" /><br/>`
        : '';

      const popupHtml = `
        <div style="font-family:system-ui;min-width:160px;">
          ${selfieHtml}
          <div style="font-weight:700;margin-bottom:4px;">Check-in #${num}${isLast ? ' (Latest)' : ''}</div>
          <div style="font-size:12px;color:#666;margin-bottom:4px;">${formatDateTime(ci.checked_in_at)}</div>
          <div style="font-size:11px;font-family:monospace;color:#888;">
            ${lat.toFixed(6)}, ${lng.toFixed(6)}
            ${ci.accuracy ? `<br/>±${ci.accuracy.toFixed(0)}m accuracy` : ''}
          </div>
          <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener"
             style="display:inline-block;margin-top:6px;font-size:11px;color:#fbbf24;">
            Open in Google Maps →
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 220 });
    });

    // Trail polyline connecting all points chronologically
    if (trailCoords.length > 1) {
      L.polyline(trailCoords, {
        color: '#fbbf24',
        weight: 2,
        opacity: 0.6,
        dashArray: '8, 6',
      }).addTo(map);
    }

    // Fit bounds to show all markers
    if (markers.length === 1) {
      map.setView(markers[0], 15);
    } else {
      const bounds = L.latLngBounds(markers);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [gpsCheckins.length, gpsCheckins.map((c) => c.id).join(',')]);

  if (gpsCheckins.length === 0) {
    return (
      <div
        className="flex items-center justify-center border border-zinc-800 rounded-xl bg-zinc-900/50"
        style={{ height }}
      >
        <div className="text-center px-4">
          <svg className="w-8 h-8 text-zinc-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xs text-zinc-500">No GPS check-in data yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="rounded-xl overflow-hidden border border-zinc-800"
        style={{ height, width: '100%' }}
      />
      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-zinc-900/90 border border-zinc-700 rounded-lg px-3 py-2 text-[10px] text-zinc-400 space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#fbbf24] border border-[#92400e]" />
          Latest check-in
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#3b82f6] border border-[#1e3a5f]" />
          Prior check-ins
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 border-t border-dashed border-[#fbbf24]" />
          Movement trail
        </div>
      </div>
      {/* Count badge */}
      <div className="absolute top-3 right-3 z-[1000] bg-zinc-900/90 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300">
        <span className="font-bold text-[#fbbf24]">{gpsCheckins.length}</span> location{gpsCheckins.length !== 1 ? 's' : ''} recorded
      </div>
    </div>
  );
}
