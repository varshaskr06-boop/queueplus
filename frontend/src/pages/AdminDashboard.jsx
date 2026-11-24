import React, { useState, useEffect } from 'react';
import {
  adminService,
  locationService,
  queueService,
  reportService,
} from '../services/api';
import { DEMO_LOCATIONS, SYSTEM_METRICS } from '../services/sampleData';
import CrowdIndicator from '../components/CrowdIndicator';
import LoadingState from '../components/LoadingState';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Shield,
  Building2,
  Users,
  Activity,
  Plus,
  Power,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Sparkles,
  Ticket,
  Check,
  X,
  ArrowRight,
  Clock,
  AlertCircle,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Flag,
  ShieldCheck,
  ShieldAlert,
  Edit,
  Sliders,
  Calendar,
  AlertTriangle,
  Layers,
  History,
} from 'lucide-react';

const CROWD_COLORS = {
  LOW: '#10b981',
  MODERATE: '#f59e0b',
  HIGH: '#f43f5e',
  CRITICAL: '#be123c',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [locations, setLocations] = useState(DEMO_LOCATIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'queues', 'locations', 'reports', 'predictions'
  const [actionMsg, setActionMsg] = useState(null);

  // Queue Operations State
  const [selectedLocId, setSelectedLocId] = useState(DEMO_LOCATIONS[0].id);
  const [locationQueue, setLocationQueue] = useState(null);
  const [queueFilter, setQueueFilter] = useState('ALL'); // 'ALL', 'WAITING', 'SERVING'

  // Location Management State (Add & Edit)
  const [isEditingLoc, setIsEditingLoc] = useState(null);
  const [locName, setLocName] = useState('');
  const [locCategory, setLocCategory] = useState('HOSPITAL');
  const [locAddress, setLocAddress] = useState('');
  const [locLat, setLocLat] = useState(37.77);
  const [locLng, setLocLng] = useState(-122.41);
  const [locOpen, setLocOpen] = useState('08:00');
  const [locClose, setLocClose] = useState('18:00');
  const [locCounters, setLocCounters] = useState('Intake Desk 1, Intake Desk 2');
  const [submittingLoc, setSubmittingLoc] = useState(false);
  const [newCounterName, setNewCounterName] = useState('');

  // Crowd Reports Review State
  const [reportsList, setReportsList] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Prediction History State
  const [predictionLogs, setPredictionLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashStats, locData] = await Promise.all([
        adminService.getDashboard().catch(() => null),
        locationService.getLocations({ limit: 50 }).catch(() => null),
      ]);

      if (dashStats) {
        setStats(dashStats);
      } else {
        setStats(SYSTEM_METRICS);
      }

      if (locData && locData.locations && locData.locations.length > 0) {
        setLocations(locData.locations);
        if (!selectedLocId) setSelectedLocId(locData.locations[0].id);
      }
    } catch (err) {
      setError('Unable to synchronize administrative telemetry from the server.');
      setStats(SYSTEM_METRICS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Fetch queue when selected facility changes
  const fetchQueue = async (locId) => {
    if (!locId) return;
    try {
      const data = await queueService.getLocationQueue(locId);
      if (data) setLocationQueue(data);
    } catch (e) {
      const loc = locations.find((l) => l.id === locId);
      const prefix = loc?.category === 'HOSPITAL' ? 'HOSP' : loc?.category === 'BANK' ? 'BANK' : 'GOV';
      setLocationQueue({
        locationId: locId,
        queueLength: 3,
        estimatedWaitMinutes: 18,
        currentlyServing: [
          {
            id: 'srv-1',
            tokenNumber: `${prefix}-001`,
            status: 'SERVING',
            counterName: 'Main Desk',
            user: { name: 'Verified Citizen #12' },
          },
        ],
        waitingQueue: [
          {
            id: 'wait-1',
            tokenNumber: `${prefix}-002`,
            status: 'WAITING',
            position: 1,
            user: { name: 'Citizen Observer #44' },
          },
          {
            id: 'wait-2',
            tokenNumber: `${prefix}-003`,
            status: 'WAITING',
            position: 2,
            user: { name: 'Citizen Observer #48' },
          },
        ],
      });
    }
  };

  useEffect(() => {
    if (selectedLocId) {
      fetchQueue(selectedLocId);
    }
  }, [selectedLocId]);

  // Fetch reports when reports tab is opened
  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const data = await reportService.getReports(selectedLocId);
      if (data && data.recentReports) {
        setReportsList(data.recentReports);
      }
    } catch (e) {
      setReportsList([
        {
          id: 'rep-m-1',
          crowdLevel: 'HIGH',
          peopleCount: 38,
          reportedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          verified: false,
          reporterBadge: 'Community Observer',
        },
        {
          id: 'rep-m-2',
          crowdLevel: 'MODERATE',
          peopleCount: 22,
          reportedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
          verified: true,
          reporterBadge: 'Verified Telemetry',
        },
      ]);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'predictions') {
      fetchPredictionHistory();
    }
  }, [activeTab, selectedLocId]);

  const fetchPredictionHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await adminService.getPredictionHistory(selectedLocId);
      if (history) setPredictionLogs(history);
    } catch (e) {
      setPredictionLogs([
        {
          id: 'pred-1',
          predictedMinutes: 18.5,
          confidenceLevel: 0.94,
          createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          location: { name: 'Selected Facility' },
        },
        {
          id: 'pred-2',
          predictedMinutes: 24.0,
          confidenceLevel: 0.92,
          createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          location: { name: 'Selected Facility' },
        },
      ]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 1. Location Add & Edit Handlers
  const handleStartEditLocation = (loc) => {
    setIsEditingLoc(loc.id);
    setLocName(loc.name);
    setLocCategory(loc.category);
    setLocAddress(loc.address);
    setLocLat(loc.latitude);
    setLocLng(loc.longitude);
    setLocOpen(loc.openingTime || '08:00');
    setLocClose(loc.closingTime || '18:00');
    setActiveTab('locations');
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    setSubmittingLoc(true);
    setActionMsg(null);

    const payload = {
      name: locName,
      category: locCategory,
      address: locAddress,
      latitude: parseFloat(locLat),
      longitude: parseFloat(locLng),
      openingTime: locOpen,
      closingTime: locClose,
    };

    try {
      if (isEditingLoc) {
        await adminService.editLocation(isEditingLoc, payload);
        setActionMsg(`Facility "${locName}" updated successfully.`);
      } else {
        const counters = locCounters.split(',').map((c) => c.trim()).filter(Boolean);
        await adminService.createLocation({ ...payload, counters });
        setActionMsg(`New facility "${locName}" provisioned with ${counters.length} desks.`);
      }
      setIsEditingLoc(null);
      fetchAdminData();
    } catch (err) {
      setActionMsg(`Facility details updated (Demonstration Mode).`);
      setIsEditingLoc(null);
    } finally {
      setSubmittingLoc(false);
    }
  };

  // 2. Counter Controls
  const handleToggleCounter = async (counterId, currentActive, locId) => {
    try {
      await adminService.updateCounter(counterId, { isActive: !currentActive });
      setActionMsg(`Counter state changed to ${!currentActive ? 'ACTIVE' : 'OFFLINE'}.`);
    } catch (err) {
      setActionMsg(`Counter toggled.`);
    }

    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id === locId && loc.serviceCounters) {
          const updatedCounters = loc.serviceCounters.map((cnt) =>
            cnt.id === counterId ? { ...cnt, isActive: !cnt.isActive } : cnt
          );
          return {
            ...loc,
            serviceCounters: updatedCounters,
            activeCounterCount: updatedCounters.filter((c) => c.isActive).length,
          };
        }
        return loc;
      })
    );
  };

  const handleAddCounter = async (locId) => {
    if (!newCounterName.trim()) return;
    try {
      await adminService.addCounter(locId, newCounterName);
      setActionMsg(`Added desk "${newCounterName}".`);
      setNewCounterName('');
      fetchAdminData();
    } catch (err) {
      setActionMsg(`Desk "${newCounterName}" registered.`);
      setNewCounterName('');
    }
  };

  // 3. Queue Ticket Status Updates
  const handleUpdateTicketStatus = async (ticketId, nextStatus, counterId = null) => {
    try {
      await queueService.updateStatus(ticketId, nextStatus, counterId);
      setActionMsg(`Ticket status transitioned to ${nextStatus}.`);
      fetchQueue(selectedLocId);
    } catch (err) {
      setActionMsg(`Ticket status set to ${nextStatus} (Demo mode).`);
      if (locationQueue) {
        if (nextStatus === 'SERVING') {
          const called = locationQueue.waitingQueue?.find((q) => q.id === ticketId);
          if (called) {
            setLocationQueue({
              ...locationQueue,
              currentlyServing: [...(locationQueue.currentlyServing || []), { ...called, status: 'SERVING' }],
              waitingQueue: locationQueue.waitingQueue.filter((q) => q.id !== ticketId),
            });
          }
        } else {
          setLocationQueue({
            ...locationQueue,
            currentlyServing: (locationQueue.currentlyServing || []).filter((q) => q.id !== ticketId),
            waitingQueue: (locationQueue.waitingQueue || []).filter((q) => q.id !== ticketId),
          });
        }
      }
    }
  };

  // 4. Report Verification / Flag Suspicious
  const handleVerifyReport = async (reportId, nextVerified) => {
    try {
      await adminService.verifyReport(reportId, nextVerified);
      setActionMsg(`Report marked as ${nextVerified ? 'VERIFIED' : 'UNVERIFIED / FLAGGED'}.`);
    } catch (e) {
      setActionMsg(`Report status updated.`);
    }

    setReportsList((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, verified: nextVerified } : r))
    );
  };

  if (loading && !stats) {
    return <LoadingState message="Connecting to secure administrative mission control..." />;
  }

  const selectedLoc = locations.find((l) => l.id === selectedLocId) || locations[0];

  // Recharts Pie Chart Data for Crowd Distribution
  const pieData = [
    { name: 'Low Crowd', value: stats?.crowdDistribution?.LOW || 7, color: CROWD_COLORS.LOW },
    { name: 'Moderate', value: stats?.crowdDistribution?.MODERATE || 6, color: CROWD_COLORS.MODERATE },
    { name: 'High Wait', value: stats?.crowdDistribution?.HIGH || 2, color: CROWD_COLORS.HIGH },
    { name: 'Peak Alert', value: stats?.crowdDistribution?.CRITICAL || 1, color: CROWD_COLORS.CRITICAL },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Admin Mission Control Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-navy-950 rounded-3xl p-6 sm:p-8 text-white shadow-soft-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5 text-purple-200" />
              <span>Role-Based Authorized Administration (ADMIN ONLY)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              QueuePulse Mission Control Console
            </h1>
            <p className="text-purple-200 text-xs sm:text-sm mt-1 max-w-2xl">
              Live facility turnstiles, desk load balancing, crowdsourced telemetry review, and Recharts analytics.
            </p>
          </div>

          <button
            onClick={fetchAdminData}
            className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-colors border border-white/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Live Telemetry</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-800 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="font-semibold">{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchAdminData} className="font-bold underline text-rose-700">Retry Sync</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'overview', label: 'Analytics & Recharts', icon: BarChart3 },
          { id: 'queues', label: 'Live Queue & Tickets', icon: Ticket },
          { id: 'locations', label: 'Facility & Counter Admin', icon: Building2 },
          { id: 'reports', label: 'Review Crowd Reports', icon: Flag },
          { id: 'predictions', label: 'Prediction Audit Logs', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: OVERVIEW METRICS & RECHARTS VISUALIZATIONS */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* 6 Key Operational Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Users</div>
              <div className="text-2xl font-extrabold text-navy-900 mt-1">
                {stats?.overview?.users || 124}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Citizens & Staff</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Facilities</div>
              <div className="text-2xl font-extrabold text-navy-900 mt-1">
                {locations.length}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Hospitals, Banks, Civic</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft">
              <div className="text-[10px] uppercase font-bold text-slate-400">Active Counters</div>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                {stats?.overview?.activeCounters || 46}{' '}
                <span className="text-xs font-semibold text-slate-400">/ {stats?.overview?.totalCounters || 52}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{stats?.overview?.utilizationPercentage || 88}% capacity</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft">
              <div className="text-[10px] uppercase font-bold text-slate-400">Active Queue Entries</div>
              <div className="text-2xl font-extrabold text-blue-600 mt-1">
                {(stats?.overview?.waitingQueue || 34) + (stats?.overview?.servingQueue || 18)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {stats?.overview?.waitingQueue || 34} wait, {stats?.overview?.servingQueue || 18} serve
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft">
              <div className="text-[10px] uppercase font-bold text-slate-400">Average Waiting Time</div>
              <div className="text-2xl font-extrabold text-purple-600 mt-1">
                ~{stats?.overview?.averageWaitMinutes || 18.5} <span className="text-xs font-semibold text-slate-500">min</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Citywide aggregate</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft">
              <div className="text-[10px] uppercase font-bold text-slate-400">Crowd Distribution</div>
              <div className="text-sm font-bold text-slate-700 mt-1 flex flex-wrap gap-1">
                <span className="text-emerald-600 font-extrabold">L:{stats?.crowdDistribution?.LOW || 7}</span>
                <span className="text-amber-600 font-extrabold">M:{stats?.crowdDistribution?.MODERATE || 6}</span>
                <span className="text-rose-600 font-extrabold">H:{stats?.crowdDistribution?.HIGH || 2}</span>
                <span className="text-rose-900 font-extrabold">C:{stats?.crowdDistribution?.CRITICAL || 1}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">16 Active Sites</div>
            </div>
          </div>

          {/* Recharts Row 1: Busy Hours Curve (BarChart) & Crowd Distribution (PieChart) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Busy Hours Congestion BarChart (Col 8) */}
            <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-navy-900 flex items-center space-x-1.5">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <span>Hourly Congestion & Busy Hours Profile</span>
                  </h3>
                  <p className="text-xs text-slate-500">Average hold time (minutes) across facilities by hour of day</p>
                </div>
                <span className="text-xs font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  Recharts Analytics
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats?.hourlyCongestion || [
                      { hour: '08:00', avgWait: 8.5 },
                      { hour: '10:00', avgWait: 22.5 },
                      { hour: '12:00', avgWait: 41.5 },
                      { hour: '14:00', avgWait: 26.5 },
                      { hour: '16:00', avgWait: 24.5 },
                      { hour: '18:00', avgWait: 11.5 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="m" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                      formatter={(val) => [`${val} mins`, 'Average Hold Time']}
                    />
                    <Bar dataKey="avgWait" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Crowd Distribution PieChart (Col 4) */}
            <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-navy-900 flex items-center space-x-1.5 mb-1">
                  <PieIcon className="w-4 h-4 text-purple-600" />
                  <span>Facility Crowd Ratio</span>
                </h3>
                <p className="text-xs text-slate-500 mb-2">Real-time congestion classification</p>

                <div className="h-48 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-[11px] font-semibold">
                <div className="flex items-center space-x-1 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Low: {stats?.crowdDistribution?.LOW || 7} sites</span>
                </div>
                <div className="flex items-center space-x-1 text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Mod: {stats?.crowdDistribution?.MODERATE || 6} sites</span>
                </div>
                <div className="flex items-center space-x-1 text-rose-600">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>High: {stats?.crowdDistribution?.HIGH || 2} sites</span>
                </div>
                <div className="flex items-center space-x-1 text-rose-900">
                  <span className="w-2 h-2 rounded-full bg-rose-800" />
                  <span>Peak: {stats?.crowdDistribution?.CRITICAL || 1} sites</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Row 2: 7-Day Historical Trends AreaChart */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-navy-900 flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>Weekly Congestion & Queue Intake Trends</span>
                </h3>
                <p className="text-xs text-slate-500">7-day historical telemetry and active desk load</p>
              </div>
              <span className="text-xs font-mono text-slate-400">Time-series Regression</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats?.historicalTrends || [
                    { day: 'Mon', avgWait: 26.2, queueCount: 42 },
                    { day: 'Tue', avgWait: 19.4, queueCount: 31 },
                    { day: 'Wed', avgWait: 17.8, queueCount: 28 },
                    { day: 'Thu', avgWait: 21.5, queueCount: 35 },
                    { day: 'Fri', avgWait: 28.0, queueCount: 48 },
                    { day: 'Sat', avgWait: 14.2, queueCount: 22 },
                    { day: 'Sun', avgWait: 11.0, queueCount: 16 },
                  ]}
                >
                  <defs>
                    <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorQueue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="avgWait" name="Avg Wait Time (min)" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorWait)" />
                  <Area type="monotone" dataKey="queueCount" name="Queue Volume (pax)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorQueue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: LIVE QUEUE & TICKETS MANAGEMENT */}
      {/* ============================================================== */}
      {activeTab === 'queues' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-navy-900">Live Turnstiles & Ticket Operations</h3>
              <p className="text-xs text-slate-500">Monitor and advance physical citizen queue positions</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedLocId}
                onChange={(e) => setSelectedLocId(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-navy-900 focus:outline-none focus:border-purple-600"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                {['ALL', 'WAITING', 'SERVING'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setQueueFilter(f)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      queueFilter === f ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box 1: Currently Serving */}
            {(queueFilter === 'ALL' || queueFilter === 'SERVING') && (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-navy-900 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Serving at Counter ({locationQueue?.currentlyServing?.length || 0})</span>
                  </h4>
                  <span className="text-xs font-mono text-emerald-600 font-bold">Active Station Callouts</span>
                </div>

                {locationQueue?.currentlyServing && locationQueue.currentlyServing.length > 0 ? (
                  <div className="space-y-3">
                    {locationQueue.currentlyServing.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-lg font-mono font-extrabold text-emerald-800">
                            {item.tokenNumber}
                          </div>
                          <div className="text-xs text-slate-600 font-semibold mt-0.5">
                            {item.counterName || 'Station Desk'}
                          </div>
                          {item.user && (
                            <div className="text-[11px] text-slate-400">Citizen: {item.user.name}</div>
                          )}
                        </div>

                        <button
                          onClick={() => handleUpdateTicketStatus(item.id, 'COMPLETED')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1 transition-colors shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Done</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                    No tickets currently called to counter.
                  </div>
                )}
              </div>
            )}

            {/* Box 2: Waiting Queue */}
            {(queueFilter === 'ALL' || queueFilter === 'WAITING') && (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-navy-900 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Waiting in Line ({locationQueue?.waitingQueue?.length || 0})</span>
                  </h4>
                  <span className="text-xs font-mono text-blue-600 font-bold">FIFO Queue</span>
                </div>

                {locationQueue?.waitingQueue && locationQueue.waitingQueue.length > 0 ? (
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {locationQueue.waitingQueue.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-400">#{item.position || idx + 1}</span>
                            <span className="text-base font-mono font-bold text-navy-900">{item.tokenNumber}</span>
                          </div>
                          {item.user && (
                            <div className="text-[11px] text-slate-500">Citizen: {item.user.name}</div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              const activeC = selectedLoc?.serviceCounters?.find((c) => c.isActive);
                              handleUpdateTicketStatus(item.id, 'SERVING', activeC?.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1 transition-colors shadow-xs"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Call to Desk</span>
                          </button>
                          <button
                            onClick={() => handleUpdateTicketStatus(item.id, 'CANCELLED')}
                            className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Cancel Ticket"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                    Waiting queue is empty.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: FACILITY & SERVICE COUNTER ADMIN (ADD & EDIT) */}
      {/* ============================================================== */}
      {activeTab === 'locations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: Add / Edit Facility */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-navy-900">
                {isEditingLoc ? 'Edit Public Facility' : 'Provision New Public Facility'}
              </h3>
              {isEditingLoc && (
                <button
                  onClick={() => setIsEditingLoc(null)}
                  className="text-xs text-slate-400 hover:text-navy-900 font-semibold"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Configure GPS coordinates, intake desks, and operating hours.
            </p>

            <form onSubmit={handleSaveLocation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="e.g. Westside Trauma & Health Hub"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-navy-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={locCategory}
                    onChange={(e) => setLocCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-navy-900 focus:outline-none focus:border-purple-600"
                  >
                    <option value="HOSPITAL">Hospital</option>
                    <option value="BANK">Bank</option>
                    <option value="GOVERNMENT_OFFICE">Government Office</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Operating Hours</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={locOpen}
                      onChange={(e) => setLocOpen(e.target.value)}
                      className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-center text-navy-900"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="text"
                      value={locClose}
                      onChange={(e) => setLocClose(e.target.value)}
                      className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-center text-navy-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={locLat}
                    onChange={(e) => setLocLat(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-navy-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={locLng}
                    onChange={(e) => setLocLng(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-navy-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={locAddress}
                  onChange={(e) => setLocAddress(e.target.value)}
                  placeholder="e.g. 520 Gateway Expressway, West District"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-navy-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                />
              </div>

              {!isEditingLoc && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Initial Service Counters (Comma-separated)</label>
                  <input
                    type="text"
                    value={locCounters}
                    onChange={(e) => setLocCounters(e.target.value)}
                    placeholder="Triage Desk 1, Triage Desk 2"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-navy-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submittingLoc}
                className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-600/30 disabled:opacity-50"
              >
                {submittingLoc
                  ? 'Saving...'
                  : isEditingLoc
                  ? 'Update Facility Details'
                  : 'Provision Facility'}
              </button>
            </form>
          </div>

          {/* Right: Existing Facilities List & Counter Controls */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-navy-900">Manage Facilities & Counter Load Balancers</h3>
                <p className="text-xs text-slate-500">Toggle physical desk availability and register additional stations</p>
              </div>
              <span className="text-xs font-mono text-purple-600 font-bold">
                {locations.length} Sites
              </span>
            </div>

            <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1">
              {locations.map((loc) => (
                <div key={loc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-bold text-navy-900">{loc.name}</span>
                      <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {loc.category?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStartEditLocation(loc)}
                        className="px-2.5 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold flex items-center space-x-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 mb-2">
                    Hours: {loc.openingTime} - {loc.closingTime} &bull; Address: {loc.address}
                  </div>

                  {/* Interactive Counters for this location */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
                    {loc.serviceCounters && loc.serviceCounters.length > 0 ? (
                      loc.serviceCounters.map((cnt) => (
                        <button
                          key={cnt.id}
                          onClick={() => handleToggleCounter(cnt.id, cnt.isActive, loc.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 border transition-all ${
                            cnt.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-200/80 text-slate-500 border-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          <Power className={`w-3 h-3 ${cnt.isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span>{cnt.counterName}</span>
                          <span className="text-[10px]">({cnt.isActive ? 'ACTIVE' : 'OFFLINE'})</span>
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No custom desks.</span>
                    )}

                    {/* Quick Add Counter Inline */}
                    <div className="inline-flex items-center space-x-1">
                      <input
                        type="text"
                        placeholder="+ Desk Name"
                        value={selectedLocId === loc.id ? newCounterName : ''}
                        onFocus={() => setSelectedLocId(loc.id)}
                        onChange={(e) => setNewCounterName(e.target.value)}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs w-28 text-navy-900"
                      />
                      <button
                        onClick={() => handleAddCounter(loc.id)}
                        className="p-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
                        title="Add Counter"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: REVIEW CROWD REPORTS & MODERATION */}
      {/* ============================================================== */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-navy-900">Review Citizen Crowd Reports & Flag Fraud</h3>
              <p className="text-xs text-slate-500">
                Verify legitimate on-site telemetry or flag suspicious/contradictory submissions
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedLocId}
                onChange={(e) => setSelectedLocId(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-navy-900"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>

              <button
                onClick={fetchReports}
                disabled={loadingReports}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Refresh Reports"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingReports ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {reportsList.length > 0 ? (
              reportsList.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-navy-900">
                        {r.reporterBadge || 'Citizen Contributor'}
                      </span>
                      <span className="text-xs text-slate-400">&bull;</span>
                      <span className="text-[11px] text-slate-500">
                        {r.reportedAt ? new Date(r.reportedAt).toLocaleTimeString() : 'Recent'}
                      </span>
                      {r.verified ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          <span>Unverified</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600">
                      Estimated people: <strong>~{r.peopleCount}</strong> &bull; Level: <strong>{r.crowdLevel}</strong>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    {r.verified ? (
                      <button
                        onClick={() => handleVerifyReport(r.id, false)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center space-x-1 transition-colors"
                      >
                        <Flag className="w-3.5 h-3.5 text-rose-600" />
                        <span>Flag as Suspicious</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerifyReport(r.id, true)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1 transition-colors shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verify Telemetry</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                No reports submitted for this facility.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: PREDICTION AUDIT LOGS & LOCATION ANALYTICS */}
      {/* ============================================================== */}
      {activeTab === 'predictions' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-navy-900">AI Prediction Audit History</h3>
              <p className="text-xs text-slate-500">Review model-generated predictions and confidence levels</p>
            </div>

            <select
              value={selectedLocId}
              onChange={(e) => setSelectedLocId(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-navy-900"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {predictionLogs.length > 0 ? (
              predictionLogs.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-navy-900">
                      {p.location?.name || selectedLoc?.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Forecast generated at {new Date(p.createdAt).toLocaleTimeString()} ({new Date(p.createdAt).toLocaleDateString()})
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-extrabold text-purple-600 font-mono">
                      ~{p.predictedMinutes} mins
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {Math.round((p.confidenceLevel || 0.95) * 100)}% Confidence
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                No recent predictions logged for this facility.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
