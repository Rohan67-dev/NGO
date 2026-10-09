import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { ImpactStory } from '../../../types';

export const AdminStories: React.FC = () => {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('Aasha Editorial Team');
  const [imageUrl, setImageUrl] = useState('');

  const { data, refetch } = useQuery<{ content: ImpactStory[] }>({
    queryKey: ['admin-stories'],
    queryFn: async () => {
      const res = await axiosClient.get('/stories?size=20');
      return res.data.data;
    },
  });

  const stories = data?.content || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post('/admin/stories', {
        title,
        excerpt,
        content,
        author,
        imageUrl,
        published: true,
      });
      setTitle('');
      setExcerpt('');
      setContent('');
      setImageUrl('');
      refetch();
    } catch (e) {
      alert('Failed to publish story');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Impact Stories Editorial CMS</h1>
        <p className="text-xs text-slate-400 mt-1">Publish editorial articles highlighting rural artisan and beneficiary achievements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleCreate} className="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 space-y-4 text-xs h-fit">
          <h3 className="text-sm font-bold text-white">Publish New Impact Story</h3>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Story Title</label>
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Author</label>
            <input required type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Short Excerpt</label>
            <textarea required rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Full Content Article</label>
            <textarea required rows={5} value={content} onChange={(e) => setContent(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Featured Image URL</label>
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-xl transition-colors">
            Publish Story Post
          </button>
        </form>

        <div className="lg:col-span-2 space-y-4">
          {stories.map((story) => (
            <div key={story.id} className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 space-y-2 text-xs">
              <h4 className="font-bold text-white text-sm">{story.title}</h4>
              <p className="text-slate-400 line-clamp-2">{story.excerpt}</p>
              <span className="text-[10px] text-emerald-400 font-semibold block">By {story.author}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
