import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-navy-900">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>
      </div>
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>QueuePulse AI &copy; {new Date().getFullYear()} &bull; Intelligent Queue Management & Machine Learning Forecasts</div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">Scikit-learn Random Forest</span>
            <span>&bull;</span>
            <span className="text-slate-400">PostgreSQL + Prisma</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
