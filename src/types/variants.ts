export interface ProductVariant {
  id: string;
  product_id: string;
  name: string; // Small, Medium, Large
  price: number;
  stock_quantity: number;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  parent_id?: string | null;
  display_order: number;
  created_at: string;
  subcategories?: Category[]; // For nested display
}

export interface ProductWithVariants {
  id: string;
  name: string;
  category_id: string;
  price: number; // Base price (used if no variants)
  has_variants: boolean;
  stock_quantity: number;
  low_stock_threshold?: number;
  image_url?: string;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[]; // If has_variants is true
}

export interface CartItemWithVariant {
  product: ProductWithVariants;
  variant?: ProductVariant; // Selected variant
  quantity: number;
}
