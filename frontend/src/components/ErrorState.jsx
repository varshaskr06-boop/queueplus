import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message = 'Unable to connect to service', onRetry }) {
  return (
    <div className="bg-white border border-rose-200 rounded-3xl p-8 text-center max-w-md mx-auto my-8 shadow-soft">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-3 shadow-xs">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-navy-900 mb-1">Service Notification</h3>
      <p className="text-xs text-slate-500 mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
