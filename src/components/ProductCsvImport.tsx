import React, { useMemo, useRef, useState } from 'react';
import {
  FileSpreadsheet, X, Download, Upload, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Check, Tag,
} from 'lucide-react';
import { ecommerce } from '../db/ecommerce';
import { EcProduct, EcCategory, EcBrand, EcVariant } from '../types/ecommerce';
import {
  parseProductCSV, validateProductRows, generateProductCSVTemplate,
  downloadTextFile, ProductValidationResult, ValidatedProductRow, ProductImportVariant,
} from '../utils/productCsvImport';

interface Props {
  open: boolean;
  onClose: () => void;
  categories: EcCategory[];
  brands: EcBrand[];
  existingProducts: EcProduct[];
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onImported: () => void;
}

type Step = 'upload' | 'review' | 'importing' | 'done';

interface Summary {
  imported: number;
  updated: number;
  failed: number;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'p';

export const ProductCsvImport: React.FC<Props> = ({
  open, onClose, categories, brands, existingProducts, addToast, onImported,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [csvError, setCsvError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ProductValidationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<Summary>({ imported: 0, updated: 0, failed: 0 });
  const [failedRows, setFailedRows] = useState<{ line: number; name: string; error: string }[]>([]);

  const categoryLookup = useMemo(() => {
    const map = new Map<string, EcCategory>();
    categories.forEach(c => map.set(c.name.trim().toLowerCase(), c));
    return map;
  }, [categories]);

  const brandLookup = useMemo(() => {
    const map = new Map<string, EcBrand>();
    brands.forEach(b => map.set(b.name.trim().toLowerCase(), b));
    return map;
  }, [brands]);

  const handleDownloadTemplate = () => {
    downloadTextFile('product-import-template.csv', generateProductCSVTemplate());
    addToast('Template downloaded', 'success');
  };

  const existingSkuMap = useMemo(() => {
    const map = new Map<string, EcProduct>();
    existingProducts.forEach(p => { if (p.sku) map.set(p.sku.trim().toLowerCase(), p); });
    return map;
  }, [existingProducts]);

  const reset = () => {
    setStep('upload');
    setFileName('');
    setCsvError(null);
    setValidation(null);
    setProgress(0);
    setSummary({ imported: 0, updated: 0, failed: 0 });
    setFailedRows([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelected = (file: File) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      setCsvError('Please select a .csv file.');
      return;
    }
    setCsvError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string) || '';
        const parsed = parseProductCSV(text);
        if (parsed.length === 0) {
          setCsvError('No product rows found in the CSV. The file must have a header row plus data rows.');
          setStep('upload');
          return;
        }
        const existingSkus = new Set<string>(existingProducts.map(p => (p.sku || '').trim()));
        const result = validateProductRows(parsed, {
          existingSkus,
          categoryNames: categories.map(c => c.name),
          brandNames: brands.map(b => b.name),
        });
        setValidation(result);
        setStep('review');
      } catch (err: any) {
        setCsvError(err?.message || 'Failed to parse CSV.');
        setStep('upload');
      }
    };
    reader.onerror = () => setCsvError('Failed to read the file.');
    reader.readAsText(file, 'utf-8');
  };

  const runImport = async () => {
    if (!validation) return;
    const valid = validation.valid;
    if (valid.length === 0) {
      addToast('No valid rows to import.', 'error');
      return;
    }
    setStep('importing');
    setSummary({ imported: 0, updated: 0, failed: 0 });
    setFailedRows([]);
    setProgress(0);

    const s: Summary = { imported: 0, updated: 0, failed: 0 };
    const failures: { line: number; name: string; error: string }[] = [];
    const nowBase = Date.now();

    for (let i = 0; i < valid.length; i++) {
      const row = valid[i];
      setProgress(Math.round(((i + 1) / valid.length) * 100));
      try {
        const category = categoryLookup.get(row.category.trim().toLowerCase());
        const brand = brandLookup.get(row.brand.trim().toLowerCase());
        const existing = existingSkuMap.get(row.sku.trim().toLowerCase());
        const pid = existing?.id || `ec-prod-${slugify(row.sku)}-${nowBase}-${i}`;

        const payload: EcProduct = {
          id: pid,
          name: row.name,
          sku: row.sku,
          product_type: row.productType,
          description: row.description,
          brand_id: brand?.id,
          category_id: category?.id,
          price: row.price,
          sale_price: row.salePrice,
          stock: row.productType === 'simple' ? row.stock : 0,
          images: row.images,
          is_active: row.status === 'active',
          featured: existing?.featured,
        };

         await ecommerce.saveProduct(payload);

         if (row.productType === 'variable') {
           if (existing) await ecommerce.deleteVariantsByProduct(pid);

           // Register the "Size" attribute + values once (reused, never duplicated).
           const sizeAttr = row.sizes.length ? await ecommerce.getOrCreateAttribute('Size') : null;
           if (sizeAttr) {
             for (const sz of row.sizes) {
               try { await ecommerce.getOrCreateAttributeValue(sizeAttr.id, sz); } catch { /* non-fatal */ }
             }
           }

           for (const v of row.variants) {
             const vid = `ec-var-${pid}-${slugify(v.sku)}-${nowBase}`;
             const vPayload: EcVariant = {
               id: vid,
               product_id: pid,
               sku: v.sku,
               price: v.price,
               sale_price: v.salePrice,
               stock: v.stock,
               attributes: v.attributes || {},
               image: v.image || '',
               images: v.image ? [v.image] : [],
               is_active: true,
             };
             await ecommerce.saveVariant(vPayload);
           }
         }

        if (existing) s.updated++; else s.imported++;
        setSummary({ ...s });
      } catch (err: any) {
        s.failed++;
        failures.push({ line: row.line, name: row.name, error: err?.message || 'Import failed.' });
        setSummary({ ...s });
      }
    }

    setSummary(s);
    setFailedRows(failures);
    setStep('done');
    onImported();
  };

  const validCount = validation?.valid.length ?? 0;
  const invalidCount = validation?.errors.length ?? 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600"><FileSpreadsheet className="w-5 h-5" /></div>
            <div>
              <h3 className="font-extrabold text-slate-900">Import Products via CSV</h3>
              <p className="text-[11px] text-slate-500">Bulk import / update Simple &amp; Variable products in the catalog.</p>
            </div>
          </div>
          <button onClick={() => { if (step !== 'importing') { reset(); onClose(); } }} className="text-slate-400 hover:text-slate-700 rounded-lg p-1.5 hover:bg-slate-100" title="Close"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          {step === 'upload' && renderUpload()}
          {step === 'review' && renderReview()}
          {step === 'importing' && renderImporting()}
          {step === 'done' && renderDone()}
        </div>
      </div>
    </div>
  );

