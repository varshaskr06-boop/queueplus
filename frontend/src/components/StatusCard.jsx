import React from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function StatusCard({ title, serviceUrl, status, details, icon: Icon }) {
  const isOnline = status.state === 'online';
  const isChecking = status.state === 'checking';

  return (
    <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-6 shadow-xl hover:border-slate-600 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-slate-700/50 text-indigo-400">
            {Icon && <Icon className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-lg">{title}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{serviceUrl}</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {isChecking && (
            <span className="inline-flex items-center text-amber-400 text-xs px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Checking...
            </span>
          )}
          {isOnline && (
            <span className="inline-flex items-center text-emerald-400 text-xs px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Healthy
            </span>
          )}
          {!isOnline && !isChecking && (
            <span className="inline-flex items-center text-rose-400 text-xs px-3 py-1 rounded-full bg-rose-400/10 border border-rose-400/20 font-medium">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Disconnected
            </span>
          )}
        </div>
      </div>

      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 font-mono text-xs">
        {isOnline && status.data && (
          <pre className="text-emerald-300 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(status.data, null, 2)}
          </pre>
        )}
        {!isOnline && !isChecking && (
          <div className="text-rose-400">
            Service unreachable. Ensure server is running on {serviceUrl}
          </div>
        )}
        {isChecking && (
          <div className="text-slate-500">Pinging endpoint...</div>
        )}
      </div>

      {details && (
        <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs text-slate-400">
          {details}
        </div>
      )}
    </div>
  );
}
