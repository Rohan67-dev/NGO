import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, User as UserIcon } from 'lucide-react';
import { axiosClient } from '@/api/axiosClient';
import { ImpactStory } from '@/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PLACEHOLDER_IMAGE } from '@/lib/format';

export const StoryDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: story, isLoading } = useQuery<ImpactStory>({
    queryKey: ['story', slug],
    queryFn: async () => {
      const res = await axiosClient.get(`/stories/${slug}`);
      return res.data.data;
    },
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (!story) {
    return (
      <div className="text-center py-16 space-y-3">
        <h1 className="text-lg font-bold text-slate-800">Story not found</h1>
        <button onClick={() => navigate('/stories')} className="text-xs font-semibold text-emerald-600 underline">See all stories</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Stories
      </button>

      <article className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">{story.title}</h1>

        <div className="flex items-center gap-4 text-xs text-slate-500 pb-6 border-b border-slate-100">
          {story.author && (
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <UserIcon className="w-4 h-4 text-emerald-600" /> {story.author}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-slate-400" /> {new Date(story.publishedAt).toLocaleDateString()}
          </span>
        </div>

        <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden">
          <img src={story.imageUrl || PLACEHOLDER_IMAGE} alt={story.title} className="w-full h-full object-cover" />
        </div>

        <div className="text-sm text-slate-700 leading-relaxed space-y-4 pt-4 whitespace-pre-line">
          {story.content}
        </div>
      </article>
    </div>
  );
};