  function renderUpload() {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <p className="text-xs text-slate-600 mb-3">
            Upload a CSV file to import products. Download the template first to ensure correct formatting.
            It includes two example rows — edit them or remove them before importing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleDownloadTemplate} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors">
              <Download className="w-4 h-4" /> Download CSV Template
            </button>
            <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer">
              <Upload className="w-4 h-4" /> Choose CSV File
              <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={e => handleFileSelected(e.target.files?.[0] as File)} className="hidden" />
            </label>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Tag className="w-4 h-4 text-indigo-500" /> Expected columns</p>
          <div className="flex flex-wrap gap-1.5">
            {['Product Name', 'SKU', 'Product Type', 'Category', 'Brand', 'Description', 'Price', 'Sale Price', 'Stock', 'Images', 'Attributes', 'Size Available', 'Variants', 'Status'].map(c => (
              <span key={c} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-mono text-slate-600">{c}</span>
            ))}
          </div>
          <ul className="mt-3 space-y-1 text-[11px] text-slate-500">
            <li>• <b>Product Type:</b> <code>simple</code> or <code>variable</code></li>
            <li>• <b>Images:</b> pipe (<code>|</code>)-separated image URLs</li>
            <li>• <b>Attributes:</b> pipe-separated <code>key:value</code> pairs, e.g. <code>color:Black|material:Cotton</code></li>
            <li>• <b>Size Available:</b> comma-separated sizes, e.g. <code>M, L, XL</code>. For variable products, one variant is auto-created per size (unless a <b>Variants</b> column is also supplied). The Size attribute &amp; values are reused, never duplicated.</li>
            <li>• <b>Variants (variable only):</b> semicolon-separated, each with pipe-separated <code>sku:|price:|stock:</code> + attribute pairs, e.g. <code>sku:NAZ-9|price:4395|stock:20|color:Black|size:UK9;sku:NAZ-10|price:4595|stock:15|color:Black|size:UK10</code></li>
            <li>• <b>Status:</b> <code>active</code> / <code>inactive</code> (defaults to <code>active</code>)</li>
            <li>• <b>Action:</b> existing catalog SKUs are <b>updated</b>; new SKUs are <b>created</b>.</li>
          </ul>
        </div>

        {csvError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{csvError}</div>
          </div>
        )}
      </div>
    );
  }
