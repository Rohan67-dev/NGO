import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Trash2 } from 'lucide-react';
import { axiosClient, getErrorMessage } from '../../../api/axiosClient';
import { Announcement } from '../../../types';
import { toast } from '../../../store/useToastStore';

const blank = { title: '', content: '', linkUrl: '', active: true };

/** Site-wide banner shown above the navigation (previously hard-coded in the Navbar). */
export const AdminAnnouncements: React.FC = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: items, refetch } = useQuery<Announcement[]>({
    queryKey: ['admin-announcements'],
    queryFn: async () => (await axiosClient.get('/admin/announcements')).data.data,
  });

  const done = () => {
    setForm(blank);
    setEditingId(null);
    refetch();
    qc.invalidateQueries({ queryKey: ['announcements'] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, linkUrl: form.linkUrl.trim() || null };
      if (editingId) await axiosClient.put(`/admin/announcements/${editingId}`, payload);
      else await axiosClient.post('/admin/announcements', payload);
      toast.success('Announcement saved');
      done();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const toggle = async (a: Announcement) => {
    try {
      await axiosClient.put(`/admin/announcements/${a.id}`, { ...a, active: !a.active });
      done();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async (a: Announcement) => {
    if (!confirm(`Delete announcement "${a.title}"?`)) return;
    try {
      await axiosClient.delete(`/admin/announcements/${a.id}`);
      done();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Announcements</h1>
        <p className="text-xs text-slate-400 mt-1">The first active announcement is shown in the banner at the top of every public page.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="admin-card p-6 space-y-4 text-xs h-fit">
          <h2 className="text-sm font-bold text-white">{editingId ? 'Edit Announcement' : 'New Announcement'}</h2>
          <div>
            <label htmlFor="a-title" className="admin-label">Title</label>
            <input id="a-title" required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label htmlFor="a-content" className="admin-label">Text</label>
            <textarea id="a-content" required maxLength={500} rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label htmlFor="a-link" className="admin-label">Link (site path like /shop, or https:// URL)</label>
            <input id="a-link" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className="admin-input" />
          </div>
          <label className="flex items-center gap-2 text-slate-300">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-emerald-500" /> Active
          </label>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 btn-primary py-3">Save</button>
            {editingId && <button type="button" onClick={() => { setForm(blank); setEditingId(null); }} className="px-4 rounded-xl border border-slate-600 font-semibold">Cancel</button>}
          </div>
        </form>

        <div className="lg:col-span-2 space-y-3">
          {items?.length === 0 && <p className="text-xs text-slate-500">No announcements.</p>}
          {items?.map((a) => (
            <div key={a.id} className={`admin-card p-4 text-xs flex justify-between gap-3 ${a.active ? '' : 'opacity-50'}`}>
              <div>
                <p className="font-bold text-white">{a.title} {!a.active && <span className="text-amber-300 text-[10px]">(inactive)</span>}</p>
                <p className="text-slate-400">{a.content}</p>
                {a.linkUrl && <p className="text-emerald-400 font-mono text-[10px]">{a.linkUrl}</p>}
              </div>
              <div className="flex gap-1 shrink-0 items-start">
                <button onClick={() => toggle(a)} className="px-2 py-1 rounded-lg border border-slate-600 text-[10px]">{a.active ? 'Deactivate' : 'Activate'}</button>
                <button onClick={() => { setEditingId(a.id); setForm({ title: a.title, content: a.content, linkUrl: a.linkUrl || '', active: a.active }); }} className="p-1 text-slate-300 hover:text-emerald-400" aria-label={`Edit ${a.title}`}><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => remove(a)} className="p-1 text-slate-400 hover:text-rose-400" aria-label={`Delete ${a.title}`}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
