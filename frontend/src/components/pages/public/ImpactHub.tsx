import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin } from 'lucide-react';
import { axiosClient } from '@/api/axiosClient';
import { ImpactMetric, ImpactProject } from '@/types';
import { MetricIcon } from '@/components/common/MetricIcon';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PLACEHOLDER_IMAGE } from '@/lib/format';

export const ImpactHub: React.FC = () => {
  const { data: metrics, isLoading: loadingMetrics } = useQuery<ImpactMetric[]>({
    queryKey: ['impact-metrics'],
    queryFn: async () => (await axiosClient.get('/impact/metrics')).data.data,
  });

  const { data: projects, isLoading: loadingProjects } = useQuery<ImpactProject[]>({
    queryKey: ['impact-projects'],
    queryFn: async () => (await axiosClient.get('/impact/projects')).data.data,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> SOCIAL IMPACT
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Transparency &amp; Community Impact Portal</h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Figures, field projects and campaigns published by the NGO. See the{' '}
            <Link to="/campaigns" className="underline text-emerald-300">campaigns</Link> and{' '}
            <Link to="/stories" className="underline text-emerald-300">stories</Link> for more detail.
          </p>
        </div>
      </div>

      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900">Collective Social Metrics</h2>
          <p className="text-xs text-slate-500 mt-1">As reported by the NGO.</p>
        </div>
        {loadingMetrics && <LoadingSpinner />}
        {metrics && metrics.length === 0 && <p className="text-center text-xs text-slate-500">No metrics have been published yet.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics?.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-md">
                <MetricIcon name={m.icon} className="w-6 h-6" />
              </div>
              <span className="text-3xl font-black text-slate-900">{m.value.toLocaleString('en-IN')}</span>
              <span className="text-xs font-bold text-emerald-700 mt-1">{m.title}{m.unit ? ` (${m.unit})` : ''}</span>
              {m.description && <p className="text-[11px] text-slate-500 mt-2">{m.description}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Active Field Projects</h2>
        {loadingProjects && <LoadingSpinner />}
        {projects && projects.length === 0 && <p className="text-xs text-slate-500">No active projects have been published yet.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects?.map((proj) => (
            <div key={proj.id} className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm flex flex-col sm:flex-row">
              <div className="sm:w-2/5 aspect-video sm:aspect-auto bg-slate-100 relative">
                <img src={proj.imageUrl || PLACEHOLDER_IMAGE} alt={proj.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 sm:w-3/5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold mb-1">
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> {proj.location}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{proj.title}</h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-4 leading-relaxed">{proj.description}</p>
                </div>
                {proj.beneficiariesCount != null && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600">Beneficiaries:</span>
                    <span className="text-emerald-700 font-extrabold">{proj.beneficiariesCount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
