import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Search,
  Clock,
  Shield,
  Sparkles,
  BarChart3,
  MapPin,
  CheckCircle2,
  Users,
  Building2,
  ChevronRight,
} from 'lucide-react';
import LocationCard from '../components/LocationCard';
import { DEMO_LOCATIONS, SYSTEM_METRICS } from '../services/sampleData';

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/locations?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/locations');
    }
  };

  const previewLocations = DEMO_LOCATIONS.slice(0, 3);

  return (
    <div className="space-y-16 sm:space-y-24 py-8 sm:py-16">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>AI-Powered Queue Intelligence & Prediction</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-navy-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
          Eliminate Waiting Lines with{' '}
          <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Predictive Machine Learning
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          QueuePulse AI forecasts customer wait times, models hourly traffic curves, and optimizes desk capacities for hospitals, commercial banks, and government offices.
        </p>

        {/* Hero Search Bar */}
        <div className="mt-10 max-w-2xl mx-auto">
          <form
            onSubmit={handleSearchSubmit}
            className="p-2 sm:p-2.5 bg-white rounded-3xl border border-slate-200 shadow-soft-lg flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="flex-1 flex items-center space-x-3 px-3 w-full">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hospitals, banks, DMVs, passport bureaus..."
                className="w-full text-sm text-navy-900 placeholder-slate-400 focus:outline-none bg-transparent py-2"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/30 flex items-center justify-center space-x-2 shrink-0"
            >
              <span>Explore Facilities</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Quick Tags */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span>Popular:</span>
          <button
            onClick={() => navigate('/locations?category=HOSPITAL')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-400 transition-colors"
          >
            Metro Hospital
          </button>
          <button
            onClick={() => navigate('/locations?category=GOVERNMENT_OFFICE')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-400 transition-colors"
          >
            DMV Hub
          </button>
          <button
            onClick={() => navigate('/locations?category=BANK')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-400 transition-colors"
          >
            Commercial Banks
          </button>
        </div>
      </section>

      {/* Live System Metrics Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-navy-900">{SYSTEM_METRICS.totalLocations}</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Demonstration Facilities</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-600">{SYSTEM_METRICS.activeCounters} / {SYSTEM_METRICS.totalCounters}</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Active Service Desks</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600">{SYSTEM_METRICS.mlAccuracyPercentage}%</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Random Forest R² Accuracy</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-navy-900">~{SYSTEM_METRICS.averageWaitTimeMinutes}m</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Average Wait Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Real-Time Facilities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Live Telemetry</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Real-Time Queue Status Across City Desks
            </h2>
          </div>
          <Link
            to="/locations"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View All 16 Facilities</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {previewLocations.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              onJoinQueue={() => navigate(`/locations/${loc.id}`)}
            />
          ))}
        </div>
      </section>

      {/* How It Works (Three-Tier Architecture) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-navy-900 via-slate-900 to-navy-950 text-white rounded-3xl p-8 sm:p-12 shadow-soft-lg">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Activity className="w-3.5 h-3.5" />
              <span>Full Stack Intelligent Pipeline</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Engineered for Public Service Resilience
            </h2>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              QueuePulse AI integrates physical check-ins with Scikit-learn regressors to forecast delays before customers leave home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-white mb-2">Ingestion & Tracking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tokens are issued via Express & PostgreSQL, tracking timestamps across Waiting, Serving, and Completed stages.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-sm mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-white mb-2">Random Forest Regressor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Python FastAPI models queue volume, counter count, service rate, and hour of day to calculate 95% confidence wait bounds.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-sm mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-white mb-2">Dynamic Capacity Rebalancing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Facility administrators receive automatic counter surge recommendations to immediately clear congestion spikes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-blue-600 text-white rounded-3xl p-8 sm:p-12 shadow-glow">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Experience Intelligent Queue Management?
          </h2>
          <p className="text-blue-100 text-sm max-w-xl mx-auto mt-2 mb-8">
            Explore 16 real-time demonstration facilities, view predictions, or launch the administrator mission control console.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/locations"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-blue-700 font-bold text-xs uppercase tracking-wider hover:bg-blue-50 transition-colors shadow-sm"
            >
              Browse Facilities
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-800 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-900 transition-colors border border-blue-400/30"
            >
              Open User Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
