import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import CrowdIndicator from './CrowdIndicator';
import { Clock, Users, ArrowRight, MapPin } from 'lucide-react';

// Center map smoothly on location change
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Custom modern SVG/HTML pins for Leaflet
function createCustomPin(category, crowdLevel) {
  const isPeak = crowdLevel === 'CRITICAL' || crowdLevel === 'HIGH';
  const isModerate = crowdLevel === 'MODERATE';

  const bgColor = isPeak ? '#f43f5e' : isModerate ? '#f59e0b' : '#10b981';
  const ringColor = isPeak ? 'rgba(244, 63, 94, 0.3)' : isModerate ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)';

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
      <div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background-color: ${ringColor}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: relative; width: 28px; height: 28px; border-radius: 9999px; background-color: ${bgColor}; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); display: flex; align-items: center; justify-content: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

export default function LeafletMap({
  locations = [],
  selectedLocation = null,
  onSelectLocation = null,
  center = [37.7749, -122.4194],
  zoom = 13,
  height = '500px',
}) {
  const activeCenter = selectedLocation
    ? [selectedLocation.latitude, selectedLocation.longitude]
    : center;

  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-soft relative z-0">
      <MapContainer
        center={activeCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={activeCenter} zoom={zoom} />

        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {locations.map((loc) => {
          if (!loc.latitude || !loc.longitude) return null;
          const pinIcon = createCustomPin(loc.category, loc.crowdLevel);

          return (
            <Marker
              key={loc.id}
              position={[loc.latitude, loc.longitude]}
              icon={pinIcon}
              eventHandlers={{
                click: () => onSelectLocation && onSelectLocation(loc),
              }}
            >
              <Popup className="queuepulse-popup">
                <div className="p-2 space-y-2 min-w-[200px] text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {loc.category?.replace('_', ' ')}
                    </span>
                    <CrowdIndicator level={loc.crowdLevel || 'LOW'} />
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm leading-tight">{loc.name}</h4>
                  <p className="text-[11px] text-slate-500 flex items-start space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate">{loc.address}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-center font-mono">
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Queue Depth</div>
                      <div className="text-sm font-extrabold text-blue-600">{loc.waitingQueueCount || 0} pax</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Est. Wait</div>
                      <div className="text-sm font-extrabold text-slate-900">~{loc.estimatedWaitMinutes || 15}m</div>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Desks: <strong>{loc.activeCounterCount || 3} online</strong></span>
                    <span>Avg Service: <strong>{loc.averageServiceTimeMinutes || 8}m</strong></span>
                  </div>

                  <Link
                    to={`/locations/${loc.id}`}
                    className="block text-center w-full py-1.5 px-3 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-xs mt-2"
                  >
                    View Details & Queues &rarr;
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
