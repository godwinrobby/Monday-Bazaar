import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, RefreshCw, AlertCircle, Check, GripVertical } from 'lucide-react';
import { ecommerce } from '../db/ecommerce';

export interface ImageItem {
  id: string;
  url: string;
  file?: File;
  progress: number;
  status: 'committed' | 'uploading' | 'error';
  error?: string;
}

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder: string;
  maxFiles?: number;
  maxSizeMB?: number;
  label?: string;
  placeholder?: string;
}

const DEFAULT_MAX = 20;
const DEFAULT_MAX_MB = 10;

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value = [],
  onChange,
  folder,
  maxFiles = DEFAULT_MAX,
  maxSizeMB = DEFAULT_MAX_MB,
  label = 'Images',
  placeholder = 'Upload images or drop them here',
}) => {
  const committed: ImageItem[] = value.map((url) => ({
    id: url, url, progress: 100, status: 'committed' as const,
  }));
  const [pending, setPending] = useState<ImageItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems = [...committed, ...pending];
  const hasCapacity = allItems.length < maxFiles;

  const removeItem = async (item: ImageItem) => {
    if (item.status === 'uploading') return;
    try { await ecommerce.deleteImage(item.url); } catch { /* best-effort */ }
    onChange(value.filter((u) => u !== item.url));
  };

  const replaceItem = (item: ImageItem) => {
    removeItem(item);
    inputRef.current?.click();
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const arr = [...value];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    onChange(arr);
  };

  const startUpload = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!fileArr.length) return;
    const room = maxFiles - (value.length + pending.length);
    const slice = fileArr.slice(0, room > 0 ? room : 0);
    if (!slice.length) return;

    const created: ImageItem[] = slice.map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: URL.createObjectURL(f),
      file: f,
      progress: 0,
      status: 'uploading',
    }));
    setPending((p) => [...p, ...created]);

    for (const item of created) {
      const file = item.file!;
      try {
        const url = await ecommerce.uploadImage(file, folder, (pct) => {
          setPending((p) => p.map((x) => (x.id === item.id ? { ...x, progress: pct } : x)));
        });
        // Remove from pending first, then append to committed via the parent, so the
        // same image is never rendered twice in a transitional frame.
        setPending((p) => p.filter((x) => x.id !== item.id));
        onChange([...value, url]);
        URL.revokeObjectURL(item.url);
      } catch (e: any) {
        setPending((p) =>
          p.map((x) => (x.id === item.id ? { ...x, progress: 0, status: 'error', error: e?.message || 'Upload failed' } : x)),
        );
      }
    }
  }, [value, pending, onChange, maxFiles, folder]);

  const onFilesSelected = (files: FileList | File[]) => {
    if (!hasCapacity) return;
    startUpload(files);
  };

  const onItemDragStart = (idx: number) => () => {
    if (idx >= value.length) return; // only committed URLs are reorderable
    setDragIdx(idx);
  };
  const onItemDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
  };
  const onItemDrop = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx < value.length && idx < value.length) {
      reorder(dragIdx, idx);
      setDragIdx(null);
    } else if (e.dataTransfer.files?.length) {
      onFilesSelected(e.dataTransfer.files);
    } else {
      setDragIdx(null);
    }
  };

  const renderThumb = (item: ImageItem, idx: number) => {
    const isCommitted = item.status === 'committed';
    const isPending = item.status === 'uploading';
    const isError = item.status === 'error';
    return (
      <div
        key={item.id}
        className={`relative group w-20 h-20 rounded-xl overflow-hidden border-2 ${isCommitted ? 'border-slate-200 bg-slate-50' : 'border-slate-300 bg-slate-100'} flex items-center justify-center`}
        draggable={isCommitted}
        onDragStart={onItemDragStart(idx)}
        onDragOver={onItemDragOver(idx)}
        onDrop={onItemDrop(idx)}
      >
        <img
          src={item.url}
          alt={label}
          className={`w-full h-full object-cover ${isPending ? 'opacity-60' : ''}`}
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=Bad'; }}
        />
        {isCommitted && (
          <div
            className="absolute top-1 left-1 cursor-grab rounded bg-white/80 text-slate-500 hover:bg-white hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        {isPending && (
          <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-1 text-[9px] text-slate-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{item.progress}%</span>
          </div>
        )}
        {isError && (
          <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isError ? (
            <button
              type="button"
              onClick={() => { if (item.file) startUpload([item.file]); }}
              className="p-0.5 rounded bg-white text-slate-600 hover:text-indigo-600"
              title="Retry upload"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => replaceItem(item)}
              className="p-0.5 rounded bg-white text-slate-600 hover:text-indigo-600"
              title="Replace image"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => removeItem(item)}
            disabled={isPending}
            className="p-0.5 rounded bg-white text-slate-600 hover:text-red-600 disabled:opacity-40"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {isError && item.error && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-red-50 border border-red-200 text-red-700 text-[9px] font-medium px-2 py-1 rounded">{item.error}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">{label}</label>
      <div
        className={`relative flex flex-wrap gap-2 items-center rounded-xl border border-slate-200 bg-white transition-all ${dragOver ? 'border-indigo-400 bg-indigo-50/40' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) onFilesSelected(e.dataTransfer.files);
        }}
      >
        {allItems.length > 0 ? (
          allItems.map((item, i) => renderThumb(item, i))
        ) : (
          <div
            className="w-full py-6 text-center cursor-pointer hover:bg-slate-50 rounded-xl transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
            <p className="text-xs text-slate-500">{placeholder}</p>
            <p className="text-[10px] text-slate-400 mt-1">{`Max ${maxFiles} images, up to ${maxSizeMB} MB each`}</p>
          </div>
        )}

        {hasCapacity && (
          <div
            className="w-full py-3 text-center cursor-pointer hover:bg-slate-5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-300 transition-all"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mx-auto mb-0.5" />
            <span className="text-[11px] font-bold">Add images</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files && hasCapacity) onFilesSelected(files);
            e.target.value = '';
          }}
        />
      </div>

      {allItems.length >= maxFiles && (
        <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />Maximum {maxFiles} images reached. Remove some to add more.
        </p>
      )}

      {value.length > 0 && (
        <p className="text-[10px] text-slate-400 flex items-center gap-1">
          <Check className="w-3 h-3 text-emerald-500" />Drag the thumbnails to reorder; the first image is used as the product cover.
        </p>
      )}
    </div>
  );
};
