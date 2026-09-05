import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package, Tags, Award, ShoppingCart, Tag, CreditCard, Truck, Settings,
  Plus, Search, Edit2, Trash2, X, Star, RefreshCw, Eye,
  AlertCircle, Save, PackagePlus, ClipboardList, Store, BarChart3, Boxes, Layers, ExternalLink, Check,
  Users, UserCheck, UserX, Mail, Phone, MapPin, KeyRound, Calendar, ExternalLink as ExtLink, ChevronRight,
  FileSpreadsheet, GripVertical,
} from 'lucide-react';
import { ecommerce } from '../db/ecommerce';
import {
  EcProduct, EcCategory, EcBrand, EcVariant, EcOrder, EcCoupon, EcCustomer,
  EcPaymentMethod, EcShippingMethod, EcProductType, EcOrderStatus,
  EcAttribute, EcAttributeValue,
} from '../types/ecommerce';
import { ProductCsvImport } from './ProductCsvImport';
import { ProductDeleteModal } from './ProductDeleteModal';
import { Pagination } from './Pagination';
import { FormDrawer } from './FormDrawer';
import { ImageUploader } from './ImageUploader';
import { VariantAttributesEditor } from './VariantAttributesEditor';

type EcTab = 'products' | 'attributes' | 'categories' | 'brands' | 'orders' | 'coupons' | 'payments' | 'shipping' | 'shop' | 'customers' | 'settings';

interface Props {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const inputCls = 'px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white';

/* ==================== PRODUCTS PANEL ==================== */
const ProductsPanel: React.FC<{ addToast: Props['addToast']; setError: (s: string | null) => void }> = ({ addToast, setError }) => {
  const [products, setProducts] = useState<EcProduct[]>([]);
  const [categories, setCategories] = useState<EcCategory[]>([]);
  const [brands, setBrands] = useState<EcBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // debounced search
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EcProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showVariants, setShowVariants] = useState(false);
  const [form, setForm] = useState<EcProduct>({ id: '', name: '', product_type: 'simple', price: 0, stock: 0, is_active: true, images: [] });
  const [variants, setVariants] = useState<EcVariant[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const res = await ecommerce.listProductsPaged({
        page, perPage, search: searchQuery,
        status: statusFilter || undefined, product_type: typeFilter || undefined,
        orderBy: 'created_at', orderDir: 'desc',
      });
      setProducts(res.rows); setTotal(res.total);
      // If the last row of the last page was removed, step back a page.
      if (res.rows.length === 0 && res.total > 0 && page > 1) setPage(1);
    } catch (e: any) { setErrorState(e?.message || 'Failed to load products'); setError(e?.message || null); }
    finally { setLoading(false); }
  }, [setError, searchQuery, statusFilter, typeFilter, page, perPage]);

  // Reference lists (categories/brands) are small — load once.
  useEffect(() => {
    Promise.all([ecommerce.listCategories(), ecommerce.listBrands()])
      .then(([c, b]) => { setCategories(c); setBrands(b); })
      .catch(() => { /* non-fatal */ });
  }, []);

  // Debounce search input → query; reset to first page on filter changes.
  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { setPage(1); }, [statusFilter, typeFilter, perPage]);

  useEffect(() => { load(); }, [load]);

  // Full product list for CSV import duplicate-SKU checking (loaded on demand).
  const [importCheckProducts, setImportCheckProducts] = useState<EcProduct[]>([]);
  useEffect(() => {
    if (showImport) ecommerce.listProducts().then(setImportCheckProducts).catch(() => { /* non-fatal */ });
  }, [showImport]);

  const openNew = () => {
    const newId = `ec-prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setEditId(null); setShowVariants(false);
    setForm({ id: newId, name: '', product_type: 'simple', price: 0, stock: 0, is_active: true, images: [] });
    setVariants([]); setShowForm(true);
  };

  const openEdit = async (p: EcProduct) => {
    setEditId(p.id); setForm(p); setShowVariants(p.product_type === 'variable'); setShowForm(true);
    try { setVariants(await ecommerce.listVariants(p.id)); } catch { setVariants([]); }
  };

  const save = async () => {
    if (!form.name.trim()) return addToast('Product name is required', 'error');
    setLoading(true);
    try {
      await ecommerce.saveProduct({ ...form, price: Number(form.price || 0), stock: Number(form.stock || 0) });
      const pid = editId || form.id;
      if (form.product_type === 'variable' && pid) {
        for (const v of variants) {
          await ecommerce.saveVariant({ ...v, product_id: pid, price: Number(v.price || 0), stock: Number(v.stock || 0) });
        }
      }
      addToast(editId ? 'Product updated' : 'Product created', 'success');
      setShowForm(false); await load();
    } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); }
  };

  // Opens the delete confirmation modal for a product.
  const requestDelete = (p: EcProduct) => {
    setDeleteTarget(p);
  };

  // Performs the delete after the admin confirms in the modal.
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await ecommerce.deleteProduct(deleteTarget.id); // also deletes variants
      addToast('Product deleted', 'success');
      setDeleteTarget(null); // close modal on success
      await load();
    } catch (e: any) {
      addToast(e?.message || 'Failed to delete product', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products by name or SKU..." className="pl-9 pr-3 py-2 w-full border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={`${inputCls} py-2`}>
            <option value="">All Types</option>
            <option value="simple">Simple</option>
            <option value="variable">Variable</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${inputCls} py-2`}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={load} disabled={loading} title="Refresh" className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl disabled:opacity-40 transition-colors"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <button onClick={openNew} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm whitespace-nowrap"><Plus className="w-4 h-4 shrink-0" /> Add Product</button>
          <button onClick={() => setShowImport(true)} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap"><FileSpreadsheet className="w-4 h-4 shrink-0" /> Import CSV</button>
        </div>
      </div>
      <ProductCsvImport
        open={showImport}
        onClose={() => setShowImport(false)}
        categories={categories}
        brands={brands}
        existingProducts={importCheckProducts}
        addToast={addToast}
        onImported={() => { setShowImport(false); setImportCheckProducts([]); load(); }}
      />
      <FormDrawer
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? 'Edit Product' : 'New Product'}
        subtitle={editId ? 'Update product details, pricing and inventory' : 'Create a new product with variants if needed'}
        saving={loading}
        error={error}
        width="2xl"
        footer={
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} disabled={loading} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50">Cancel</button>
            <button type="button" onClick={save} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-50">
              {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> {editId ? 'Update Product' : 'Save Product'}</>}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product Name *" className={inputCls} />
          <input value={form.sku || ''} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="SKU" className={inputCls} />
          <select value={form.product_type} onChange={e => { setForm({ ...form, product_type: e.target.value as EcProductType }); setShowVariants(e.target.value === 'variable'); }} className={inputCls}>
            <option value="simple">Simple Product</option><option value="variable">Variable Product</option>
          </select>
          <select value={form.category_id || ''} onChange={e => setForm({ ...form, category_id: e.target.value })} className={inputCls}>
            <option value="">Select Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.brand_id || ''} onChange={e => setForm({ ...form, brand_id: e.target.value })} className={inputCls}>
            <option value="">Select Brand</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input value={form.slug || ''} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="Slug" className={inputCls} />
          <div className="flex items-center gap-2">
            <input type="number" value={form.price || 0} onChange={e => setForm({ ...form, price: Number(e.target.value) })} placeholder="Price" className={inputCls} />
            <button type="button" className={`ml-auto flex items-center gap-1 text-xs font-bold ${form.featured ? 'text-amber-500' : 'text-slate-400'}`} onClick={() => setForm({ ...form, featured: !form.featured })}><Star className={`w-4 h-4 ${form.featured ? 'fill-amber-400 text-amber-400' : ''}`} /> Featured</button>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" value={form.sale_price ?? ''} onChange={e => setForm({ ...form, sale_price: e.target.value ? Number(e.target.value) : null })} placeholder="Sale Price" className={inputCls} />
            <label className="flex items-center gap-1 text-xs text-slate-600 whitespace-nowrap"><input type="checkbox" checked={form.is_active !== false} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-3.5 h-3.5 accent-indigo-500" /> Active</label>
          </div>
          {form.product_type === 'simple' && (
            <input type="number" value={form.stock || 0} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} placeholder="Stock" className={inputCls} />
          )}
        </div>
        <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Description" className={`${inputCls} w-full`} />
        <ImageUploader
          value={form.images || []}
          onChange={(imgs) => setForm({ ...form, images: imgs })}
          folder={`products/${editId || form.id || 'unknown'}`}
          maxFiles={12}
          label="Product Images"
          placeholder="Upload product images or drag & drop"
        />
        {showVariants && (
          <div className="border border-slate-100 rounded-xl bg-slate-50 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-indigo-500" /> Variants (SKU, price, stock, attributes, images)</h5>
              <button type="button" onClick={() => setVariants([...variants, { id: '', product_id: editId || form.id || '', sku: '', price: 0, sale_price: null, stock: 0, attributes: {}, image: '', images: [], is_active: true }])} className="flex items-center gap-1 text-[11px] font-bold text-indigo-600"><Plus className="w-3.5 h-3.5" /> Add Variant</button>
            </div>
            {variants.length === 0 && <p className="text-[11px] text-slate-400">No variants yet — add at least one for a variable product.</p>}
            {variants.map((v, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 items-end">
                  <input value={v.sku || ''} onChange={e => { const vv = [...variants]; vv[i] = { ...vv[i], sku: e.target.value }; setVariants(vv); }} placeholder="SKU" className={`${inputCls} col-span-2`} />
                  <input type="number" value={v.price || 0} onChange={e => { const vv = [...variants]; vv[i] = { ...vv[i], price: Number(e.target.value) }; setVariants(vv); }} placeholder="Price" className={`${inputCls} col-span-2 md:col-span-1`} />
                  <input type="number" value={v.sale_price ?? ''} onChange={e => { const vv = [...variants]; vv[i] = { ...vv[i], sale_price: e.target.value ? Number(e.target.value) : null }; setVariants(vv); }} placeholder="Sale" className={`${inputCls} col-span-2 md:col-span-1`} />
                  <input type="number" value={v.stock || 0} onChange={e => { const vv = [...variants]; vv[i] = { ...vv[i], stock: Number(e.target.value) }; setVariants(vv); }} placeholder="Stock" className={`${inputCls} col-span-2 md:col-span-1`} />
                  <button type="button" onClick={() => setVariants(variants.filter((_, x) => x !== i))} className="col-span-2 md:col-span-1 text-red-500 hover:text-red-700 font-bold text-[11px] flex items-center justify-center gap-1"><Trash2 className="w-4 h-4" /> Remove</button>
                </div>
                <VariantAttributesEditor
                  value={v.attributes || {}}
                  onChange={(attrs) => { const vv = [...variants]; vv[i] = { ...vv[i], attributes: attrs }; setVariants(vv); }}
                />
                <ImageUploader
                  value={(v.images && v.images.length ? v.images : (v.image ? [v.image] : []))}
                  onChange={(imgs) => {
                    const vv = [...variants];
                    vv[i] = { ...vv[i], images: imgs, image: imgs[0] || '' };
                    setVariants(vv);
                  }}
                  folder={`variants/${editId || form.id || 'unknown'}`}
                  maxFiles={8}
                  label={`Variant #${i + 1} Images`}
                  placeholder="Upload variant images or drag & drop"
                />
              </div>
            ))}
          </div>
        )}
      </FormDrawer>
