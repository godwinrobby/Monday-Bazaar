import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border flex items-start gap-3 transform transition-all duration-300 animate-in slide-in-from-top-4 ${
              isError
                ? 'bg-red-950/95 border-red-500/60 text-red-100 shadow-red-950/40'
                : isSuccess
                ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100 shadow-emerald-950/40'
                : isWarning
                ? 'bg-amber-950/95 border-amber-500/60 text-amber-100 shadow-amber-950/40'
                : 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-950/40'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isError && <AlertTriangle className="w-5 h-5 text-red-400" />}
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {!isError && !isSuccess && !isWarning && <Info className="w-5 h-5 text-sky-400" />}
            </div>

            <div className="flex-1 text-xs space-y-0.5">
              {toast.title && <h4 className="font-extrabold text-sm leading-tight tracking-wide">{toast.title}</h4>}
              <p className="leading-relaxed opacity-95 font-medium">{toast.message}</p>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
