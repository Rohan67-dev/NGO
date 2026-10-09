import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Target, Award } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-4 shadow-xl">
        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold">Aasha Foundation for Social Impact</h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          Bridging the gap between conscious consumers and rural artisan communities through dignified, fair-trade social commerce.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Our Mission</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            To create sustainable, dignified income streams for rural artisans, women's self-help groups, and smallholder farmers across India.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Our Vision</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            A world where traditional crafts are preserved, social inequality is eliminated, and every e-commerce purchase empowers real human lives.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Transparency</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            The impact figures, field projects and campaigns the NGO publishes are listed in the{" "}
            <Link to="/impact" className="text-emerald-700 underline">Impact Portal</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};
