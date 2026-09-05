import { EcProductType } from '../types/ecommerce';

/**
 * CSV Product Import utilities for the Admin App (Product / Catalog module).
 *
 * Supports bulk import of Simple & Variable products. Maps the following CSV
 * columns: Product Name, SKU, Product Type, Category, Brand, Description,
 * Price, Sale Price, Stock, Images, Attributes, Variants, Status.
 *
 * A product row can be CREATED (new SKU) or UPDATED (existing SKU).
 */

export const PRODUCT_CSV_COLUMNS = [
  'Product Name',
  'SKU',
  'Product Type',
  'Category',
  'Brand',
  'Description',
  'Price',
  'Sale Price',
  'Stock',
  'Images',
  'Attributes',
  'Size Available',
  'Variants',
  'Status',
] as const;

export interface ParsedProductRow {
   line: number; // 1-based line in the file (includes header)
  raw: Record<string, string>;
  name: string;
  sku: string;
  productType: string;
  category: string;
  brand: string;
  description: string;
  price: string;
  salePrice: string;
  stock: string;
  images: string;
  attributes: string;
  sizeAvailable: string;
  variants: string;
  status: string;
}

export interface ProductImportVariant {
  sku: string;
  price: number;
  salePrice: number | null;
  stock: number;
  attributes: Record<string, string>;
  image?: string;
}

export interface ValidatedProductRow {
  line: number;
  name: string;
  sku: string;
  productType: EcProductType;
  category: string;
  brand: string;
  description: string;
  price: number;
  salePrice: number | null;
  stock: number;
   images: string[];
  attributes: Record<string, string>;
  sizes: string[];
  variants: ProductImportVariant[];
  status: 'active' | 'inactive';
  action: 'create' | 'update';
  errors: string[];
}

export interface ProductValidationResult {
  rows: ValidatedProductRow[];
  errors: ValidatedProductRow[];
  valid: ValidatedProductRow[];
  hasErrors: boolean;
}

/** Low-level CSV parser. Handles quoted fields, escaped quotes and BOM. */
export function parseCSVRows(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push(cur.trim());
      cur = '';
    } else if ((c === '\n' || c === '\r') && !inQuotes) {
      if (cur.trim() || row.some(v => v !== '')) {
        row.push(cur.trim());
        if (row.some(v => v !== '')) rows.push(row);
      }
      row = [];
      cur = '';
      if (c === '\r' && text[i + 1] === '\n') i++;
    } else {
      cur += c;
    }
  }
  if (cur.trim() || row.some(v => v !== '')) {
    row.push(cur.trim());
    if (row.some(v => v !== '')) rows.push(row);
  }
  return rows;
}

const norm = (s: string) => s.toLowerCase().replace(/[\s_]+/g, ' ').trim();

function columnIndex(headers: string[], ...names: string[]): { index: number; header: string } | null {
  for (let i = 0; i < headers.length; i++) {
    const h = norm(headers[i]);
    if (names.some(n => norm(n) === h)) return { index: i, header: headers[i].trim() };
  }
  return null;
}

const REQUIRED_COLUMNS = [
  { names: ['Product Name'], label: 'Product Name' },
  { names: ['SKU'], label: 'SKU' },
  { names: ['Product Type'], label: 'Product Type' },
  { names: ['Price'], label: 'Price' },
];

/**
 * Parse raw CSV text into normalized product rows. Throws on missing or
 * unrecognized required columns so the admin can fix the template first.
 */
export function parseProductCSV(csvText: string): ParsedProductRow[] {
  const rows = parseCSVRows(csvText);
  if (rows.length === 0) return [];
  const headers = rows[0].map(norm);

  const missing = REQUIRED_COLUMNS.filter(({ names }) => !columnIndex(headers, ...names));
  if (missing.length) {
    throw new Error(`Missing required CSV column(s): ${missing.map(m => m.label).join(', ')}.`);
  }

  const getCol = (...names: string[]) => columnIndex(headers, ...names)?.index ?? -1;
  const idx = {
    name: getCol('Product Name'),
    sku: getCol('SKU'),
    productType: getCol('Product Type'),
    category: getCol('Category'),
    brand: getCol('Brand'),
    description: getCol('Description'),
    price: getCol('Price'),
    salePrice: getCol('Sale Price', 'Saleprice'),
    stock: getCol('Stock'),
    images: getCol('Images', 'Image'),
    attributes: getCol('Attributes', 'Attribute'),
    sizeAvailable: getCol('Size Available', 'Sizes', 'size_available'),
    variants: getCol('Variants'),
    status: getCol('Status'),
  };

  const rawHeaders = rows[0];
  const result: ParsedProductRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const get = (ci: number) => (ci >= 0 && ci < r.length ? r[ci] : '');
    const map: Record<string, string> = {};
    rawHeaders.forEach((h, j) => { map[h] = j < r.length ? r[j] : ''; });

    result.push({
      line: i + 1,
      raw: map,
      name: get(idx.name),
      sku: get(idx.sku),
      productType: get(idx.productType),
      category: get(idx.category),
      brand: get(idx.brand),
      description: get(idx.description),
      price: get(idx.price),
      salePrice: get(idx.salePrice),
      stock: get(idx.stock),
       images: get(idx.images),
       attributes: get(idx.attributes),
       sizeAvailable: get(idx.sizeAvailable),
       variants: get(idx.variants),
       status: get(idx.status),
     });
  }
  return result;
}

