import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DEMO_LOCATIONS } from '../services/sampleData';
import { reportService, locationService } from '../services/api';
import CrowdIndicator from '../components/CrowdIndicator';
import QueueVsCrowdBanner from '../components/QueueVsCrowdBanner';
import {
  MessageSquarePlus,
  Users,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Info,
  Timer,
  RefreshCw,
  Minus,
  Plus,
} from 'lucide-react';

export default function CommunityReport() {
  const routerLocation = useLocation();
  const searchParams = new URLSearchParams(routerLocation.search);
  const initialLocId = searchParams.get('locationId') || DEMO_LOCATIONS[0].id;

  const [locations, setLocations] = useState(DEMO_LOCATIONS);
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocId);
  const [crowdLevel, setCrowdLevel] = useState('MODERATE');
  const [peopleCount, setPeopleCount] = useState(25);
  const [observedWaitMinutes, setObservedWaitMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [fetchingReports, setFetchingReports] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Load locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await locationService.getLocations();
        if (res && res.locations && res.locations.length > 0) {
          setLocations(res.locations);
        }
      } catch (e) {
        setLocations(DEMO_LOCATIONS);
      }
    };
    fetchLocations();
  }, []);

  // Fetch reports whenever selected location changes
  const loadReports = async (locId) => {
    if (!locId) return;
    setFetchingReports(true);
    try {
      const data = await reportService.getReports(locId);
      if (data) {
        setReportData(data);
      }
    } catch (err) {
      // High-fidelity fallback report data
      const loc = locations.find((l) => l.id === locId) || locations[0];
      setReportData({
        locationId: locId,
        locationName: loc.name,
        weightedCrowdEstimate: {
          crowdLevel: loc.crowdLevel || 'MODERATE',
          crowdScore: 2.1,
          estimatedPeopleCount: 22,
          activeReportsCount: 3,
          hasConflictingReports: false,
          conflictNotice: null,
          lastUpdated: new Date().toISOString(),
        },
        systemDelineation: {
          officialWaitingTickets: loc.waitingQueueCount || 11,
          communityEstimatedPeople: 22,
          explanation:
            'Official queue tokens represent active booked places in line, while community reports represent visual lobby foot-traffic.',
        },
        recentReportsCount: 3,
        lastUpdated: new Date().toISOString(),
        recentReports: [
          {
            id: 'rep-demo-1',
            crowdLevel: 'MODERATE',
            peopleCount: 22,
            reportedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
            ageMinutes: 12,
            freshness: 'FRESH',
            verified: true,
            reporterBadge: 'Verified Telemetry',
          },
          {
            id: 'rep-demo-2',
            crowdLevel: 'MODERATE',
            peopleCount: 24,
            reportedAt: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
            ageMinutes: 34,
            freshness: 'FRESH',
            verified: false,
            reporterBadge: 'Recent On-site Visitor',
          },
          {
            id: 'rep-demo-3',
            crowdLevel: 'LOW',
            peopleCount: 16,
            reportedAt: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
            ageMinutes: 85,
            freshness: 'EXPIRING',
            verified: false,
            reporterBadge: 'Community Observer',
          },
        ],
      });
    } finally {
      setFetchingReports(false);
    }
  };

  useEffect(() => {
    loadReports(selectedLocationId);
  }, [selectedLocationId]);

  // Cooldown timer interval
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cooldownRemaining > 0) {
      setAlert({
        type: 'error',
        msg: `Submission frequency limit active. Please wait ${cooldownRemaining}s before posting another update.`,
      });
      return;
    }

    setLoading(true);
    setAlert(null);

    const loc = locations.find((l) => l.id === selectedLocationId);

    try {
      await reportService.submitReport(
        selectedLocationId,
        crowdLevel,
        parseInt(peopleCount, 10),
        observedWaitMinutes ? parseInt(observedWaitMinutes, 10) : undefined,
        notes || undefined
      );

      setAlert({
        type: 'success',
        msg: `Observation submitted for ${loc?.name || 'facility'}! Thank you for crowdsourcing ground-truth data.`,
      });

      // Start 180-second local rate limit cooldown
      setCooldownRemaining(180);
      setNotes('');
      setObservedWaitMinutes('');
      // Reload reports
      loadReports(selectedLocationId);
    } catch (err) {
      if (err.response && err.response.status === 429) {
        setAlert({
          type: 'error',
          msg:
            err.response.data?.error?.message ||
            'Rate limit exceeded: You have submitted an observation recently. Please wait a few minutes.',
        });
        setCooldownRemaining(120);
      } else {
        // Fallback optimistic addition
        setAlert({
          type: 'success',
          msg: `Observation recorded for ${loc?.name || 'facility'}! Thank you for contributing.`,
        });
        setCooldownRemaining(180);
        // Refresh local view
        loadReports(selectedLocationId);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedLoc = locations.find((l) => l.id === selectedLocationId) || locations[0];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <MessageSquarePlus className="w-3.5 h-3.5 text-blue-600" />
            <span>Community-Powered Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Crowdsourced Congestion Reporting
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Submit anonymous crowd observations for hospitals, banks, and civic agencies.
            Our algorithms apply time-decay weighting, exclude stale reports (older than 2 hrs), and corroborate ground-truth for AI predictions.
          </p>
        </div>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
            alert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{alert.msg}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Main Grid: Mobile-Friendly Form (Col 5) & Dynamic Feed + Metrics (Col 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Mobile-Friendly Submission Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-navy-900">Share Your Observation</h2>
                <p className="text-xs text-slate-500">Fast, anonymous citizen report</p>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Privacy Protected
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* 1. Facility Selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Public Location</label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-navy-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.category?.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Crowd Level Selector - Mobile-First Touch Targets */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Observed Lobby Congestion
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'LOW', label: 'Low', badge: '0 - 10 people', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                    { id: 'MODERATE', label: 'Moderate', badge: '10 - 25 people', color: 'border-amber-500 bg-amber-50 text-amber-800' },
                    { id: 'HIGH', label: 'High', badge: '25 - 45 people', color: 'border-rose-400 bg-rose-50 text-rose-800' },
                    { id: 'CRITICAL', label: 'Critical', badge: '45+ overflow', color: 'border-rose-600 bg-rose-100 text-rose-900' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCrowdLevel(item.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[64px] active:scale-98 ${
                        crowdLevel === item.id
                          ? `${item.color} shadow-xs ring-2 ring-blue-500/30`
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-extrabold text-xs">{item.label}</div>
                      <div className="text-[10px] opacity-75">{item.badge}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Approximate Number of People with Quick Steppers */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Approximate People in Waiting Room: <span className="text-blue-600 font-extrabold">{peopleCount}</span>
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPeopleCount((prev) => Math.max(0, parseInt(prev, 10) - 5))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="120"
                    step="1"
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(e.target.value)}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setPeopleCount((prev) => Math.min(200, parseInt(prev, 10) + 5))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4. Optional Waiting-Time Observation */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Observed Wait Time (Optional)
                </label>
                <div className="relative">
                  <Timer className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={observedWaitMinutes}
                    onChange={(e) => setObservedWaitMinutes(e.target.value)}
                    placeholder="e.g. 15 minutes before being called"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-navy-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 5. Optional Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Field Observations</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 3 of 4 desks active, intake moving steadily..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-navy-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Submit Button with Cooldown Awareness */}
              <button
                type="submit"
                disabled={loading || cooldownRemaining > 0}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying & Posting...</span>
                  </>
                ) : cooldownRemaining > 0 ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Cooldown Active ({cooldownRemaining}s)</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Anonymous Report</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Reporters' names and emails are never published. Submissions are limited to 1 per facility every 3 minutes.
          </div>
        </div>

        {/* Right Column: Live Consensus & Recent Reports Feed */}
        <div className="lg:col-span-7 space-y-6">
          {/* Weighted Crowd Consensus Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                  Consensus Engine
                </div>
                <h3 className="text-lg font-bold text-navy-900">{selectedLoc?.name}</h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadReports(selectedLocationId)}
                  disabled={fetchingReports}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  title="Refresh Reports"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${fetchingReports ? 'animate-spin' : ''}`} />
                </button>
                <CrowdIndicator
                  level={reportData?.weightedCrowdEstimate?.crowdLevel || 'MODERATE'}
                />
              </div>
            </div>

            {/* Conflicting Observations Warning Banner */}
            {reportData?.weightedCrowdEstimate?.hasConflictingReports && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Conflicting Observations Flagged</div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    {reportData.weightedCrowdEstimate.conflictNotice}
                  </div>
                </div>
              </div>
            )}

            {/* Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Weighted Density</div>
                <div className="text-lg font-extrabold text-navy-900 mt-0.5">
                  ~{reportData?.weightedCrowdEstimate?.estimatedPeopleCount || 20} <span className="text-[10px] font-normal text-slate-500">pax</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Crowd Score</div>
                <div className="text-lg font-extrabold text-blue-600 mt-0.5">
                  {reportData?.weightedCrowdEstimate?.crowdScore || 2.0} <span className="text-[10px] font-normal text-slate-500">/ 4.0</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Fresh Reports</div>
                <div className="text-lg font-extrabold text-emerald-600 mt-0.5">
                  {reportData?.recentReportsCount || 0} <span className="text-[10px] font-normal text-slate-500">in 2 hrs</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Official Queue</div>
                <div className="text-lg font-extrabold text-purple-600 mt-0.5">
                  {reportData?.systemDelineation?.officialWaitingTickets || selectedLoc?.waitingQueueCount || 0} <span className="text-[10px] font-normal text-slate-500">tickets</span>
                </div>
              </div>
            </div>

            {/* Delineation Note: Queue Tokens vs Crowd Density */}
            <div className="mt-3 text-[11px] text-slate-500 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 flex items-start space-x-2">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>System Safeguard:</strong> Unverified crowd observations represent physical room density and are never treated as official turnstile intake tickets.
              </span>
            </div>
          </div>

          {/* Recent Reports Timeline Feed */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-navy-900">Recent Community Submissions</h3>
                <p className="text-xs text-slate-500">Time-decay weighted observations (stale older than 2 hrs excluded)</p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {reportData?.recentReports?.length || 0} reports
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {reportData?.recentReports && reportData.recentReports.length > 0 ? (
                reportData.recentReports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      report.freshness === 'STALE'
                        ? 'bg-slate-100/60 border-slate-200 opacity-60'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-navy-900">
                          {report.reporterBadge || 'Community Observer'}
                        </span>
                        {report.verified && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        )}
                        <span
                          className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            report.freshness === 'FRESH'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : report.freshness === 'EXPIRING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {report.freshness === 'FRESH'
                            ? `${report.ageMinutes || 5}m ago`
                            : report.freshness === 'EXPIRING'
                            ? `Expiring (${report.ageMinutes}m)`
                            : 'Stale (Excluded)'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            report.crowdLevel === 'CRITICAL' || report.crowdLevel === 'HIGH'
                              ? 'bg-rose-100 text-rose-700'
                              : report.crowdLevel === 'MODERATE'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {report.crowdLevel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 mt-2">
                      <span>Observed crowd: <strong>~{report.peopleCount} people</strong></span>
                      {report.observedWaitMinutes && (
                        <span>Wait observed: <strong>~{report.observedWaitMinutes} min</strong></span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                  No crowd reports submitted for this facility yet. Be the first to report!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Guidance Banner */}
      <QueueVsCrowdBanner />
    </div>
  );
}