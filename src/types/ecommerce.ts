// E-commerce domain types (Admin + User App)

export type EcProductType = 'simple' | 'variable';

export interface EcCategory {
  id: string;
  name: string;
  slug?: string;
  parent_id?: string | null;
  image?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface EcBrand {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
  description?: string;
  is_active?: boolean;
}

export interface EcProduct {
  id: string;
  name: string;
  slug?: string;
  product_type: EcProductType;
  description?: string;
  brand_id?: string;
  category_id?: string;
  price: number;
  sale_price?: number | null;
  sku?: string;
  stock: number;
  images?: string[];
  is_active?: boolean;
  featured?: boolean;
  created_at?: string;
  // joined
  category_name?: string;
  brand_name?: string;
}

export interface EcVariant {
  id: string;
  product_id: string;
  sku?: string;
  price: number;
  sale_price?: number | null;
  stock: number;
  attributes?: Record<string, string>;
  image?: string;
  images?: string[];
  is_active?: boolean;
}

export interface EcAttribute {
  id: string;
  name: string;
  slug: string;
  has_presets?: boolean;
  is_active?: boolean;
}

/** Attribute Group — an alias for EcAttribute that represents a group
 * (e.g. "Size", "Color", "Storage"). Each group has many values below. */
export type EcAttributeGroup = EcAttribute;

export interface EcAttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  sort_order?: number;
  is_active?: boolean;
}

/** Combined attribute group with its resolved values (for admin list/detail views). */
export interface EcAttributeGroupWithValues extends EcAttribute {
  values: EcAttributeValue[];
}

/** Links a product to an attribute group it uses (variable & simple products). */
export interface EcProductAttributeGroup {
  id: string;
  product_id: string;
  attribute_id: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface EcCoupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_order?: number;
  max_discount?: number | null;
  usage_limit?: number;
  used?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean;
}

export interface EcPaymentMethod {
  id: string;
  name: string;
  enabled?: boolean;
  sort_order?: number;
}

export interface EcShippingMethod {
  id: string;
  name: string;
  charge: number;
  min_order_free?: number;
  estimated_days?: string;
  enabled?: boolean;
  sort_order?: number;
}

export interface EcAddress {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export type EcOrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type EcPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type EcCustomerStatus = 'active' | 'inactive' | 'blocked';

export interface EcCustomer {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  password_hash?: string;
  password_salt?: string;
  status: EcCustomerStatus;
  address?: EcAddress;
  last_login_at?: string | null;
  created_at?: string;
  // joined / derived
  order_count?: number;
  total_spent?: number;
}

export interface EcOrder {
  id?: string;
  order_number?: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  address?: EcAddress;
  status: EcOrderStatus;
  payment_method?: string;
  payment_status?: EcPaymentStatus;
  shipping_method?: string;
  shipping_charge?: number;
  subtotal?: number;
  discount?: number;
  coupon_code?: string;
  total?: number;
  tracking_number?: string;
  tracking_company?: string;
  notes?: string;
  created_at?: string;
  items?: EcOrderItem[];
}

export interface EcOrderItem {
  id?: string;
  order_id?: string;
  product_id?: string;
  variant_id?: string;
  product_name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  total: number;
  image?: string;
  attributes?: Record<string, string>;
}

export interface EcCartItem {
  productId: string;
  variantId?: string;
  productName: string;
  sku?: string;
  price: number;
  image?: string;
  attributes?: Record<string, string>;
  quantity: number;
  stock: number;
  productType: EcProductType;
}