function parseKeyValues(value: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!value) return out;
  value.split('|').concat(value || []).filter(Boolean).forEach(part => {
    const [k, ...rest] = part.split(/[:=]/);
    const key = (k || '').trim();
    if (key) out[key] = rest.join(':').trim();
  });
  return out;
}

/** Parse a `Size Available` column (e.g. "M, L, XL") into a de-duplicated list of
 *  size values, preserving the first-seen order. These are reused to create the
 *  "Size" attribute values and to auto-generate variable-product variants. */
export function parseSizes(value: string): string[] {
  if (!value) return [];
  return Array.from(new Set(
    value.split(/,|;|\|/).map((s) => s.trim()).filter(Boolean),
  ));
}

/** Auto-generate one variant per size for a variable product. Each variant
 *  inherits the product's base price, sale price and stock and carries a
 *  `size` attribute plus an auto-derived SKU. */
export function buildSizeVariants(opts: {
  sku: string;
  price: number;
  salePrice: number | null;
  stock: number;
  image?: string;
  sizes: string[];
} & Record<string, any>): ProductImportVariant[] {
  const { sku, price, salePrice, stock, image, sizes, ...attrs } = opts;
  return sizes.map((size) => ({
    sku: `${sku}-${String(size).replace(/\s+/g, '-')}`,
    price,
    salePrice,
    stock,
    attributes: { ...(attrs as Record<string, string>), size },
    image,
  }));
}

/** Parse the Variants column into structured variant records + errors. */
export function parseVariantsText(raw: string): { variants: ProductImportVariant[]; errors: string[] } {
  const errors: string[] = [];
  const variants: ProductImportVariant[] = [];
  if (!raw.trim()) return { variants, errors: ['Variable product must have at least one variant.'] };
  const segments = raw.split(';').map(s => s.trim()).filter(Boolean);
  segments.forEach((seg, idx) => {
    const entry: ProductImportVariant = { sku: '', price: 0, salePrice: null, stock: 0, attributes: {} };
    seg.split('|').map(p => p.trim()).filter(Boolean).forEach(part => {
      const [kRaw, ...rest] = part.split(/[:=]/);
      const key = (kRaw || '').trim().toLowerCase();
      const val = rest.join(':').trim();
      if (key === 'sku') entry.sku = val;
      else if (key === 'price') entry.price = parseFloat(val);
      else if (key === 'sale' || key === 'sale_price' || key === 'saleprice') entry.salePrice = val ? parseFloat(val) : null;
      else if (key === 'stock') entry.stock = parseInt(val, 10);
      else if (key === 'image') entry.image = val;
      else if (key) entry.attributes[(kRaw || '').trim()] = val;
    });
    if (!entry.sku) errors.push(`Variant ${idx + 1}: SKU is required.`);
    if (!(entry.price > 0)) errors.push(`Variant ${idx + 1}${entry.sku ? ` (${entry.sku})` : ''}: price must be a number greater than 0.`);
    if (!Number.isInteger(entry.stock) || entry.stock < 0) errors.push(`Variant ${idx + 1}${entry.sku ? ` (${entry.sku})` : ''}: stock must be a non-negative whole number.`);
    variants.push(entry);
  });
  return { variants, errors };
}

function parseStatus(value: string): { status: 'active' | 'inactive'; error?: string } {
  const v = (value || '').trim().toLowerCase();
  if (!v || v === 'active' || v === '1' || v === 'true' || v === 'yes' || v === 'in-stock' || v === 'enabled') {
    return { status: 'active' };
  }
  if (v === 'inactive' || v === '0' || v === 'false' || v === 'no' || v === 'disabled' || v === 'out-of-stock') {
    return { status: 'inactive' };
  }
  return { status: 'active', error: `Invalid status "${value}". Use active or inactive.` };
}

export interface ProductValidationOptions {
  existingSkus: Set<string>; // lowercase existing product SKUs
  categoryNames: string[];   // case-insensitive match targets
  brandNames: string[];      // case-insensitive match targets
  strict?: boolean;
}

/**
 * Validate every parsed row and produce row-by-row errors so the admin can
 * review before importing. Applies required-field, price, stock, SKU-duplicate,
 * category/brand and variant checks.
 */
