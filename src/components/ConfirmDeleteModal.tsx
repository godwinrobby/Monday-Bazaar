import React from 'react';
import { Deal } from '../types';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  deal: Deal | null;
  onClose: () => void;
  onConfirm: (dealId: string) => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  deal,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !deal) return null;

  return (
    <div id="confirm-delete-modal-overlay" className="fixed inset-0 z-[110] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        id="confirm-delete-modal-card"
        className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 space-y-5"
      >
        
        <div className="flex items-center justify-between">
          <div className="p-3 bg-red-100 text-red-600 rounded-2xl flex items-center gap-2">
            <Trash2 className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900">Delete Deal Confirmation</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete this deal from the database?
          </p>
        </div>

        {/* Deal Preview Snippet */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
          <img
            src={deal.imageUrl}
            alt={deal.title}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div className="overflow-hidden space-y-0.5">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 rounded-md uppercase">
              {deal.store}
            </span>
            <p className="font-bold text-xs text-slate-900 truncate">{deal.title}</p>
            <p className="text-xs text-slate-500 font-extrabold">₹{deal.dealPrice.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(deal.id);
              onClose();
            }}
            className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Yes, Delete Deal</span>
          </button>
        </div>

      </div>
    </div>
  );
};
