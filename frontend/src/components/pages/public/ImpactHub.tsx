import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Heart, Users, Utensils, Trees, GraduationCap, MapPin, Sparkles } from 'lucide-react';
import { axiosClient } from '@/api/axiosClient';
import { ImpactMetric, ImpactProject, Campaign } from '@/types';

export const ImpactHub: React.FC = () => {
  const { data: metrics } = useQuery<ImpactMetric[]>({
    queryKey: ['impact-hub-metrics'],
    queryFn: async () => {
      const res = await axiosClient.get('/impact/metrics');
      return res.data.data;
    },
  });

  const { data: projects } = useQuery<ImpactProject[]>({
    queryKey: ['impact-hub-projects'],
    queryFn: async () => {
      const res = await axiosClient.get('/impact/projects');
      return res.data.data;
    },
  });

  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ['impact-hub-campaigns'],
    queryFn: async () => {
      const res = await axiosClient.get('/campaigns');
      return res.data.data;
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED SOCIAL IMPACT
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Transparency &amp; Community Impact Portal
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            We believe full transparency builds authentic social change. Explore the real-time social metrics, rural artisan initiatives, and active campaigns powered directly by your purchases.
          </p>
        </div>
      </div>

      {/* Metrics Section */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900">Collective Social Metrics</h2>
          <p className="text-xs text-slate-500 mt-1">Updated dynamically from verified NGO field deployment reports.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics?.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-md">
                {m.icon === 'Utensils' && <Utensils className="w-6 h-6" />}
                {m.icon === 'Users' && <Users className="w-6 h-6" />}
                {m.icon === 'Trees' && <Trees className="w-6 h-6" />}
                {m.icon === 'GraduationCap' && <GraduationCap className="w-6 h-6" />}
              </div>
              <span className="text-3xl font-black text-slate-900">{m.value.toLocaleString()}+</span>
              <span className="text-xs font-bold text-emerald-700 mt-1">{m.title}</span>
              <p className="text-[11px] text-slate-500 mt-2">{m.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Projects */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Active Field Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects?.map((proj) => (
            <div key={proj.id} className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm flex flex-col sm:flex-row">
              <div className="sm:w-2/5 aspect-video sm:aspect-auto bg-slate-100 relative">
                <img src={proj.imageUrl || 'https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&q=80&w=800'} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-6 sm:w-3/5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold mb-1">
                    <MapPin className="w-3.5 h-3.5" /> {proj.location}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{proj.title}</h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{proj.description}</p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600">Beneficiaries Supported:</span>
                  <span className="text-emerald-700 font-extrabold">{proj.beneficiariesCount}+ Families</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
