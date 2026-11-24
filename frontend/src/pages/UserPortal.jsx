import React, { useState, useEffect } from 'react';
import { locationService, queueService, reportService, predictionService } from '../services/api';
import { Search, MapPin, Building2, Clock, Users, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function UserPortal() {
  const [locations, setLocations] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeLocation, setActiveLocation] = useState(null);
  const [modalType, setModalType] = useState(null); // 'join' or 'report'
  const [modalLoading, setModalLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Report modal state
  const [crowdLevel, setCrowdLevel] = useState('MODERATE');
  const [peopleCount, setPeopleCount] = useState(20);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const data = await locationService.getLocations({
        category: category || undefined,
        search: search || undefined,
      });
      setLocations(data.locations || []);
    } catch (err) {
      console.error('Failed to load facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLocations();
  };

  const handleJoinQueue = async () => {
    if (!activeLocation) return;
    setModalLoading(true);
    try {
      const result = await queueService.joinQueue(activeLocation.id);
      setNotification({
        type: 'success',
        message: `Joined queue! Your token is ${result.queueEntry.tokenNumber}. Estimated wait: ${result.estimatedWaitMinutes} minutes.`,
      });
      setModalType(null);
      fetchLocations();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.error?.message || 'Failed to join queue. Please sign in.',
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!activeLocation) return;
    setModalLoading(true);
    try {
      await reportService.submitReport(activeLocation.id, crowdLevel, parseInt(peopleCount, 10));
      setNotification({
        type: 'success',
        message: 'Thank you! Your crowd observation has been recorded.',
      });
      setModalType(null);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.error?.message || 'Failed to submit crowd report.',
      });
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Search Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Public Facility Directory</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Find Public Facilities & Live Queue Status
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            Search 16 demonstration facilities across hospitals, banks, and government offices to view wait times and enter queues online.
          </p>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by facility name or address..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="HOSPITAL">Hospitals & Clinics</option>
              <option value="BANK">Commercial Banks</option>
              <option value="GOVERNMENT_OFFICE">Government Offices</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Facilities Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 mx-auto text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      loc.category === 'HOSPITAL'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : loc.category === 'BANK'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}
                  >
                    {loc.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center space-x-1 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{loc.openingTime} - {loc.closingTime}</span>
                  </span>
                </div>

                <h3 className="font-bold text-white text-base leading-snug mb-1">{loc.name}</h3>
                <p className="text-xs text-slate-400 flex items-start space-x-1.5 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <span>{loc.address}</span>
                </p>

                <div className="grid grid-cols-2 gap-2 my-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Waiting</div>
                    <div className="text-base font-bold text-indigo-400">{loc.waitingQueueCount || 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Active Desks</div>
                    <div className="text-base font-bold text-emerald-400">{loc.activeCounterCount || 0}</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setActiveLocation(loc);
                    setModalType('report');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700/60 transition-colors"
                >
                  Report Crowd
                </button>
                <button
                  onClick={() => {
                    setActiveLocation(loc);
                    setModalType('join');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center space-x-1 shadow-md shadow-indigo-600/20"
                >
                  <span>Join Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join Queue Modal */}
      {modalType === 'join' && activeLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Join Facility Queue</h3>
            <p className="text-xs text-slate-400 mb-4">
              You are requesting a queue ticket for <strong className="text-indigo-300">{activeLocation.name}</strong>.
            </p>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-6 text-xs text-slate-300 space-y-1">
              <div><strong>Current Waiting:</strong> {activeLocation.waitingQueueCount || 0} people</div>
              <div><strong>Active Counters:</strong> {activeLocation.activeCounterCount || 0} counters</div>
              <div><strong>Estimated Wait:</strong> ~{Math.round(((activeLocation.waitingQueueCount || 1) / Math.max(1, activeLocation.activeCounterCount || 1)) * 8)} minutes</div>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={modalLoading}
                onClick={handleJoinQueue}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {modalLoading ? 'Confirming...' : 'Confirm Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crowd Report Modal */}
      {modalType === 'report' && activeLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Report Facility Crowd</h3>
            <p className="text-xs text-slate-400 mb-4">
              Share real-time crowd conditions at <strong className="text-indigo-300">{activeLocation.name}</strong>.
            </p>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Congestion Level</label>
                <select
                  value={crowdLevel}
                  onChange={(e) => setCrowdLevel(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
                >
                  <option value="LOW">Low (0 - 10 people)</option>
                  <option value="MODERATE">Moderate (10 - 25 people)</option>
                  <option value="HIGH">High (25 - 50 people)</option>
                  <option value="CRITICAL">Critical Congestion (50+ people)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Estimated People Count</label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {modalLoading ? 'Submitting...' : 'Submit Observation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