export function validateProductRows(
  parsed: ParsedProductRow[],
  opts: ProductValidationOptions,
): ProductValidationResult {
  const existingSkus = new Set(Array.from(opts.existingSkus).map(s => s.toLowerCase()));
  const categoryNames = opts.categoryNames.map(c => c.trim().toLowerCase());
  const brandNames = opts.brandNames.map(b => b.trim().toLowerCase());
  const seenSkus = new Map<string, number>(); // lowercase sku -> first line
  const rows: ValidatedProductRow[] = [];

  parsed.forEach(p => {
    const errors: string[] = [];
    const name = p.name.trim();
    const sku = p.sku.trim();
    const productTypeVal = p.productType.trim().toLowerCase();

    if (!name) errors.push('Product Name is required.');
    let productType: EcProductType = 'simple';
    if (productTypeVal !== 'simple' && productTypeVal !== 'variable') {
      errors.push(`Product Type "${p.productType}" is invalid. Use "simple" or "variable".`);
    } else {
      productType = productTypeVal as EcProductType;
    }

    if (!sku) {
      errors.push('SKU is required.');
    } else if (!existingSkus.has(sku.toLowerCase()) && seenSkus.has(sku.toLowerCase())) {
      errors.push(`Duplicate SKU inside file — first used on line ${seenSkus.get(sku.toLowerCase())}.`);
    } else if (!existingSkus.has(sku.toLowerCase())) {
      seenSkus.set(sku.toLowerCase(), p.line);
    }

    let category = '';
    if (p.category.trim()) {
      category = p.category.trim();
      if (!categoryNames.includes(category.toLowerCase())) {
        errors.push(`Category "${category}" not found. Create it first in the Categories tab.`);
      }
    }
    let brand = '';
    if (p.brand.trim()) {
      brand = p.brand.trim();
      if (!brandNames.includes(brand.toLowerCase())) {
        errors.push(`Brand "${brand}" not found. Create it first in the Brands tab.`);
      }
    }

    const price = parseFloat(p.price);
    if (p.price.trim() === '' || isNaN(price) || price <= 0) {
      errors.push('Price is required and must be a number greater than 0.');
    }
    let salePrice: number | null = null;
    if (p.salePrice.trim() !== '') {
      const sp = parseFloat(p.salePrice);
      if (isNaN(sp) || sp < 0) {
        errors.push('Sale Price must be a non-negative number.');
      } else {
        salePrice = sp;
        if (!isNaN(price) && price > 0 && sp >= price) {
          errors.push('Sale Price must be lower than Price.');
        }
      }
    }

    let stock = 0;
    if (p.stock.trim() !== '') {
      stock = parseInt(p.stock, 10);
      if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
        errors.push('Stock must be a non-negative whole number.');
      }
    }

    const images = Array.from(new Set(
      p.images.split('|').concat(p.images.includes('|') ? [] : p.images.split(',')).map(s => s.trim()).filter(Boolean),
    ));
    const attributes = parseKeyValues(p.attributes);
    const sizes = parseSizes(p.sizeAvailable);

    let variants: ProductImportVariant[] = [];
    if (productType === 'variable') {
      if (p.variants.trim()) {
        const v = parseVariantsText(p.variants);
        variants = v.variants;
        v.errors.forEach((e) => errors.push(e));
      } else if (sizes.length) {
        // No explicit Variants column — auto-generate one variant per size,
        // inheriting the product's price / sale price / stock / first image.
        variants = buildSizeVariants({
          sku,
          price: isNaN(price) ? 0 : price,
          salePrice,
          stock,
          image: images[0],
          sizes,
        });
      }
      if (variants.length === 0) {
        errors.push('Variable product must provide variants via the Variants column, the Size Available column, or both.');
      }

      // Unique SKU check across auto-generated / explicit variants in this file.
      const seenVariantSkus = new Set<string>();
      variants.forEach((v) => {
        const ls = (v.sku || '').toLowerCase();
        if (!ls) return;
        if (seenVariantSkus.has(ls)) errors.push(`Duplicate variant SKU "${v.sku}" for product SKU "${sku}".`);
        seenVariantSkus.add(ls);
      });
    }

    const statusRes = parseStatus(p.status);
    if (statusRes.error) errors.push(statusRes.error);

    rows.push({
      line: p.line,
      name: name || p.name,
      sku,
      productType,
      category,
      brand,
      description: p.description.trim(),
      price: isNaN(price) ? 0 : price,
      salePrice,
      stock,
       images,
       attributes,
       sizes,
       variants,
      status: statusRes.status,
      action: sku && existingSkus.has(sku.toLowerCase()) ? 'update' : 'create',
      errors,
    });
  });

  const valid = rows.filter(r => r.errors.length === 0);
  const invalid = rows.filter(r => r.errors.length > 0);
  return { rows, errors: invalid, valid, hasErrors: invalid.length > 0 };
}

/** Generates the downloadable CSV template (header + 2 example rows). */
export function generateProductCSVTemplate(): string {
  const header = PRODUCT_CSV_COLUMNS.join(',');
  const exampleSimple =
    'Samsung Galaxy S25,GS25-256-BLK,simple,Mobiles & Tablets,Samsung,"Flagship smartphone with 50MP camera.",79999,74999,30,https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600|https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600,color:Black,,active';
  const exampleVariable =
    'Apple MacBook Air M4,MBA-M4-BASE,variable,Laptops & Computers,Apple,"Ultra-thin laptop with Apple M4 chip.",114900,99900,0,https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600,ram:base,"M, L, XL",,active';
  return [header, exampleSimple, exampleVariable].join('\n');
}

/** Trigger a browser download of the provided text as a file. */
export function downloadTextFile(filename: string, content: string, mime = 'text/csv'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}