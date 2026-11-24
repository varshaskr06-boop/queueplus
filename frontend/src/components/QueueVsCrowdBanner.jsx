import React from 'react';
import { Ticket, Users, ArrowRight, ShieldCheck } from 'lucide-react';

export default function QueueVsCrowdBanner() {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft">
      <div className="max-w-3xl mb-6">
        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
          System Guidance
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
          Understanding Queue Tokens vs. Crowd Estimation
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          QueuePulse AI clearly distinguishes between your official place in line and the physical room density.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Concept 1: Queue Token Booking */}
        <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-3 shadow-sm shadow-blue-600/30">
              <Ticket className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-navy-900 mb-1.5 flex items-center space-x-1.5">
              <span>Official Queue Token Booking</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-extrabold">
                Virtual Ticket
              </span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              An official virtual position in the facility's live database (e.g. <strong className="text-blue-700">HOSP-015</strong>).
              Physical counters call your token sequentially. You can monitor when your turn transitions from <em>WAITING</em> to <em>SERVING</em> to <em>COMPLETED</em>.
            </p>
          </div>
          <div className="text-[11px] font-semibold text-blue-700 flex items-center space-x-1 pt-3 border-t border-blue-100">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Reserves your place with counter agents</span>
          </div>
        </div>

        {/* Concept 2: Crowd Estimation */}
        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm mb-3 shadow-sm shadow-amber-500/30">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-navy-900 mb-1.5 flex items-center space-x-1.5">
              <span>Environmental Crowd Estimation</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-extrabold">
                Density Rating
              </span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              An environmental calculation of physical lobby congestion (e.g. <strong className="text-amber-700">Moderate: 22 people</strong>).
              Derived from Random Forest arrival regression and community ground-truth reports. Helps you choose the optimal time of day to travel.
            </p>
          </div>
          <div className="text-[11px] font-semibold text-amber-700 flex items-center space-x-1 pt-3 border-t border-amber-100">
            <span>Does not hold an intake place without a ticket</span>
          </div>
        </div>
      </div>
    </div>
  );
}
