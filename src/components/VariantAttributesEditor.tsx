import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Tag, RefreshCw } from 'lucide-react';
import { ecommerce } from '../db/ecommerce';

interface Props {
  value: Record<string, string>;
  onChange: (attrs: Record<string, string>) => void;
}

const parsePairs = (raw: string): { key: string; value: string }[] =>
  raw
    .split(/,|\|/).map((s) => s.trim()).filter(Boolean)
    .map((part) => {
      const [k, ...rest] = part.split(/[:=]/);
      const key = (k || '').trim();
      const value = rest.join(':').trim();
      return key ? { key, value } : null;
    })
    .filter(Boolean) as { key: string; value: string }[];

export const VariantAttributesEditor: React.FC<Props> = ({ value, onChange }) => {
  const attrs = value || {};
  const [text, setText] = useState('');
  const [sizes, setSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSize, setNewSize] = useState('');
  const [savingSize, setSavingSize] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadSizes = useCallback(async () => {
    try { setSizes(await ecommerce.listSizes()); } catch { /* non-fatal */ }
    setLoading(false);
  }, []);

  useEffect(() => { let cancelled = false; (async () => { await loadSizes(); if (cancelled) return; })(); return () => { cancelled = true; }; }, [loadSizes]);

  const commitText = () => {
    const pairs = parsePairs(text);
    if (!pairs.length) { setText(''); return; }
    const next: Record<string, string> = { ...attrs };
    for (const p of pairs) { if (p.value !== '') next[p.key.toLowerCase()] = p.value; }
    onChange(next);
    setText('');
  };

  const removeKey = (k: string) => {
    const { [k]: _, ...rest } = attrs;
    onChange(rest);
  };

  const toggleSize = (sz: string) => {
    const key = 'size';
    const next: Record<string, string> = { ...attrs };
    if (next[key] === sz) { delete next[key]; } else { next[key] = sz; }
    onChange(next);
  };

  const addSize = async () => {
    const v = newSize.trim();
    if (!v || savingSize) return;
    setSavingSize(true);
    try {
      const attr = await ecommerce.getOrCreateAttribute('Size');
      await ecommerce.getOrCreateAttributeValue(attr.id, v);
      setNewSize('');
      await loadSizes();
    } catch (e: any) {
      // best-effort: still allow typing the size into the variant attributes
      const next = { ...attrs };
      if (!next.size) next.size = v;
      onChange(next);
    } finally {
      setSavingSize(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(attrs).map(([k, val]) => (
          <span key={k} className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-mono">
            <Tag className="w-3 h-3 text-slate-400" />
            <b>{k}</b>:{val}
            <button type="button" onClick={() => removeKey(k)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
          </span>
        ))}
        {!Object.keys(attrs).length && <span className="text-[10px] text-slate-400">No attributes set</span>}
      </div>

      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { commitText(); e.preventDefault(); } }}
        onBlur={commitText}
        placeholder="Add attribute: color:Black, size:M (Enter to add)"
        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
      />

      {loading ? (
        <div className="flex items-center gap-1 text-[10px] text-slate-400"><RefreshCw className="w-3 h-3 animate-spin" /> Loading registered sizes…</div>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-500">Size:</span>
          {sizes.map((sz) => {
            const active = attrs.size === sz;
            return (
              <button
                key={sz}
                type="button"
                onClick={() => toggleSize(sz)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${active ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
              >
                {sz}
              </button>
            );
          })}
          <div className="flex items-center gap-1">
            <input
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSize(); } }}
              placeholder="+ new size"
              className="w-20 px-1.5 py-0.5 border border-slate-200 rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
            />
            <button type="button" onClick={addSize} disabled={savingSize || !newSize.trim()} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
