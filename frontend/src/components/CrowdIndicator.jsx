import React from 'react';

export default function CrowdIndicator({ level, count }) {
  const normalized = (level || 'LOW').toUpperCase();

  const configs = {
    LOW: {
      label: 'Low Crowd',
      dotColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      ringColor: 'ring-emerald-500/20',
    },
    MODERATE: {
      label: 'Moderate',
      dotColor: 'bg-amber-500',
      badgeBg: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
      ringColor: 'ring-amber-500/20',
    },
    HIGH: {
      label: 'High Density',
      dotColor: 'bg-orange-500',
      badgeBg: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200',
      ringColor: 'ring-orange-500/20',
    },
    CRITICAL: {
      label: 'Critical Peak',
      dotColor: 'bg-rose-500',
      badgeBg: 'bg-rose-50',
      textColor: 'text-rose-700',
      borderColor: 'border-rose-200',
      ringColor: 'ring-rose-500/20',
    },
  };

  const config = configs[normalized] || configs.LOW;

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${config.badgeBg} ${config.textColor} ${config.borderColor} shadow-2xs`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse`} />
      <span>{config.label}</span>
      {count !== undefined && (
        <span className="text-[10px] opacity-75 font-mono">({count})</span>
      )}
    </span>
  );
}