function renderReview() {
    if (!validation) return null;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">{validation.rows.length} rows</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">{validCount} valid</span>
            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-bold">{invalidCount} with errors</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setStep('upload'); setValidation(null); }} className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">← Back</button>
            <button onClick={runImport} disabled={validCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-bold text-xs rounded-xl transition-colors">
              <Upload className="w-3.5 h-3.5" /> Confirm &amp; Import {validCount} product(s)
            </button>
          </div>
        </div>

        {invalidCount > 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{invalidCount} row(s) have validation errors and will be <b>skipped</b>. Fix them in the CSV and re-upload, or continue to import only the valid rows.</div>
          </div>
        )}

        <div className="border border-slate-200 rounded-2xl overflow-auto max-h-[50vh]">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 sticky top-0">
               <tr>
                 <th className="text-left p-3 font-bold">Row</th>
                 <th className="text-left p-3 font-bold">Product</th>
                 <th className="text-left p-3 font-bold">SKU</th>
                 <th className="text-left p-3 font-bold">Type</th>
                 <th className="text-left p-3 font-bold">Sizes</th>
                 <th className="text-left p-3 font-bold">Action</th>
                 <th className="text-left p-3 font-bold">Validation</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {validation.rows.map((row) => (
                 <RowView key={row.line} row={row} categories={categories} brands={brands} />
               ))}
             </tbody>
           </table>
        </div>
      </div>
    );
  }

  function renderImporting() {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
          <div>
            <p className="text-sm font-bold text-slate-900">Importing products…</p>
            <p className="text-[11px] text-slate-500">Writing through the product API to the database. Please wait.</p>
          </div>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-slate-500 text-right font-bold">{progress}%</p>
      </div>
    );
  }
function renderDone() {
    const total = summary.imported + summary.updated + summary.failed;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <StatBox icon={<Check className="w-5 h-5" />} label="Imported (new)" value={summary.imported} color="bg-emerald-500" />
          <StatBox icon={<RefreshCw className="w-5 h-5" />} label="Updated (existing SKU)" value={summary.updated} color="bg-indigo-500" />
          <StatBox icon={<XCircle className="w-5 h-5" />} label="Failed" value={summary.failed} color="bg-red-500" />
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-500">Processed {total} row(s).</p>
          {failedRows.length === 0 ? (
            <p className="text-sm font-bold text-emerald-600 mt-1 flex items-center justify-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Import complete</p>
          ) : (
            <p className="text-sm font-bold text-amber-600 mt-1 flex items-center justify-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Import finished with errors</p>
          )}
        </div>

        {failedRows.length > 0 && (
          <div className="border border-red-200 rounded-2xl overflow-auto max-h-48">
            <table className="w-full text-xs">
              <thead className="bg-red-50 text-red-600 border-b border-red-100">
                <tr>
                  <th className="text-left p-2.5 font-bold">Row</th>
                  <th className="text-left p-2.5 font-bold">Product</th>
                  <th className="text-left p-2.5 font-bold">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50">
                {failedRows.map((f) => (
                  <tr key={`${f.line}-${f.name}`}>
                    <td className="p-2.5 text-red-600 font-mono">{f.line}</td>
                    <td className="p-2.5 text-slate-700">{f.name}</td>
                    <td className="p-2.5 text-red-600">{f.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Close</button>
          <button onClick={reset} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl">
            <Upload className="w-3.5 h-3.5" /> Import Another File
          </button>
        </div>
      </div>
    );
  }
};

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
      <div className={`w-9 h-9 mx-auto rounded-xl ${color} text-white flex items-center justify-center mb-2`}>{icon}</div>
      <div className="text-2xl font-black text-slate-900">{value}</div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}

interface RowViewProps {
  row: ValidatedProductRow;
  categories: EcCategory[];
  brands: EcBrand[];
}

const RowView: React.FC<RowViewProps> = ({ row, categories, brands }) => {
  const ok = row.errors.length === 0;
  return (
    <tr className={ok ? 'bg-white' : 'bg-red-50/40'}>
      <td className="p-3 text-slate-400 font-mono">{row.line}</td>
      <td className="p-3">
        <div className="font-bold text-slate-900 max-w-[200px] truncate">{row.name}</div>
        {row.variants.length > 0 && row.productType === 'variable' && (
          <div className="text-[10px] text-slate-400">{row.variants.length} variant(s)</div>
        )}
      </td>
      <td className="p-3 text-slate-600 font-mono">{row.sku || '—'}</td>
       <td className="p-3"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${row.productType === 'variable' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'}`}>{row.productType}</span></td>
       <td className="p-3 text-slate-600">{row.sizes.length ? row.sizes.map((s) => <span key={s} className="inline-block px-1.5 py-0.5 mr-1 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">{s}</span>) : <span className="text-slate-300">—</span>}</td>
       <td className="p-3">
         <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${row.action === 'update' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {row.action === 'update' ? 'Update' : 'Create'}
        </span>
      </td>
      <td className="p-3">
        {ok ? (
          <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]"><CheckCircle2 className="w-3.5 h-3.5" /> Valid</span>
        ) : (
          <div className="space-y-0.5">
            {row.errors.slice(0, 3).map((e, i) => (
              <div key={i} className="flex items-start gap-1 text-red-600 text-[10px]"><XCircle className="w-3 h-3 shrink-0 mt-0.5" />{e}</div>
            ))}
            {row.errors.length > 3 && <div className="text-[10px] text-slate-400">+{row.errors.length - 3} more…</div>}
          </div>
        )}
      </td>
    </tr>
  );
};

export default ProductCsvImport;