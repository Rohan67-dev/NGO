import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit3, Trash2 } from 'lucide-react';
import { axiosClient, getErrorMessage } from '../../../api/axiosClient';
import { ImpactMetric, ImpactProject } from '../../../types';
import { toast } from '../../../store/useToastStore';
import { METRIC_ICONS, MetricIcon } from '../../common/MetricIcon';
import { humanize } from '../../../lib/format';

const blankMetric = { title: '', description: '', value: '', unit: '', icon: 'Users', displayOrder: '0', active: true };
const blankProject = {
  title: '', description: '', location: '', beneficiariesCount: '', imageUrl: '',
  status: 'ACTIVE' as ImpactProject['status'], startDate: '', endDate: '',
};

const MetricsSection: React.FC = () => {
  const [form, setForm] = useState(blankMetric);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: metrics, refetch } = useQuery<ImpactMetric[]>({
    queryKey: ['admin-impact-metrics'],
    queryFn: async () => (await axiosClient.get('/admin/impact/metrics')).data.data,
  });

  const reset = () => { setForm(blankMetric); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description,
      value: parseInt(form.value, 10),
      unit: form.unit,
      icon: form.icon,
      displayOrder: parseInt(form.displayOrder || '0', 10),
      active: form.active,
    };
    try {
      // Fixed: the original posted to '/api/admin/...' on a client whose base URL already ends in /api (404).
      if (editingId) await axiosClient.put(`/admin/impact/metrics/${editingId}`, payload);
      else await axiosClient.post('/admin/impact/metrics', payload);
      toast.success('Metric saved');
      reset();
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save impact metric'));
    }
  };

  const remove = async (m: ImpactMetric) => {
    if (!confirm(`Delete metric "${m.title}"?`)) return;
    try {
      await axiosClient.delete(`/admin/impact/metrics/${m.id}`);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <form onSubmit={handleSubmit} className="admin-card p-6 space-y-4 text-xs h-fit">
        <h2 className="text-sm font-bold text-white">{editingId ? 'Edit Metric' : 'Add Impact Metric'}</h2>
        <p className="text-[11px] text-amber-300">Publish only figures the NGO can substantiate.</p>
        <div>
          <label htmlFor="m-title" className="admin-label">Metric Title</label>
          <input id="m-title" required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Artisans trained" className="admin-input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="m-value" className="admin-label">Value</label>
            <input id="m-value" required type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label htmlFor="m-unit" className="admin-label">Unit</label>
            <input id="m-unit" type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. People" className="admin-input" />
          </div>
          <div>
            <label htmlFor="m-icon" className="admin-label">Icon</label>
            <select id="m-icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="admin-input">
              {Object.keys(METRIC_ICONS).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="m-order" className="admin-label">Display order</label>
            <input id="m-order" type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} className="admin-input" />
          </div>
        </div>
        <div>
          <label htmlFor="m-desc" className="admin-label">Sub-description / source</label>
          <input id="m-desc" type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Per 2025-26 annual report" className="admin-input" />
        </div>
        <label className="flex items-center gap-2 text-slate-300">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-emerald-500" /> Show on public site
        </label>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 btn-primary py-3">{editingId ? 'Save Changes' : 'Add Metric'}</button>
          {editingId && <button type="button" onClick={reset} className="px-4 rounded-xl border border-slate-600 font-semibold">Cancel</button>}
        </div>
      </form>

      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-fit">
        {metrics?.length === 0 && <p className="text-xs text-slate-500">No metrics yet.</p>}
        {metrics?.map((m) => (
          <div key={m.id} className={`admin-card p-5 space-y-1 text-xs ${m.active ? '' : 'opacity-50'}`}>
            <div className="flex justify-between">
              <MetricIcon name={m.icon} className="w-5 h-5 text-emerald-400" />
              <div className="flex gap-1">
                <button onClick={() => { setEditingId(m.id); setForm({ title: m.title, description: m.description || '', value: String(m.value), unit: m.unit || '', icon: m.icon || 'Users', displayOrder: String(m.displayOrder ?? 0), active: m.active }); }} className="p-1 text-slate-300 hover:text-emerald-400" aria-label={`Edit ${m.title}`}><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => remove(m)} className="p-1 text-slate-400 hover:text-rose-400" aria-label={`Delete ${m.title}`}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <span className="text-2xl font-black text-emerald-400">{m.value?.toLocaleString('en-IN')}</span>
            <h3 className="font-bold text-white text-sm">{m.title} {!m.active && <span className="text-[10px] text-amber-300">(hidden)</span>}</h3>
            <p className="text-slate-400">{m.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const ProjectsSection: React.FC = () => {
  const [form, setForm] = useState(blankProject);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: projects, refetch } = useQuery<ImpactProject[]>({
    queryKey: ['admin-impact-projects'],
    queryFn: async () => (await axiosClient.get('/admin/impact/projects')).data.data,
  });

  const reset = () => { setForm(blankProject); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      beneficiariesCount: form.beneficiariesCount ? parseInt(form.beneficiariesCount, 10) : null,
      imageUrl: form.imageUrl || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };
    try {
      if (editingId) await axiosClient.put(`/admin/impact/projects/${editingId}`, payload);
      else await axiosClient.post('/admin/impact/projects', payload);
      toast.success('Project saved');
      reset();
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save project'));
    }
  };

  const remove = async (p: ImpactProject) => {
    if (!confirm(`Delete project "${p.title}"?`)) return;
    try {
      await axiosClient.delete(`/admin/impact/projects/${p.id}`);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <form onSubmit={handleSubmit} className="admin-card p-6 space-y-4 text-xs h-fit">
        <h2 className="text-sm font-bold text-white">{editingId ? 'Edit Field Project' : 'Add Field Project'}</h2>
        <div>
          <label htmlFor="pr-title" className="admin-label">Title</label>
          <input id="pr-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="admin-input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pr-loc" className="admin-label">Location</label>
            <input id="pr-loc" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label htmlFor="pr-ben" className="admin-label">Beneficiaries</label>
            <input id="pr-ben" type="number" min="0" value={form.beneficiariesCount} onChange={(e) => setForm({ ...form, beneficiariesCount: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label htmlFor="pr-start" className="admin-label">Start date</label>
            <input id="pr-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label htmlFor="pr-end" className="admin-label">End date</label>
            <input id="pr-end" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="admin-input" />
          </div>
        </div>
        <div>
          <label htmlFor="pr-desc" className="admin-label">Description</label>
          <textarea id="pr-desc" required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input" />
        </div>
        <div>
          <label htmlFor="pr-img" className="admin-label">Image URL</label>
          <input id="pr-img" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="admin-input" />
        </div>
        <div>
          <label htmlFor="pr-status" className="admin-label">Status (only Active is shown publicly)</label>
          <select id="pr-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ImpactProject['status'] })} className="admin-input">
            {['PLANNING', 'ACTIVE', 'COMPLETED'].map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 btn-primary py-3">{editingId ? 'Save Changes' : 'Add Project'}</button>
          {editingId && <button type="button" onClick={reset} className="px-4 rounded-xl border border-slate-600 font-semibold">Cancel</button>}
        </div>
      </form>

      <div className="lg:col-span-2 space-y-4">
        {projects?.length === 0 && <p className="text-xs text-slate-500">No projects yet.</p>}
        {projects?.map((p) => (
          <div key={p.id} className="admin-card p-5 text-xs space-y-1">
            <div className="flex justify-between gap-3">
              <h3 className="font-bold text-white text-sm">{p.title} <span className="text-[10px] text-slate-400">({humanize(p.status)})</span></h3>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => { setEditingId(p.id); setForm({ title: p.title, description: p.description, location: p.location, beneficiariesCount: p.beneficiariesCount != null ? String(p.beneficiariesCount) : '', imageUrl: p.imageUrl || '', status: p.status, startDate: p.startDate || '', endDate: p.endDate || '' }); }} className="p-1 text-slate-300 hover:text-emerald-400" aria-label={`Edit ${p.title}`}><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => remove(p)} className="p-1 text-slate-400 hover:text-rose-400" aria-label={`Delete ${p.title}`}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-emerald-400">{p.location}{p.beneficiariesCount != null ? ` · ${p.beneficiariesCount} beneficiaries` : ''}</p>
            <p className="text-slate-400 line-clamp-2">{p.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export const AdminImpact: React.FC = () => (
  <div className="space-y-10">
    <div>
      <h1 className="text-2xl font-bold text-white">Impact Metrics &amp; Field Projects</h1>
      <p className="text-xs text-slate-400 mt-1">Shown on the home page and the Impact Portal.</p>
    </div>
    <MetricsSection />
    <ProjectsSection />
  </div>
);
