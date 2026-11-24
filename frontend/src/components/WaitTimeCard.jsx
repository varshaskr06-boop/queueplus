import React from 'react';
import { Clock, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

export default function WaitTimeCard({ minutes = 15, confidence = 0.95, trend = 'stable', title = 'Estimated Wait' }) {
  const isHigh = minutes >= 30;
  const isModerate = minutes >= 15 && minutes < 30;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-soft hover:shadow-soft-lg transition-shadow">
      <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
        <span className="flex items-center space-x-1">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>{title}</span>
        </span>
        <span className="flex items-center space-x-1 text-[11px] text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
          <Sparkles className="w-3 h-3 text-blue-500" />
          <span>{Math.round(confidence * 100)}% conf.</span>
        </span>
      </div>

      <div className="flex items-baseline space-x-2">
        <span
          className={`text-3xl font-extrabold tracking-tight ${
            isHigh ? 'text-rose-600' : isModerate ? 'text-amber-600' : 'text-emerald-600'
          }`}
        >
          ~{minutes}
        </span>
        <span className="text-xs font-bold text-slate-500">minutes</span>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Load dynamic:</span>
        <span className="flex items-center space-x-1 font-medium">
          {trend === 'increasing' && (
            <>
              <TrendingUp className="w-3 h-3 text-rose-500" />
              <span className="text-rose-600">Surging arrivals</span>
            </>
          )}
          {trend === 'decreasing' && (
            <>
              <TrendingDown className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-600">Discharging fast</span>
            </>
          )}
          {trend === 'stable' && (
            <>
              <Minus className="w-3 h-3 text-slate-400" />
              <span className="text-slate-600">Equilibrium state</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
