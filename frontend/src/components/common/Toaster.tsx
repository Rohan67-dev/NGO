import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

export const Toaster: React.FC = () => {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 sm:w-96" aria-live="polite" role="status">
      {toasts.map((t) => {
        const styles =
          t.kind === 'success'
            ? 'bg-emerald-600 text-white'
            : t.kind === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-slate-900 text-white';
        const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertTriangle : Info;
        return (
          <div key={t.id} className={`${styles} rounded-xl shadow-lg px-4 py-3 text-xs font-medium flex items-start gap-2`}>
            <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="opacity-80 hover:opacity-100" aria-label="Dismiss notification">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
