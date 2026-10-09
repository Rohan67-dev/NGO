import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { axiosClient, getErrorMessage } from '../../../api/axiosClient';
import { ContactMessage, Page } from '../../../types';
import { toast } from '../../../store/useToastStore';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Pagination } from '../../common/Pagination';
import { formatDate, humanize } from '../../../lib/format';

const STATUSES: ContactMessage['status'][] = ['NEW', 'IN_PROGRESS', 'RESOLVED'];

/** Contact-form inbox (messages were saved by the original code but never shown anywhere). */
export const AdminMessages: React.FC = () => {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, refetch } = useQuery<Page<ContactMessage>>({
    queryKey: ['admin-messages', status, page],
    queryFn: async () => (await axiosClient.get('/admin/contact-messages', { params: { status: status || undefined, page } })).data.data,
    placeholderData: keepPreviousData,
  });

  const update = async (m: ContactMessage, next: string) => {
    try {
      await axiosClient.put(`/admin/contact-messages/${m.id}/status`, { status: next });
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Contact Messages</h1>
          <p className="text-xs text-slate-400 mt-1">Messages sent through the public contact form. Reply by email, then mark them resolved.</p>
        </div>
        <label htmlFor="msg-status" className="sr-only">Filter by status</label>
        <select id="msg-status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} className="admin-input sm:w-44 text-xs">
          <option value="">All messages</option>
          {STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
        </select>
      </div>

      {isLoading && <LoadingSpinner />}
      {data?.content.length === 0 && <p className="text-xs text-slate-500">No messages.</p>}
      <div className="space-y-3">
        {data?.content.map((m) => (
          <div key={m.id} className="admin-card p-5 text-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <div>
                <p className="font-bold text-white text-sm">{m.subject}</p>
                <p className="text-slate-400">
                  {m.name} · <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.subject)}`} className="text-emerald-400 underline">{m.email}</a>
                  {m.phone ? ` · ${m.phone}` : ''} · {formatDate(m.createdAt)}
                </p>
              </div>
              <label className="sr-only" htmlFor={`m-status-${m.id}`}>Status</label>
              <select id={`m-status-${m.id}`} value={m.status} onChange={(e) => update(m, e.target.value)} className="admin-input sm:w-36 h-fit">
                {STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
              </select>
            </div>
            <p className="text-slate-300 whitespace-pre-line">{m.message}</p>
          </div>
        ))}
      </div>
      <Pagination dark page={page} totalPages={data?.totalPages ?? 0} onPageChange={setPage} />
    </div>
  );
};
