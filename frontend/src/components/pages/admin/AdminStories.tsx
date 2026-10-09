import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit3, Trash2 } from 'lucide-react';
import { axiosClient, getErrorMessage } from '../../../api/axiosClient';
import { ImpactStory, Page } from '../../../types';
import { toast } from '../../../store/useToastStore';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { formatDate } from '../../../lib/format';

const blank = { title: '', excerpt: '', content: '', author: '', imageUrl: '', published: true };

export const AdminStories: React.FC = () => {
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery<Page<ImpactStory>>({
    queryKey: ['admin-stories'],
    queryFn: async () => (await axiosClient.get('/admin/stories', { params: { size: 100 } })).data.data,
  });
  const stories = data?.content || [];

  const reset = () => { setForm(blank); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, imageUrl: form.imageUrl || null };
      if (editingId) await axiosClient.put(`/admin/stories/${editingId}`, payload);
      else await axiosClient.post('/admin/stories', payload);
      toast.success(form.published ? 'Story published' : 'Draft saved');
      reset();
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save story'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: ImpactStory) => {
    if (!confirm(`Delete story "${s.title}"?`)) return;
    try {
      await axiosClient.delete(`/admin/stories/${s.id}`);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Impact Stories Editorial CMS</h1>
        <p className="text-xs text-slate-400 mt-1">Publish true stories with the consent of the people featured. Unpublished drafts are not visible on the site.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="admin-card p-6 space-y-4 text-xs h-fit">
          <h2 className="text-sm font-bold text-white">{editingId ? 'Edit Story' : 'New Impact Story'}</h2>
          <div>
            <label htmlFor="s-title" className="admin-label">Story Title</label>
            <input id="s-title" required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label htmlFor="s-author" className="admin-label">Author</label>
            <input id="s-author" type="text" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label htmlFor="s-excerpt" className="admin-label">Short Excerpt</label>
            <textarea id="s-excerpt" required rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label htmlFor="s-content" className="admin-label">Full Article</label>
            <textarea id="s-content" required rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label htmlFor="s-img" className="admin-label">Featured Image URL</label>
            <input id="s-img" type="text" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="admin-input" />
          </div>
          <label className="flex items-center gap-2 text-slate-300">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="accent-emerald-500" /> Published
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 btn-primary py-3">{editingId ? 'Save Changes' : form.published ? 'Publish Story' : 'Save Draft'}</button>
            {editingId && <button type="button" onClick={reset} className="px-4 rounded-xl border border-slate-600 font-semibold">Cancel</button>}
          </div>
        </form>

        <div className="lg:col-span-2 space-y-4">
          {isLoading && <LoadingSpinner />}
          {!isLoading && stories.length === 0 && <p className="text-xs text-slate-500">No stories yet.</p>}
          {stories.map((story) => (
            <div key={story.id} className="admin-card p-5 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <h3 className="font-bold text-white text-sm">
                  {story.title} {!story.published && <span className="text-[10px] text-amber-300">(draft)</span>}
                </h3>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditingId(story.id); setForm({ title: story.title, excerpt: story.excerpt, content: story.content, author: story.author || '', imageUrl: story.imageUrl || '', published: story.published }); }} className="p-1 text-slate-300 hover:text-emerald-400" aria-label={`Edit ${story.title}`}><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => remove(story)} className="p-1 text-slate-400 hover:text-rose-400" aria-label={`Delete ${story.title}`}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="text-slate-400 line-clamp-2">{story.excerpt}</p>
              <span className="text-[10px] text-emerald-400 font-semibold block">
                {story.author ? `By ${story.author} · ` : ''}{formatDate(story.publishedAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
