import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { axiosClient } from '@/api/axiosClient';
import { ImpactStory } from '@/types';

export const ImpactStories: React.FC = () => {
  const { data } = useQuery<{ content: ImpactStory[] }>({
    queryKey: ['stories-list'],
    queryFn: async () => {
      const res = await axiosClient.get('/stories?page=0&size=12');
      return res.data.data;
    },
  });

  const stories = data?.content || [];
  const empty = data && stories.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">EDITORIAL &amp; VOICES</span>
        <h1 className="text-3xl font-extrabold text-slate-900">Beneficiary Impact Stories</h1>
        <p className="text-xs text-slate-500">Real interviews and narratives from the rural artisans and communities we serve.</p>
      </div>

      {empty && <p className="text-center text-xs text-slate-500">No stories have been published yet.</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stories.map((story) => (
          <Link key={story.id} to={`/stories/${story.slug}`} className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
            <div className="aspect-video bg-slate-100 overflow-hidden">
              <img src={story.imageUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800'} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2">{story.title}</h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{story.excerpt}</p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                <span>Read Full Story</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
