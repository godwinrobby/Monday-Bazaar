import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Tags, Award, ShoppingCart, Tag, CreditCard, Truck, Settings,
  Plus, Search, Edit2, Trash2, X, Star, RefreshCw, Eye,
  AlertCircle, Save, PackagePlus, ClipboardList, Store, BarChart3, Boxes, Layers, ExternalLink, Check,
  Users, UserCheck, UserX, Mail, Phone, MapPin, KeyRound, Calendar, ExternalLink as ExtLink,
} from 'lucide-react';
import { ecommerce } from '../db/ecommerce';
import {
  EcProduct, EcCategory, EcBrand, EcVariant, EcOrder, EcCoupon, EcCustomer,
  EcPaymentMethod, EcShippingMethod, EcProductType, EcOrderStatus,
} from '../types/ecommerce';

type EcTab = 'products' | 'categories' | 'brands' | 'orders' | 'coupons' | 'payments' | 'shipping' | 'shop' | 'customers' | 'settings';

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
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showVariants, setShowVariants] = useState(false);
  const [form, setForm] = useState<EcProduct>({ id: '', name: '', product_type: 'simple', price: 0, stock: 0, is_active: true, images: [] });
  const [variants, setVariants] = useState<EcVariant[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, b] = await Promise.all([ecommerce.listProducts(), ecommerce.listCategories(), ecommerce.listBrands()]);
      setProducts(p); setCategories(c); setBrands(b);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [setError]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditId(null); setShowVariants(false); setForm({ id: '', name: '', product_type: 'simple', price: 0, stock: 0, is_active: true, images: [] }); setVariants([]); setShowForm(true); };

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

  const remove = async (id: string) => {
    if (!window.confirm('Delete this product (and its variants)?')) return;
    setLoading(true);
    try { await ecommerce.deleteProduct(id); addToast('Product deleted', 'success'); await load(); } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-9 pr-3 py-2 w-full border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm"><Plus className="w-4 h-4" /> Add Product</button>
      </div>
{showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-2"><PackagePlus className="w-4 h-4 text-indigo-500" />{editId ? 'Edit Product' : 'New Product'}</h4>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
          <input value={(form.images || []).join(', ')} onChange={e => setForm({ ...form, images: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Image URLs (comma separated)" className={`${inputCls} w-full`} />
          {showVariants && (
            <div className="border border-slate-100 rounded-xl bg-slate-50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-indigo-500" /> Variants (SKU, price, stock, attributes, image)</h5>
                <button type="button" onClick={() => setVariants([...variants, { id: '', product_id: editId || form.id || '', sku: '', price: 0, sale_price: null, stock: 0, attributes: {}, image: '', is_active: true }])} className="flex items-center gap-1 text-[11px] font-bold text-indigo-600"><Plus className="w-3.5 h-3.5" /> Add Variant</button>
              </div>
              {variants.length === 0 && <p className="text-[11px] text-slate-400">No variants yet — add at least one for a variable product.</p>}
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-white border border-slate-200 rounded-lg p-2">
                  <input value={v.sku || ''} onChange={e => { const vv = [...variants]; vv[i] = { ...vv[i], sku: e.target.value }; setVariants(vv); }} placeholder="SKU" className={`${inputCls} col-span-12 sm:col-span-3`} />
                  <input type="number" value={v.price || 0} onChange={e => { const vv = [...variants]; vv[i] = { ...vv[i], price: Number(e.target.value) }; setVariants(vv); }} placeholder="Price" className={`${inputCls} col-span-4 sm:col-span-2`} />
                  <input type="number" value={v.sale_price ?? ''} onChange={e => { const vv = [...variants]; vv[i] = { ...vv[i], sale_price: e.target.value ? Number(e.target.value) : null }; setVariants(vv); }} placeholder="Sale" className={`${inputCls} col-span-4 sm:col-span-2`} />
                  <input type="number" value={v.stock || 0} onChange={e => { const vv = [...variants]; vv[i] = { ...vv[i], stock: Number(e.target.value) }; setVariants(vv); }} placeholder="Stock" className={`${inputCls} col-span-4 sm:col-span-2`} />
                  <input value={Object.entries(v.attributes || {}).map(([k, val]) => `${k}:${val}`).join(', ')} onChange={e => { const vv = [...variants]; vv[i] = { ...vv[i], attributes: Object.fromEntries(e.target.value.split(',').map(s => s.trim()).filter(Boolean).map(part => { const [k, ...rest] = part.split(':'); return [k, rest.join(':')]; })) }; setVariants(vv); }} placeholder="color:Black, size:UK 9" className={`${inputCls} col-span-10 sm:col-span-2`} />
                  <button type="button" onClick={() => setVariants(variants.filter((_, x) => x !== i))} className="col-span-2 sm:col-span-1 text-red-500 hover:text-red-700 justify-self-end"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
            <button type="button" onClick={save} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-50"><Save className="w-4 h-4" /> Save Product</button>
          </div>
        </div>
      )}
<div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto">
        {loading && !products.length ? (
          <div className="p-10 text-center text-slate-400 text-xs"><RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">No products found.</div>
        ) : (
          <table className="w-full text-xs">
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
              {filtered.map(p => (
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
                      <button onClick={() => remove(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
/* ==================== CATEGORIES PANEL ==================== */
const CategoriesPanel: React.FC<{ addToast: Props['addToast']; setError: (s: string | null) => void }> = ({ addToast, setError }) => {
  const [cats, setCats] = useState<EcCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<EcCategory | null>(null);
  const load = useCallback(async () => { setLoading(true); try { setCats(await ecommerce.listCategories()); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }, [setError]);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    if (!edit?.name?.trim()) return addToast('Category name required', 'error');
    setLoading(true);
    try { await ecommerce.saveCategory(edit); addToast(edit.id ? 'Category updated' : 'Category created', 'success'); setEdit(null); await load(); }
    catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); }
  };
  const remove = async (id: string) => { if (!window.confirm('Delete category?')) return; setLoading(true); try { await ecommerce.deleteCategory(id); addToast('Deleted', 'success'); await load(); } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); } };
  const parents = cats.filter(c => !c.parent_id);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-extrabold text-slate-900">Categories &amp; Sub-categories</h4>
        <button onClick={() => setEdit({ id: '', name: '', parent_id: null })} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 shadow-sm"><Plus className="w-4 h-4" /> Add Category</button>
      </div>
      {edit && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} placeholder="Name *" className={inputCls} />
            <select value={edit.parent_id || ''} onChange={e => setEdit({ ...edit, parent_id: e.target.value || null })} className={inputCls}><option value="">— Top level —</option>{parents.filter(c => c.id !== edit.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <input value={edit.slug || ''} onChange={e => setEdit({ ...edit, slug: e.target.value })} placeholder="Slug" className={inputCls} />
            <input value={edit.image || ''} onChange={e => setEdit({ ...edit, image: e.target.value })} placeholder="Image URL" className={inputCls} />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={edit.is_active !== false} onChange={e => setEdit({ ...edit, is_active: e.target.checked })} className="w-3.5 h-3.5 accent-indigo-500" /> Active</label>
            <div className="flex gap-2">
              <button onClick={() => setEdit(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl"><Save className="w-4 h-4" /> Save</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100"><tr><th className="text-left p-3 font-bold">Name</th><th className="text-left p-3 font-bold">Parent</th><th className="text-left p-3 font-bold">Status</th><th className="text-right p-3 font-bold">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {cats.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/60">
                <td className="p-3 font-bold text-slate-900">{c.name}</td>
                <td className="p-3 text-slate-600">{c.parent_id ? (cats.find(p => p.id === c.parent_id)?.name || '—') : <span className="text-slate-400">Top level</span>}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${c.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{c.is_active !== false ? 'Active' : 'Inactive'}</span></td>
                <td className="p-3"><div className="flex justify-end gap-1.5"><button onClick={() => setEdit(c)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => remove(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td>
              </tr>
            ))}
            {cats.length === 0 && !loading && <tr><td colSpan={4} className="p-8 text-center text-slate-400">No categories yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
/* ==================== BRANDS PANEL ==================== */
const BrandsPanel: React.FC<{ addToast: Props['addToast']; setError: (s: string | null) => void }> = ({ addToast, setError }) => {
  const [brands, setBrands] = useState<EcBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<EcBrand | null>(null);
  const load = useCallback(async () => { setLoading(true); try { setBrands(await ecommerce.listBrands()); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }, [setError]);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    if (!edit?.name?.trim()) return addToast('Brand name required', 'error');
    setLoading(true);
    try { await ecommerce.saveBrand(edit); addToast('Brand saved', 'success'); setEdit(null); await load(); } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); }
  };
  const remove = async (id: string) => { if (!window.confirm('Delete brand?')) return; setLoading(true); try { await ecommerce.deleteBrand(id); addToast('Deleted', 'success'); await load(); } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); } };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-extrabold text-slate-900">Brand Management</h4>
        <button onClick={() => setEdit({ id: '', name: '' })} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 shadow-sm"><Plus className="w-4 h-4" /> Add Brand</button>
      </div>
      {edit && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} placeholder="Name *" className={inputCls} />
            <input value={edit.logo || ''} onChange={e => setEdit({ ...edit, logo: e.target.value })} placeholder="Logo URL" className={inputCls} />
            <input value={edit.slug || ''} onChange={e => setEdit({ ...edit, slug: e.target.value })} placeholder="Slug" className={inputCls} />
            <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={edit.is_active !== false} onChange={e => setEdit({ ...edit, is_active: e.target.checked })} className="w-3.5 h-3.5 accent-indigo-500" /> Active</label>
            <input value={edit.description || ''} onChange={e => setEdit({ ...edit, description: e.target.value })} placeholder="Description" className={`${inputCls} sm:col-span-2`} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEdit(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
            <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl"><Save className="w-4 h-4" /> Save</button>
          </div>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100"><tr><th className="text-left p-3 font-bold">Brand</th><th className="text-left p-3 font-bold">Status</th><th className="text-right p-3 font-bold">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {brands.map(b => (
              <tr key={b.id} className="hover:bg-slate-50/60">
                <td className="p-3"><div className="flex items-center gap-2"><img src={b.logo || 'https://placehold.co/24x24'} alt="" className="w-6 h-6 rounded-full object-contain bg-slate-100" onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/24x24'; }} /><span className="font-bold text-slate-900">{b.name}</span></div></td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${b.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{b.is_active !== false ? 'Active' : 'Inactive'}</span></td>
                <td className="p-3"><div className="flex justify-end gap-1.5"><button onClick={() => setEdit(b)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => remove(b.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td>
              </tr>
            ))}
            {brands.length === 0 && !loading && <tr><td colSpan={3} className="p-8 text-center text-slate-400">No brands yet.</td></tr>}
          </tbody>
        </table>
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
  const [selected, setSelected] = useState<EcOrder | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => { setLoading(true); try { setOrders(await ecommerce.listOrders()); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }, [setError]);
  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: string) => { try { setSelected(await ecommerce.getOrder(id)); } catch (e: any) { setError(e.message); } };

  const updateOrder = async (patch: Partial<EcOrder>) => {
    if (!selected) return;
    setSaving(true);
    try {
      await ecommerce.saveOrder({ ...selected, ...patch });
      setSelected(await ecommerce.getOrder(selected.id)); addToast('Order updated', 'success'); await load();
    } catch (e: any) { addToast(e.message, 'error'); } finally { setSaving(false); }
  };

  const filtered = orders.filter(o => (o.order_number || '').toLowerCase().includes(search.toLowerCase()) || (o.customer_name || '').toLowerCase().includes(search.toLowerCase()) || (o.customer_email || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order # / customer..." className="pl-9 pr-3 py-2 w-full border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
            <tr><th className="text-left p-3 font-bold">Order</th><th className="text-left p-3 font-bold">Customer</th><th className="text-left p-3 font-bold">Status</th><th className="text-left p-3 font-bold">Payment</th><th className="text-right p-3 font-bold">Total</th><th className="text-left p-3 font-bold">Date</th><th className="text-right p-3 font-bold">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(o => (
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
            {filtered.length === 0 && !loading && <tr><td colSpan={7} className="p-8 text-center text-slate-400">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
      {saving && <div className="text-[11px] text-indigo-500 font-bold flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</div>}
{selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl my-8 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div><h4 className="font-black text-slate-900">Order {selected.order_number}</h4><p className="text-[11px] text-slate-500">{selected.created_at ? new Date(selected.created_at).toLocaleString('en-IN') : ''}</p></div>
              <button onClick={() => setSelected(null)} className="p-2 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
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
          </div>
        </div>
      )}
    </div>
  );
};
/* ==================== COUPONS PANEL ==================== */
const CouponsPanel: React.FC<{ addToast: Props['addToast']; setError: (s: string | null) => void }> = ({ addToast, setError }) => {
  const [coupons, setCoupons] = useState<EcCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<EcCoupon | null>(null);
  const load = useCallback(async () => { setLoading(true); try { setCoupons(await ecommerce.listCoupons()); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }, [setError]);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    if (!edit?.code?.trim()) return addToast('Coupon code required', 'error');
    setLoading(true);
    try { await ecommerce.saveCoupon(edit); addToast('Coupon saved', 'success'); setEdit(null); await load(); } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); }
  };
  const remove = async (id: string) => { if (!window.confirm('Delete coupon?')) return; setLoading(true); try { await ecommerce.deleteCoupon(id); addToast('Deleted', 'success'); await load(); } catch (e: any) { addToast(e.message, 'error'); } finally { setLoading(false); } };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-extrabold text-slate-900">Coupons &amp; Discounts</h4>
        <button onClick={() => setEdit({ id: '', code: '', type: 'percent', value: 0, min_order: 0, is_active: true })} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 shadow-sm"><Plus className="w-4 h-4" /> Add Coupon</button>
      </div>
      {edit && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <input value={edit.code} onChange={e => setEdit({ ...edit, code: e.target.value.toUpperCase() })} placeholder="Code e.g. SAVE10" className={inputCls} />
            <select value={edit.type} onChange={e => setEdit({ ...edit, type: e.target.value as 'percent' | 'fixed' })} className={inputCls}><option value="percent">Percent (%)</option><option value="fixed">Fixed (₹)</option></select>
            <input type="number" value={edit.value || 0} onChange={e => setEdit({ ...edit, value: Number(e.target.value) })} placeholder="Value" className={inputCls} />
            <input type="number" value={edit.min_order || 0} onChange={e => setEdit({ ...edit, min_order: Number(e.target.value) })} placeholder="Min order (₹)" className={inputCls} />
            <input type="number" value={edit.max_discount || ''} onChange={e => setEdit({ ...edit, max_discount: e.target.value ? Number(e.target.value) : null })} placeholder="Max discount (₹)" className={inputCls} />
            <input type="number" value={edit.usage_limit || 0} onChange={e => setEdit({ ...edit, usage_limit: Number(e.target.value) })} placeholder="Usage limit" className={inputCls} />
            <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={edit.is_active !== false} onChange={e => setEdit({ ...edit, is_active: e.target.checked })} className="w-3.5 h-3.5 accent-indigo-500" /> Active</label>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEdit(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
            <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl"><Save className="w-4 h-4" /> Save</button>
          </div>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto">
        <table className="w-full text-xs">
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
            {coupons.length === 0 && !loading && <tr><td colSpan={7} className="p-8 text-center text-slate-400">No coupons yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
/* ==================== PAYMENTS PANEL ==================== */
const PaymentsPanel: React.FC<{ addToast: Props['addToast']; setError: (s: string | null) => void }> = ({ addToast, setError }) => {
  const [methods, setMethods] = useState<EcPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<EcPaymentMethod | null>(null);
  const load = useCallback(async () => { setLoading(true); try { setMethods(await ecommerce.listPaymentMethods()); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }, [setError]);
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
      {edit && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm flex flex-wrap items-center gap-3">
          <input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} placeholder="Method name (e.g. UPI)" className={`${inputCls} flex-1 min-w-[200px]`} />
          <input type="number" value={edit.sort_order || 0} onChange={e => setEdit({ ...edit, sort_order: Number(e.target.value) })} placeholder="Sort order" className={`${inputCls} w-24`} />
          <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={edit.enabled !== false} onChange={e => setEdit({ ...edit, enabled: e.target.checked })} className="w-3.5 h-3.5 accent-indigo-500" /> Enabled</label>
          <div className="flex gap-2 ml-auto"><button onClick={() => setEdit(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button><button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl"><Save className="w-4 h-4" /> Save</button></div>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto">
        <table className="w-full text-xs">
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
            {methods.length === 0 && !loading && <tr><td colSpan={4} className="p-8 text-center text-slate-400">No payment methods configured.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
/* ==================== SHIPPING PANEL ==================== */
const ShippingPanel: React.FC<{ addToast: Props['addToast']; setError: (s: string | null) => void }> = ({ addToast, setError }) => {
  const [methods, setMethods] = useState<EcShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<EcShippingMethod | null>(null);
  const load = useCallback(async () => { setLoading(true); try { setMethods(await ecommerce.listShippingMethods()); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }, [setError]);
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
      {edit && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} placeholder="Name (e.g. Express)" className={inputCls} />
            <input type="number" value={edit.charge || 0} onChange={e => setEdit({ ...edit, charge: Number(e.target.value) })} placeholder="Charge (₹)" className={inputCls} />
            <input type="number" value={edit.min_order_free || 0} onChange={e => setEdit({ ...edit, min_order_free: Number(e.target.value) })} placeholder="Free above (₹)" className={inputCls} />
            <input value={edit.estimated_days || ''} onChange={e => setEdit({ ...edit, estimated_days: e.target.value })} placeholder="Est. days (e.g. 3-5 days)" className={inputCls} />
            <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={edit.enabled !== false} onChange={e => setEdit({ ...edit, enabled: e.target.checked })} className="w-3.5 h-3.5 accent-indigo-500" /> Enabled</label>
          </div>
          <div className="flex gap-2 justify-end"><button onClick={() => setEdit(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button><button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl"><Save className="w-4 h-4" /> Save</button></div>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-auto">
        <table className="w-full text-xs">
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
            {methods.length === 0 && !loading && <tr><td colSpan={6} className="p-8 text-center text-slate-400">No shipping methods configured.</td></tr>}
          </tbody>
        </table>
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
          <li><b>Admin → API → Database → User App:</b> Admin CRUD writes to Supabase tables (<code>ec_products</code>, <code>ec_variants</code>, <code>ec_categories</code>, <code>ec_brands</code>, <code>ec_coupons</code>, <code>ec_payment_methods</code>, <code>ec_shipping_methods</code>, <code>ec_orders</code>, <code>ec_order_items</code>) via the shared <code>src/db/ecommerce.ts</code> service.</li>
          <li>Simple products carry price/stock directly; Variable products manage price/stock/SKU per variant.</li>
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<EcCustomer | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<EcOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<EcOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cs, os] = await Promise.all([ecommerce.listCustomers(), ecommerce.listOrders()]);
      setCustomers(cs); setOrders(os);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [setError]);
  useEffect(() => { load(); }, [load]);

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

      {loading ? (
        <div className="p-10 text-center text-slate-400 text-xs"><RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />Loading customers…</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
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
                {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">No customers match your filters.</td></tr>}
              </tbody>
            </table>
          </div>
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

/* ==================== ECADMIN (MAIN COMPONENT, DEFINED LAST) ==================== */
export const EcAdmin: React.FC<Props> = ({ addToast }) => {
  const [tab, setTab] = useState<EcTab>('products');
  const [error, setError] = useState<string | null>(null);

  const tabs: { id: EcTab; label: string; icon: React.ReactNode }[] = [
    { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
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
