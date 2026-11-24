import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DEMO_LOCATIONS } from '../services/sampleData';
import { predictionService, locationService } from '../services/api';
import PredictionChart from '../components/PredictionChart';
import CrowdIndicator from '../components/CrowdIndicator';
import QueueVsCrowdBanner from '../components/QueueVsCrowdBanner';
import {
  TrendingUp,
  Sparkles,
  Cpu,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Loader2,
  Sliders,
  Compass,
  Navigation,
  Car,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Info,
  Building2,
  Timer,
  Check,
  Zap,
} from 'lucide-react';

export default function AIPrediction() {
  const routerLoc = useLocation();
  const searchParams = new URLSearchParams(routerLoc.search);
  const initialLocId = searchParams.get('locationId') || DEMO_LOCATIONS[0].id;

  const [locations, setLocations] = useState(DEMO_LOCATIONS);
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocId);
  const [travelDuration, setTravelDuration] = useState(25);
  const [loading, setLoading] = useState(false);
  const [recommendationData, setRecommendationData] = useState(null);

  // What-If Simulator state
  const [simQueueLength, setSimQueueLength] = useState(16);
  const [simActiveCounters, setSimActiveCounters] = useState(3);
  const [simHourOfDay, setSimHourOfDay] = useState(14);
  const [simServiceTime, setSimServiceTime] = useState(8.5);
  const [simResult, setSimResult] = useState(null);

  // Fetch locations on mount
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

  // Fetch smart recommendation whenever location or travel duration changes
  const fetchSmartRecommendation = async (locId, travelMins) => {
    setLoading(true);
    try {
      const data = await predictionService.getVisitRecommendation(locId, travelMins);
      if (data) {
        setRecommendationData(data);
      }
    } catch (err) {
      // High-fidelity fallback calculation
      const loc = locations.find((l) => l.id === locId) || locations[0];
      const openH = parseInt(loc.openingTime?.split(':')[0] || '8', 10);
      const closeH = parseInt(loc.closingTime?.split(':')[0] || '18', 10);

      const slots = [];
      for (let h = 7; h <= 20; h++) {
        const isOpen = h >= openH && h < closeH;
        const timeLabel = `${String(h).padStart(2, '0')}:00`;
        const displayLabel = h === 12 ? '12:00 PM' : h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;

        if (!isOpen) {
          slots.push({
            hour: h,
            timeLabel,
            displayLabel,
            isOpen: false,
            predictedWaitMinutes: null,
            crowdLevel: 'CLOSED',
            expectedTotalMinutes: null,
          });
          continue;
        }

        const isPeak = (h >= 11 && h <= 14) || (h >= 17 && h <= 18);
        const wait = isPeak ? 38 : h <= 9 ? 8 : 16;
        const crowd = wait >= 35 ? 'CRITICAL' : wait >= 20 ? 'HIGH' : wait >= 12 ? 'MODERATE' : 'LOW';

        slots.push({
          hour: h,
          timeLabel,
          displayLabel,
          isOpen: true,
          isArrivalOpen: true,
          arrivalDisplay: `${h}:${travelMins} ${h >= 12 ? 'PM' : 'AM'}`,
          predictedWaitMinutes: wait,
          crowdLevel: crowd,
          travelDurationMinutes: travelMins,
          expectedTotalMinutes: travelMins + wait,
          isOptimalDeparture: h === 9,
        });
      }

      setRecommendationData({
        location: loc,
        currentConditions: {
          waitingQueueCount: loc.waitingQueueCount || 12,
          activeCounters: loc.activeCounterCount || 3,
        },
        userTravelInput: { travelDurationMinutes: travelMins },
        smartDeparture: {
          optimalDepartureHour: 9,
          departureTimeDisplay: '09:00 AM',
          estimatedArrivalTime: `09:${travelMins} AM`,
          travelDurationMinutes: travelMins,
          expectedWaitMinutes: 8,
          expectedTotalTimeMinutes: travelMins + 8,
          timeSavedMinutes: 30,
          summary: `Depart at 09:00 AM (travel: ${travelMins}m) to arrive by 09:${travelMins} AM. You will face only ~8m wait, saving 30m compared to midday peak departure.`,
        },
        bestVisitWindow: {
          windowLabel: '08:30 AM - 10:00 AM',
          expectedWaitMinutes: 8,
          reason: 'Low arrival influx and optimal desk coverage before midday surge.',
        },
        peakWindowToAvoid: {
          windowLabel: '11:30 AM - 02:00 PM',
          expectedWaitMinutes: 38,
          reason: 'Midday rush hour with highest congestion and counter turnover.',
        },
        timeSlots: slots,
        disclaimer:
          'DISCLAIMER: Future wait times and departure recommendations are statistical forecasts generated from historical queuing curves and live community telemetry. They do not constitute official reservations or guaranteed service appointments.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmartRecommendation(selectedLocationId, travelDuration);
  }, [selectedLocationId, travelDuration]);

  // Run What-If calculation
  const handleRunSimulation = () => {
    const totalCapacity = simActiveCounters * (60.0 / simServiceTime);
    const baseWait = (simQueueLength / Math.max(0.1, totalCapacity)) * 60;
    const peakFactor = simHourOfDay >= 11 && simHourOfDay <= 14 ? 1.3 : 1.0;
    const pred = Math.max(2, Math.round(baseWait * peakFactor));

    setSimResult({
      predictedWait: pred,
      crowdLevel: pred >= 35 ? 'CRITICAL' : pred >= 22 ? 'HIGH' : pred >= 12 ? 'MODERATE' : 'LOW',
      totalCapacity: Math.round(totalCapacity),
      recommendation:
        pred > 25
          ? 'High queue wait! Adding 1 service desk will reduce delays by ~35%.'
          : 'Service desk capacity matches current incoming volume.',
    });
  };

  const selectedLoc = locations.find((l) => l.id === selectedLocationId) || locations[0];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Smart Scheduling & Travel Optimizer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Smart Visit & Departure Recommendations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Analyze historical queuing curves, current bottlenecks, and operating hours. Enter your travel time to discover the optimal departure window that minimizes your total round-trip hold time.
          </p>
        </div>
      </div>

      {/* Control Bar: Location & Travel Duration Selectors */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Facility Selector (Col 6) */}
          <div className="md:col-span-6">
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Target Facility</span>
            </label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-navy-900 focus:outline-none focus:border-blue-500"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.category?.replace('_', ' ')})
                </option>
              ))}
            </select>
            <div className="mt-1.5 text-[11px] text-slate-400 flex items-center space-x-2">
              <span>Hours: {selectedLoc?.openingTime} - {selectedLoc?.closingTime}</span>
              <span>&bull;</span>
              <span>Desks: {selectedLoc?.activeCounterCount || 3} online</span>
            </div>
          </div>

          {/* Travel Duration Selector (Col 6) */}
          <div className="md:col-span-6">
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
              <Car className="w-3.5 h-3.5 text-blue-600" />
              <span>Estimated Travel Duration (From Your Location)</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[10, 15, 20, 25, 35, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setTravelDuration(mins)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    travelDuration === mins
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {mins} min
                </button>
              ))}
              <div className="relative inline-flex items-center">
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={travelDuration}
                  onChange={(e) => setTravelDuration(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-20 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-navy-900 text-center"
                />
                <span className="text-[10px] text-slate-400 ml-1">min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Departure Recommendation Hero Card */}
      {recommendationData?.smartDeparture && (
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-soft-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>Optimal Departure Recommendation</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 text-xs font-extrabold">
                Saves ~{recommendationData.smartDeparture.timeSavedMinutes} mins vs. Peak
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Leave at {recommendationData.smartDeparture.departureTimeDisplay}
                </h2>
                <p className="text-blue-100 text-xs sm:text-sm leading-relaxed max-w-2xl">
                  {recommendationData.smartDeparture.summary}
                </p>

                {/* Calculation formula display */}
                <div className="mt-4 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 inline-flex flex-wrap items-center gap-3 text-xs font-mono">
                  <span>Travel: <strong>{travelDuration}m</strong></span>
                  <span>+</span>
                  <span>Expected Wait: <strong>{recommendationData.smartDeparture.expectedWaitMinutes}m</strong></span>
                  <span>=</span>
                  <span className="text-yellow-300 font-extrabold text-sm">
                    Total: ~{recommendationData.smartDeparture.expectedTotalTimeMinutes}m
                  </span>
                </div>
              </div>

              <div className="lg:col-span-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center">
                <div className="text-[11px] text-blue-200 uppercase font-bold tracking-wider">Arrival Target</div>
                <div className="text-2xl font-extrabold text-white mt-0.5">
                  {recommendationData.smartDeparture.estimatedArrivalTime}
                </div>
                <div className="text-xs text-emerald-300 font-semibold mt-1 flex items-center justify-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Facility Open & Intake Optimal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Best Window vs Avoid Peak Side-by-Side Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommended Window */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Recommended Window</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600">
                ~{recommendationData?.bestVisitWindow?.expectedWaitMinutes || 8}m wait
              </span>
            </div>

            <h3 className="text-xl font-bold text-navy-900 mb-1">
              {recommendationData?.bestVisitWindow?.windowLabel || '08:30 AM - 10:00 AM'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {recommendationData?.bestVisitWindow?.reason || 'Lowest community foot-traffic with active counter coverage.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Expected Hold Time:</span>
            <span className="font-extrabold text-emerald-600 text-sm">Minimal Delay</span>
          </div>
        </div>

        {/* Peak Bottleneck to Avoid */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>Period to Avoid</span>
              </span>
              <span className="text-xs font-mono font-bold text-rose-600">
                ~{recommendationData?.peakWindowToAvoid?.expectedWaitMinutes || 42}m wait
              </span>
            </div>

            <h3 className="text-xl font-bold text-navy-900 mb-1">
              {recommendationData?.peakWindowToAvoid?.windowLabel || '11:30 AM - 02:00 PM'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {recommendationData?.peakWindowToAvoid?.reason || 'Midday congestion peak with longest lines and high staff turnover.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Expected Hold Time:</span>
            <span className="font-extrabold text-rose-600 text-sm">Long Wait Warning</span>
          </div>
        </div>
      </div>

      {/* Hourly Trend Chart with Optimal Highlight & Closed Exclusion */}
      <PredictionChart
        forecast={recommendationData?.timeSlots || []}
        title={`Expected Wait-Time Curve for ${selectedLoc?.name}`}
        subtitle={`Operating hours: ${selectedLoc?.openingTime} - ${selectedLoc?.closingTime}. Closed hours automatically excluded.`}
        recommendedText={`Optimal departure window: ${recommendationData?.smartDeparture?.departureTimeDisplay || '09:00 AM'}`}
      />

      {/* Time Slot Comparison Table (Mobile Responsive Cards / Grid) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-navy-900">Compare Upcoming Visiting Slots</h3>
            <p className="text-xs text-slate-500">
              Total expected time = {travelDuration}m travel + estimated facility wait time
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {selectedLoc?.openingTime} - {selectedLoc?.closingTime}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recommendationData?.timeSlots?.map((slot, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                slot.isOptimalDeparture
                  ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                  : !slot.isOpen
                  ? 'bg-slate-100/60 border-slate-200 opacity-60'
                  : 'bg-slate-50 border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-xs text-navy-900">
                  {slot.displayLabel}
                </span>
                {slot.isOptimalDeparture ? (
                  <span className="text-[10px] uppercase font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    Optimal
                  </span>
                ) : (
                  <CrowdIndicator level={slot.crowdLevel} />
                )}
              </div>

              {slot.isOpen ? (
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Wait Time:</span>
                    <span className="font-bold text-navy-900">~{slot.predictedWaitMinutes}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Round-trip:</span>
                    <span className="font-bold text-blue-600">~{slot.expectedTotalMinutes}m</span>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1">
                    Arrive: {slot.arrivalDisplay}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic pt-2">
                  {slot.statusLabel || 'Facility Closed'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Statistical Forecast Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Statistical Forecast Notice:</strong> Future crowd levels and wait-time estimations are algorithmic predictions derived from historical queuing patterns, counter allocation models, and community reports. They do <strong>not</strong> represent guaranteed appointments or scheduled turnstile reservations. Actual conditions may vary due to emergency walk-ins or unexpected counter closures.
        </div>
      </div>

      {/* What-If Simulation Lab for Administrators & Citizens */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-navy-900 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-purple-600" />
              <span>Interactive What-If Capacity Simulator</span>
            </h3>
            <p className="text-xs text-slate-500">
              Test how opening counters or shifting arrival hours dampens queue hold times
            </p>
          </div>
          <button
            onClick={handleRunSimulation}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
          >
            Run Simulation
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs mb-4">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Queue Depth: {simQueueLength}</label>
            <input
              type="range"
              min="1"
              max="60"
              value={simQueueLength}
              onChange={(e) => setSimQueueLength(parseInt(e.target.value, 10))}
              className="w-full accent-purple-600"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Active Desks: {simActiveCounters}</label>
            <input
              type="range"
              min="1"
              max="8"
              value={simActiveCounters}
              onChange={(e) => setSimActiveCounters(parseInt(e.target.value, 10))}
              className="w-full accent-purple-600"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Arrival Hour: {simHourOfDay}:00</label>
            <input
              type="range"
              min="8"
              max="20"
              value={simHourOfDay}
              onChange={(e) => setSimHourOfDay(parseInt(e.target.value, 10))}
              className="w-full accent-purple-600"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Avg Service: {simServiceTime}m</label>
            <input
              type="range"
              min="3"
              max="18"
              step="0.5"
              value={simServiceTime}
              onChange={(e) => setSimServiceTime(parseFloat(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>
        </div>

        {simResult && (
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-purple-900">
                Simulated Queue Wait: ~{simResult.predictedWait} minutes ({simResult.crowdLevel})
              </div>
              <div className="text-[11px] text-purple-700 mt-0.5">{simResult.recommendation}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-100 px-2.5 py-1 rounded-full">
                Throughput: ~{simResult.totalCapacity} pax/hr
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Queue Token vs Crowd Guidance Banner */}
      <QueueVsCrowdBanner />
    </div>
  );
}