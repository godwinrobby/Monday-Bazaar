import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  EcCategory, EcBrand, EcProduct, EcVariant, EcCoupon, EcCustomer,
  EcPaymentMethod, EcShippingMethod, EcOrder, EcOrderItem, EcProductType,
} from '../types/ecommerce';
import { generateSalt, hashPassword, verifyPassword } from '../utils/auth';

// E-commerce data service — client-side Supabase integration shared by the
// Admin and User apps (products, variants, categories, brands, orders,
// coupons, payments, shipping). RLS is permissive so the anon key works.

class SupabaseEcommerce {
  client: SupabaseClient;

  constructor() {
    const url = (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || 'https://pmvnyxpyypifneqojlqq.supabase.co';
    const key = (typeof process !== 'undefined' && (process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY)) || 'sb_publishable_QdwxI3KvRW5Ro-vY5XPuQg_Cg4mLVdD';
    this.client = createClient(String(url).trim(), String(key).trim(), { auth: { persistSession: false } });
  }

  private error(e: any): never {
    throw new Error(e?.message || 'E-commerce database error');
  }

  private mapProduct(r: any): EcProduct {
    return {
      id: r.id, name: r.name, slug: r.slug, product_type: r.product_type,
      description: r.description, brand_id: r.brand_id, category_id: r.category_id,
      price: Number(r.price || 0), sale_price: r.sale_price != null ? Number(r.sale_price) : null,
      sku: r.sku, stock: Number(r.stock || 0), images: Array.isArray(r.images) ? r.images : [],
      is_active: r.is_active !== false, featured: Boolean(r.featured), created_at: r.created_at,
    };
  }

  private mapVariant(r: any): EcVariant {
    return {
      id: r.id, product_id: r.product_id, sku: r.sku, price: Number(r.price || 0),
      sale_price: r.sale_price != null ? Number(r.sale_price) : null, stock: Number(r.stock || 0),
      attributes: r.attributes || {}, image: r.image, is_active: r.is_active !== false,
    };
  }

  private mapOrder(r: any): EcOrder {
    return {
      id: r.id, order_number: r.order_number, customer_id: r.customer_id,
      customer_name: r.customer_name,
      customer_email: r.customer_email, customer_phone: r.customer_phone,
      address: r.address || {}, status: r.status, payment_method: r.payment_method,
      payment_status: r.payment_status, shipping_method: r.shipping_method,
      shipping_charge: Number(r.shipping_charge || 0), subtotal: Number(r.subtotal || 0),
      discount: Number(r.discount || 0), coupon_code: r.coupon_code, total: Number(r.total || 0),
      tracking_number: r.tracking_number, tracking_company: r.tracking_company,
      notes: r.notes, created_at: r.created_at,
    };
  }

  private mapCoupon(r: any): EcCoupon {
    return {
      id: r.id, code: r.code, type: r.type, value: Number(r.value || 0),
      min_order: Number(r.min_order || 0), max_discount: r.max_discount != null ? Number(r.max_discount) : null,
      usage_limit: Number(r.usage_limit || 0), used: Number(r.used || 0),
      starts_at: r.starts_at, ends_at: r.ends_at, is_active: r.is_active !== false,
    };
  }

  async listProducts(): Promise<EcProduct[]> {
    const { data, error } = await this.client.from('ec_products').select('*').order('created_at', { ascending: false });
    if (error) this.error(error);
    return (data || []).map((r: any) => this.mapProduct(r));
  }

  async getProduct(id: string): Promise<EcProduct | null> {
    const { data, error } = await this.client.from('ec_products').select('*').eq('id', id).limit(1);
    if (error) this.error(error);
    return Array.isArray(data) && data[0] ? this.mapProduct(data[0]) : null;
  }

  async saveProduct(p: EcProduct): Promise<void> {
    const { error } = await this.client.from('ec_products').upsert({
      id: p.id || `ec-prod-${Date.now()}`,
      name: p.name,
      slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      product_type: p.product_type,
      description: p.description || '',
      brand_id: p.brand_id,
      category_id: p.category_id,
      price: p.price,
      sale_price: p.sale_price,
      sku: p.sku || '',
      stock: p.stock,
      images: Array.isArray(p.images) ? p.images : [],
      is_active: p.is_active !== false,
      featured: Boolean(p.featured),
    }, { onConflict: 'id' });
    if (error) this.error(error);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.client.from('ec_variants').delete().eq('product_id', id);
    const { error } = await this.client.from('ec_products').delete().eq('id', id);
    if (error) this.error(error);
  }

  async listVariants(productId?: string): Promise<EcVariant[]> {
    let q = this.client.from('ec_variants').select('*');
    if (productId) q = q.eq('product_id', productId);
    const { data, error } = await q.order('id');
    if (error) this.error(error);
    return (data || []).map((r: any) => this.mapVariant(r));
  }

  async saveVariant(v: EcVariant): Promise<void> {
    const { error } = await this.client.from('ec_variants').upsert({
      id: v.id || `ec-var-${Date.now()}`,
      product_id: v.product_id,
      sku: v.sku || '',
      price: v.price,
      sale_price: v.sale_price,
      stock: v.stock,
      attributes: v.attributes || {},
      image: v.image || '',
      is_active: v.is_active !== false,
    }, { onConflict: 'id' });
    if (error) this.error(error);
  }

  async deleteVariant(id: string): Promise<void> {
    const { error } = await this.client.from('ec_variants').delete().eq('id', id);
    if (error) this.error(error);
  }

  async listCategories(): Promise<EcCategory[]> {
    const { data, error } = await this.client.from('ec_categories').select('*').order('sort_order');
    if (error) this.error(error);
    return (data || []).map((r: any) => ({
      id: r.id, name: r.name, slug: r.slug, parent_id: r.parent_id, image: r.image,
      sort_order: r.sort_order, is_active: r.is_active !== false,
    }));
  }

  async saveCategory(c: EcCategory): Promise<void> {
    const { error } = await this.client.from('ec_categories').upsert({
      id: c.id || `ec-cat-${Date.now()}`,
      name: c.name,
      slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      parent_id: c.parent_id || null,
      image: c.image || '',
      sort_order: c.sort_order || 0,
      is_active: c.is_active !== false,
    }, { onConflict: 'id' });
    if (error) this.error(error);
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.client.from('ec_categories').delete().eq('id', id);
    if (error) this.error(error);
  }

  async listBrands(): Promise<EcBrand[]> {
    const { data, error } = await this.client.from('ec_brands').select('*').order('name');
    if (error) this.error(error);
    return (data || []).map((r: any) => ({
      id: r.id, name: r.name, slug: r.slug, logo: r.logo, description: r.description, is_active: r.is_active !== false,
    }));
  }

  async saveBrand(b: EcBrand): Promise<void> {
    const { error } = await this.client.from('ec_brands').upsert({
      id: b.id || `ec-brand-${Date.now()}`,
      name: b.name,
      slug: b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logo: b.logo || '', description: b.description || '', is_active: b.is_active !== false,
    }, { onConflict: 'id' });
    if (error) this.error(error);
  }

  async deleteBrand(id: string): Promise<void> {
    const { error } = await this.client.from('ec_brands').delete().eq('id', id);
    if (error) this.error(error);
  }

  async listOrders(): Promise<EcOrder[]> {
    const { data, error } = await this.client.from('ec_orders').select('*').order('created_at', { ascending: false });
    if (error) this.error(error);
    return (data || []).map((r: any) => this.mapOrder(r));
  }

  async getOrder(id: string): Promise<EcOrder | null> {
    const { data, error } = await this.client.from('ec_orders').select('*').eq('id', id).limit(1);
    if (error) this.error(error);
    if (!(Array.isArray(data) && data[0])) return null;
    const order = this.mapOrder(data[0]);
    order.items = await this.listOrderItems(id);
    return order;
  }

  async listOrderItems(orderId: string): Promise<EcOrderItem[]> {
    const { data, error } = await this.client.from('ec_order_items').select('*').eq('order_id', orderId);
    if (error) this.error(error);
    return (data || []).map((r: any) => ({
      id: r.id, order_id: r.order_id, product_id: r.product_id, variant_id: r.variant_id,
      product_name: r.product_name, sku: r.sku, quantity: Number(r.quantity || 1),
      unit_price: Number(r.unit_price || 0), total: Number(r.total || 0),
      image: r.image, attributes: r.attributes || {},
    }));
  }

  async saveOrder(order: EcOrder): Promise<void> {
    const { error } = await this.client.from('ec_orders').upsert({
      id: order.id || `ec-order-${Date.now()}`,
      order_number: order.order_number || this.genOrderNumber(),
      customer_id: order.customer_id || null,
      customer_name: order.customer_name, customer_email: order.customer_email,
      customer_phone: order.customer_phone, address: order.address || {},
      status: order.status || 'pending', payment_method: order.payment_method,
      payment_status: order.payment_status || 'pending', shipping_method: order.shipping_method,
      shipping_charge: order.shipping_charge || 0, subtotal: order.subtotal || 0,
      discount: order.discount || 0, coupon_code: order.coupon_code, total: order.total || 0,
      tracking_number: order.tracking_number, tracking_company: order.tracking_company,
      notes: order.notes,
    }, { onConflict: 'id' });
    if (error) this.error(error);
  }

  async placeOrder(order: EcOrder): Promise<string> {
    const id = order.id || `ec-order-${Date.now()}`;
    const orderNumber = order.order_number || this.genOrderNumber();
    await this.saveOrder({ ...order, id, order_number: orderNumber });
    for (const item of order.items || []) {
      const { error } = await this.client.from('ec_order_items').upsert({
        id: item.id || `ec-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order_id: id, product_id: item.product_id, variant_id: item.variant_id,
        product_name: item.product_name, sku: item.sku, quantity: item.quantity,
        unit_price: item.unit_price, total: item.total, image: item.image,
        attributes: item.attributes || {},
      }, { onConflict: 'id' });
      if (error) this.error(error);
    }
    // Decrement stock (simple product + variant)
    for (const item of order.items || []) {
      if (item.product_id) {
        const product = await this.getProduct(item.product_id);
        if (product) {
          await this.client.from('ec_products').update({ stock: Math.max(0, (product.stock || 0) - item.quantity) }).eq('id', product.id);
        }
      }
      if (item.variant_id) {
        const { data } = await this.client.from('ec_variants').select('stock').eq('id', item.variant_id).limit(1);
        if (Array.isArray(data) && data[0]) {
          await this.client.from('ec_variants').update({ stock: Math.max(0, Number(data[0].stock || 0) - item.quantity) }).eq('id', item.variant_id);
        }
      }
    }
    if (order.coupon_code) {
      const coupon = await this.getCouponByCode(order.coupon_code);
      if (coupon) {
        await this.client.from('ec_coupons').update({ used: (coupon.used || 0) + 1 }).eq('id', coupon.id);
      }
    }
    return id;
  }

  private genOrderNumber(): string {
    return `MB${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
  }


  async listShippingMethods(): Promise<EcShippingMethod[]> {
    const { data, error } = await this.client.from('ec_shipping_methods').select('*').order('sort_order');
    if (error) this.error(error);
    return (data || []).map((r: any) => ({
      id: r.id, name: r.name, charge: Number(r.charge || 0), min_order_free: Number(r.min_order_free || 0),
      estimated_days: r.estimated_days, enabled: r.enabled !== false, sort_order: r.sort_order,
    }));
  }

  async saveShippingMethod(s: EcShippingMethod): Promise<void> {
    const { error } = await this.client.from('ec_shipping_methods').upsert({
      id: s.id || `ec-ship-${Date.now()}`, name: s.name, charge: s.charge,
      min_order_free: s.min_order_free || 0, estimated_days: s.estimated_days || '',
      enabled: s.enabled !== false, sort_order: s.sort_order || 0,
    }, { onConflict: 'id' });
    if (error) this.error(error);
  }

  async listPaymentMethods(): Promise<EcPaymentMethod[]> {
    const { data, error } = await this.client.from('ec_payment_methods').select('*').order('sort_order');
    if (error) this.error(error);
    return (data || []).map((r: any) => ({
      id: r.id, name: r.name, enabled: r.enabled !== false, sort_order: r.sort_order,
    }));
  }

  async savePaymentMethod(p: EcPaymentMethod): Promise<void> {
    const { error } = await this.client.from('ec_payment_methods').upsert({
      id: p.id || `ec-pay-${Date.now()}`, name: p.name, enabled: p.enabled !== false, sort_order: p.sort_order || 0,
    }, { onConflict: 'id' });
    if (error) this.error(error);
  }

  async listCoupons(): Promise<EcCoupon[]> {
    const { data, error } = await this.client.from('ec_coupons').select('*').order('code');
    if (error) this.error(error);
    return (data || []).map((r: any) => this.mapCoupon(r));
  }

  async getCouponByCode(code: string): Promise<EcCoupon | null> {
    const { data, error } = await this.client.from('ec_coupons').select('*').ilike('code', String(code).trim()).limit(1);
    if (error) this.error(error);
    return Array.isArray(data) && data[0] ? this.mapCoupon(data[0]) : null;
  }

  async saveCoupon(c: EcCoupon): Promise<void> {
    const { error } = await this.client.from('ec_coupons').upsert({
      id: c.id || `ec-coupon-${Date.now()}`, code: String(c.code).toUpperCase().trim(), type: c.type,
      value: c.value, min_order: c.min_order || 0, max_discount: c.max_discount,
      usage_limit: c.usage_limit || 0, used: c.used || 0,
      starts_at: c.starts_at, ends_at: c.ends_at, is_active: c.is_active !== false,
    }, { onConflict: 'id' });
    if (error) this.error(error);
  }

  async deleteCoupon(id: string): Promise<void> {
    const { error } = await this.client.from('ec_coupons').delete().eq('id', id);
    if (error) this.error(error);
  }

  /* ==================== CUSTOMERS / AUTH ==================== */

  private mapCustomer(r: any): EcCustomer {
    return {
      id: r.id, name: r.name, email: r.email, phone: r.phone,
      password_hash: r.password_hash, password_salt: r.password_salt,
      status: r.status || 'active', address: r.address || {},
      last_login_at: r.last_login_at, created_at: r.created_at,
    };
  }

  async listCustomers(): Promise<EcCustomer[]> {
    const { data, error } = await this.client.from('ec_customers').select('*').order('created_at', { ascending: false });
    if (error) this.error(error);
    return (data || []).map((r: any) => this.mapCustomer(r));
  }

  async getCustomer(id: string): Promise<EcCustomer | null> {
    const { data, error } = await this.client.from('ec_customers').select('*').eq('id', id).limit(1);
    if (error) this.error(error);
    return Array.isArray(data) && data[0] ? this.mapCustomer(data[0]) : null;
  }

  async getCustomerByEmail(email: string): Promise<EcCustomer | null> {
    const { data, error } = await this.client.from('ec_customers').select('*').ilike('email', String(email).trim()).limit(1);
    if (error) this.error(error);
    return Array.isArray(data) && data[0] ? this.mapCustomer(data[0]) : null;
  }

  // Register a new customer. Passwords are hashed (PBKDF2 + salt) — never stored plaintext.
  async registerCustomer(input: { name?: string; email: string; phone?: string; password: string; address?: EcAddress }): Promise<EcCustomer> {
    const email = String(input.email).trim().toLowerCase();
    if (!email) throw new Error('Email is required');
    if (!input.password || input.password.length < 6) throw new Error('Password must be at least 6 characters');
    const existing = await this.getCustomerByEmail(email);
    if (existing) throw new Error('An account with this email already exists');
    const salt = generateSalt();
    const passwordHash = await hashPassword(input.password, salt);
    const id = `ec-cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await this.client.from('ec_customers').insert({
      id, name: input.name || '', email, phone: input.phone || '',
      password_hash: passwordHash, password_salt: salt,
      status: 'active', address: input.address || {},
    }).select().single();
    if (error) this.error(error);
    const c = this.mapCustomer(data);
    delete (c as any).password_hash;
    delete (c as any).password_salt;
    return c;
  }

  // Verify credentials. Returns the customer (without sensitive fields) or null.
  async loginCustomer(email: string, password: string): Promise<EcCustomer | null> {
    const customer = await this.getCustomerByEmail(email);
    if (!customer) return null;
    if (customer.status === 'blocked') throw new Error('This account has been blocked');
    if (customer.status === 'inactive') throw new Error('This account is inactive');
    const ok = await verifyPassword(password, customer.password_salt || '', customer.password_hash || '');
    if (!ok) return null;
    await this.client.from('ec_customers').update({ last_login_at: new Date().toISOString() }).eq('id', customer.id);
    const fresh = await this.getCustomer(customer.id);
    const result = fresh || customer;
    delete (result as any).password_hash;
    delete (result as any).password_salt;
    return result;
  }

  async updateCustomer(id: string, patch: Partial<EcCustomer>): Promise<EcCustomer> {
    const { data, error } = await this.client.from('ec_customers').update({
      name: patch.name, phone: patch.phone, address: patch.address, status: patch.status,
    }).eq('id', id).select().single();
    if (error) this.error(error);
    const c = this.mapCustomer(data);
    delete (c as any).password_hash;
    delete (c as any).password_salt;
    return c;
  }

  // Change password (requires current password).
  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 6) throw new Error('New password must be at least 6 characters');
    const customer = await this.getCustomer(id);
    if (!customer) throw new Error('Customer not found');
    const ok = await verifyPassword(currentPassword, customer.password_salt || '', customer.password_hash || '');
    if (!ok) throw new Error('Current password is incorrect');
    const salt = generateSalt();
    const passwordHash = await hashPassword(newPassword, salt);
    const { error } = await this.client.from('ec_customers').update({ password_hash: passwordHash, password_salt: salt }).eq('id', id);
    if (error) this.error(error);
  }

  // Forgot password: verify the email matches the account and set a new password.
  async resetPassword(email: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 6) throw new Error('New password must be at least 6 characters');
    const customer = await this.getCustomerByEmail(email);
    if (!customer) throw new Error('No account found with this email');
    const salt = generateSalt();
    const passwordHash = await hashPassword(newPassword, salt);
    const { error } = await this.client.from('ec_customers').update({ password_hash: passwordHash, password_salt: salt }).eq('id', customer.id);
    if (error) this.error(error);
  }

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await this.client.from('ec_customers').delete().eq('id', id);
    if (error) this.error(error);
  }

  async listOrdersByCustomer(customerId: string): Promise<EcOrder[]> {
    const { data, error } = await this.client.from('ec_orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
    if (error) this.error(error);
    return (data || []).map((r: any) => this.mapOrder(r));
  }
}

export const ecommerce = new SupabaseEcommerce();
export type { EcProductType };
