import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, Star, ShoppingBag, SlidersHorizontal, Loader2, X } from 'lucide-react';
import { ecommerce } from '../db/ecommerce';
import { EcProduct, EcCategory } from '../types/ecommerce';

export const EcShopPage: React.FC = () => {
  const [products, setProducts] = useState<EcProduct[]>([]);
  const [categories, setCategories] = useState<EcCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [catId, setCatId] = useState<string>('');
  const [sort, setSort] = useState('featured');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([ecommerce.listProducts(), ecommerce.listCategories()]);
      setProducts(p.filter(x => x.is_active !== false));
      setCategories(c);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const subCatsOf = (id: string) => categories.filter(c => c.parent_id === id);

  const filtered = useMemo(() => {
    let list = products.filter(p => (p.name || '').toLowerCase().includes(search.toLowerCase()));
    if (catId) {
      const ids = new Set<string>([catId, ...subCatsOf(catId).map(c => c.id)]);
      list = list.filter(p => p.category_id && ids.has(p.category_id));
    }
    list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
    if (sort === 'price_low') list.sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price));
    if (sort === 'price_high') list.sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price));
    return list;
  }, [products, search, catId, sort]);

  const topCats = categories.filter(c => !c.parent_id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Package className="w-6 h-6 text-indigo-500" /> E-Commerce Store</h1>
          <p className="text-xs text-slate-500 mt-0.5">Simple &amp; variable products · Cart · Checkout · Orders · Tracking</p>
        </div>
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-9 pr-3 py-2 w-full xs:w-56 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <label className="flex items-center gap-1.5 text-xs text-slate-500"><SlidersHorizontal className="w-4 h-4" />
            <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none">
              <option value="featured">Featured</option>
              <option value="price_low">Price: Low → High</option>
              <option value="price_high">Price: High → Low</option>
            </select>
          </label>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2"><X className="w-4 h-4" /> {error} <em className="ml-auto">Run the e-commerce migration to seed demo data.</em></div>}

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button onClick={() => setCatId('')} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${!catId ? 'bg-indigo-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'}`}>All Products</button>
        {topCats.map(c => (
          <button key={c.id} onClick={() => setCatId(catId === c.id ? '' : c.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${catId === c.id ? 'bg-indigo-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'}`}>{c.name}</button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm"><Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />Loading products...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm"><ShoppingBag className="w-6 h-6 mx-auto mb-2" />No products found in this view.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => {
            const price = p.sale_price ?? p.price;
            const off = p.sale_price != null && p.price > 0 ? Math.round(((p.price - p.sale_price) / p.price) * 100) : 0;
            return (
              <Link key={p.id} to={`/shop/${p.id}`} className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="relative aspect-square bg-slate-50 overflow-hidden">
                  <img src={p.images?.[0] || 'https://placehold.co/300x300?text=No+Img'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x300?text=No+Img'; }} />
                  {p.featured && <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-amber-400 text-amber-950 text-[10px] font-black rounded-full"><Star className="w-3 h-3 fill-amber-950" /> Featured</span>}
                  {off > 0 && <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full">{off}% OFF</span>}
                  <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${p.product_type === 'variable' ? 'bg-purple-500 text-white' : 'bg-sky-500 text-white'}`}>{p.product_type}</span>
                </div>
                <div className="p-3">
                  <div className="text-[11px] text-slate-500 truncate">{categories.find(c => c.id === p.category_id)?.name || 'General'}</div>
                  <div className="font-bold text-slate-900 text-sm line-clamp-2 min-h-[2.5rem]">{p.name}</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-lg font-black text-indigo-600">₹{Number(price).toLocaleString('en-IN')}</span>
                    {p.sale_price != null && <span className="text-xs text-slate-400 line-through">₹{Number(p.price).toLocaleString('en-IN')}</span>}
                  </div>
                  <div className="mt-1.5 text-[10px] text-slate-500">{p.product_type === 'variable' ? 'Select options' : p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};