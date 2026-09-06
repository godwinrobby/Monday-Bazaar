// Shared normalization + uniqueness helpers for Product Variant attributes.
// Used by the Admin editor, the E-commerce data service (backend save), and the
// CSV importer so duplicates are detected consistently everywhere.

/** Normalize a single attribute key or value for comparison:
 * trims surrounding whitespace and lower-cases, so "M", "m" and " M " compare equal. */
export function normalizeAttrToken(token: string | null | undefined): string {
  return String(token ?? '').trim().toLowerCase();
}

/**
 * Build a canonical, deterministic "combination key" from a variant's attributes
 * object (e.g. { Color: 'Black', Size: '  M ' } -> "color:black|size:m").
 * Keys/values are trimmed + lower-cased then sorted by key, so the same combo is
 * always represented identically regardless of case/whitespace/insertion order.
 * This must mirror the SQL expression used by the `attrs_key` generated column
 * (public.ec_variant_attrs_key) for the DB-level uniqueness safeguard.
 */
export function variantComboKey(attrs: Record<string, unknown> | null | undefined): string {
  return Object.entries(attrs || {})
    .map(([k, v]) => `${normalizeAttrToken(k)}:${normalizeAttrToken(v as any)}`)
    .filter(s => s !== ':')
    .sort()
    .join('|');
}

/** Human-readable label for a combo, e.g. "Size: M · Color: Black" (trimmed, original case). */
export function variantComboLabel(attrs: Record<string, unknown> | null | undefined): string {
  const parts = Object.entries(attrs || {})
    .filter(([, v]) => String(v ?? '').trim() !== '')
    .map(([k, v]) => `${String(k).trim()}: ${String(v).trim()}`);
  return parts.sort().join(' · ');
}

/**
 * Given a list of variants, return a map of index -> list of other conflicting
 * indices (those that share the same normalized attribute combination). The
 * calling variant's own id is naturally excluded because we only add indices
 * of *other* variants with an equal combo key.
 */
export function findDuplicateVariantIndices(
  variants: { id?: string | null; attributes?: Record<string, unknown> | null }[],
): Map<number, number[]> {
  const conflicts = new Map<number, number[]>();
  for (let i = 0; i < variants.length; i++) {
    const key = variantComboKey(variants[i]?.attributes);
    if (!key) continue;
    for (let j = 0; j < variants.length; j++) {
      if (i === j) continue;
      if (variantComboKey(variants[j]?.attributes) === key) {
        const arr = conflicts.get(i) || [];
        if (!arr.includes(j)) arr.push(j);
        conflicts.set(i, arr);
      }
    }
  }
  return conflicts;
}