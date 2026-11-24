import React from 'react';
import { Link } from 'react-router-dom';
import CrowdIndicator from './CrowdIndicator';
import { MapPin, ArrowRight, Compass, Timer, Clock } from 'lucide-react';

export default function LocationCard({ location, onJoinQueue, onSelect }) {
  const categoryConfig = {
    HOSPITAL: {
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      label: 'Healthcare',
    },
    BANK: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Banking & Financial',
    },
    GOVERNMENT_OFFICE: {
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      label: 'Government / Civic',
    },
  };

  const cat = categoryConfig[location.category] || categoryConfig.HOSPITAL;

  const avgTime =
    location.averageServiceTimeMinutes ||
    (location.category === 'HOSPITAL' ? 8.5 : location.category === 'BANK' ? 5.5 : 9.0);

  const formattedUpdate = location.lastUpdated
    ? new Date(location.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Live';

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft hover:shadow-soft-lg hover:border-blue-300 transition-all flex flex-col justify-between group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-3.5">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cat.badge}`}>
            {cat.label}
          </span>
          <CrowdIndicator level={location.crowdLevel || 'LOW'} />
        </div>

        {/* Title & Address */}
        <h3 className="text-base font-bold text-navy-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {location.name}
        </h3>
        <p className="text-xs text-slate-500 flex items-start space-x-1.5 mt-1.5 mb-2 line-clamp-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>{location.address}</span>
        </p>

        {/* Distance if nearby search was performed */}
        {location.distance !== undefined && (
          <div className="inline-flex items-center space-x-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md mb-2">
            <Compass className="w-3 h-3 text-blue-600" />
            <span>{location.distance} km away</span>
          </div>
        )}

        {/* Live Wait Time & Queue Status Box */}
        <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 my-3 text-center">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Est. Wait</div>
            <div className="text-xl font-extrabold text-navy-900 mt-0.5">
              ~{location.estimatedWaitMinutes || 15} <span className="text-[11px] font-semibold text-slate-500">min</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Waiting / Desks</div>
            <div className="text-xl font-extrabold text-blue-600 mt-0.5">
              {location.waitingQueueCount || 0} <span className="text-[11px] font-normal text-slate-500">/ {location.activeCounterCount || 3}</span>
            </div>
          </div>
        </div>

        {/* Average Service Time and Last Updated */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 px-1">
          <span className="flex items-center space-x-1">
            <Timer className="w-3 h-3 text-slate-400" />
            <span>Avg Service: <strong className="text-slate-700">~{avgTime}m</strong></span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {formattedUpdate === 'Live' ? '● Realtime' : `Updated ${formattedUpdate}`}
          </span>
        </div>

        {location.recommendedVisitingTime && (
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mb-2 px-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span className="truncate">Best time: <strong className="text-slate-700">{location.recommendedVisitingTime}</strong></span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
        <Link
          to={`/locations/${location.id}`}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          View Details
        </Link>
        <button
          onClick={() => onJoinQueue && onJoinQueue(location)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all flex items-center space-x-1 shadow-sm shadow-blue-600/30"
        >
          <span>Join Queue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
