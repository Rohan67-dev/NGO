import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export const NotFound: React.FC = () => (
  <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
    <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
      <Compass className="w-6 h-6" />
    </div>
    <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
    <p className="text-xs text-slate-500">The page you are looking for doesn&apos;t exist or has been moved.</p>
    <div className="flex justify-center gap-3">
      <Link to="/" className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:border-emerald-300">Home</Link>
      <Link to="/shop" className="btn-primary px-4 py-2">Browse the shop</Link>
    </div>
  </div>
);
