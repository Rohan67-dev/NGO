import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { ImpactMetric } from '../../../types';

export const AdminImpact: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [icon, setIcon] = useState('Utensils');

  const { data: metrics, refetch } = useQuery<ImpactMetric[]>({
    queryKey: ['admin-impact-metrics'],
    queryFn: async () => {
      const res = await axiosClient.get('/impact/metrics');
      return res.data.data;
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post('/api/admin/impact/metrics', {
        title,
        description,
        value: parseInt(value),
        unit,
        icon,
        displayOrder: (metrics?.length || 0) + 1,
        active: true,
      });
      setTitle('');
      setDescription('');
      setValue('');
      setUnit('');
      refetch();
    } catch (e) {
      alert('Failed to save impact metric');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Impact Metrics CMS</h1>
        <p className="text-xs text-slate-400 mt-1">Update real-time NGO impact statistics shown across the portal.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleCreate} className="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 space-y-4 text-xs h-fit">
          <h3 className="text-sm font-bold text-white">Add Impact Metric Counter</h3>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Metric Title</label>
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Meals Served" className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Counter Value</label>
            <input required type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 15400" className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Unit</label>
            <input required type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. Meals" className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Sub-description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Distributed to rural schools" className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-xl transition-colors">
            Update Impact Counter
          </button>
        </form>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metrics?.map((m) => (
            <div key={m.id} className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 space-y-1 text-xs">
              <span className="text-2xl font-black text-emerald-400">{m.value?.toLocaleString()}</span>
              <h4 className="font-bold text-white text-sm">{m.title}</h4>
              <p className="text-slate-400">{m.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
