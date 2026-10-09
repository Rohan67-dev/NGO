import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { axiosClient } from '@/api/axiosClient';
import { Campaign } from '@/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatINR, humanize, PLACEHOLDER_IMAGE } from '@/lib/format';

export const Campaigns: React.FC = () => {
  const { data: campaigns, isLoading, isError } = useQuery<Campaign[]>({
    queryKey: ['campaigns-list'],
    queryFn: async () => (await axiosClient.get('/campaigns')).data.data,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">SOCIAL INITIATIVES</span>
        <h1 className="text-3xl font-extrabold text-slate-900">Active NGO Campaigns</h1>
        <p className="text-xs text-slate-500">Relief, skill training and community development drives run by the NGO.</p>
      </div>

      {isLoading && <LoadingSpinner />}
      {isError && <p className="text-center text-xs text-red-600" role="alert">Campaigns could not be loaded. Please try again later.</p>}
      {campaigns && campaigns.length === 0 && (
        <p className="text-center text-xs text-slate-500">There are no active campaigns right now.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {campaigns?.map((camp) => (
          <Link to={`/campaigns/${camp.slug}`} key={camp.id} className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="aspect-video bg-slate-100 overflow-hidden relative">
              <img src={camp.imageUrl || PLACEHOLDER_IMAGE} alt={camp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">{humanize(camp.status)}</span>
                <h2 className="text-xl font-bold text-slate-900 mt-2 group-hover:text-emerald-700">{camp.title}</h2>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{camp.description}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Raised: {formatINR(camp.currentAmount, 0)}</span>
                  <span>Target: {formatINR(camp.targetAmount, 0)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, camp.progressPercentage)}%` }} />
                </div>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 pt-1">
                  Read more <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
