import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number; // zero-based
  totalPages: number;
  onPageChange: (page: number) => void;
  dark?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange, dark }) => {
  if (totalPages <= 1) return null;
  const btn = dark
    ? 'px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40'
    : 'px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-emerald-300 disabled:opacity-40 bg-white';
  return (
    <nav className="flex items-center justify-center gap-3 text-xs font-semibold" aria-label="Pagination">
      <button className={btn} disabled={page <= 0} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className={dark ? 'text-slate-300' : 'text-slate-600'}>
        Page {page + 1} of {totalPages}
      </span>
      <button className={btn} disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)} aria-label="Next page">
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};
