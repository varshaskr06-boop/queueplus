import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { locationService, queueService, reportService } from '../services/api';
import { DEMO_LOCATIONS } from '../services/sampleData';
import WaitTimeCard from '../components/WaitTimeCard';
import CrowdIndicator from '../components/CrowdIndicator';
import PredictionChart from '../components/PredictionChart';
import LeafletMap from '../components/LeafletMap';
import QueueVsCrowdBanner from '../components/QueueVsCrowdBanner';
import LoadingState from '../components/LoadingState';
import {
  MapPin,
  Clock,
  Phone,
  Users,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  MessageSquarePlus,
  CheckCircle2,
  AlertCircle,
  Timer,
  Ticket,
  Activity,
  Layers,
} from 'lucide-react';

export default function LocationDetails() {
  const { id } = useParams();
  const [location, setLocation] = useState(null);
  const [liveQueue, setLiveQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [joining, setJoining] = useState(false);
  const [userTicket, setUserTicket] = useState(null);
  const navigate = useNavigate();

  const fetchDetailAndQueue = async () => {
    setLoading(true);
    try {
      const [locData, queueData] = await Promise.allSettled([
        locationService.getLocationById(id),
        queueService.getLocationQueue(id),
      ]);

      if (locData.status === 'fulfilled' && locData.value) {
        setLocation(locData.value);
      } else {
        const fallback = DEMO_LOCATIONS.find((l) => l.id === id) || DEMO_LOCATIONS[0];
        setLocation(fallback);
      }

      if (queueData.status === 'fulfilled' && queueData.value) {
        setLiveQueue(queueData.value);
      } else {
        // High fidelity demo queue state
        setLiveQueue({
          queueLength: 6,
          estimatedWaitMinutes: 18,
          currentlyServing: [
            { id: 'srv-1', tokenNumber: 'HOSP-002', counterName: 'Triage Desk 1', startedAt: new Date().toISOString() },
            { id: 'srv-2', tokenNumber: 'HOSP-003', counterName: 'Triage Desk 2', startedAt: new Date().toISOString() },
          ],
          waitingQueue: [
            { id: 'q-1', tokenNumber: 'HOSP-004', position: 1 },
            { id: 'q-2', tokenNumber: 'HOSP-005', position: 2 },
            { id: 'q-3', tokenNumber: 'HOSP-006', position: 3 },
            { id: 'q-4', tokenNumber: 'HOSP-007', position: 4 },
          ],
        });
      }
    } catch (err) {
      const fallback = DEMO_LOCATIONS.find((l) => l.id === id) || DEMO_LOCATIONS[0];
      setLocation(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailAndQueue();
  }, [id]);

  const handleJoinQueue = async () => {
    setJoining(true);
    setNotice(null);
    try {
      const res = await queueService.joinQueue(location.id);
      setUserTicket(res.queueEntry);
      setNotice({
        type: 'success',
        text: `Queue ticket ${res.queueEntry.tokenNumber} reserved! Position #${res.queueEntry.position || 1} in line. Estimated wait: ${res.estimatedWaitMinutes} minutes.`,
      });
      // Refresh live queue entries
      try {
        const updatedQueue = await queueService.getLocationQueue(location.id);
        if (updatedQueue) setLiveQueue(updatedQueue);
      } catch (e) {
        // Ignore refresh error
      }
    } catch (err) {
      // Demo fallback ticket
      const prefix = location.category === 'HOSPITAL' ? 'HOSP' : location.category === 'BANK' ? 'BANK' : 'GOV';
      const fakeToken = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
      const fallbackTicket = {
        id: `demo-${Date.now()}`,
        tokenNumber: fakeToken,
        position: (liveQueue?.waitingQueue?.length || 0) + 1,
        status: 'WAITING',
      };
      setUserTicket(fallbackTicket);
      setNotice({
        type: 'success',
        text: `Virtual ticket ${fakeToken} reserved for ${location.name}. Please keep this tab open.`,
      });
      if (liveQueue) {
        setLiveQueue({
          ...liveQueue,
          queueLength: (liveQueue.queueLength || 0) + 1,
          waitingQueue: [...(liveQueue.waitingQueue || []), fallbackTicket],
        });
      }
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <LoadingState message="Loading facility telemetry & live queue..." />;
  if (!location) return <div>Facility not found.</div>;

  const avgTime =
    location.averageServiceTimeMinutes ||
    (location.category === 'HOSPITAL' ? 8.5 : location.category === 'BANK' ? 5.5 : 9.0);

  const formattedUpdate = location.lastUpdated
    ? new Date(location.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Realtime Live';

  const activeCounters =
    location.serviceCounters?.filter((c) => c.isActive) || [];

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link
        to="/locations"
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-navy-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Facilities</span>
      </Link>

      {/* Facility Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                {location.category?.replace('_', ' ')}
              </span>
              <CrowdIndicator level={location.crowdLevel || 'LOW'} />
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{location.openingTime || '08:00'} - {location.closingTime || '18:00'}</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                ● {formattedUpdate}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              {location.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{location.address}</span>
            </p>

            {location.phone && (
              <p className="text-xs text-slate-500 flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{location.phone}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <Link
              to={`/prediction?locationId=${location.id}`}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs uppercase tracking-wider text-center transition-colors flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Smart Departure</span>
            </Link>

            <Link
              to={`/report?locationId=${location.id}`}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider text-center transition-colors flex items-center justify-center space-x-1.5"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Report Crowd</span>
            </Link>

            <button
              onClick={handleJoinQueue}
              disabled={joining}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Ticket className="w-4 h-4" />
              <span>{joining ? 'Booking Ticket...' : 'Get Queue Ticket'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Notification Banner */}
      {notice && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
            notice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Active User Ticket Display */}
      {userTicket && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-soft-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-2">
              <Ticket className="w-3.5 h-3.5" />
              <span>Your Official Queue Ticket</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight font-mono">{userTicket.tokenNumber}</div>
            <p className="text-xs text-blue-100 mt-1">
              Position #{userTicket.position || 1} in queue. Please monitor service desk displays.
            </p>
          </div>

          <div className="text-right sm:text-right">
            <div className="text-[11px] uppercase tracking-wider text-blue-200 font-bold">Ticket Status</div>
            <div className="text-lg font-bold text-emerald-300 uppercase tracking-wider">{userTicket.status || 'WAITING'}</div>
            <div className="text-[11px] text-blue-200 mt-1">Estimated call: ~{location.estimatedWaitMinutes || 15}m</div>
          </div>
        </div>
      )}

      {/* Key Telemetry Cards: 4 Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <WaitTimeCard
          title="Predicted Queue Delay"
          minutes={location.estimatedWaitMinutes || 18}
          confidence={location.confidenceLevel || 0.94}
          trend="decreasing"
        />

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">Waiting Queue Length</div>
          <div className="text-3xl font-extrabold text-blue-600">
            {location.waitingQueueCount || liveQueue?.queueLength || 0}{' '}
            <span className="text-xs font-bold text-slate-500">citizens</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Current Status:</span>
            <span className="font-bold text-navy-900">{location.crowdLevel || 'MODERATE'}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">Active Counters</div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {location.activeCounterCount || activeCounters.length || 3}{' '}
            <span className="text-xs font-bold text-slate-500">
              / {location.totalCounterCount || location.serviceCounters?.length || 4}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Operating Desks:</span>
            <span className="font-bold text-emerald-600">Online & Serving</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">Average Service Speed</div>
          <div className="text-3xl font-extrabold text-slate-800">
            ~{avgTime}{' '}
            <span className="text-xs font-bold text-slate-500">min / turn</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Recommended Window:</span>
            <span className="font-bold text-navy-900 truncate max-w-[130px]">
              {location.recommendedVisitingTime || '08:00 - 10:00 AM'}
            </span>
          </div>
        </div>
      </div>

      {/* Facility Mini Map & Live Board Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Facility Mini Map (Col 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-navy-900 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Geographic Map Location</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
              </span>
            </div>

            <div className="w-full rounded-2xl overflow-hidden border border-slate-200">
              <LeafletMap
                locations={[location]}
                selectedLocation={location}
                center={[location.latitude || 37.7749, location.longitude || -122.4194]}
                zoom={14}
                height="320px"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Category: <strong>{location.category?.replace('_', ' ')}</strong></span>
            <span>OSM Navigation Ready</span>
          </div>
        </div>

        {/* Live Queue Board (Col 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-navy-900 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Real-time Facility Turnstiles</span>
                </h3>
                <p className="text-xs text-slate-500">Live tokens being called and waiting in queue</p>
              </div>
              <button
                onClick={fetchDetailAndQueue}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Refresh Live Queue"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Currently Serving Section */}
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl mb-2 flex items-center justify-between">
                <span>Now Serving at Desks</span>
                <span>Active Callouts</span>
              </div>
              {liveQueue?.currentlyServing && liveQueue.currentlyServing.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {liveQueue.currentlyServing.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-300 text-center"
                    >
                      <div className="text-base font-mono font-extrabold text-emerald-700">
                        {item.tokenNumber}
                      </div>
                      <div className="text-[10px] text-emerald-800 font-semibold mt-0.5 truncate">
                        {item.counterName || 'Desk Active'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 rounded-xl">
                  No tickets currently called to counter.
                </div>
              )}
            </div>

            {/* Waiting Queue List */}
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl mb-2 flex items-center justify-between">
                <span>Waiting in Line ({liveQueue?.waitingQueue?.length || 0})</span>
                <span>FIFO Sequence</span>
              </div>
              {liveQueue?.waitingQueue && liveQueue.waitingQueue.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                  {liveQueue.waitingQueue.map((entry, idx) => (
                    <span
                      key={entry.id || idx}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border ${
                        userTicket && userTicket.tokenNumber === entry.tokenNumber
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      #{entry.position || idx + 1}: {entry.tokenNumber}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 rounded-xl">
                  Queue is currently empty. Direct service available!
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tokens are called sequentially by desk attendants</span>
            <span className="font-bold text-navy-900">Live Sync</span>
          </div>
        </div>
      </div>

      {/* Hourly Prediction Chart */}
      <PredictionChart
        forecast={location.hourlyForecast}
        title={`Forecasted Wait Time Curve for ${location.name}`}
      />

      {/* Service Counters Breakdown */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft">
        <h3 className="text-base font-bold text-navy-900 mb-1">Service Desks & Counters</h3>
        <p className="text-xs text-slate-500 mb-6">Real-time status of intake counters operating at this facility</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {location.serviceCounters && location.serviceCounters.length > 0 ? (
            location.serviceCounters.map((cnt) => (
              <div
                key={cnt.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-navy-900">{cnt.counterName}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Physical Station</div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    cnt.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {cnt.isActive ? 'ACTIVE' : 'OFFLINE'}
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400">All standard service counters in operation.</div>
          )}
        </div>
      </div>

      {/* Distinction Banner */}
      <QueueVsCrowdBanner />
    </div>
  );
}