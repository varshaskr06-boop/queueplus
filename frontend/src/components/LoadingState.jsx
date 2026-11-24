import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading live queue intelligence...' }) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
      <h3 className="text-sm font-bold text-navy-900">{message}</h3>
      <p className="text-xs text-slate-400 mt-1">Connecting to QueuePulse AI backend and ML prediction nodes</p>
    </div>
  );
}
