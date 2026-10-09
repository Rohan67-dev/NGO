import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { axiosClient } from '@/api/axiosClient';
import { Campaign } from '@/types';

export const Campaigns: React.FC = () => {
  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ['campaigns-list'],
    queryFn: async () => {
      const res = await axiosClient.get('/campaigns');
      return res.data.data;
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">SOCIAL INITIATIVES</span>
        <h1 className="text-3xl font-extrabold text-slate-900">Active NGO Campaigns</h1>
        <p className="text-xs text-slate-500">Targeted relief, skill training, and community development drives.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {campaigns?.map((camp) => (
          <div key={camp.id} className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm flex flex-col justify-between">
            <div className="aspect-video bg-slate-100 overflow-hidden relative">
              <img src={camp.imageUrl || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800'} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {camp.status}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">{camp.title}</h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{camp.description}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Raised: ₹{camp.currentAmount.toLocaleString()}</span>
                  <span>Target: ₹{camp.targetAmount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, camp.progressPercentage)}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