<div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto">
        {error ? (
          <div className="p-10 text-center text-xs text-red-500 flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            <span className="font-bold">{error}</span>
            <button onClick={load} className="mt-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors">Try again</button>
          </div>
        ) : loading && !products.length ? (
          <div className="p-10 text-center text-slate-400 text-xs"><RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />Loading products...</div>
        ) : !loading && products.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-2">
            <Package className="w-8 h-8 text-slate-200" />
            <p className="text-slate-400 text-xs font-bold">{searchQuery || statusFilter || typeFilter ? 'No products match your filters.' : 'No products yet.'}</p>
            <p className="text-slate-300 text-[11px]">Add a product or import via CSV to get started.</p>
          </div>
        ) : (
          <>
          <table className={`w-full text-xs transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="text-left p-3 font-bold">Product</th>
                <th className="text-left p-3 font-bold">Type</th>
                <th className="text-left p-3 font-bold">Category</th>
                <th className="text-right p-3 font-bold">Price</th>
                <th className="text-right p-3 font-bold">Stock</th>
                <th className="text-left p-3 font-bold">Status</th>
                <th className="text-right p-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <img src={p.images?.[0] || 'https://placehold.co/40x40?text=No+Img'} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100" onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=No+Img'; }} />
                      <div>
                        <div className="font-bold text-slate-900 max-w-[200px] truncate">{p.name}</div>
                        <div className="text-slate-400 text-[10px] font-mono">{p.sku || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${p.product_type === 'variable' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'}`}>{p.product_type}</span></td>
                  <td className="p-3 text-slate-600">{categories.find(c => c.id === p.category_id)?.name || p.category_name || '—'}</td>
                  <td className="p-3 text-right font-bold text-slate-900">₹{Number(p.sale_price ?? p.price).toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right text-slate-600">{p.stock}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${p.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{p.is_active !== false ? 'Active' : 'Inactive'}</span></td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => requestDelete(p)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} disabled={loading} />
          </>
        )}
      </div>
      <ProductDeleteModal
        product={deleteTarget}
        deleting={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};
