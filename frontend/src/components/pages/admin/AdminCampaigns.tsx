import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Megaphone } from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { Campaign } from '../../../types';

export const AdminCampaigns: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const { data: campaigns, refetch } = useQuery<Campaign[]>({
    queryKey: ['admin-campaigns'],
    queryFn: async () => {
      const res = await axiosClient.get('/campaigns');
      return res.data.data;
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post('/admin/campaigns', {
        title,
        description,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || '0'),
        imageUrl,
        status: 'ACTIVE',
        featured: true,
      });
      setTitle('');
      setDescription('');
      setTargetAmount('');
      setCurrentAmount('');
      setImageUrl('');
      refetch();
    } catch (e) {
      alert('Failed to save campaign');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Campaign Management</h1>
        <p className="text-xs text-slate-400 mt-1">Configure active NGO fundraising and community drives.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleCreate} className="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 space-y-4 text-xs h-fit">
          <h3 className="text-sm font-bold text-white">Create New Campaign</h3>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Campaign Title</label>
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Target Amount (₹)</label>
            <input required type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Current Amount (₹)</label>
            <input type="number" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Description</label>
            <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Image URL</label>
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-xl transition-colors">
            Publish Campaign
          </button>
        </form>

        <div className="lg:col-span-2 space-y-4">
          {campaigns?.map((camp) => (
            <div key={camp.id} className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-white font-bold text-sm">
                <span>{camp.title}</span>
                <span className="text-emerald-400 font-extrabold">₹{camp.currentAmount} / ₹{camp.targetAmount}</span>
              </div>
              <p className="text-slate-400 line-clamp-2">{camp.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
