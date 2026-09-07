import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ShoppingCart, Star, Check, Minus, Plus, Loader2, Truck, ShieldCheck, X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { ecommerce } from '../db/ecommerce';
import { useCart } from '../context/CartContext';
import { EcProduct, EcVariant, EcCategory, EcAttributeGroupWithValues } from '../types/ecommerce';

export const EcProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<EcProduct | null>(null);
  const [variants, setVariants] = useState<EcVariant[]>([]);
  const [category, setCategory] = useState<EcCategory | null>(null);
  const [attrGroups, setAttrGroups] = useState<EcAttributeGroupWithValues[]>([]);
  const [assignedAttrMap, setAssignedAttrMap] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<EcVariant | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState<string>('');
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [viewerIndex, setViewerIndex] = useState(0);

  const normalizeImageList = (value: unknown): string[] => {
    if (!value) return [];
    const raw = Array.isArray(value) ? value : [value];
    return raw
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          const candidate = (item as any).url || (item as any).image || (item as any).src;
          return typeof candidate === 'string' ? candidate.trim() : '';
        }
        return '';
      })
      .filter((url): url is string => Boolean(url));
  };

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await ecommerce.getProduct(id);
      if (!p) { setError('Product not found'); setLoading(false); return; }
      setProduct(p);
      const v = await ecommerce.listVariants(p.id);
      setVariants(v.filter(x => x.is_active !== false));
      // Load assigned attribute groups + their values for display
      const pag = await ecommerce.listProductAttributeGroups(p.id);
      const groups: EcAttributeGroupWithValues[] = [];
      const map: Record<string, string> = {};
      for (const g of pag) {
        const attr = await ecommerce.getAttributeById(g.attribute_id);
        if (attr) {
          const values = await ecommerce.listAttributeValues(attr.id);
          groups.push({ ...attr, values });
        }
      }
      // Map lowercase key → group display name
      for (const g of groups) {
        map[g.slug.toLowerCase()] = g.name;
      }
      setAttrGroups(groups);
      setAssignedAttrMap(map);
      if (p.category_id) {
        const cats = await ecommerce.listCategories();
        setCategory(cats.find(c => c.id === p.category_id) || null);
      }
      if (v.length) setSelected(v[0]);
      const initialGallery = [
        ...normalizeImageList(v[0]?.images),
        ...normalizeImageList(v[0]?.image),
        ...normalizeImageList(p.images),
      ];
      setActiveImage(initialGallery[0] || '');
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

  const variantAttrGroups: Record<string, string[]> = {};
  variants.forEach(v => Object.entries(v.attributes || {}).forEach(([k, val]) => {
    (variantAttrGroups[k] = variantAttrGroups[k] || []).push(String(val));
  }));
  Object.keys(variantAttrGroups).forEach(k => { variantAttrGroups[k] = [...new Set(variantAttrGroups[k])]; });
  const selectableByAttr = (attrKey: string, attrVal: string) => variants.filter(v => String(v.attributes?.[attrKey]) === attrVal);

  const groupLabel = (key: string): string => assignedAttrMap[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1);
  const gallery = (() => {
    const variantImages = [
      ...normalizeImageList(selected?.images),
      ...normalizeImageList(selected?.image),
    ];
    const productImages = normalizeImageList(product?.images);
    return [...new Set([...variantImages, ...productImages])];
  })();

  useEffect(() => {
    if (!isImageOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsImageOpen(false);
      if (event.key === 'ArrowLeft' && gallery.length > 1) moveViewer(-1);
      if (event.key === 'ArrowRight' && gallery.length > 1) moveViewer(1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gallery.length, isImageOpen]);

  const mainImage = activeImage || gallery[0] || 'https://placehold.co/600x600?text=No+Img';
  const openImageViewer = () => {
    const selectedIndex = gallery.indexOf(mainImage);
    setViewerIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setImageZoom(1);
    setIsImageOpen(true);
  };
  const selectGalleryImage = (image: string, index: number) => {
    setActiveImage(image);
    setViewerIndex(index);
  };
  const moveViewer = (direction: number) => {
    if (gallery.length < 2) return;
    setViewerIndex(current => {
      const nextIndex = (current + direction + gallery.length) % gallery.length;
      setActiveImage(gallery[nextIndex]);
      return nextIndex;
    });
    setImageZoom(1);
  };
  const viewerImage = gallery[viewerIndex] || mainImage;
  const changeImageZoom = (amount: number) => {
    setImageZoom(current => Math.min(3, Math.max(1, Number((current + amount).toFixed(2)))));
  };

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
          <div className="group relative aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={openImageViewer}
              className="block h-full w-full cursor-zoom-in"
              title="Open image viewer"
            >
              <img
                src={mainImage}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={e => {
                  const fallback = 'https://placehold.co/600x600?text=No+Img';
                  const target = e.target as HTMLImageElement;
                  if (target.src !== fallback) target.src = fallback;
                }}
              />
              <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/70 px-3 py-1.5 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn className="h-3.5 w-3.5" /> View larger
              </span>
            </button>
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={event => { event.stopPropagation(); moveViewer(-1); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-800 shadow-lg transition hover:bg-white"
                  aria-label="Previous product image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={event => { event.stopPropagation(); moveViewer(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-800 shadow-lg transition hover:bg-white"
                  aria-label="Next product image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-3 left-3 rounded-full bg-slate-950/70 px-2.5 py-1 text-[11px] font-bold text-white">
                  {Math.min(viewerIndex + 1, gallery.length)} / {gallery.length}
                </span>
              </>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {gallery.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => selectGalleryImage(img, i)}
                  className={`shrink-0 rounded-xl border-2 transition-all ${activeImage === img ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-indigo-400'}`}
                  title={`View image ${i + 1}`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-16 h-16 rounded-[10px] object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x64?text=Img'; }}
                  />
                </button>
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
              {Object.entries(variantAttrGroups).map(([attrKey, values]) => (
                <div key={attrKey}>
                  <p className="text-xs font-extrabold text-slate-700 uppercase mb-1.5">{groupLabel(attrKey)}</p>
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

      {isImageOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} image viewer`}
          onClick={event => {
            if (event.target === event.currentTarget) setIsImageOpen(false);
          }}
        >
          <button
            type="button"
            onClick={() => setIsImageOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20"
            aria-label="Close image viewer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex max-h-full max-w-full flex-col items-center gap-4">
            <div
              className="relative max-h-[75vh] max-w-[92vw] overflow-auto rounded-2xl bg-white/5 p-2 sm:max-w-[85vw]"
              onWheel={event => {
                event.preventDefault();
                changeImageZoom(event.deltaY < 0 ? 0.25 : -0.25);
              }}
            >
              <img
                src={viewerImage}
                alt={product.name}
                className="max-h-[72vh] max-w-[88vw] object-contain transition-transform duration-200 sm:max-w-[80vw]"
                style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center center' }}
                onError={event => {
                  const fallback = 'https://placehold.co/600x600?text=No+Img';
                  const target = event.target as HTMLImageElement;
                  if (target.src !== fallback) target.src = fallback;
                }}
              />
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => moveViewer(-1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-950/70 p-2.5 text-white hover:bg-slate-950"
                    aria-label="Previous product image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveViewer(1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-950/70 p-2.5 text-white hover:bg-slate-950"
                    aria-label="Next product image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex max-w-[92vw] gap-2 overflow-x-auto rounded-xl bg-white/10 p-2 sm:max-w-[80vw]">
                {gallery.map((image, index) => (
                  <button
                    key={`${image}-viewer-${index}`}
                    type="button"
                    onClick={() => {
                      selectGalleryImage(image, index);
                      setImageZoom(1);
                    }}
                    className={`shrink-0 rounded-lg border-2 p-0.5 ${viewerIndex === index ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    aria-label={`View product image ${index + 1}`}
                  >
                    <img src={image} alt="" className="h-14 w-14 rounded-md object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 rounded-full bg-white/10 p-1.5 text-white">
              <button type="button" onClick={() => changeImageZoom(-0.25)} disabled={imageZoom <= 1} className="rounded-full p-2 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Zoom out">
                <ZoomOut className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setImageZoom(1)} className="rounded-full p-2 hover:bg-white/15" aria-label="Reset zoom">
                <RotateCcw className="h-4 w-4" />
              </button>
              <span className="min-w-12 text-center text-xs font-bold">{Math.round(imageZoom * 100)}%</span>
              <button type="button" onClick={() => changeImageZoom(0.25)} disabled={imageZoom >= 3} className="rounded-full p-2 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Zoom in">
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
