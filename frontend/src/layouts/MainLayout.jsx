import React from 'react';
import Navbar from '../components/Navbar';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-navy-900">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-slate-200/80 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 font-bold text-navy-900">
            <span>QueuePulse<span className="text-blue-600">.AI</span></span>
            <span className="text-slate-400 font-normal">| Hackathon 2026 Edition</span>
          </div>
          <div>Intelligent wait time predictions for hospitals, banks & civic services.</div>
        </div>
      </footer>
    </div>
  );
}