/* ==================== CATEGORIES PANEL ==================== */
const CategoriesPanel: React.FC<{ addToast: Props['addToast']; setError: (s: string | null) => void }> = ({ addToast, setError }) => {
  const [cats, setCats] = useState<EcCategory[]>([]);
  const [allCats, setAllCats] = useState<EcCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [edit, setEdit] = useState<EcCategory | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setErrorState(null);
    try {
      const res = await ecommerce.listCategoriesPaged({ page, perPage, search: searchQuery });
      setCats(res.rows); setTotal(res.total);
      if (res.rows.length === 0 && res.total > 0 && page > 1) setPage(1);
    } catch (e: any) { setErrorState(e?.message || 'Failed to load categories'); setError(e?.message || null); }
    finally { setLoading(false); }
  }, [setError, searchQuery, page, perPage]);
  useEffect(() => { load(); }, [load]);
  // Full list for the parent-category dropdown (small reference data).
  useEffect(() => { ecommerce.listCategories().then(setAllCats).catch(() => { /* non-fatal */ }); }, []);
  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const save = async () => {
    if (!edit?.name?.trim()) return addToast('Category name required', 'error');
    setLoading(true);
    try { await ecommerce.saveCategory(edit); addToast(edit.id ? 'Category updated' : 'Category created', 'success'); setEdit(null); ecommerce.listCategories().then(setAllCats).catch(() => {}); await load(); }
    catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); }
  };
  const remove = async (id: string) => { if (!window.confirm('Delete category?')) return; setLoading(true); try { await ecommerce.deleteCategory(id); addToast('Deleted', 'success'); await load(); } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); } };
  const parents = allCats.filter(c => !c.parent_id);
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories..." className="pl-9 pr-3 py-2 w-full border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <button onClick={load} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl disabled:opacity-40 transition-colors shrink-0" disabled={loading}><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        <button onClick={() => setEdit({ id: '', name: '', parent_id: null })} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 shadow-sm shrink-0"><Plus className="w-4 h-4" /> Add Category</button>
      </div>
      <FormDrawer
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit Category' : 'New Category'}
        subtitle={edit?.id ? 'Update category name, slug and parent' : 'Create a new product category'}
        saving={loading}
        error={error}
        width="md"
        footer={
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={() => setEdit(null)} disabled={loading} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50">Cancel</button>
            <button type="button" onClick={save} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-50">
              {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Category</>}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={edit?.name || ''} onChange={e => setEdit(edit ? { ...edit, name: e.target.value } : null)} placeholder="Name *" className={inputCls} />
          <select value={edit?.parent_id || ''} onChange={e => setEdit(edit ? { ...edit, parent_id: e.target.value || null } : null)} className={inputCls}><option value="">— Top level —</option>{parents.filter(c => c.id !== edit?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input value={edit?.slug || ''} onChange={e => setEdit(edit ? { ...edit, slug: e.target.value } : null)} placeholder="Slug" className={inputCls} />
          <input value={edit?.image || ''} onChange={e => setEdit(edit ? { ...edit, image: e.target.value } : null)} placeholder="Image URL" className={inputCls} />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={edit?.is_active !== false} onChange={e => setEdit(edit ? { ...edit, is_active: e.target.checked } : null)} className="w-3.5 h-3.5 accent-indigo-500" /> Active</label>
      </FormDrawer>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto">
        {error ? (
          <div className="p-10 text-center text-xs text-red-500 flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6" /><span className="font-bold">{error}</span>
            <button onClick={load} className="mt-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors">Try again</button>
          </div>
        ) : loading && !cats.length ? (
          <div className="p-10 text-center text-slate-400 text-xs"><RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />Loading categories...</div>
        ) : !loading && cats.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-2">
            <Tags className="w-8 h-8 text-slate-200" />
            <p className="text-slate-400 text-xs font-bold">{searchQuery ? 'No categories match your search.' : 'No categories yet.'}</p>
          </div>
        ) : (
          <>
          <table className={`w-full text-xs transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100"><tr><th className="text-left p-3 font-bold">Name</th><th className="text-left p-3 font-bold">Parent</th><th className="text-left p-3 font-bold">Status</th><th className="text-right p-3 font-bold">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {cats.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/60">
                <td className="p-3 font-bold text-slate-900">{c.name}</td>
                <td className="p-3 text-slate-600">{c.parent_id ? (allCats.find(p => p.id === c.parent_id)?.name || '—') : <span className="text-slate-400">Top level</span>}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${c.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{c.is_active !== false ? 'Active' : 'Inactive'}</span></td>
                <td className="p-3"><div className="flex justify-end gap-1.5"><button onClick={() => setEdit(c)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => remove(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} disabled={loading} />
          </>
        )}
      </div>
    </div>
  );
};
/* ==================== BRANDS PANEL ==================== */
const BrandsPanel: React.FC<{ addToast: Props['addToast']; setError: (s: string | null) => void }> = ({ addToast, setError }) => {
  const [brands, setBrands] = useState<EcBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [edit, setEdit] = useState<EcBrand | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setErrorState(null);
    try {
      const res = await ecommerce.listBrandsPaged({ page, perPage, search: searchQuery });
      setBrands(res.rows); setTotal(res.total);
      if (res.rows.length === 0 && res.total > 0 && page > 1) setPage(1);
    } catch (e: any) { setErrorState(e?.message || 'Failed to load brands'); setError(e?.message || null); }
    finally { setLoading(false); }
  }, [setError, searchQuery, page, perPage]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);
  const save = async () => {
    if (!edit?.name?.trim()) return addToast('Brand name required', 'error');
    setLoading(true);
    try { await ecommerce.saveBrand(edit); addToast('Brand saved', 'success'); setEdit(null); await load(); } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); }
  };
  const remove = async (id: string) => { if (!window.confirm('Delete brand?')) return; setLoading(true); try { await ecommerce.deleteBrand(id); addToast('Deleted', 'success'); await load(); } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); } };
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brands..." className="pl-9 pr-3 py-2 w-full border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <button onClick={load} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl disabled:opacity-40 transition-colors shrink-0" disabled={loading}><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        <button onClick={() => setEdit({ id: '', name: '' })} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 shadow-sm shrink-0"><Plus className="w-4 h-4" /> Add Brand</button>
      </div>
      <FormDrawer
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit Brand' : 'New Brand'}
        subtitle={edit?.id ? 'Update brand details and media' : 'Add a new brand to the catalog'}
        saving={loading}
        error={error}
        width="md"
        footer={
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={() => setEdit(null)} disabled={loading} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50">Cancel</button>
            <button type="button" onClick={save} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-50">
              {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Brand</>}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={edit?.name || ''} onChange={e => setEdit(edit ? { ...edit, name: e.target.value } : null)} placeholder="Name *" className={inputCls} />
          <input value={edit?.logo || ''} onChange={e => setEdit(edit ? { ...edit, logo: e.target.value } : null)} placeholder="Logo URL" className={inputCls} />
          <input value={edit?.slug || ''} onChange={e => setEdit(edit ? { ...edit, slug: e.target.value } : null)} placeholder="Slug" className={inputCls} />
          <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={edit?.is_active !== false} onChange={e => setEdit(edit ? { ...edit, is_active: e.target.checked } : null)} className="w-3.5 h-3.5 accent-indigo-500" /> Active</label>
          <input value={edit?.description || ''} onChange={e => setEdit(edit ? { ...edit, description: e.target.value } : null)} placeholder="Description" className={`${inputCls} sm:col-span-2`} />
        </div>
      </FormDrawer>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto">
        {error ? (
          <div className="p-10 text-center text-xs text-red-500 flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6" /><span className="font-bold">{error}</span>
            <button onClick={load} className="mt-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors">Try again</button>
          </div>
        ) : loading && !brands.length ? (
          <div className="p-10 text-center text-slate-400 text-xs"><RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />Loading brands...</div>
        ) : !loading && brands.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-2">
            <Award className="w-8 h-8 text-slate-200" />
            <p className="text-slate-400 text-xs font-bold">{searchQuery ? 'No brands match your search.' : 'No brands yet.'}</p>
          </div>
        ) : (
          <>
          <table className={`w-full text-xs transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100"><tr><th className="text-left p-3 font-bold">Brand</th><th className="text-left p-3 font-bold">Status</th><th className="text-right p-3 font-bold">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {brands.map(b => (
              <tr key={b.id} className="hover:bg-slate-50/60">
                <td className="p-3"><div className="flex items-center gap-2"><img src={b.logo || 'https://placehold.co/24x24'} alt="" className="w-6 h-6 rounded-full object-contain bg-slate-100" onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/24x24'; }} /><span className="font-bold text-slate-900">{b.name}</span></div></td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${b.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{b.is_active !== false ? 'Active' : 'Inactive'}</span></td>
                <td className="p-3"><div className="flex justify-end gap-1.5"><button onClick={() => setEdit(b)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => remove(b.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} disabled={loading} />
          </>
        )}
      </div>
    </div>
  );
};
/* ==================== ORDERS PANEL ==================== */
const ORDER_STATUSES: EcOrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const statusColor: Record<EcOrderStatus, string> = { pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-sky-100 text-sky-700', shipped: 'bg-indigo-100 text-indigo-700', delivered: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700' };

const OrdersPanel: React.FC<{ addToast: Props['addToast']; setError: (s: string | null) => void }> = ({ addToast, setError }) => {
  const [orders, setOrders] = useState<EcOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState<string | null>(null);
  const [selected, setSelected] = useState<EcOrder | null>(null);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [payFilter, setPayFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setErrorState(null);
    try {
      const res = await ecommerce.listOrdersPaged({
        page, perPage, search: searchQuery,
        status: statusFilter || undefined, payment_status: payFilter || undefined,
        orderBy: 'created_at', orderDir: 'desc',
      });
      setOrders(res.rows); setTotal(res.total);
      if (res.rows.length === 0 && res.total > 0 && page > 1) setPage(1);
    } catch (e: any) { setErrorState(e?.message || 'Failed to load orders'); setError(e?.message || null); }
    finally { setLoading(false); }
  }, [setError, searchQuery, statusFilter, payFilter, page, perPage]);
  useEffect(() => { load(); }, [load]);

  // Debounce search + reset page on filter changes.
  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { setPage(1); }, [statusFilter, payFilter, perPage]);

  const openDetail = async (id: string) => { try { setSelected(await ecommerce.getOrder(id)); } catch (e: any) { setError(e.message); } };

  const updateOrder = async (patch: Partial<EcOrder>) => {
    if (!selected) return;
    setSaving(true);
    try {
      await ecommerce.saveOrder({ ...selected, ...patch });
      setSelected(await ecommerce.getOrder(selected.id)); addToast('Order updated', 'success'); await load();
    } catch (e: any) { addToast(e.message, 'error'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order # / customer..." className="pl-9 pr-3 py-2 w-full border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${inputCls} py-2`}>
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={payFilter} onChange={e => setPayFilter(e.target.value)} className={`${inputCls} py-2`}>
            <option value="">All Payments</option>
            {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto">
        {error ? (
          <div className="p-10 text-center text-xs text-red-500 flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6" /><span className="font-bold">{error}</span>
            <button onClick={load} className="mt-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors">Try again</button>
          </div>
        ) : loading && !orders.length ? (
          <div className="p-10 text-center text-slate-400 text-xs"><RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />Loading orders...</div>
        ) : !loading && orders.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-slate-200" />
            <p className="text-slate-400 text-xs font-bold">{searchQuery || statusFilter || payFilter ? 'No orders match your filters.' : 'No orders yet.'}</p>
          </div>
        ) : (
          <>
          <table className={`w-full text-xs transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
            <tr><th className="text-left p-3 font-bold">Order</th><th className="text-left p-3 font-bold">Customer</th><th className="text-left p-3 font-bold">Status</th><th className="text-left p-3 font-bold">Payment</th><th className="text-right p-3 font-bold">Total</th><th className="text-left p-3 font-bold">Date</th><th className="text-right p-3 font-bold">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map(o => (
              <tr key={o.id} className="hover:bg-slate-50/60">
                <td className="p-3 font-mono font-bold text-indigo-600">{o.order_number}</td>
                <td className="p-3"><div className="font-bold text-slate-900">{o.customer_name}</div><div className="text-slate-400 text-[10px]">{o.customer_email}</div></td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${statusColor[o.status] || 'bg-slate-100 text-slate-600'}`}>{o.status}</span></td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${o.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : o.payment_status === 'failed' || o.payment_status === 'refunded' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{o.payment_status}</span></td>
                <td className="p-3 text-right font-bold text-slate-900">₹{Number(o.total || 0).toLocaleString('en-IN')}</td>
                <td className="p-3 text-slate-500">{o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : '—'}</td>
                <td className="p-3"><div className="flex justify-end gap-1.5"><button onClick={() => openDetail(o.id)} className="px-2.5 py-1.5 bg-indigo-500 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-600"><Eye className="w-3.5 h-3.5" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} disabled={loading} />
          </>
        )}
      </div>
      <FormDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Order ${selected.order_number}` : 'Order Details'}
        subtitle={selected?.created_at ? new Date(selected.created_at).toLocaleString('en-IN') : ''}
        saving={saving}
        error={error}
        width="xl"
        footer={
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={() => setSelected(null)} disabled={saving} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50">Close</button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-1">
                <p className="font-extrabold text-slate-700 uppercase tracking-wide text-[10px]">Customer</p>
                <p className="font-bold text-slate-900">{selected.customer_name}</p>
                <p className="text-slate-500">{selected.customer_email}</p>
                <p className="text-slate-500">{selected.customer_phone}</p>
                <div className="pt-1 text-slate-600">{selected.address?.line1}{selected.address?.line2 ? `, ${selected.address.line2}` : ''}<br />{selected.address?.city}{selected.address?.state ? `, ${selected.address.state}` : ''} - {selected.address?.pincode}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2">
                <p className="font-extrabold text-slate-700 uppercase tracking-wide text-[10px]">Fulfilment</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-slate-500 self-center">Order Status</label>
                  <select value={selected.status} onChange={e => updateOrder({ status: e.target.value as EcOrderStatus })} className={`${inputCls} !py-1`}>{ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                  <label className="text-slate-500 self-center">Payment Status</label>
                  <select value={selected.payment_status} onChange={e => updateOrder({ payment_status: e.target.value as any })} className={`${inputCls} !py-1`}>{PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                  <label className="text-slate-500 self-center">Payment</label><span className="text-slate-700 font-bold self-center">{selected.payment_method || '—'}</span>
                  <label className="text-slate-500 self-center">Shipping</label><span className="text-slate-700 font-bold self-center">{selected.shipping_method || '—'}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <p className="font-extrabold text-slate-700 uppercase tracking-wide text-[10px]">Tracking / Shipment</p>
                  <input value={selected.tracking_number || ''} onChange={e => updateOrder({ tracking_number: e.target.value })} placeholder="Tracking number" className={`${inputCls} w-full`} />
                  <input value={selected.tracking_company || ''} onChange={e => updateOrder({ tracking_company: e.target.value })} placeholder="Courier / tracking company" className={`${inputCls} w-full`} />
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100"><tr><th className="text-left p-3 font-bold">Item</th><th className="text-left p-3 font-bold">SKU</th><th className="text-right p-3 font-bold">Qty</th><th className="text-right p-3 font-bold">Price</th><th className="text-right p-3 font-bold">Total</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {(selected.items || []).map((it, i) => (
                    <tr key={i}>
                      <td className="p-3"><div className="flex items-center gap-2"><img src={it.image || 'https://placehold.co/32x32'} alt="" className="w-8 h-8 rounded-lg object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/32x32'; }} /><span className="font-bold text-slate-900">{it.product_name}</span></div></td>
                      <td className="p-3 text-slate-500 font-mono">{it.sku || '—'}</td>
                      <td className="p-3 text-right text-slate-700">{it.quantity}</td>
                      <td className="p-3 text-right text-slate-600">₹{Number(it.unit_price).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-slate-900">₹{Number(it.total).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-3 text-xs">
              <div><p className="font-bold text-slate-500">Coupon: {selected.coupon_code || '—'}</p><p className="font-bold text-slate-500">Notes: {selected.notes || '—'}</p></div>
              <div className="space-y-1 text-right w-full sm:w-64">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{Number(selected.subtotal || 0).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-slate-600"><span>Discount</span><span>-₹{Number(selected.discount || 0).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-slate-600"><span>Shipping</span><span>+₹{Number(selected.shipping_charge || 0).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-1"><span>Total</span><span>₹{Number(selected.total || 0).toLocaleString('en-IN')}</span></div>
              </div>
            </div>
          </div>
        )}
      </FormDrawer>
    </div>
  );
};
/* ==================== COUPONS PANEL ==================== */
const CouponsPanel: React.FC<{ addToast: Props['addToast']; setError: (s: string | null) => void }> = ({ addToast, setError }) => {
  const [coupons, setCoupons] = useState<EcCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [edit, setEdit] = useState<EcCoupon | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setErrorState(null);
    try {
      const res = await ecommerce.listCouponsPaged({ page, perPage, search: searchQuery });
      setCoupons(res.rows); setTotal(res.total);
      if (res.rows.length === 0 && res.total > 0 && page > 1) setPage(1);
    } catch (e: any) { setErrorState(e?.message || 'Failed to load coupons'); setError(e?.message || null); }
    finally { setLoading(false); }
  }, [setError, searchQuery, page, perPage]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);
  const save = async () => {
    if (!edit?.code?.trim()) return addToast('Coupon code required', 'error');
    setLoading(true);
    try { await ecommerce.saveCoupon(edit); addToast('Coupon saved', 'success'); setEdit(null); await load(); } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); }
  };
  const remove = async (id: string) => { if (!window.confirm('Delete coupon?')) return; setLoading(true); try { await ecommerce.deleteCoupon(id); addToast('Deleted', 'success'); await load(); } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); } };
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search coupons by code..." className="pl-9 pr-3 py-2 w-full border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <button onClick={load} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl disabled:opacity-40 transition-colors shrink-0" disabled={loading}><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        <button onClick={() => setEdit({ id: '', code: '', type: 'percent', value: 0, min_order: 0, is_active: true })} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 shadow-sm shrink-0"><Plus className="w-4 h-4" /> Add Coupon</button>
      </div>
      <FormDrawer
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit Coupon' : 'New Coupon'}
        subtitle={edit?.id ? 'Update coupon rules and limits' : 'Create a new discount coupon'}
        saving={loading}
        error={error}
        width="lg"
        footer={
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={() => setEdit(null)} disabled={loading} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50">Cancel</button>
            <button type="button" onClick={save} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-50">
              {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Coupon</>}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <input value={edit?.code || ''} onChange={e => setEdit(edit ? { ...edit, code: e.target.value.toUpperCase() } : null)} placeholder="Code e.g. SAVE10" className={inputCls} />
          <select value={edit?.type || 'percent'} onChange={e => setEdit(edit ? { ...edit, type: e.target.value as 'percent' | 'fixed' } : null)} className={inputCls}><option value="percent">Percent (%)</option><option value="fixed">Fixed (₹)</option></select>
          <input type="number" value={edit?.value || 0} onChange={e => setEdit(edit ? { ...edit, value: Number(e.target.value) } : null)} placeholder="Value" className={inputCls} />
          <input type="number" value={edit?.min_order || 0} onChange={e => setEdit(edit ? { ...edit, min_order: Number(e.target.value) } : null)} placeholder="Min order (₹)" className={inputCls} />
          <input type="number" value={edit?.max_discount || ''} onChange={e => setEdit(edit ? { ...edit, max_discount: e.target.value ? Number(e.target.value) : null } : null)} placeholder="Max discount (₹)" className={inputCls} />
          <input type="number" value={edit?.usage_limit || 0} onChange={e => setEdit(edit ? { ...edit, usage_limit: Number(e.target.value) } : null)} placeholder="Usage limit" className={inputCls} />
          <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={edit?.is_active !== false} onChange={e => setEdit(edit ? { ...edit, is_active: e.target.checked } : null)} className="w-3.5 h-3.5 accent-indigo-500" /> Active</label>
        </div>
      </FormDrawer>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto">
        {error ? (
          <div className="p-10 text-center text-xs text-red-500 flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6" /><span className="font-bold">{error}</span>
            <button onClick={load} className="mt-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors">Try again</button>
          </div>
        ) : loading && !coupons.length ? (
          <div className="p-10 text-center text-slate-400 text-xs"><RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />Loading coupons...</div>
        ) : !loading && coupons.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-2">
            <Tag className="w-8 h-8 text-slate-200" />
            <p className="text-slate-400 text-xs font-bold">{searchQuery ? 'No coupons match your search.' : 'No coupons yet.'}</p>
          </div>
        ) : (
          <>
          <table className={`w-full text-xs transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100"><tr><th className="text-left p-3 font-bold">Code</th><th className="text-left p-3 font-bold">Type</th><th className="text-right p-3 font-bold">Value</th><th className="text-right p-3 font-bold">Min Order</th><th className="text-right p-3 font-bold">Used / Limit</th><th className="text-left p-3 font-bold">Status</th><th className="text-right p-3 font-bold">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {coupons.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/60">
                <td className="p-3 font-mono font-bold text-indigo-600">{c.code}</td>
                <td className="p-3 text-slate-600 capitalize">{c.type}</td>
                <td className="p-3 text-right font-bold text-slate-900">{c.type === 'percent' ? `${c.value}%` : `₹${c.value}`}</td>
                <td className="p-3 text-right text-slate-600">₹{c.min_order || 0}</td>
                <td className="p-3 text-right text-slate-600">{c.used || 0} / {c.usage_limit || '∞'}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${c.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{c.is_active !== false ? 'Active' : 'Inactive'}</span></td>
                <td className="p-3"><div className="flex justify-end gap-1.5"><button onClick={() => setEdit(c)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => remove(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} disabled={loading} />
          </>
        )}
      </div>
    </div>
  );
};
/* ==================== PAYMENTS PANEL ==================== */
const PaymentsPanel: React.FC<{ addToast: Props['addToast']; setError: (s: string | null) => void }> = ({ addToast, setError }) => {
  const [methods, setMethods] = useState<EcPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [edit, setEdit] = useState<EcPaymentMethod | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setErrorState(null);
    try {
      const res = await ecommerce.listPaymentMethodsPaged({ page, perPage });
      setMethods(res.rows); setTotal(res.total);
      if (res.rows.length === 0 && res.total > 0 && page > 1) setPage(1);
    } catch (e: any) { setErrorState(e?.message || 'Failed to load payment methods'); setError(e?.message || null); }
    finally { setLoading(false); }
  }, [setError, page, perPage]);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    if (!edit?.name?.trim()) return addToast('Name required', 'error');
    setLoading(true);
    try { await ecommerce.savePaymentMethod(edit); addToast('Payment method saved', 'success'); setEdit(null); await load(); } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); }
  };
  const toggle = async (m: EcPaymentMethod) => { try { await ecommerce.savePaymentMethod({ ...m, enabled: !(m.enabled !== false) }); await load(); } catch (e: any) { addToast(e.message, 'error'); } };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-extrabold text-slate-900">Payment Methods &amp; Configuration</h4>
        <button onClick={() => setEdit({ id: '', name: '', enabled: true })} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 shadow-sm"><Plus className="w-4 h-4" /> Add Method</button>
      </div>
      <FormDrawer
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit Payment Method' : 'New Payment Method'}
        subtitle={edit?.id ? 'Update payment method configuration' : 'Add a new payment option'}
        saving={loading}
        error={error}
        width="sm"
        footer={
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={() => setEdit(null)} disabled={loading} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50">Cancel</button>
            <button type="button" onClick={save} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-50">
              {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Method</>}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <input value={edit?.name || ''} onChange={e => setEdit(edit ? { ...edit, name: e.target.value } : null)} placeholder="Method name (e.g. UPI)" className={`${inputCls} w-full`} />
          <input type="number" value={edit?.sort_order || 0} onChange={e => setEdit(edit ? { ...edit, sort_order: Number(e.target.value) } : null)} placeholder="Sort order" className={`${inputCls} w-full`} />
          <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={edit?.enabled !== false} onChange={e => setEdit(edit ? { ...edit, enabled: e.target.checked } : null)} className="w-3.5 h-3.5 accent-indigo-500" /> Enabled</label>
        </div>
      </FormDrawer>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto">
        {error ? (
          <div className="p-10 text-center text-xs text-red-500 flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6" /><span className="font-bold">{error}</span>
            <button onClick={load} className="mt-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors">Try again</button>
          </div>
        ) : loading && !methods.length ? (
          <div className="p-10 text-center text-slate-400 text-xs"><RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />Loading payment methods...</div>
        ) : !loading && methods.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-2">
            <CreditCard className="w-8 h-8 text-slate-200" />
            <p className="text-slate-400 text-xs font-bold">No payment methods configured.</p>
          </div>
        ) : (
          <>
          <table className={`w-full text-xs transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100"><tr><th className="text-left p-3 font-bold">Method</th><th className="text-left p-3 font-bold">Status</th><th className="text-right p-3 font-bold">Sort Order</th><th className="text-right p-3 font-bold">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {methods.map(m => (
              <tr key={m.id} className="hover:bg-slate-50/60">
                <td className="p-3 font-bold text-slate-900">{m.name}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${m.enabled !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{m.enabled !== false ? 'Enabled' : 'Disabled'}</span></td>
                <td className="p-3 text-right text-slate-600">{m.sort_order}</td>
                <td className="p-3"><div className="flex justify-end gap-1.5"><button onClick={() => setEdit(m)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => toggle(m)} className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">{m.enabled !== false ? 'Disable' : 'Enable'}</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} disabled={loading} />
          </>
        )}
      </div>
    </div>
  );
};
/* ==================== SHIPPING PANEL ==================== */
const ShippingPanel: React.FC<{ addToast: Props['addToast']; setError: (s: string | null) => void }> = ({ addToast, setError }) => {
  const [methods, setMethods] = useState<EcShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [edit, setEdit] = useState<EcShippingMethod | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setErrorState(null);
    try {
      const res = await ecommerce.listShippingMethodsPaged({ page, perPage });
      setMethods(res.rows); setTotal(res.total);
      if (res.rows.length === 0 && res.total > 0 && page > 1) setPage(1);
    } catch (e: any) { setErrorState(e?.message || 'Failed to load shipping methods'); setError(e?.message || null); }
    finally { setLoading(false); }
  }, [setError, page, perPage]);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    if (!edit?.name?.trim()) return addToast('Name required', 'error');
    setLoading(true);
    try { await ecommerce.saveShippingMethod(edit); addToast('Shipping method saved', 'success'); setEdit(null); await load(); } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); }
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-extrabold text-slate-900">Shipping Methods, Charges &amp; Delivery</h4>
        <button onClick={() => setEdit({ id: '', name: '', charge: 0, min_order_free: 0, enabled: true })} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 shadow-sm"><Plus className="w-4 h-4" /> Add Method</button>
      </div>
      <FormDrawer
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit Shipping Method' : 'New Shipping Method'}
        subtitle={edit?.id ? 'Update charges, free shipping threshold and delivery estimate' : 'Add a new shipping method'}
        saving={loading}
        error={error}
        width="lg"
        footer={
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={() => setEdit(null)} disabled={loading} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50">Cancel</button>
            <button type="button" onClick={save} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-50">
              {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Method</>}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <input value={edit?.name || ''} onChange={e => setEdit(edit ? { ...edit, name: e.target.value } : null)} placeholder="Name (e.g. Express)" className={inputCls} />
          <input type="number" value={edit?.charge || 0} onChange={e => setEdit(edit ? { ...edit, charge: Number(e.target.value) } : null)} placeholder="Charge (₹)" className={inputCls} />
          <input type="number" value={edit?.min_order_free || 0} onChange={e => setEdit(edit ? { ...edit, min_order_free: Number(e.target.value) } : null)} placeholder="Free above (₹)" className={inputCls} />
          <input value={edit?.estimated_days || ''} onChange={e => setEdit(edit ? { ...edit, estimated_days: e.target.value } : null)} placeholder="Est. days (e.g. 3-5 days)" className={inputCls} />
          <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={edit?.enabled !== false} onChange={e => setEdit(edit ? { ...edit, enabled: e.target.checked } : null)} className="w-3.5 h-3.5 accent-indigo-500" /> Enabled</label>
        </div>
      </FormDrawer>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto">
        {error ? (
          <div className="p-10 text-center text-xs text-red-500 flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6" /><span className="font-bold">{error}</span>
            <button onClick={load} className="mt-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors">Try again</button>
          </div>
        ) : loading && !methods.length ? (
          <div className="p-10 text-center text-slate-400 text-xs"><RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />Loading shipping methods...</div>
        ) : !loading && methods.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-2">
            <Truck className="w-8 h-8 text-slate-200" />
            <p className="text-slate-400 text-xs font-bold">No shipping methods configured.</p>
          </div>
        ) : (
          <>
          <table className={`w-full text-xs transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100"><tr><th className="text-left p-3 font-bold">Method</th><th className="text-right p-3 font-bold">Charge</th><th className="text-right p-3 font-bold">Free Above</th><th className="text-left p-3 font-bold">Est. Delivery</th><th className="text-left p-3 font-bold">Status</th><th className="text-right p-3 font-bold">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {methods.map(m => (
              <tr key={m.id} className="hover:bg-slate-50/60">
                <td className="p-3 font-bold text-slate-900">{m.name}</td>
                <td className="p-3 text-right font-bold text-slate-900">₹{Math.round(m.charge)}</td>
                <td className="p-3 text-right text-slate-600">₹{Math.round(m.min_order_free || 0)}</td>
                <td className="p-3 text-slate-600">{m.estimated_days || '—'}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${m.enabled !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{m.enabled !== false ? 'Active' : 'Disabled'}</span></td>
                <td className="p-3"><div className="flex justify-end gap-1.5"><button onClick={() => setEdit(m)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} disabled={loading} />
          </>
        )}
      </div>
    </div>
  );
};
/* ==================== SETTINGS PANEL ==================== */
const SettingsPanel: React.FC<{ addToast: Props['addToast'] }> = ({ addToast }) => {
  const [stats, setStats] = useState({ products: 0, variants: 0, categories: 0, brands: 0, coupons: 0, orders: 0, payments: 0, shipping: 0 });
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, v, c, b, co, o, pa, s] = await Promise.all([
        ecommerce.listProducts(), ecommerce.listVariants(), ecommerce.listCategories(), ecommerce.listBrands(),
        ecommerce.listCoupons(), ecommerce.listOrders(), ecommerce.listPaymentMethods(), ecommerce.listShippingMethods(),
      ]);
      setStats({ products: p.filter(x => x.is_active !== false).length, variants: v.length, categories: c.length, brands: b.length, coupons: co.length, orders: o.length, payments: pa.length, shipping: s.length });
    } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); }
  }, [addToast]);
  useEffect(() => { load(); }, [load]);
  const cards = [
    { label: 'Active Products', value: stats.products, icon: <Package className="w-5 h-5 text-indigo-500" /> },
    { label: 'Variants', value: stats.variants, icon: <ClipboardList className="w-5 h-5 text-purple-500" /> },
    { label: 'Categories', value: stats.categories, icon: <Tags className="w-5 h-5 text-orange-500" /> },
    { label: 'Brands', value: stats.brands, icon: <Award className="w-5 h-5 text-emerald-500" /> },
    { label: 'Coupons', value: stats.coupons, icon: <Tag className="w-5 h-5 text-rose-500" /> },
    { label: 'Orders', value: stats.orders, icon: <ShoppingCart className="w-5 h-5 text-blue-500" /> },
    { label: 'Payment Methods', value: stats.payments, icon: <CreditCard className="w-5 h-5 text-cyan-500" /> },
    { label: 'Shipping Methods', value: stats.shipping, icon: <Truck className="w-5 h-5 text-slate-500" /> },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600"><Settings className="w-5 h-5" /></div>
        <div>
          <h4 className="font-extrabold text-slate-900">E-Commerce Settings &amp; Overview</h4>
          <p className="text-[11px] text-slate-500">A snapshot of your storefront configuration, inventory and fulfilment.</p>
        </div>
      </div>
      {loading ? (
        <div className="p-10 text-center text-slate-400 text-xs"><RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />Loading settings…</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {cards.map(c => (
            <div key={c.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-50">{c.icon}</div>
              <div><div className="text-2xl font-black text-slate-900">{c.value}</div><div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{c.label}</div></div>
            </div>
          ))}
        </div>
      )}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-1">
        <p className="font-bold flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> How this module maps together</p>
        <ul className="list-disc list-inside text-amber-700 space-y-0.5">
          <li><b>Admin → API → Database → User App:</b> Admin CRUD writes to Supabase tables (<code>ec_products</code>, <code>ec_variants</code>, <code>ec_categories</code>, <code>ec_brands</code>, <code>ec_attributes</code>, <code>ec_attribute_values</code>, <code>ec_coupons</code>, <code>ec_payment_methods</code>, <code>ec_shipping_methods</code>, <code>ec_orders</code>, <code>ec_order_items</code>) via the shared <code>src/db/ecommerce.ts</code> service.</li>
          <li>Simple products carry price/stock directly; Variable products manage price/stock/SKU per variant. Both can carry images (gallery per product, plus per-variant image galleries).</li>
          <li>Attributes (e.g. Size, Color) are managed in the Attributes tab, registered once and reused across products and CSV import without duplicates.</li>
          <li>Orders placed in the User App flow straight into the Admin Orders tab, where you can manage status, payment status, shipment and tracking numbers.</li>
          <li>Payment &amp; shipping methods configured here are offered during checkout in the User App.</li>
          <li>Coupons created here are validated (min order, expiry, usage) at checkout.</li>
        </ul>
      </div>
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div>
          <p className="font-extrabold text-slate-900">Demo data</p>
          <p className="text-[11px] text-slate-500">Products, variants, categories, brands, coupons, payments &amp; shipping are pre-seeded for testing.</p>
        </div>
        <button onClick={() => { navigator.clipboard?.writeText('supabase db push'); addToast('Demo data instructions - run migration', 'info'); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50">View Migration</button>
      </div>
    </div>
  );
};

/* ==================== SHOP MANAGEMENT PANEL ==================== */
const ShopPanel: React.FC<{ addToast: Props['addToast']; setError: (s: string | null) => void }> = ({ addToast, setError }) => {
  const [products, setProducts] = useState<EcProduct[]>([]);
  const [variants, setVariants] = useState<EcVariant[]>([]);
  const [categories, setCategories] = useState<EcCategory[]>([]);
  const [brands, setBrands] = useState<EcBrand[]>([]);
  const [orders, setOrders] = useState<EcOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, v, c, b, o] = await Promise.all([
        ecommerce.listProducts(),
        ecommerce.listVariants(),
        ecommerce.listCategories(),
        ecommerce.listBrands(),
        ecommerce.listOrders(),
      ]);
      setProducts(pr); setVariants(v); setCategories(c); setBrands(b); setOrders(o);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [setError]);
  useEffect(() => { load(); }, [load]);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
  const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);

  const variantsByProduct = useMemo(() => {
    const map = new Map<string, EcVariant[]>();
    for (const v of variants) { const arr = map.get(v.product_id) || []; arr.push(v); map.set(v.product_id, arr); }
    return map;
  }, [variants]);

  const effectiveStock = (p: EcProduct): number => {
    if (p.product_type === 'variable') {
      const vs = variantsByProduct.get(p.id) || [];
      return vs.reduce((acc, v) => acc + (v.stock || 0), 0);
    }
    return p.stock || 0;
  };

  const effectivePrice = (p: EcProduct): number => {
    if (p.product_type === 'variable') {
      const vs = variantsByProduct.get(p.id) || [];
      const arr = vs.map(v => v.sale_price ?? v.price).filter(Number.isFinite);
      if (arr.length) return Math.min(...arr);
    }
    return p.sale_price ?? p.price;
  };

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.is_active !== false).length;
    const inactive = total - active;
    const variable = products.filter(p => p.product_type === 'variable').length;
    const simple = total - variable;
    const outOfStock = products.filter(p => effectiveStock(p) <= 0).length;
    const lowStock = products.filter(p => { const s = effectiveStock(p); return s > 0 && s <= 10; }).length;
    const inventoryValue = products.reduce((acc, p) => acc + (effectiveStock(p) * effectivePrice(p)), 0);
    const totalOrders = orders.length;
    const revenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
    return { total, active, inactive, variable, simple, outOfStock, lowStock, inventoryValue, totalOrders, revenue };
  }, [products, variantsByProduct, orders]);

  const toggleActive = async (p: EcProduct) => {
    setSavingId(p.id);
    try {
      await ecommerce.saveProduct({ ...p, is_active: !(p.is_active !== false) });
      addToast(p.is_active !== false ? 'Product deactivated' : 'Product activated', 'success');
      await load();
    } catch (e: any) { addToast(e.message, 'error'); } finally { setSavingId(null); }
  };

  const toggleFeatured = async (p: EcProduct) => {
    setSavingId(p.id);
    try {
      await ecommerce.saveProduct({ ...p, featured: !p.featured });
      addToast(p.featured ? 'Removed from featured' : 'Marked as featured', 'success');
      await load();
    } catch (e: any) { addToast(e.message, 'error'); } finally { setSavingId(null); }
  };

  const filtered = products.filter(p => {
    const term = search.toLowerCase();
    const matchesTerm = !term || (p.name || '').toLowerCase().includes(term) || (p.sku || '').toLowerCase().includes(term);
    const matchesType = !typeFilter || p.product_type === typeFilter;
    const matchesStatus = !statusFilter ? true : statusFilter === 'active' ? p.is_active !== false : p.is_active === false;
    return matchesTerm && matchesType && matchesStatus;
  });

  const statCards = [
    { label: 'Total Products', value: stats.total, icon: <Boxes className="w-5 h-5 text-indigo-500" /> },
    { label: 'Active', value: stats.active, icon: <Check className="w-5 h-5 text-emerald-500" />, sub: `${stats.inactive} inactive` },
    { label: 'Variable', value: stats.variable, icon: <Layers className="w-5 h-5 text-purple-500" />, sub: `${stats.simple} simple` },
    { label: 'Out of Stock', value: stats.outOfStock, icon: <X className="w-5 h-5 text-red-500" />, sub: `${stats.lowStock} low stock` },
    { label: 'Inventory Value', value: `₹${stats.inventoryValue.toLocaleString('en-IN')}`, icon: <BarChart3 className="w-5 h-5 text-amber-500" /> },
    { label: 'Orders', value: stats.totalOrders, icon: <ShoppingCart className="w-5 h-5 text-blue-500" />, sub: `₹${stats.revenue.toLocaleString('en-IN')} revenue` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h4 className="font-extrabold text-slate-900 flex items-center gap-2"><Store className="w-5 h-5 text-indigo-500" /> Shop Management</h4>
          <p className="text-[11px] text-slate-500">Monitor &amp; manage storefront products, stock and status. Fully synced with the user-facing Shop.</p>
        </div>
        <a href="/shop" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 shadow-sm"><ExternalLink className="w-4 h-4" /> View Storefront</a>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(c => (
          <div key={c.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 shrink-0">{c.icon}</div>
            <div className="min-w-0">
              <div className="text-lg font-black text-slate-900 truncate">{c.value}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{c.label}</div>
              {c.sub && <div className="text-[10px] text-slate-400 truncate">{c.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Category / Brand breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h5 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-1.5"><Tags className="w-4 h-4 text-indigo-500" /> Category Breakdown</h5>
          <div className="space-y-2">
            {categories.length === 0 && <p className="text-xs text-slate-400">No categories yet.</p>}
            {categories.map(c => {
              const count = products.filter(p => p.category_id === c.id).length;
              const pct = products.length ? Math.round((count / products.length) * 100) : 0;
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="font-bold text-slate-700">{c.name}</span>
                    <span className="text-slate-500">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }}></div></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h5 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-500" /> Brand Breakdown</h5>
          <div className="space-y-2">
            {brands.length === 0 && <p className="text-xs text-slate-400">No brands yet.</p>}
            {brands.map(b => {
              const count = products.filter(p => p.brand_id === b.id).length;
              const pct = products.length ? Math.round((count / products.length) * 100) : 0;
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="font-bold text-slate-700">{b.name}</span>
                    <span className="text-slate-500">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }}></div></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product monitor */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or SKU..." className="pl-9 pr-3 py-2 w-full border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div className="flex items-center gap-2">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={`${inputCls} !py-2`}><option value="">All Types</option><option value="simple">Simple</option><option value="variable">Variable</option></select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${inputCls} !py-2`}><option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          </div>
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-xs"><RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />Loading shop data…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr><th className="text-left p-3 font-bold">Product</th><th className="text-left p-3 font-bold">Category</th><th className="text-left p-3 font-bold">Type</th><th className="text-right p-3 font-bold">Price</th><th className="text-right p-3 font-bold">Stock</th><th className="text-left p-3 font-bold">Status</th><th className="text-center p-3 font-bold">Featured</th><th className="text-right p-3 font-bold">Store</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img src={p.images?.[0] || 'https://placehold.co/32x32'} alt="" className="w-8 h-8 rounded-lg object-cover bg-slate-100 flex-shrink-0" onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/32x32'; }} />
                        <div className="min-w-0"><div className="font-bold text-slate-900 line-clamp-1 max-w-[220px]">{p.name}</div>{p.sku && <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>}</div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-500">{catMap.get(p.category_id || '') || '—'}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${p.product_type === 'variable' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'}`}>{p.product_type}</span></td>
                    <td className="p-3 text-right font-bold text-slate-900">₹{Number(effectivePrice(p)).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right"><span className={`font-bold ${effectiveStock(p) <= 0 ? 'text-red-500' : effectiveStock(p) <= 10 ? 'text-amber-500' : 'text-emerald-600'}`}>{effectiveStock(p)}</span></td>
                    <td className="p-3">
                      <button onClick={() => toggleActive(p)} disabled={savingId === p.id} className={`px-2 py-0.5 rounded-full font-bold text-[10px] transition-colors ${p.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{p.is_active !== false ? 'Active' : 'Inactive'}</button>
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => toggleFeatured(p)} disabled={savingId === p.id} title="Toggle featured" className={`p-1 rounded-lg transition-colors ${p.featured ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'}`}><Star className={`w-4 h-4 ${p.featured ? 'fill-amber-400' : ''}`} /></button>
                    </td>
                    <td className="p-3"><div className="flex justify-end gap-1.5">
                      <a href={`/shop/${p.id}`} target="_blank" rel="noreferrer" title="View in store" className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><ExternalLink className="w-4 h-4" /></a>
                    </div></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-400">No products match your filters.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ==================== CUSTOMERS PANEL ==================== */
const CUSTOMER_STATUSES = ['active', 'inactive', 'blocked'];

const CustomersPanel: React.FC<{ addToast: Props['addToast']; setError: (s: string | null) => void }> = ({ addToast, setError }) => {
  const [customers, setCustomers] = useState<EcCustomer[]>([]);
  const [orders, setOrders] = useState<EcOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<EcCustomer | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<EcOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<EcOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErrorState(null);
    try {
      const [res, os] = await Promise.all([
        ecommerce.listCustomersPaged({ page, perPage, search: searchQuery, status: statusFilter || undefined }),
        ecommerce.listOrders(),
      ]);
      setCustomers(res.rows); setTotal(res.total); setOrders(os);
      if (res.rows.length === 0 && res.total > 0 && page > 1) setPage(1);
    } catch (e: any) { setErrorState(e?.message || 'Failed to load customers'); setError(e?.message || null); }
    finally { setLoading(false); }
  }, [setError, searchQuery, statusFilter, page, perPage]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { setPage(1); }, [statusFilter, perPage]);

  // Derive per-customer order stats
  const stats = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const o of orders) {
      if (!o.customer_id) continue;
      const cur = map.get(o.customer_id) || { count: 0, total: 0 };
      cur.count += 1;
      cur.total += Number(o.total || 0);
      map.set(o.customer_id, cur);
    }
    return map;
  }, [orders]);

  const filtered = customers.filter(c => {
    const term = search.toLowerCase();
    const matches = !term || (c.name || '').toLowerCase().includes(term) || (c.email || '').toLowerCase().includes(term) || (c.phone || '').toLowerCase().includes(term);
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matches && matchesStatus;
  });

  const openDetail = async (c: EcCustomer) => {
    setSelected(c);
    setSelectedOrder(null);
    setDetailLoading(true);
    try {
      const os = await ecommerce.listOrdersByCustomer(c.id);
      setSelectedOrders(os);
    } catch (e: any) { setError(e.message); setSelectedOrders([]); } finally { setDetailLoading(false); }
  };

  const openOrder = async (o: EcOrder) => {
    setDetailLoading(true);
    try {
      const full = await ecommerce.getOrder(o.id);
      setSelectedOrder(full || o);
    } catch (e: any) { setError(e.message); setSelectedOrder(o); } finally { setDetailLoading(false); }
  };

  const updateOrder = async (patch: Partial<EcOrder>) => {
    if (!selectedOrder) return;
    setSavingId(selectedOrder.id);
    try {
      await ecommerce.saveOrder({ ...selectedOrder, ...patch });
      const fresh = await ecommerce.getOrder(selectedOrder.id);
      setSelectedOrder(fresh || selectedOrder);
      // refresh order lists
      if (selected) { const os = await ecommerce.listOrdersByCustomer(selected.id); setSelectedOrders(os); }
      await load();
      addToast('Order updated', 'success');
    } catch (e: any) { addToast(e.message, 'error'); } finally { setSavingId(null); }
  };

  const updateCustomerStatus = async (c: EcCustomer, status: EcCustomer['status']) => {
    setSavingId(c.id);
    try {
      await ecommerce.updateCustomer(c.id, { status });
      addToast(`Customer ${status}`, 'success');
      await load();
      if (selected?.id === c.id) setSelected({ ...selected, status });
    } catch (e: any) { addToast(e.message, 'error'); } finally { setSavingId(null); }
  };

  const remove = async (c: EcCustomer) => {
    if (!window.confirm(`Delete customer ${c.email}?`)) return;
    setLoading(true);
    try { await ecommerce.deleteCustomer(c.id); addToast('Customer deleted', 'success'); await load(); } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); }
  };

  const statusColor: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-amber-100 text-amber-700',
    blocked: 'bg-red-100 text-red-700',
  };
  const orderStatusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-sky-100 text-sky-700',
    shipped: 'bg-indigo-100 text-indigo-700', delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  const payStatusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700', paid: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700', refunded: 'bg-slate-100 text-slate-600',
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const totalRevenue = orders.reduce((a, o) => a + Number(o.total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h4 className="font-extrabold text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-500" /> Customer Management</h4>
          <p className="text-[11px] text-slate-500">View registered customers, their account status and full order history.</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-500" /> {totalCustomers} customers</span>
          <span className="flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-emerald-500" /> {activeCustomers} active</span>
          <span className="flex items-center gap-1.5"><ShoppingCart className="w-4 h-4 text-blue-500" /> ₹{totalRevenue.toLocaleString('en-IN')} revenue</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or phone..." className="pl-9 pr-3 py-2 w-full border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${inputCls} !py-2`}>
          <option value="">All Status</option>
          {CUSTOMER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading && !customers.length ? (
        <div className="p-10 text-center text-slate-400 text-xs"><RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />Loading customers…</div>
      ) : error && !customers.length ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 text-center text-xs text-red-500 flex flex-col items-center gap-2">
          <AlertCircle className="w-6 h-6" /><span className="font-bold">{error}</span>
          <button onClick={load} className="mt-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors">Try again</button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className={`w-full text-xs transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr><th className="text-left p-3 font-bold">Customer</th><th className="text-left p-3 font-bold">Contact</th><th className="text-right p-3 font-bold">Orders</th><th className="text-right p-3 font-bold">Total Spent</th><th className="text-left p-3 font-bold">Status</th><th className="text-right p-3 font-bold">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => {
                  const st = stats.get(c.id);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-sm flex-shrink-0">{(c.name || c.email || '?').charAt(0).toUpperCase()}</div>
                          <div className="min-w-0"><div className="font-bold text-slate-900 line-clamp-1 max-w-[180px]">{c.name || '—'}</div><div className="text-[10px] text-slate-400">{c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : ''}</div></div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-600 flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {c.email}</div>
                        {c.phone && <div className="text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {c.phone}</div>}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">{st?.count || 0}</td>
                      <td className="p-3 text-right font-bold text-slate-900">₹{Number(st?.total || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] capitalize ${statusColor[c.status] || 'bg-slate-100 text-slate-600'}`}>{c.status}</span></td>
                      <td className="p-3"><div className="flex justify-end gap-1.5">
                        <button onClick={() => openDetail(c)} title="View customer" className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => remove(c)} title="Delete customer" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div></td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-10 text-center flex flex-col items-center gap-2">
                    <Users className="w-8 h-8 text-slate-200" />
                    <span className="text-slate-400 text-xs font-bold">{searchQuery || statusFilter ? 'No customers match your filters.' : 'No customers yet.'}</span>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} disabled={loading} />
        </div>
      )}

      {/* Customer detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl my-8 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-black text-lg">{(selected.name || selected.email || '?').charAt(0).toUpperCase()}</div>
                <div><h4 className="font-black text-slate-900">{selected.name || 'Customer'}</h4><p className="text-[11px] text-slate-500">{selected.email}</p></div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Profile + status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-slate-50 rounded-xl p-4 text-xs space-y-2">
                  <p className="font-extrabold text-slate-700 uppercase tracking-wide text-[10px]">Customer Profile</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" /> <span className="font-bold">{selected.email}</span></div>
                    <div className="flex items-center gap-1.5 text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" /> {selected.phone || '—'}</div>
                    <div className="flex items-center gap-1.5 text-slate-600"><KeyRound className="w-3.5 h-3.5 text-slate-400" /> Password: <span className="font-bold">•••••••• (secured)</span></div>
                    <div className="flex items-center gap-1.5 text-slate-600"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined: {selected.created_at ? new Date(selected.created_at).toLocaleDateString('en-IN') : '—'}</div>
                  </div>
                  {selected.address?.line1 && (
                    <div className="flex items-start gap-1.5 text-slate-600 pt-1"><MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" /><span>{selected.address.line1}{selected.address.line2 ? `, ${selected.address.line2}` : ''}, {selected.address.city}{selected.address.state ? `, ${selected.address.state}` : ''} - {selected.address.pincode}</span></div>
                  )}
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2">
                  <p className="font-extrabold text-slate-700 uppercase tracking-wide text-[10px]">Account Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] capitalize ${statusColor[selected.status] || 'bg-slate-100 text-slate-600'}`}>{selected.status}</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <label className="text-slate-500 block">Set Status</label>
                    <select value={selected.status} disabled={savingId === selected.id} onChange={e => updateCustomerStatus(selected, e.target.value as EcCustomer['status'])} className={`${inputCls} w-full`}>
                      {CUSTOMER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="pt-1 text-slate-500">
                    <div><b>{stats.get(selected.id)?.count || 0}</b> orders</div>
                    <div>Spent: <b>₹{Number(stats.get(selected.id)?.total || 0).toLocaleString('en-IN')}</b></div>
                  </div>
                </div>
              </div>

              {/* Order history */}
              <div>
                <h5 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-1.5"><ShoppingCart className="w-4 h-4 text-indigo-500" /> Order History</h5>
                {detailLoading ? (
                  <div className="py-8 text-center text-slate-400 text-xs"><RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />Loading orders...</div>
                ) : selectedOrders.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">This customer has no orders yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedOrders.map(o => (
                      <button key={o.id} onClick={() => openOrder(o)} className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">#{o.order_number?.slice(-8) || o.id.slice(-8)}</div>
                          <div className="text-[10px] text-slate-500">{o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : ''}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] capitalize ${orderStatusColor[o.status] || 'bg-slate-100'}`}>{o.status}</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] capitalize ${payStatusColor[o.payment_status || 'pending'] || 'bg-slate-100'}`}>{o.payment_status || 'pending'}</span>
                          <span className="font-black text-slate-900 text-sm">₹{Number(o.total || 0).toLocaleString('en-IN')}</span>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected order detail */}
              {selectedOrder && (
                <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-extrabold text-slate-900 text-sm">Order #{selectedOrder.order_number?.slice(-8) || selectedOrder.id.slice(-8)}</h5>
                    <button onClick={() => setSelectedOrder(null)} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
                    <div className="bg-slate-50 rounded-xl p-3"><span className="text-slate-500 block text-[10px] uppercase">Order Status</span>
                      <select value={selectedOrder.status} disabled={savingId === selectedOrder.id} onChange={e => updateOrder({ status: e.target.value as EcOrderStatus })} className={`${inputCls} w-full mt-1`}>{ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3"><span className="text-slate-500 block text-[10px] uppercase">Payment Status</span>
                      <select value={selectedOrder.payment_status || 'pending'} disabled={savingId === selectedOrder.id} onChange={e => updateOrder({ payment_status: e.target.value as any })} className={`${inputCls} w-full mt-1`}>{PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3"><span className="text-slate-500 block text-[10px] uppercase">Shipping</span>
                      <div className="font-bold text-slate-900 mt-1">{selectedOrder.shipping_method || '—'}</div>
                      <div className="text-slate-500">{selectedOrder.payment_method || '—'}</div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-xs mb-3">
                    <span className="text-slate-500 block text-[10px] uppercase mb-1">Tracking / Shipment</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input value={selectedOrder.tracking_number || ''} disabled={savingId === selectedOrder.id} onChange={e => updateOrder({ tracking_number: e.target.value })} placeholder="Tracking number" className={`${inputCls} w-full`} />
                      <input value={selectedOrder.tracking_company || ''} disabled={savingId === selectedOrder.id} onChange={e => updateOrder({ tracking_company: e.target.value })} placeholder="Courier company" className={`${inputCls} w-full`} />
                    </div>
                    {selectedOrder.tracking_number && (
                      <a href={`/orders/${selectedOrder.id}/track`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-indigo-600 font-bold"><ExtLink className="w-3.5 h-3.5" /> View Tracking</a>
                    )}
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-100"><tr><th className="text-left p-2 font-bold">Item</th><th className="text-right p-2 font-bold">Qty</th><th className="text-right p-2 font-bold">Price</th><th className="text-right p-2 font-bold">Total</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {(selectedOrder.items || []).map((it, i) => (
                          <tr key={i}><td className="p-2 font-bold text-slate-900">{it.product_name}</td><td className="p-2 text-right">{it.quantity}</td><td className="p-2 text-right">₹{Number(it.unit_price).toLocaleString('en-IN')}</td><td className="p-2 text-right font-bold">₹{Number(it.total).toLocaleString('en-IN')}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end mt-3 text-xs space-y-1">
                    <div className="text-right space-y-1">
                      <div className="flex justify-between gap-6 text-slate-600"><span>Subtotal</span><span>₹{Number(selectedOrder.subtotal || 0).toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between gap-6 text-slate-600"><span>Shipping</span><span>₹{Number(selectedOrder.shipping_charge || 0).toLocaleString('en-IN')}</span></div>
                      {selectedOrder.discount > 0 && <div className="flex justify-between gap-6 text-emerald-600"><span>Discount</span><span>-₹{Number(selectedOrder.discount || 0).toLocaleString('en-IN')}</span></div>}
                      <div className="flex justify-between gap-6 font-black text-slate-900 border-t border-slate-200 pt-1"><span>Total</span><span>₹{Number(selectedOrder.total || 0).toLocaleString('en-IN')}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ==================== ATTRIBUTES PANEL ==================== */
interface AttrValueForm {
  id?: string;
  value: string;
  sort_order: number;
}

const AttributesPanel: React.FC<{ addToast: Props['addToast']; setError: (s: string | null) => void }> = ({ addToast, setError }) => {
  const [attrs, setAttrs] = useState<EcAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [edit, setEdit] = useState<{ attr: EcAttribute; values: AttrValueForm[] } | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [savingValues, setSavingValues] = useState<string | null>(null); // value id being toggled

  const load = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const res = await ecommerce.listAttributesPaged({ page, perPage, search: searchQuery });
      setAttrs(res.rows); setTotal(res.total);
      if (res.rows.length === 0 && res.total > 0 && page > 1) setPage(1);
    } catch (e: any) { setErrorState(e?.message || 'Failed to load attributes'); setError(e?.message || null); }
    finally { setLoading(false); }
  }, [setError, searchQuery, page, perPage]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const openNew = () => setEdit({ attr: { id: '', name: 'Size', slug: '', has_presets: true, is_active: true }, values: [] });
  const openEdit = async (a: EcAttribute) => {
    const vals = await ecommerce.listAttributeValues(a.id);
    setEdit({
      attr: { ...a },
      values: vals.map((v) => ({ id: v.id, value: v.value, sort_order: v.sort_order || 0 })),
    });
  };

  const slugFromName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'attr';

  const save = async () => {
    if (!edit?.attr.name?.trim()) return addToast('Attribute name required', 'error');
    const name = edit.attr.name.trim();
    const patch: EcAttribute = { ...edit.attr, name, slug: edit.attr.slug || slugFromName(name), has_presets: edit.attr.has_presets !== false, is_active: edit.attr.is_active !== false };
    setLoading(true);
    try {
      const saved = await ecommerce.saveAttribute(patch);
      await ecommerce.saveAttributeValues(saved.id, edit.values.filter((v) => v.value.trim()));
      addToast(edit.attr.id ? 'Attribute updated' : 'Attribute created', 'success');
      setEdit(null);
      await load();
    } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); }
  };

  const remove = async (a: EcAttribute) => {
    if (!window.confirm(`Delete attribute "${a.name}" and all its values? This cannot be undone.`)) return;
    setLoading(true);
    try { await ecommerce.deleteAttribute(a.id); addToast('Deleted', 'success'); await load(); } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); }
  };

  const reorderValues = (from: number, to: number) => {
    if (!edit || from === to) return;
    const v = [...edit.values];
    const [m] = v.splice(from, 1);
    v.splice(to, 0, m);
    v.forEach((x, i) => { x.sort_order = i * 10; });
    setEdit({ ...edit, values: v });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search attributes..." className="pl-9 pr-3 py-2 w-full border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <button onClick={load} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl disabled:opacity-40 transition-colors shrink-0" disabled={loading}><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        <button onClick={openNew} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 shadow-sm shrink-0"><Plus className="w-4 h-4" /> Add Attribute</button>
      </div>

      <FormDrawer
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.attr.id ? 'Edit Attribute' : 'New Attribute'}
        subtitle={edit?.attr.id ? 'Update name, slug and permitted values' : 'Create a new product attribute (e.g. Size, Color)'}
        saving={loading}
        error={error}
        width="lg"
        footer={
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={() => setEdit(null)} disabled={loading} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50">Cancel</button>
            <button type="button" onClick={save} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-50">
              {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Attribute</>}
            </button>
          </div>
        }
      >
        {edit && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={edit.attr.name || ''} onChange={e => setEdit({ ...edit, attr: { ...edit.attr, name: e.target.value } })} placeholder="Name e.g. Size, Color" className={inputCls} />
              <input value={edit.attr.slug || slugFromName(edit.attr.name)} onChange={e => setEdit({ ...edit, attr: { ...edit.attr, slug: e.target.value } })} placeholder="Slug" className={inputCls} />
              <label className="flex items-center gap-1.5 text-xs text-slate-600 col-span-2"><input type="checkbox" checked={edit.attr.has_presets !== false} onChange={e => setEdit({ ...edit, attr: { ...edit.attr, has_presets: e.target.checked } })} className="w-3.5 h-3.5 accent-indigo-500" /> Has preset values (suggests a controlled list in the product form)</label>
              <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={edit.attr.is_active !== false} onChange={e => setEdit({ ...edit, attr: { ...edit.attr, is_active: e.target.checked } })} className="w-3.5 h-3.5 accent-indigo-500" /> Active</label>
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-700 uppercase mb-1.5">Permitted Values</p>
              <div className="space-y-1.5">
                {edit.values.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5"
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { if (dragIdx !== null) { reorderValues(dragIdx, i); setDragIdx(null); } }}
                  >
                    <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" title="Drag to reorder" />
                    <input value={v.value} onChange={e => { const vv = [...edit.values]; vv[i] = { ...vv[i], value: e.target.value }; setEdit({ ...edit, values: vv }); }} placeholder="e.g. M" className={`${inputCls} flex-1`} />
                    <button type="button" onClick={() => setEdit({ ...edit, values: edit.values.filter((_, x) => x !== i) })} className="p-1 text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => { const next = [...(edit.values || []), { value: '', sort_order: edit.values.length * 10 }]; setEdit({ ...edit, values: next }); }} className="flex items-center gap-1 text-[11px] font-bold text-indigo-600"><Plus className="w-3.5 h-3.5" /> Add value</button>
              </div>
              {edit.values.some((v) => !v.value.trim()) && (
                <p className="text-[10px] text-red-500 mt-1">Empty values will be skipped on save.</p>
              )}
            </div>
          </div>
        )}
      </FormDrawer>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto">
        {error ? (
          <div className="p-10 text-center text-xs text-red-500 flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6" /><span className="font-bold">{error}</span>
            <button onClick={load} className="mt-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors">Try again</button>
          </div>
        ) : loading && !attrs.length ? (
          <div className="p-10 text-center text-slate-400 text-xs"><RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />Loading attributes…</div>
        ) : !loading && attrs.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-2">
            <Layers className="w-8 h-8 text-slate-200" />
            <p className="text-slate-400 text-xs font-bold">{searchQuery ? 'No attributes match your search.' : 'No attributes yet.'}</p>
            <p className="text-slate-300 text-[11px]">Add an attribute to use it with variable products and CSV import.</p>
          </div>
        ) : (
          <>
            <table className={`w-full text-xs transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr><th className="text-left p-3 font-bold">Attribute</th><th className="text-left p-3 font-bold">Slug</th><th className="text-right p-3 font-bold">Values</th><th className="text-left p-3 font-bold">Presets</th><th className="text-left p-3 font-bold">Status</th><th className="text-right p-3 font-bold">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attrs.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600"><Layers className="w-4 h-4" /></div>
                        <span className="font-bold text-slate-900">{a.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-500 font-mono">{a.slug || '—'}</td>
                    <td className="p-3 text-slate-600">
                      <AttributeValuesBadge attributeId={a.id} />
                    </td>
                    <td className="p-3">{a.has_presets ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">Yes</span> : <span className="text-slate-400 text-[10px]">—</span>}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${a.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{a.is_active !== false ? 'Active' : 'Inactive'}</span></td>
                    <td className="p-3"><div className="flex justify-end gap-1.5"><button onClick={() => openEdit(a)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => remove(a)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} disabled={loading} />
          </>
        )}
      </div>
    </div>
  );
};

/* Lightweight value-count fetcher for the table (keeps the row render simple). */
const AttributeValuesBadge: React.FC<{ attributeId: string }> = ({ attributeId }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    ecommerce.listAttributeValues(attributeId).then((v) => setCount(v.length)).catch(() => setCount(0));
  }, [attributeId]);
  return <span className="text-[10px] text-slate-500">{count} value{count !== 1 ? 's' : ''}</span>;
};
export const EcAdmin: React.FC<Props> = ({ addToast }) => {
  const [tab, setTab] = useState<EcTab>('products');
  const [error, setError] = useState<string | null>(null);

  const tabs: { id: EcTab; label: string; icon: React.ReactNode }[] = [
    { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
    { id: 'attributes', label: 'Attributes', icon: <Layers className="w-4 h-4" /> },
    { id: 'categories', label: 'Categories', icon: <Tags className="w-4 h-4" /> },
    { id: 'brands', label: 'Brands', icon: <Award className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'coupons', label: 'Coupons', icon: <Tag className="w-4 h-4" /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'shipping', label: 'Shipping', icon: <Truck className="w-4 h-4" /> },
    { id: 'shop', label: 'Shop', icon: <Store className="w-4 h-4" /> },
    { id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const renderTab = () => {
    switch (tab) {
       case 'attributes': return <AttributesPanel addToast={addToast} setError={setError} />;
       case 'products': return <ProductsPanel addToast={addToast} setError={setError} />;
       case 'categories': return <CategoriesPanel addToast={addToast} setError={setError} />;
      case 'brands': return <BrandsPanel addToast={addToast} setError={setError} />;
      case 'orders': return <OrdersPanel addToast={addToast} setError={setError} />;
      case 'coupons': return <CouponsPanel addToast={addToast} setError={setError} />;
      case 'payments': return <PaymentsPanel addToast={addToast} setError={setError} />;
      case 'shipping': return <ShippingPanel addToast={addToast} setError={setError} />;
      case 'shop': return <ShopPanel addToast={addToast} setError={setError} />;
      case 'customers': return <CustomersPanel addToast={addToast} setError={setError} />;
      case 'settings': return <SettingsPanel addToast={addToast} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600"><Package className="w-5 h-5" /></div>
          <div>
            <h3 className="font-extrabold text-slate-900">E-Commerce Module</h3>
            <p className="text-[11px] text-slate-500">Products, categories, orders, payments, shipping &amp; coupons</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setError(null); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${tab === t.id ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}
      {renderTab()}
    </div>
  );
};
