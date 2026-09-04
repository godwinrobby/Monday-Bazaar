import React from 'react';
import { X } from 'lucide-react';

interface FormDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  saving?: boolean;
  error?: string | null;
  success?: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
};

export const FormDrawer: React.FC<FormDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  saving,
  error,
  success,
  children,
  footer,
  width = 'lg',
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Drawer Panel */}
      <div
        className={`relative ml-auto h-full w-full ${widthClasses[width]} bg-white shadow-2xl flex flex-col transform transition-transform duration-200 ease-out`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="min-w-0">
            <h3 className="font-black text-base sm:text-lg text-slate-900 truncate">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Messages */}
        {(error || success) && (
          <div className="mx-4 sm:mx-6 mt-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span className="break-all">{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-start gap-2">
                <span className="shrink-0 mt-0.5">✓</span>
                <span className="break-all">{success}</span>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer !== undefined && footer !== null && (
          <div className="shrink-0 px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/80">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
