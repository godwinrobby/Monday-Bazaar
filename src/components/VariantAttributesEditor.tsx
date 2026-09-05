import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Tag, RefreshCw } from 'lucide-react';
import { ecommerce } from '../db/ecommerce';
import { EcAttribute, EcAttributeValue } from '../types/ecommerce';

interface Props {
  value: Record<string, string>;
  onChange: (attrs: Record<string, string>) => void;
  /** IDs of attribute groups assigned to this product. When omitted, all
   * active preset groups are shown (backward-compatible behaviour). */
  assignedGroups?: string[];
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

export const VariantAttributesEditor: React.FC<Props> = ({ value, onChange, assignedGroups }) => {
  const attrs = value || {};
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState<LoadedAttr[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingValue, setSavingValue] = useState<string | null>(null);
  const [newCustom, setNewCustom] = useState<{ groupId: string; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const assignedSet = assignedGroups ? new Set(assignedGroups) : null;

  const loadAll = useCallback(async () => {
    try {
      const list = await ecommerce.listAttributes();
      const preset = list.filter((a) => a.is_active !== false && a.has_presets);
      const loadedAttrs: LoadedAttr[] = [];
      for (const a of preset) {
        // Only include groups that are assigned to this product (when assignedGroups is provided).
        if (assignedSet && !assignedSet.has(a.id)) continue;
        const vals = await ecommerce.listAttributeValues(a.id).then((v) => v.filter(x => x.is_active !== false).map((x) => x.value));
        if (vals.length) loadedAttrs.push({ attr: a, values: vals });
      }
      setLoaded(loadedAttrs);
    } catch { /* non-fatal — falls back to freeform only */ }
    setLoading(false);
  }, [assignedSet]);

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

  /** Register a new value for an assigned attribute group inline. */
  const addCustomValue = async (groupId: string) => {
    if (!newCustom) return;
    const v = newCustom.text.trim();
    if (!v || savingValue) return;
    setSavingValue(v);
    try {
      const attr = await ecommerce.getAttributeById(groupId);
      if (!attr) throw new Error('Attribute group not found');
      await ecommerce.getOrCreateAttributeValue(attr.id, v);
      await loadAll();
      setNewCustom(null);
    } catch {
      // keep typing the value into the variant attributes as a fallback
      const key = loaded.find(l => l.attr.id === groupId)?.attr.name.toLowerCase() || 'value';
      const next = { ...attrs };
      if (!next[key]) next[key] = v;
      onChange(next);
      setNewCustom(null);
    } finally {
      setSavingValue(null);
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
        <div className="text-[10px] text-slate-400">No registered attribute groups assigned to this product. Assign groups in the product form above.</div>
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
            {/* Inline "add new value" for this group */}
            {newCustom?.groupId === attr.id ? (
              <div className="flex items-center gap-1">
                <input
                  value={newCustom.text || ''}
                  onChange={(e) => setNewCustom({ groupId: attr.id, text: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCustomValue(attr.id); }}
                  placeholder="Value…"
                  className="w-24 px-1.5 py-0.5 border border-slate-200 rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                />
                <button type="button" onClick={() => addCustomValue(attr.id)} disabled={savingValue || !newCustom?.text?.trim()} className="p-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40" title="Register a new value">
                  <Plus className="w-3 h-3" />
                </button>
                <button type="button" onClick={() => setNewCustom(null)} className="p-0.5 rounded text-slate-400 hover:bg-slate-100">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setNewCustom({ groupId: attr.id, text: '' })}
                className="p-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200"
                title={`Add new ${attr.name} value`}
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
            </div>
          ))
        )}
      </div>
  );
};
