import React from 'react';
import { Trash2, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { EcProduct } from '../types/ecommerce';

interface ProductDeleteModalProps {
  product: EcProduct | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Dedicated confirmation modal for deleting a product (and its variants).
 * Replaces the previous browser `window.confirm` dialog.
 */
export const ProductDeleteModal: React.FC<ProductDeleteModalProps> = ({
  product,
  deleting,
  onClose,
  onConfirm,
}) => {
  if (!product) return null;

  const handleClose = () => {
    if (deleting) return; // prevent closing mid-delete
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 space-y-5">
        <div className="flex items-center justify-between">
          <div className="p-3 bg-red-100 text-red-600 rounded-2xl flex items-center">
            <Trash2 className="w-6 h-6" />
          </div>
          <button
            onClick={handleClose}
            disabled={deleting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900">Delete this product?</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Delete this product and its variants?
          </p>
        </div>

        {/* Product Preview */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
          <img
            src={product.images?.[0] || 'https://placehold.co/48x48?text=No+Img'}
            alt={product.name}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x48?text=No+Img'; }}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div className="overflow-hidden space-y-0.5 min-w-0">
            <p className="font-bold text-xs text-slate-900 truncate">{product.name}</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{product.sku || 'No SKU'}</p>
            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${product.product_type === 'variable' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'}`}>
              {product.product_type}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>This action is permanent. Variants belong to this product will be deleted too, and cannot be undone.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleClose}
            disabled={deleting}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Deleting…</>
            ) : (
              <><Trash2 className="w-4 h-4" /> Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDeleteModal;