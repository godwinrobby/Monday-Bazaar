import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Tag, RefreshCw } from 'lucide-react';
import { ecommerce } from '../db/ecommerce';
import { EcAttribute, EcAttributeValue } from '../types/ecommerce';

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

interface LoadedAttr {
  attr: EcAttribute;
  values: string[];
}

export const VariantAttributesEditor: React.FC<Props> = ({ value, onChange }) => {
  const attrs = value || {};
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState<LoadedAttr[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSize, setSavingSize] = useState<string | null>(null);
  const [newCustom, setNewCustom] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const loadAll = useCallback(async () => {
    try {
      const list = await ecommerce.listAttributes();
      const preset = list.filter((a) => a.is_active !== false && a.has_presets);
      const loadedAttrs: LoadedAttr[] = [];
      for (const a of preset) {
        const vals = await ecommerce.listAttributeValues(a.id).then((v) => v.map((x) => x.value));
        if (vals.length) loadedAttrs.push({ attr: a, values: vals });
      }
      setLoaded(loadedAttrs);
    } catch { /* non-fatal — falls back to freeform only */ }
    setLoading(false);
  }, []);

  useEffect(() => { let cancelled = false; (async () => { await loadAll(); if (cancelled) return; })(); return () => { cancelled = true; }; }, [loadAll]);

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

  const setPreset = (key: string, val: string) => {
    const next: Record<string, string> = { ...attrs };
    if (next[key] === val) delete next[key]; else next[key] = val;
    onChange(next);
  };

  const addCustomSize = async () => {
    const v = newCustom.trim();
    if (!v || savingSize) return;
    setSavingSize(v);
    try {
      const attr = await ecommerce.getOrCreateAttribute('Size');
      await ecommerce.getOrCreateAttributeValue(attr.id, v);
      await loadAll();
      setNewCustom('');
    } catch {
      // keep typing the value into the variant attributes as a fallback
      const next = { ...attrs };
      if (!next.size) next.size = v;
      onChange(next);
    } finally {
      setSavingSize(null);
    }
  };

  return (
    <div className="space-y-2">
      {/* Current attribute chips */}
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

      {/* Freeform key:value editor (flexible for any attribute) */}
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { commitText(); e.preventDefault(); } }}
        onBlur={commitText}
        placeholder="Add attribute: color:Black, size:M, ram:8GB (Enter to add)"
        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
      />

      {/* Registered preset attribute selectors (Size, Color, Storage, RAM, Material, …) */}
      {loading ? (
        <div className="flex items-center gap-1 text-[10px] text-slate-400"><RefreshCw className="w-3 h-3 animate-spin" /> Loading attributes…</div>
      ) : loaded.length === 0 ? (
        <div className="text-[10px] text-slate-400">No registered attributes yet. Manage them in the Attributes tab.</div>
      ) : (
        loaded.map(({ attr, values }) => (
          <div key={attr.id} className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500">{attr.name}:</span>
            {values.map((sz) => {
              const active = attrs[attr.name.toLowerCase()] === sz;
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPreset(attr.name.toLowerCase(), sz)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${active ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        ))
      )}

      {/* Inline "add new value" for Size (keeps CSV import / admin in sync) */}
      <div className="flex items-center gap-1.5 pt-1">
        <input
          value={newCustom}
          onChange={(e) => setNewCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addCustomSize(); }}
          placeholder="+ new size value…"
          className="w-32 px-1.5 py-0.5 border border-slate-200 rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
        />
        <button type="button" onClick={addCustomSize} disabled={savingSize || !newCustom.trim()} className="p-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40" title="Register a new Size value">
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
