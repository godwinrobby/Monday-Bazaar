import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ShoppingCart, Star, Check, Minus, Plus, Loader2, Truck, ShieldCheck } from 'lucide-react';
import { ecommerce } from '../db/ecommerce';
import { useCart } from '../context/CartContext';
import { EcProduct, EcVariant, EcCategory } from '../types/ecommerce';

export const EcProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<EcProduct | null>(null);
  const [variants, setVariants] = useState<EcVariant[]>([]);
  const [category, setCategory] = useState<EcCategory | null>(null);
  const [selected, setSelected] = useState<EcVariant | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await ecommerce.getProduct(id);
      if (!p) { setError('Product not found'); setLoading(false); return; }
      setProduct(p);
      const v = await ecommerce.listVariants(p.id);
      setVariants(v.filter(x => x.is_active !== false));
      if (p.category_id) {
        const cats = await ecommerce.listCategories();
        setCategory(cats.find(c => c.id === p.category_id) || null);
      }
      if (v.length) setSelected(v[0]);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const price = selected ? (selected.sale_price ?? selected.price) : (product?.sale_price ?? product?.price ?? 0);
  const stock = selected ? selected.stock : (product?.stock ?? 0);
  const off = (product?.price || 0) > price && (product?.price || 0) > 0 ? Math.round(((product!.price! - price) / product!.price!) * 100) : 0;

  const addToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      variantId: selected?.id,
      productName: product.name,
      sku: selected?.sku || product.sku,
      price,
      image: selected?.image || product.images?.[0],
      attributes: selected?.attributes,
      quantity: qty,
      stock,
      productType: product.product_type,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const attrGroups: Record<string, string[]> = {};
  variants.forEach(v => Object.entries(v.attributes || {}).forEach(([k, val]) => { (attrGroups[k] = attrGroups[k] || []).push(String(val)); }));
  Object.keys(attrGroups).forEach(k => { attrGroups[k] = [...new Set(attrGroups[k])]; });
  const selectableByAttr = (attrKey: string, attrVal: string) => variants.filter(v => String(v.attributes?.[attrKey]) === attrVal);

  if (loading) return <div className="py-20 text-center text-slate-400"><Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />Loading product...</div>;
  if (error || !product) return (
    <div className="max-w-3xl mx-auto py-16 text-center space-y-3">
      <Package className="w-8 h-8 mx-auto text-slate-300" />
      <p className="text-slate-500 text-sm">{error || 'Product not found.'}</p>
      <Link to="/shop" className="inline-block px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl">Back to Shop</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 aspect-square">
            <img src={(selected?.image) || product.images?.[0] || 'https://placehold.co/600x600?text=No+Img'} alt={product.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600?text=No+Img'; }} />
          </div>
          {(product.images && product.images.length > 1) && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {product.images.map((img, i) => (
                <img key={i} src={img} data-thumb alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200 cursor-pointer hover:border-indigo-400" onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x64'; }} />
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          {category && <div className="flex items-center gap-1 text-[11px] text-slate-400"><Link to="/shop" className="hover:text-indigo-600">Shop</Link> <span>/</span> <span className="text-slate-600">{category.name}</span></div>}
          <h1 className="text-2xl font-black text-slate-900 leading-tight">{product.name}</h1>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${product.product_type === 'variable' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'}`}>{product.product_type} product</span>
            {product.featured && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700"><Star className="w-3 h-3 fill-amber-500" /> Featured</span>}
            {stock <= 0 && <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700">Out of stock</span>}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-indigo-600">₹{Number(price).toLocaleString('en-IN')}</span>
            {off > 0 && <span className="text-slate-400 line-through text-lg">₹{Number(product.price).toLocaleString('en-IN')}</span>}
            {off > 0 && <span className="text-emerald-600 font-bold text-sm">{off}% OFF</span>}
          </div>

          {product.sku && <p className="text-xs text-slate-400">SKU: <span className="font-mono">{selected?.sku || product.sku}</span></p>}

          {variants.length > 0 && (
            <div className="space-y-3">
              {Object.entries(attrGroups).map(([attrKey, values]) => (
                <div key={attrKey}>
                  <p className="text-xs font-extrabold text-slate-700 uppercase mb-1.5">{attrKey}</p>
                  <div className="flex flex-wrap gap-2">
                    {values.map(val => {
                      const active = selected && String(selected.attributes?.[attrKey]) === val;
                      return (
                        <button key={val} onClick={() => setSelected((selectableByAttr(attrKey, val) || [null])[0])} className={`px-3 py-1.5 rounded-xl border text-sm font-bold transition-all ${active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>{val}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <p className="text-xs text-emerald-600 font-bold flex items-center gap-1"><Check className="w-4 h-4" /> {selected ? `${stock} in stock` : 'Select an option to continue'}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-slate-50"><Minus className="w-4 h-4" /></button>
              <span className="px-3 font-bold text-sm">{qty}</span>
              <button onClick={() => setQty(Math.min(stock || 99, qty + 1))} className="px-3 py-2 hover:bg-slate-50"><Plus className="w-4 h-4" /></button>
            </div>
            <button onClick={addToCart} disabled={stock <= 0} className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${added ? 'bg-emerald-500 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}>
              {added ? <><Check className="w-5 h-5" /> Added to Cart</> : <><ShoppingCart className="w-5 h-5" /> Add to Cart</>}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 text-slate-600"><Truck className="w-5 h-5 text-indigo-500" /> Cash on Delivery &amp; fast shipping</div>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 text-slate-600"><ShieldCheck className="w-5 h-5 text-emerald-500" /> Genuine products, easy returns</div>
          </div>

          {product.description && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs font-extrabold text-slate-700 uppercase mb-1">Description</p>
              <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};