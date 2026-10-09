import React from 'react';

interface BadgeProps {
  variant?: 'emerald' | 'amber' | 'blue' | 'gray' | 'red';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'emerald', children }) => {
  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${variantStyles[variant]}`}>
      {children}
    </span>
  );
};
