import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit3, Trash2 } from 'lucide-react';
import { axiosClient, getErrorMessage } from '../../../api/axiosClient';
import { Campaign } from '../../../types';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { toast } from '../../../store/useToastStore';
import { formatINR, humanize } from '../../../lib/format';

const blank = {
  title: '', description: '', targetAmount: '', currentAmount: '', imageUrl: '',
  startDate: '', endDate: '', status: 'ACTIVE' as Campaign['status'], featured: false,
};

export const AdminCampaigns: React.FC = () => {
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: campaigns, isLoading, refetch } = useQuery<Campaign[]>({
    queryKey: ['admin-campaigns'],
    queryFn: async () => (await axiosClient.get('/admin/campaigns')).data.data,
  });

  const reset = () => { setForm(blank); setEditingId(null); };

  const edit = (c: Campaign) => {
    setEditingId(c.id);
    setForm({
      title: c.title, description: c.description, targetAmount: String(c.targetAmount), currentAmount: String(c.currentAmount ?? ''),
      imageUrl: c.imageUrl || '', startDate: c.startDate || '', endDate: c.endDate || '', status: c.status, featured: c.featured,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description,
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: form.currentAmount ? parseFloat(form.currentAmount) : 0,
      imageUrl: form.imageUrl || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      status: form.status,
      featured: form.featured,
    };
    setSaving(true);
    try {
      if (editingId) await axiosClient.put(`/admin/campaigns/${editingId}`, payload);
      else await axiosClient.post('/admin/campaigns', payload);
      toast.success('Campaign saved');
      reset();
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save campaign'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Campaign) => {
    if (!confirm(`Delete campaign "${c.title}"? Consider setting it to Completed or Cancelled instead.`)) return;
    try {
      await axiosClient.delete(`/admin/campaigns/${c.id}`);
      toast.success('Campaign deleted');
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Campaign Management</h1>
        <p className="text-xs text-slate-400 mt-1">Only Active campaigns appear on the public site. “Raised” is entered by the NGO - the store does not collect donations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="admin-card p-6 space-y-4 text-xs h-fit">
          <h2 className="text-sm font-bold text-white">{editingId ? 'Edit Campaign' : 'Create New Campaign'}</h2>
          <div>
            <label htmlFor="c-title" className="admin-label">Campaign Title</label>
            <input id="c-title" required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="admin-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="c-target" className="admin-label">Target (₹)</label>
              <input id="c-target" required type="number" min="1" step="0.01" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} className="admin-input" />
            </div>
            <div>
              <label htmlFor="c-current" className="admin-label">Raised (₹)</label>
              <input id="c-current" type="number" min="0" step="0.01" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} className="admin-input" />
            </div>
            <div>
              <label htmlFor="c-start" className="admin-label">Start date</label>
              <input id="c-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="admin-input" />
            </div>
            <div>
              <label htmlFor="c-end" className="admin-label">End date</label>
              <input id="c-end" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="admin-input" />
            </div>
          </div>
          <div>
            <label htmlFor="c-desc" className="admin-label">Description</label>
            <textarea id="c-desc" required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label htmlFor="c-img" className="admin-label">Image URL</label>
            <input id="c-img" type="text" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="admin-input" />
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label htmlFor="c-status" className="admin-label">Status</label>
              <select id="c-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Campaign['status'] })} className="admin-input">
                {['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-slate-300 pb-2">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-emerald-500" /> Feature on home page
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 btn-primary py-3">{editingId ? 'Save Changes' : 'Publish Campaign'}</button>
            {editingId && <button type="button" onClick={reset} className="px-4 rounded-xl border border-slate-600 font-semibold">Cancel</button>}
          </div>
        </form>

        <div className="lg:col-span-2 space-y-4">
          {isLoading && <LoadingSpinner />}
          {campaigns?.length === 0 && <p className="text-xs text-slate-500">No campaigns yet.</p>}
          {campaigns?.map((camp) => (
            <div key={camp.id} className="admin-card p-5 space-y-2 text-xs">
              <div className="flex justify-between items-start gap-3 text-white font-bold text-sm">
                <span>{camp.title} <span className="text-[10px] font-semibold text-slate-400">({humanize(camp.status)}{camp.featured ? ', featured' : ''})</span></span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => edit(camp)} className="p-1.5 text-slate-300 hover:text-emerald-400" aria-label={`Edit ${camp.title}`}><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => remove(camp)} className="p-1.5 text-slate-400 hover:text-rose-400" aria-label={`Delete ${camp.title}`}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="text-emerald-400 font-bold">{formatINR(camp.currentAmount, 0)} / {formatINR(camp.targetAmount, 0)} ({Math.round(camp.progressPercentage)}%)</p>
              <p className="text-slate-400 line-clamp-2">{camp.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
