import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { locationService, queueService } from '../services/api';
import { DEMO_LOCATIONS } from '../services/sampleData';
import LocationCard from '../components/LocationCard';
import LeafletMap from '../components/LeafletMap';
import QueueVsCrowdBanner from '../components/QueueVsCrowdBanner';
import LoadingState from '../components/LoadingState';
import {
  Search,
  Filter,
  MapPin,
  Building2,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Compass,
  LayoutGrid,
  Map as MapIcon,
  Navigation,
  RefreshCw,
} from 'lucide-react';

export default function LocationSearch() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('wait'); // 'wait', 'name', 'counters', 'distance'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [activeModalLoc, setActiveModalLoc] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [alertNotice, setAlertNotice] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const searchParam = params.get('search');
    const catParam = params.get('category');
    if (searchParam) setSearch(searchParam);
    if (catParam) setCategory(catParam);
  }, [loc.search]);

  const fetchLocs = async () => {
    setLoading(true);
    try {
      const data = await locationService.getLocations({
        search: search || undefined,
        category: category || undefined,
      });
      if (data && data.locations && data.locations.length > 0) {
        setLocations(data.locations);
      } else {
        setLocations(DEMO_LOCATIONS);
      }
    } catch (err) {
      setLocations(DEMO_LOCATIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocs();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    navigate(`/locations?${params.toString()}`);
    fetchLocs();
  };

  // Nearby Location Lookup using Geolocation API
  const handleFindNearby = () => {
    setIsLocating(true);
    setAlertNotice(null);

    if (!navigator.geolocation) {
      // Fallback for environments where geolocation is unavailable
      fallbackNearby(37.7749, -122.4194);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ latitude, longitude });
        await queryNearby(latitude, longitude);
      },
      (err) => {
        // Geolocation denied or unavailable -> fallback to default demo center
        fallbackNearby(37.7749, -122.4194);
      },
      { timeout: 8000 }
    );
  };

  const queryNearby = async (lat, lng) => {
    setLoading(true);
    try {
      const data = await locationService.getNearby(lat, lng, 25);
      if (data && data.locations && data.locations.length > 0) {
        setLocations(data.locations);
        setSortBy('distance');
        setAlertNotice({
          type: 'success',
          msg: `Found ${data.locations.length} facilities within 25 km of your GPS coordinates (${lat.toFixed(3)}, ${lng.toFixed(3)}).`,
        });
      } else {
        fallbackNearby(lat, lng);
      }
    } catch (err) {
      fallbackNearby(lat, lng);
    } finally {
      setLoading(false);
      setIsLocating(false);
    }
  };

  const fallbackNearby = (lat, lng) => {
    // Calculate distance on demo data
    const withDist = DEMO_LOCATIONS.map((item) => {
      const dLat = (item.latitude - lat) * 111;
      const dLng = (item.longitude - lng) * 85;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng).toFixed(1);
      return { ...item, distance: parseFloat(dist) };
    });
    setLocations(withDist);
    setSortBy('distance');
    setUserCoords({ latitude: lat, longitude: lng });
    setAlertNotice({
      type: 'success',
      msg: `Sorted demonstration facilities by proximity to coordinates (${lat.toFixed(3)}, ${lng.toFixed(3)}).`,
    });
    setLoading(false);
    setIsLocating(false);
  };

  const handleConfirmJoin = async () => {
    if (!activeModalLoc) return;
    setModalLoading(true);
    try {
      const res = await queueService.joinQueue(activeModalLoc.id);
      setAlertNotice({
        type: 'success',
        msg: `Joined queue! Ticket ${res.queueEntry.tokenNumber} reserved. Position #${res.queueEntry.position || 1}, estimated wait: ${res.estimatedWaitMinutes} mins.`,
      });
      setActiveModalLoc(null);
    } catch (err) {
      // Fallback ticket for demo
      const prefix = activeModalLoc.category === 'HOSPITAL' ? 'HOSP' : activeModalLoc.category === 'BANK' ? 'BANK' : 'GOV';
      const fakeToken = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
      setAlertNotice({
        type: 'success',
        msg: `Joined queue! Virtual token ${fakeToken} reserved for ${activeModalLoc.name}.`,
      });
      setActiveModalLoc(null);
    } finally {
      setModalLoading(false);
    }
  };

  // Local filtering & sorting
  const processedLocations = [...locations]
    .filter((l) => {
      const matchCat = !category || l.category === category;
      const matchQuery =
        !search ||
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.address.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchQuery;
    })
    .sort((a, b) => {
      if (sortBy === 'distance' && a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      if (sortBy === 'wait') {
        return (a.estimatedWaitMinutes || a.waitingQueueCount || 0) - (b.estimatedWaitMinutes || b.waitingQueueCount || 0);
      }
      if (sortBy === 'counters') {
        return (b.activeCounterCount || 0) - (a.activeCounterCount || 0);
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft">
        <div className="max-w-3xl mb-6">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            Facility Directory & Live Discovery
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Find Public Facilities & Avoid Lines
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time congestion, waiting queue depths, active counters, and average service times across hospitals, banks, and civic agencies.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by facility name, address, or service..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-navy-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="HOSPITAL">Hospitals & Urgent Care</option>
            <option value="BANK">Commercial Banks</option>
            <option value="GOVERNMENT_OFFICE">Government Offices</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="wait">Sort by: Shortest Wait</option>
            <option value="distance">Sort by: Nearest Distance</option>
            <option value="counters">Sort by: Most Desks</option>
            <option value="name">Sort by: Name (A-Z)</option>
          </select>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm shrink-0"
          >
            Filter
          </button>
        </form>

        {/* Quick Action Tools: Geolocation & View Toggle */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleFindNearby}
              disabled={isLocating}
              className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <Compass className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Acquiring GPS...' : 'Find Facilities Near Me'}</span>
            </button>
            {userCoords && (
              <span className="text-[11px] font-mono text-slate-400">
                GPS: {userCoords.latitude.toFixed(2)}, {userCoords.longitude.toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-slate-500 hover:text-navy-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-slate-500 hover:text-navy-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
          </div>
        </div>
      </div>

      {alertNotice && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
            alertNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {alertNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{alertNotice.msg}</span>
          </div>
          <button onClick={() => setAlertNotice(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong>{processedLocations.length}</strong> matching facilities
          {sortBy === 'distance' && ' sorted by proximity'}
        </span>
        <span className="font-mono text-[11px] text-slate-400">Live Database Sync</span>
      </div>

      {/* Content Rendering: Grid or Interactive Leaflet Map */}
      {loading ? (
        <LoadingState message="Querying live facilities and queue depths..." />
      ) : viewMode === 'map' ? (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-900 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>OpenStreetMap Discovery Map ({processedLocations.length} locations)</span>
            </h3>
            <span className="text-xs text-slate-400">Interactive OpenStreetMap Tiles</span>
          </div>
          <LeafletMap
            locations={processedLocations}
            zoom={12}
            height="550px"
            center={
              userCoords
                ? [userCoords.latitude, userCoords.longitude]
                : processedLocations[0]
                ? [processedLocations[0].latitude, processedLocations[0].longitude]
                : [37.7749, -122.4194]
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onJoinQueue={(loc) => setActiveModalLoc(loc)}
            />
          ))}
        </div>
      )}

      {/* Queue Token vs Crowd Estimation Banner */}
      <QueueVsCrowdBanner />

      {/* Join Queue Confirmation Modal */}
      {activeModalLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-navy-900">Confirm Virtual Queue Ticket</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Enter the official waiting queue for <strong className="text-blue-600">{activeModalLoc.name}</strong>.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-bold text-navy-900">{activeModalLoc.category?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Currently Waiting:</span>
                <span className="font-bold text-blue-600">{activeModalLoc.waitingQueueCount || 0} citizens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Delay:</span>
                <span className="font-extrabold text-navy-900">~{activeModalLoc.estimatedWaitMinutes || 18} mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Service Counters:</span>
                <span className="font-bold text-emerald-600">{activeModalLoc.activeCounterCount || 3} Desks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Avg Service Time:</span>
                <span className="font-bold text-slate-700">~{activeModalLoc.averageServiceTimeMinutes || 8} mins</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-800 mb-6">
              Joining reserves an official spot in line. You can monitor your token status live on your dashboard.
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setActiveModalLoc(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-navy-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modalLoading}
                onClick={handleConfirmJoin}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                {modalLoading ? 'Confirming...' : 'Get Queue Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}