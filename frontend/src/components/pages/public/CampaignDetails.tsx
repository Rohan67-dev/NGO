import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Mail, ShoppingBag } from 'lucide-react';
import { axiosClient } from '@/api/axiosClient';
import { Campaign } from '@/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDate, formatINR, humanize } from '@/lib/format';

/**
 * Campaign page (the home page already linked to /campaigns/:slug, but the route did not exist).
 * The platform has no donation workflow, so supporters are pointed to the shop and the contact page.
 */
export const CampaignDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: campaign, isLoading, isError } = useQuery<Campaign>({
    queryKey: ['campaign', slug],
    queryFn: async () => (await axiosClient.get(`/campaigns/${slug}`)).data.data,
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (isError || !campaign) {
    return (
      <div className="text-center py-16 space-y-3">
        <h1 className="text-lg font-bold text-slate-800">Campaign not found</h1>
        <Link to="/campaigns" className="text-xs font-semibold text-emerald-600 underline">See all campaigns</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link to="/campaigns" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> All campaigns
      </Link>

      <article className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        {campaign.imageUrl && (
          <div className="aspect-video bg-slate-100">
            <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6 sm:p-10 space-y-6">
          <div className="space-y-2">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">{humanize(campaign.status)}</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{campaign.title}</h1>
            {(campaign.startDate || campaign.endDate) && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                {formatDate(campaign.startDate)} {campaign.endDate ? `– ${formatDate(campaign.endDate)}` : ''}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Raised (reported by the NGO): {formatINR(campaign.currentAmount, 0)}</span>
              <span>Target: {formatINR(campaign.targetAmount, 0)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden" role="progressbar" aria-valuenow={Math.round(campaign.progressPercentage)} aria-valuemin={0} aria-valuemax={100}>
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, campaign.progressPercentage)}%` }} />
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{campaign.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
            <Link to="/shop" className="btn-primary py-3 flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" aria-hidden="true" /> Shop artisan products
            </Link>
            <Link to="/contact" className="text-xs font-bold py-3 rounded-xl border border-slate-200 hover:border-emerald-300 flex items-center justify-center gap-2 text-slate-700">
              <Mail className="w-4 h-4" aria-hidden="true" /> Contact us to support this campaign
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
};
