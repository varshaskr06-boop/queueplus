import React from 'react';
import { TrendingUp, Clock, AlertCircle, Sparkles, Star } from 'lucide-react';

export default function PredictionChart({
  forecast = [],
  title = "Today's Hourly Wait & Capacity Curve",
  subtitle = 'Calculated from Random Forest Regressor & queuing arrival curves',
  recommendedText = null,
  optimalHour = null,
}) {
  const defaultForecast = [
    { hour: '08:00', waitMinutes: 8, crowd: 'LOW', isOpen: true },
    { hour: '10:00', waitMinutes: 18, crowd: 'MODERATE', isOpen: true },
    { hour: '12:00', waitMinutes: 42, crowd: 'CRITICAL', isOpen: true },
    { hour: '14:00', waitMinutes: 34, crowd: 'HIGH', isOpen: true },
    { hour: '16:00', waitMinutes: 24, crowd: 'MODERATE', isOpen: true },
    { hour: '18:00', waitMinutes: 12, crowd: 'LOW', isOpen: true },
    { hour: '20:00', waitMinutes: null, crowd: 'CLOSED', isOpen: false },
  ];

  const rawData = forecast && forecast.length > 0 ? forecast : defaultForecast;

  // Normalize data items
  const data = rawData.map((d) => {
    const wait = d.predictedWaitMinutes !== undefined ? d.predictedWaitMinutes : d.waitMinutes;
    const label = d.displayLabel || d.timeLabel || d.hour;
    const isOpen = d.isOpen !== undefined ? d.isOpen : wait !== null;
    return {
      ...d,
      waitMinutes: wait,
      label,
      isOpen,
      crowd: d.crowdLevel || d.crowd || (wait >= 35 ? 'CRITICAL' : wait >= 20 ? 'HIGH' : wait >= 10 ? 'MODERATE' : 'LOW'),
    };
  });

  const validWaits = data.filter((d) => d.isOpen && d.waitMinutes !== null).map((d) => d.waitMinutes);
  const maxWait = Math.max(...validWaits, 45);

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-bold text-navy-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center space-x-1 text-emerald-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>Optimal (&lt;15m)</span>
          </span>
          <span className="flex items-center space-x-1 text-amber-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span>Moderate (15-30m)</span>
          </span>
          <span className="flex items-center space-x-1 text-rose-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span>Peak (&gt;30m)</span>
          </span>
          <span className="flex items-center space-x-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
            <span>Closed</span>
          </span>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="h-48 flex items-end justify-between gap-1.5 sm:gap-2 pt-6 pb-2 px-1 border-b border-slate-100 overflow-x-auto">
        {data.map((item, idx) => {
          if (!item.isOpen) {
            return (
              <div key={idx} className="flex-1 min-w-[28px] sm:min-w-[36px] flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip for closed slot */}
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-navy-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-20">
                  {item.statusLabel || 'Facility Closed'}
                </div>
                <div className="w-full max-w-[36px] h-3 bg-slate-200 rounded-t-sm border-t border-dashed border-slate-300" />
                <span className="text-[10px] font-mono text-slate-400 mt-2 truncate max-w-[36px] text-center">
                  {item.label}
                </span>
              </div>
            );
          }

          const heightPercent = Math.max(14, Math.round((item.waitMinutes / maxWait) * 100));
          const isPeak = item.waitMinutes >= 30;
          const isModerate = item.waitMinutes >= 15 && item.waitMinutes < 30;

          const barColor = item.isOptimalDeparture
            ? 'bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-300'
            : isPeak
            ? 'bg-rose-500 hover:bg-rose-600'
            : isModerate
            ? 'bg-amber-500 hover:bg-amber-600'
            : 'bg-emerald-500 hover:bg-emerald-600';

          return (
            <div key={idx} className="flex-1 min-w-[28px] sm:min-w-[36px] flex flex-col items-center h-full justify-end group relative">
              {/* Optimal badge */}
              {item.isOptimalDeparture && (
                <div className="absolute -top-7 text-blue-600 flex items-center justify-center animate-bounce">
                  <Star className="w-4 h-4 fill-blue-600 text-blue-600" />
                </div>
              )}

              {/* Tooltip on hover */}
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-navy-900 text-white text-[10px] font-bold p-1.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-20 text-center">
                <div>Wait: ~{item.waitMinutes} mins</div>
                {item.expectedTotalMinutes && (
                  <div className="text-blue-300">Total: ~{item.expectedTotalMinutes}m (incl. travel)</div>
                )}
                {item.arrivalDisplay && (
                  <div className="text-[9px] text-slate-300">Arrive by {item.arrivalDisplay}</div>
                )}
              </div>

              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${barColor}`}
              />
              <span className={`text-[10px] mt-2 font-mono truncate max-w-[36px] text-center ${
                item.isOptimalDeparture ? 'font-extrabold text-blue-600' : 'text-slate-500'
              }`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
        <span className="flex items-center space-x-1.5 text-slate-600">
          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>
            {recommendedText || 'Recommended arrival: Early morning or late afternoon to bypass midday peaks.'}
          </span>
        </span>
        <span className="text-[11px] font-mono text-slate-400">
          ● Closed hours automatically excluded
        </span>
      </div>
    </div>
  );
}