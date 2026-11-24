import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { locationService, predictionService } from '../services/api';
import { DEMO_LOCATIONS, SYSTEM_METRICS } from '../services/sampleData';
import LocationCard from '../components/LocationCard';
import WaitTimeCard from '../components/WaitTimeCard';
import CrowdIndicator from '../components/CrowdIndicator';
import PredictionChart from '../components/PredictionChart';
import LoadingState from '../components/LoadingState';
import {
  Search,
  MapPin,
  Clock,
  Sparkles,
  TrendingUp,
  Building2,
  Calendar,
  Compass,
  ArrowRight,
  Shield,
  Activity,
} from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const loadLocations = async () => {
      setLoading(true);
      try {
        const data = await locationService.getLocations({ limit: 12 });
        if (data && data.locations && data.locations.length > 0) {
          setLocations(data.locations);
        } else {
          setLocations(DEMO_LOCATIONS);
        }
      } catch (err) {
        // Fallback to high-fidelity demo locations
        setLocations(DEMO_LOCATIONS);
      } finally {
        setLoading(false);
      }
    };
    loadLocations();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/locations?search=${encodeURIComponent(searchQuery)}`);
  };

  const filteredLocations = locations.filter((loc) => {
    const matchesCat = selectedCategory === 'ALL' || loc.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const nearbyLocations = filteredLocations.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* 1. Welcome Message & Summary Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-soft-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>AI Operations Online</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Citizen Explorer'}!
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Real-time congestion monitor and wait forecasting across 16 hospitals, banks, and civic bureaus in your area.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/locations"
              className="px-5 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs uppercase tracking-wider hover:bg-blue-50 transition-colors shadow-sm"
            >
              Browse All Facilities
            </Link>
            <Link
              to="/map"
              className="px-5 py-2.5 rounded-xl bg-blue-800/60 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider transition-colors border border-blue-400/30"
            >
              Open Live Crowd Map
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Location Search Bar & Category Filter */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-soft">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hospitals, banks, DMVs, permit centers..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-navy-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'HOSPITAL', 'BANK', 'GOVERNMENT_OFFICE'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All Places' : cat === 'HOSPITAL' ? 'Hospitals' : cat === 'BANK' ? 'Banks' : 'Government'}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* 3. Real-Time Telemetry Grid: Current Crowds, Estimated Waits, Recommended Times */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WaitTimeCard
          title="Citywide Avg Wait"
          minutes={SYSTEM_METRICS.averageWaitTimeMinutes}
          confidence={0.96}
          trend="stable"
        />

        {/* Current Crowd Levels Widget */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Overall Congestion</span>
            <span className="text-emerald-600 font-bold">Stable</span>
          </div>
          <div className="flex items-center space-x-3 my-2">
            <CrowdIndicator level="LOW" count="9 Places" />
            <CrowdIndicator level="MODERATE" count="5 Places" />
            <CrowdIndicator level="HIGH" count="2 Places" />
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
            2 peak alerts currently active at Metro DMV & Central Hospital.
          </p>
        </div>

        {/* Recommended Visiting Times Widget */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Recommended Visiting Times</span>
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
              Optimal
            </span>
          </div>
          <div className="text-lg font-extrabold text-navy-900 mt-1">
            08:00 AM - 10:00 AM
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
            Off-peak morning window exhibits 62% shorter queue hold times.
          </p>
        </div>
      </div>

      {/* 4. Recent Predictions & Hourly Forecast Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PredictionChart />
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-navy-900 mb-1">Quick Citizen Actions</h3>
            <p className="text-xs text-slate-500 mb-4">One-click shortcuts to bypass line bottlenecks</p>

            <div className="space-y-2.5">
              <Link
                to="/locations"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group"
              >
                <div>
                  <div className="text-xs font-bold text-navy-900 group-hover:text-blue-600 transition-colors">
                    Join Online Queue
                  </div>
                  <div className="text-[11px] text-slate-500">Generate virtual token number</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </Link>

              <Link
                to="/report"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group"
              >
                <div>
                  <div className="text-xs font-bold text-navy-900 group-hover:text-blue-600 transition-colors">
                    Report Crowd Condition
                  </div>
                  <div className="text-[11px] text-slate-500">Help fellow citizens plan visits</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </Link>

              <Link
                to="/predictions"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group"
              >
                <div>
                  <div className="text-xs font-bold text-navy-900 group-hover:text-blue-600 transition-colors">
                    AI What-If Forecaster
                  </div>
                  <div className="text-[11px] text-slate-500">Simulate desk capacity & arrival times</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Fictional demonstration data</span>
            </span>
            <Link to="/profile" className="text-blue-600 font-bold hover:underline">
              View Tickets &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Nearby Public Places Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-900">Nearby Public Places</h2>
            <p className="text-xs text-slate-500">Showing facilities matching your location and filter selection</p>
          </div>
          <Link to="/locations" className="text-xs font-bold text-blue-600 hover:text-blue-700">
            View All ({locations.length})
          </Link>
        </div>

        {loading ? (
          <LoadingState message="Discovering nearby facilities..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nearbyLocations.map((loc) => (
              <LocationCard
                key={loc.id}
                location={loc}
                onJoinQueue={() => navigate(`/locations/${loc.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
