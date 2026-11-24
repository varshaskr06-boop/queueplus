import React, { useState, useEffect } from 'react';
import { locationService } from '../services/api';
import { DEMO_LOCATIONS } from '../services/sampleData';
import CrowdIndicator from '../components/CrowdIndicator';
import LeafletMap from '../components/LeafletMap';
import QueueVsCrowdBanner from '../components/QueueVsCrowdBanner';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Search,
  Filter,
  Users,
  Building2,
  ArrowRight,
  Compass,
  Timer,
  RefreshCw,
  Layers,
} from 'lucide-react';

export default function CrowdMap() {
  const [locations, setLocations] = useState(DEMO_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState(DEMO_LOCATIONS[0]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const data = await locationService.getLocations();
        if (data && data.locations && data.locations.length > 0) {
          setLocations(data.locations);
          setSelectedLocation(data.locations[0]);
        }
      } catch (err) {
        // Fallback to high-fidelity demo locations
        setLocations(DEMO_LOCATIONS);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const filtered = locations.filter((l) => {
    const matchCat = !categoryFilter || l.category === categoryFilter;
    const matchSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.address.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const avgTime =
    selectedLocation?.averageServiceTimeMinutes ||
    (selectedLocation?.category === 'HOSPITAL' ? 8.5 : selectedLocation?.category === 'BANK' ? 5.5 : 9.0);

  const formattedUpdate = selectedLocation?.lastUpdated
    ? new Date(selectedLocation.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Live';

  return (
    <div className="space-y-8">
      {/* Map Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Interactive OpenStreetMap</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Citywide Facilities & Crowd Heatmap
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Live spatial coordinates, queue lengths, operating desks, and congestion levels across hospitals, banks, and municipal offices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search map facilities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories ({locations.length})</option>
              <option value="HOSPITAL">Hospitals & Urgent Care</option>
              <option value="BANK">Commercial Banks</option>
              <option value="GOVERNMENT_OFFICE">Government Offices</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaflet OpenStreetMap Container (Col 8) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft flex flex-col justify-between">
          {/* Map Top Bar */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="text-xs font-bold text-navy-900 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
              <span>Real-time GPS Markers ({filtered.length} visible facilities)</span>
            </div>
            <div className="flex items-center space-x-3 text-[11px] font-bold">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Low Wait</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600">Moderate</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-600">Peak Congestion</span>
              </span>
            </div>
          </div>

          {/* Leaflet Map with OpenStreetMap tiles */}
          <div className="w-full">
            <LeafletMap
              locations={filtered}
              selectedLocation={selectedLocation}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
              center={[selectedLocation?.latitude || 37.7749, selectedLocation?.longitude || -122.4194]}
              zoom={13}
              height="520px"
            />
          </div>

          <div className="text-[11px] text-slate-500 text-center pt-4 flex items-center justify-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            <span>Click any facility pin to inspect live telemetry, queue tickets, and active desks.</span>
          </div>
        </div>

        {/* Selected Facility Details Sidebar (Col 4) */}
        {selectedLocation && (
          <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedLocation.category?.replace('_', ' ')}
                </span>
                <CrowdIndicator level={selectedLocation.crowdLevel || 'LOW'} />
              </div>

              <h3 className="text-lg font-bold text-navy-900 leading-snug">{selectedLocation.name}</h3>
              <p className="text-xs text-slate-500 flex items-start space-x-1.5 mt-1 mb-4">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{selectedLocation.address}</span>
              </p>

              {/* Metric Highlights Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 my-4 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Predicted Hold Time:</span>
                  <span className="font-extrabold text-blue-600 text-base">
                    ~{selectedLocation.estimatedWaitMinutes || 18} mins
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Current Queue Volume:</span>
                  <span className="font-bold text-navy-900">{selectedLocation.waitingQueueCount || 0} citizens</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Operating Service Desks:</span>
                  <span className="font-bold text-emerald-600">
                    {selectedLocation.activeCounterCount || 3} / {selectedLocation.totalCounterCount || 4} Desks
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Average Service Time:</span>
                  <span className="font-bold text-slate-700">~{avgTime} mins / person</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Operating Hours:</span>
                  <span className="font-mono text-slate-700 font-semibold">
                    {selectedLocation.openingTime || '08:00'} - {selectedLocation.closingTime || '18:00'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[11px]">
                  <span className="text-slate-400">Last Telemetry Update:</span>
                  <span className="font-mono text-slate-500">{formattedUpdate}</span>
                </div>
              </div>

              {selectedLocation.recommendedVisitingTime && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-800 flex items-start space-x-2">
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Optimal arrival window: <strong>{selectedLocation.recommendedVisitingTime}</strong></span>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-2 mt-4">
              <Link
                to={`/locations/${selectedLocation.id}`}
                className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider text-center block transition-colors shadow-sm shadow-blue-600/30"
              >
                Inspect Facility & Join Queue &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Clear Distinction Banner */}
      <QueueVsCrowdBanner />
    </div>
  );
}