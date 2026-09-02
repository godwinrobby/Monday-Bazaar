import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Search, Star, SlidersHorizontal, X,
  Boxes, Truck, ShieldCheck, RefreshCw, Layers, AlertCircle,
} from 'lucide-react';
import { ecommerce } from '../db/ecommerce';
import { EcProduct, EcCategory, EcBrand, EcVariant } from '../types/ecommerce';

interface FilterState {
  catId: string;
  brandId: string;
  productType: string;
  inStockOnly: boolean;
  priceRange: [number, number];
  maxPriceCap: number;
}

const emptyFilters: FilterState = { catId: '', brandId: '', productType: '', inStockOnly: false, priceRange: [0, 1000000], maxPriceCap: 1000000 };

export const EcShopPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<EcProduct[]>([]);
  const [variants, setVariants] = useState<EcVariant[]>([]);
  const [categories, setCategories] = useState<EcCategory[]>([]);
  const [brands, setBrands] = useState<EcBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, v, c, b] = await Promise.all([
        ecommerce.listProducts(),
        ecommerce.listVariants(),
        ecommerce.listCategories(),
        ecommerce.listBrands(),
      ]);
      const activeP = p.filter(x => x.is_active !== false);
      setProducts(activeP);
      setVariants(v.filter(x => x.is_active !== false));
      setCategories(c.filter(x => x.is_active !== false));
      setBrands(b.filter(x => x.is_active !== false));
      const prices = activeP.map(pr => pr.sale_price ?? pr.price).filter(Number.isFinite);
      const max = prices.length ? Math.max(1, ...prices) : 1000000;
      setFilters(f => ({ ...f, maxPriceCap: max, priceRange: [0, max] }));
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
  const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);

  const productVariants = useMemo(() => {
    const map = new Map<string, EcVariant[]>();
    for (const v of variants) {
      const arr = map.get(v.product_id) || [];
      arr.push(v);
      map.set(v.product_id, arr);
    }
    return map;
  }, [variants]);

  const allChildIds = useCallback((id: string): Set<string> => {
    const out = new Set<string>([id]);
    for (const ch of categories.filter(c => c.parent_id === id)) {
      for (const x of allChildIds(ch.id)) out.add(x);
    }
    return out;
  }, [categories]);

  const cheapPrice = (p: EcProduct): number => {
    const vs = productVariants.get(p.id) || [];
    if (p.product_type === 'variable' && vs.length) {
      const arr = vs.map(v => v.sale_price ?? v.price).filter(Number.isFinite);
      return arr.length ? Math.min(...arr) : (p.sale_price ?? p.price);
    }
    return p.sale_price ?? p.price;
  };

  const filtered = useMemo(() => {
    let list = products.filter(p => (p.name || '').toLowerCase().includes(search.trim().toLowerCase()));
    if (filters.catId) {
      const ids = allChildIds(filters.catId);
      list = list.filter(p => p.category_id && ids.has(p.category_id));
    }
    if (filters.brandId) list = list.filter(p => p.brand_id === filters.brandId);
    if (filters.productType) list = list.filter(p => p.product_type === filters.productType);
    if (filters.inStockOnly) {
      list = list.filter(p => {
        const vs = productVariants.get(p.id) || [];
        if (p.product_type === 'variable') return vs.some(v => v.stock > 0);
        return p.stock > 0;
      });
    }
    if (filters.priceRange[0] !== filters.priceRange[1]) {
      const [lo, hi] = filters.priceRange;
      list = list.filter(p => { const pr = cheapPrice(p); return pr >= lo && pr <= hi; });
    }
    list = [...list].sort((a, b) => {
      if (sort === 'featured') return Number(b.featured) - Number(a.featured);
      if (sort === 'name_az') return a.name.localeCompare(b.name);
      if (sort === 'name_za') return b.name.localeCompare(a.name);
      if (sort === 'newest') return String(b.created_at || '').localeCompare(String(a.created_at || ''));
      const diff = cheapPrice(a) - cheapPrice(b);
      return sort === 'price_low' ? diff : sort === 'price_high' ? -diff : 0;
    });
    return list;
  }, [products, search, filters, sort, productVariants, allChildIds]);

  const topCats = categories.filter(c => !c.parent_id);
  const hasActiveFilters = !!(filters.catId || filters.brandId || filters.productType || filters.inStockOnly);

  const resetFilters = () => {
    setSearch('');
    setFilters(f => ({ ...emptyFilters, maxPriceCap: f.maxPriceCap, priceRange: [0, f.maxPriceCap] }));
    setSort('featured');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600"><Package className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Shop</h1>
            <p className="text-xs text-slate-500">{products.length} products · Simple &amp; variable · {categories.length} categories</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-indigo-500" /> Fast delivery</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Genuine &amp; easy returns</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col md:flex-row gap-2 md:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-9 pr-9 py-2 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(v => !v)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${showFilters || hasActiveFilters ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {hasActiveFilters && <span className="px-1 text-[10px] bg-white text-indigo-600 rounded-full font-black">!</span>}
          </button>
          <label className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
            <Layers className="w-4 h-4" />
            <select value={sort} onChange={e => setSort(e.target.value)} className="bg-transparent font-bold text-slate-700 focus:outline-none">
              <option value="featured">Featured</option>
              <option value="price_low">Price: Low → High</option>
              <option value="price_high">Price: High → Low</option>
              <option value="name_az">Name: A → Z</option>
              <option value="name_za">Name: Z → A</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button onClick={() => setFilters(f => ({ ...f, catId: '' }))} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${!filters.catId ? 'bg-indigo-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'}`}>All Products</button>
        {topCats.map(c => (
          <button key={c.id} onClick={() => setFilters(f => ({ ...f, catId: f.catId === c.id ? '' : c.id }))} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filters.catId === c.id ? 'bg-indigo-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'}`}>{c.name}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {showFilters && (
          <aside className="order-1 lg:order-none lg:col-span-1">
            <FilterSidebar
              categories={topCats}
              brands={brands}
              filters={filters}
              setFilters={setFilters}
              onReset={resetFilters}
            />
          </aside>
        )}

        <div className={showFilters ? 'order-2 lg:col-span-3' : 'lg:col-span-4'}>
          {error && (
            <div className="flex flex-col items-center justify-center gap-3 p-10 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
              <AlertCircle className="w-8 h-8" />
              <p>Could not load products: {error}</p>
              <button onClick={load} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl"><RefreshCw className="w-3.5 h-3.5" /> Retry</button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600 mb-1">No products found</p>
              <p className="text-slate-400 mb-4">Try adjusting your search or filters.</p>
              <button onClick={resetFilters} className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="text-xs text-slate-500 mb-3">Showing <b className="text-slate-800">{filtered.length}</b> of {products.length} products</div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(p => {
                  const vs = productVariants.get(p.id) || [];
                  const hasStock = p.product_type === 'variable' ? vs.some(v => v.stock > 0) : p.stock > 0;
                  return (
                    <ProductCard
                      key={p.id}
                      product={p}
                      categoryName={catMap.get(p.category_id || '') || ''}
                      brandName={brandMap.get(p.brand_id || '') || ''}
                      variantCount={vs.length}
                      hasStock={hasStock}
                      onOpen={() => navigate(`/shop/${p.id}`)}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ==================== FILTER SIDEBAR ==================== */
const FilterSidebar: React.FC<{
  categories: EcCategory[];
  brands: EcBrand[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onReset: () => void;
}> = ({ categories, brands, filters, setFilters, onReset }) => {
  const update = (patch: Partial<FilterState>) => setFilters(f => ({ ...f, ...patch }));
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-5 sticky top-24">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-900 text-sm">Filters</h3>
        <button onClick={onReset} className="text-xs font-bold text-indigo-600 hover:underline">Reset</button>
      </div>

      {/* Price range */}
      <div>
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Price Range</p>
        <div className="space-y-2">
          <input type="range" min={0} max={filters.maxPriceCap || 1000000} step={500}
            value={filters.priceRange[1]} onChange={e => update({ priceRange: [filters.priceRange[0], Number(e.target.value)] })} className="w-full accent-indigo-500" />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>₹0</span>
            <span className="font-bold text-slate-800">Up to ₹{Number(filters.priceRange[1]).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Category */}
      <div>
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Category</p>
        <div className="space-y-1">
          {categories.map(c => (
            <button key={c.id} onClick={() => update({ catId: filters.catId === c.id ? '' : c.id })}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.catId === c.id ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div>
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Brand</p>
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {brands.map(b => (
            <button key={b.id} onClick={() => update({ brandId: filters.brandId === b.id ? '' : b.id })}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.brandId === b.id ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div>
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Product Type</p>
        <div className="space-y-1">
          {(['', 'simple', 'variable'] as const).map(t => (
            <button key={t} onClick={() => update({ productType: filters.productType === t ? '' : t })}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filters.productType === t ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {t === '' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* In stock */}
      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
        <input type="checkbox" checked={filters.inStockOnly} onChange={e => update({ inStockOnly: e.target.checked })} className="w-4 h-4 accent-indigo-500" />
        <span className="text-xs font-bold">In stock only</span>
      </label>
    </div>
  );
};

/* ==================== PRODUCT CARD ==================== */
const ProductCard: React.FC<{
  product: EcProduct;
  categoryName: string;
  brandName: string;
  variantCount: number;
  hasStock: boolean;
  onOpen: () => void;
}> = ({ product, categoryName, brandName, variantCount, hasStock, onOpen }) => {
  const price = product.sale_price ?? product.price;
  const off = product.sale_price != null && product.price > 0 ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0;
  const isVariable = product.product_type === 'variable';

  return (
    <div onClick={onOpen} className="cursor-pointer group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col">
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        <img src={product.images?.[0] || 'https://placehold.co/300x300?text=No+Img'} alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x300?text=No+Img'; }} />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.featured && <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-400 text-amber-950 text-[10px] font-black rounded-full"><Star className="w-3 h-3 fill-amber-950" /> Featured</span>}
          {off > 0 && <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full">{off}% OFF</span>}
        </div>
        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${isVariable ? 'bg-purple-500 text-white' : 'bg-sky-500 text-white'}`}>{product.product_type}</span>
        {!hasStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1 bg-slate-900/80 text-white text-xs font-black rounded-full">Out of stock</span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <div className="text-[11px] text-slate-500 truncate">{categoryName || (brandName || 'General')}</div>
        <div className="font-bold text-slate-900 text-sm line-clamp-2 min-h-[2.5rem]">{product.name}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-black text-indigo-600">₹{Number(price).toLocaleString('en-IN')}</span>
          {product.sale_price != null && <span className="text-xs text-slate-400 line-through">₹{Number(product.price).toLocaleString('en-IN')}</span>}
        </div>
        <div className="mt-auto pt-2">
          {isVariable ? (
            <div className="text-[10px] text-slate-500 mb-1.5">{variantCount > 0 ? `${variantCount} variant${variantCount > 1 ? 's' : ''} available` : 'Select options'}</div>
          ) : (
            <div className={`text-[10px] mb-1.5 font-medium ${hasStock ? 'text-emerald-600' : 'text-red-500'}`}>
              {hasStock ? `${product.stock} in stock` : 'Out of stock'}
            </div>
          )}
          <span className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-black rounded-xl group-hover:bg-indigo-500 transition-colors">
            <ShoppingBagIcon /> {isVariable ? 'Select Options' : 'Add to Cart'}
          </span>
        </div>
      </div>
    </div>
  );
};

const ShoppingBagIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);

/* ==================== SKELETON CARD ==================== */
const SkeletonCard: React.FC = () => (
  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-pulse">
    <div className="aspect-square bg-slate-200"></div>
    <div className="p-3 space-y-2">
      <div className="h-2.5 bg-slate-200 rounded w-1/3"></div>
      <div className="h-3.5 bg-slate-200 rounded w-3/4"></div>
      <div className="h-5 bg-slate-200 rounded w-1/4"></div>
      <div className="h-8 bg-slate-200 rounded-xl"></div>
    </div>
  </div>
);
