import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Layers, Search, Wrench, RefreshCw, AlertCircle, X } from 'lucide-react';
import { EcAttributeGroupWithValues } from '../types/ecommerce';

interface Props {
  /** All attribute groups (with values) — pre-loaded once by the parent cache. */
  attributeGroups: EcAttributeGroupWithValues[];
  /** IDs of attribute groups currently assigned to the product. */
  assignedGroupIds: string[];
  /** Called with the updated set of assigned group IDs (deduped, ordered). */
  onAssignedGroupsChange: (ids: string[]) => void;
  /** Per-group selected values: Record<attributeId, string[]>. */
  selectedValues: Record<string, string[]>;
  onSelectedValuesChange: (values: Record<string, string[]>) => void;
  /** Generate full variant combinations from the current group→values selection. */
  onGenerateVariants: (groups: { id: string; name: string; values: string[] }[]) => void;
  /** Re-run variant generation (loading state). */
  generating?: boolean;
}

const activeGroups = (groups: EcAttributeGroupWithValues[]) => groups.filter(a => a.is_active !== false);

export const ProductAttributeGroups: React.FC<Props> = ({
  attributeGroups,
  assignedGroupIds,
  onAssignedGroupsChange,
  selectedValues,
  onSelectedValuesChange,
  onGenerateVariants,
  generating,
}) => {
  const [open, setOpen] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const [valueSearch, setValueSearch] = useState<Record<string, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => activeGroups(attributeGroups), [attributeGroups]);
  const selectedCount = assignedGroupIds.length;

  // Map group id → group for fast lookups.
  const groupById = useMemo(() => new Map(groups.map(g => [g.id, g])), [groups]);
  const orderedSelected = useMemo(
    () => assignedGroupIds.map(id => groupById.get(id)).filter(Boolean) as EcAttributeGroupWithValues[],
    [assignedGroupIds, groupById],
  );

  // Close dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const filteredGroups = groups.filter(g =>
    !groupSearch.trim()
    || g.name.toLowerCase().includes(groupSearch.trim().toLowerCase())
    || (g.slug || '').toLowerCase().includes(groupSearch.trim().toLowerCase()),
  );

  const toggleGroup = (id: string) => {
    const next = assignedGroupIds.includes(id)
      ? assignedGroupIds.filter(x => x !== id)
      : [...assignedGroupIds, id];
    onAssignedGroupsChange(next);

    // Removing a group clears its selected values to keep the model consistent.
    if (assignedGroupIds.includes(id)) {
      const { [id]: _removed, ...rest } = selectedValues;
      onSelectedValuesChange(rest);
    }
  };

  const toggleValue = (groupId: string, value: string) => {
    const current = selectedValues[groupId] || [];
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    onSelectedValuesChange({ ...selectedValues, [groupId]: next });
  };

  const toggleAllValues = (groupId: string, values: string[], checked: boolean) => {
    onSelectedValuesChange({ ...selectedValues, [groupId]: checked ? values : [] });
  };

  const generateGroups = orderedSelected
    .map(g => ({
      id: g.id,
      name: g.name,
      values: (selectedValues[g.id] || g.values.filter(v => v.is_active !== false).map(v => v.value)),
    }))
    .filter(g => g.values.length > 0);

  const totalCombos = generateGroups.reduce((acc, g) => acc * g.values.length, generateGroups.length ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Header + helper text */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500" /> Attribute Groups
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Select which attribute groups this product uses. Values below will be drawn from these groups.
          </p>
        </div>
        {selectedCount > 0 && (
          <span className="shrink-0 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
            {selectedCount} selected
          </span>
        )}
      </div>
      {/* Group multi-select dropdown */}
      {groups.length === 0 ? (
        <div className="flex items-center gap-2 text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          No attribute groups found. Create some in the Attributes tab first.
        </div>
      ) : (
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-colors text-left ${open ? 'border-indigo-300 ring-2 ring-indigo-500/20' : 'border-slate-200'} ${selectedCount ? 'text-slate-900 bg-white' : 'text-slate-400 bg-white'}`}
          >
            <span className="truncate">
              {selectedCount === 0
                ? 'Select attribute groups…'
                : orderedSelected.map(g => g.name).join(' · ')}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {selectedCount > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {orderedSelected.map(g => (
                <span key={g.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                  {g.name}
                  <button type="button" aria-label={`Remove ${g.name}`} onClick={() => toggleGroup(g.id)} className="hover:text-indigo-200">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {open && (
            <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
              <div className="p-2 border-b border-slate-100">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    autoFocus
                    value={groupSearch}
                    onChange={e => setGroupSearch(e.target.value)}
                    placeholder="Search attribute groups…"
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto p-1">
                {filteredGroups.length === 0 ? (
                  <p className="p-3 text-center text-[11px] text-slate-400">No matching groups.</p>
                ) : filteredGroups.map(g => {
                  const checked = assignedGroupIds.includes(g.id);
                  const valCount = g.values.filter(v => v.is_active !== false).length;
                  return (
                    <label key={g.id} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${checked ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                      <span className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 bg-white'}`}>
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleGroup(g.id)}
                        className="sr-only"
                      />
                      <span className="flex-1 min-w-0">
                        <span className={`block text-xs font-bold ${checked ? 'text-indigo-700' : 'text-slate-700'}`}>{g.name}</span>
                        <span className="block text-[10px] text-slate-400 truncate">
                          {valCount} value{valCount === 1 ? '' : 's'}{g.has_presets ? ' · preset' : ''}
                        </span>
                      </span>
                      <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold border ${checked ? 'bg-white text-indigo-600 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {(selectedValues[g.id] || []).length}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
{/* Per-group value multi-select */}
      {orderedSelected.length > 0 && (
        <div className="space-y-2.5">
          {orderedSelected.map(g => {
            const values = g.values.filter(v => v.is_active !== false);
            const sel = selectedValues[g.id] || [];
            const query = (valueSearch[g.id] || '').trim().toLowerCase();
            const shown = query ? values.filter(v => v.value.toLowerCase().includes(query)) : values;
            return (
              <div key={g.id} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
                  <span className="flex-1 text-xs font-extrabold text-slate-700 capitalize">{g.name}</span>
                  <span className="text-[10px] font-bold text-slate-400">{sel.length} of {values.length} selected</span>
                  {values.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleAllValues(g.id, values.map(v => v.value), sel.length !== values.length)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      {sel.length === values.length ? 'Deselect all' : 'Select all'}
                    </button>
                  )}
                </div>

                {values.length > 1 && (
                  <div className="px-3 pt-2 relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-5 top-3.5" />
                    <input
                      value={valueSearch[g.id] || ''}
                      onChange={e => setValueSearch({ ...valueSearch, [g.id]: e.target.value })}
                      placeholder={`Search ${g.name} values…`}
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                )}

                <div className="p-3">
                  {values.length === 0 ? (
                    <p className="text-[11px] text-slate-400">No preset values for this group. Add them in the Attributes tab or set values per variant manually.</p>
                  ) : shown.length === 0 ? (
                    <p className="text-[11px] text-slate-400">No matching values.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                      {shown.map(v => {
                        const checked = sel.includes(v.value);
                        return (
                          <label key={v.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${checked ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleValue(g.id, v.value)}
                              className="w-3.5 h-3.5 accent-indigo-500"
                            />
                            <span className="truncate">{v.value}</span>
                            {checked && <Check className="w-3 h-3 text-indigo-500 ml-auto shrink-0" />}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Variant generation summary + action */}
      {orderedSelected.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200">
          <p className="text-[10px] text-slate-500">
            {totalCombos > 0
              ? <>Selected attributes will produce <b className="text-indigo-600">{totalCombos}</b> variant combination{totalCombos === 1 ? '' : 's'}.</>
              : 'Select values above to generate variants.'}
          </p>
          <button
            type="button"
            onClick={() => onGenerateVariants(generateGroups)}
            disabled={generating || totalCombos === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white text-[11px] font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
            Generate Variants
          </button>
        </div>
      )}
    </div>
  );
};