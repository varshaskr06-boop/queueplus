import React from 'react';
import { Server, Brain, Layout, RefreshCw, Database } from 'lucide-react';
import StatusCard from '../components/StatusCard';
import { useHealthCheck } from '../hooks/useHealthCheck';

export default function Dashboard() {
  const { backendStatus, mlStatus, refresh } = useHealthCheck();

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <span>Core Foundation Ready</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Real-Time Queue Intelligence & Wait-Time Forecasts
          </h1>
          <p className="text-slate-300 text-base leading-relaxed mb-6">
            QueuePulse AI combines real-time queue ingestion with Random Forest regression models to accurately forecast customer wait times, dynamically balance counters, and eliminate queue congestion.
          </p>
          <button
            onClick={refresh}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Check All Services</span>
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Frontend Card */}
        <StatusCard
          title="Frontend Client"
          serviceUrl="http://localhost:5173"
          status={{ state: 'online', data: { status: 'running', framework: 'React + Vite', styling: 'Tailwind CSS' } }}
          details="Serving interactive React user interface"
          icon={Layout}
        />

        {/* Backend Card */}
        <StatusCard
          title="Backend API"
          serviceUrl="http://localhost:5000/api/health"
          status={backendStatus}
          details="Express.js server with PostgreSQL & Prisma schema"
          icon={Server}
        />

        {/* ML Service Card */}
        <StatusCard
          title="ML Engine"
          serviceUrl="http://localhost:8000/health"
          status={mlStatus}
          details="FastAPI serving Random Forest Regressor wait-time models"
          icon={Brain}
        />
      </div>

      {/* Tech Stack overview */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <span>QueuePulse AI Architecture</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-slate-800/40 border border-slate-700/40 p-4 rounded-xl">
            <div className="text-indigo-400 font-semibold mb-1">Frontend</div>
            <div className="text-slate-300 text-xs">React 18, Vite, Tailwind CSS, Lucide icons</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 p-4 rounded-xl">
            <div className="text-indigo-400 font-semibold mb-1">Backend Server</div>
            <div className="text-slate-300 text-xs">Node.js, Express, Morgan, CORS, Dotenv</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 p-4 rounded-xl">
            <div className="text-indigo-400 font-semibold mb-1">Database & ORM</div>
            <div className="text-slate-300 text-xs">PostgreSQL with Prisma schemas (Queues, Tickets, Predictions)</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 p-4 rounded-xl">
            <div className="text-indigo-400 font-semibold mb-1">Machine Learning</div>
            <div className="text-slate-300 text-xs">Python 3.12, Scikit-learn, Random Forest Regressor, FastAPI</div>
          </div>
        </div>
      </div>
    </div>
  );
}
