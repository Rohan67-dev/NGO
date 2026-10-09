import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit3, Trash2, Eye, EyeOff } from 'lucide-react';
import { axiosClient, getErrorMessage } from '../../../api/axiosClient';
import { Category } from '../../../types';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { toast } from '../../../store/useToastStore';

const blank = { name: '', description: '', imageUrl: '' };

export const AdminCategories: React.FC = () => {
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: categories, isLoading, isError, refetch } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => (await axiosClient.get('/admin/categories')).data.data,
  });

  const reset = () => {
    setForm(blank);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const current = categories?.find((c) => c.id === editingId);
        await axiosClient.put(`/admin/categories/${editingId}`, { ...form, active: current?.active ?? true });
        toast.success('Category updated');
      } else {
        await axiosClient.post('/admin/categories', form);
        toast.success('Category created');
      }
      reset();
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save category'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (cat: Category) => {
    try {
      await axiosClient.put(`/admin/categories/${cat.id}`, { name: cat.name, description: cat.description, imageUrl: cat.imageUrl, active: !cat.active });
      toast.success(cat.active ? 'Category hidden from the shop' : 'Category visible in the shop');
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async (cat: Category) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await axiosClient.delete(`/admin/categories/${cat.id}`);
      toast.success('Category deleted');
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Category Management</h1>
        <p className="text-xs text-slate-400 mt-1">Hidden categories disappear from the shop filters. Categories that still contain products cannot be deleted.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="admin-card p-6 space-y-4 text-xs h-fit">
          <h2 className="text-sm font-bold text-white">{editingId ? 'Edit Category' : 'Add New Category'}</h2>
          <div>
            <label htmlFor="cat-name" className="admin-label">Category Name</label>
            <input id="cat-name" required maxLength={120} type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label htmlFor="cat-desc" className="admin-label">Description</label>
            <textarea id="cat-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label htmlFor="cat-img" className="admin-label">Banner Image URL</label>
            <input id="cat-img" type="text" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="admin-input" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 btn-primary py-3">{editingId ? 'Save Changes' : 'Create Category'}</button>
            {editingId && <button type="button" onClick={reset} className="px-4 rounded-xl border border-slate-600 font-semibold">Cancel</button>}
          </div>
        </form>

        <div className="lg:col-span-2 admin-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-white">Existing Categories</h2>
          {isLoading ? (
            <LoadingSpinner />
          ) : isError ? (
            <p className="text-xs text-rose-300">Categories could not be loaded.</p>
          ) : (
            <div className="space-y-3 text-xs">
              {categories?.length === 0 && <p className="text-slate-500">No categories yet.</p>}
              {categories?.map((cat) => (
                <div key={cat.id} className={`p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 flex items-center justify-between gap-3 ${cat.active ? '' : 'opacity-60'}`}>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm">
                      {cat.name} {!cat.active && <span className="text-[10px] text-amber-300">(hidden)</span>}
                    </h3>
                    <p className="text-slate-400 mt-0.5 line-clamp-2">{cat.description}</p>
                    <span className="text-[10px] font-mono text-emerald-400">/{cat.slug} · {cat.productCount ?? 0} products</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditingId(cat.id); setForm({ name: cat.name, description: cat.description || '', imageUrl: cat.imageUrl || '' }); }} className="p-1.5 text-slate-300 hover:text-emerald-400" aria-label={`Edit ${cat.name}`}><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => toggleActive(cat)} className="p-1.5 text-slate-300 hover:text-amber-300" aria-label={cat.active ? `Hide ${cat.name}` : `Show ${cat.name}`}>
                      {cat.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => remove(cat)} disabled={(cat.productCount ?? 0) > 0} title={(cat.productCount ?? 0) > 0 ? 'Move or archive its products first' : 'Delete'} className="p-1.5 text-slate-400 hover:text-rose-400 disabled:opacity-30" aria-label={`Delete ${cat.name}`}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
