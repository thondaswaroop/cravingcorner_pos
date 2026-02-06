export interface Category {
  id: string;
  name: string;
  icon: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number | null;
  image_url: string | null;
  is_available: boolean | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  loyalty_points: number | null;
  total_spent: number | null;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string | null;
  subtotal: number;
  discount: number | null;
  tax: number | null;
  total: number;
  payment_method: string | null;
  points_earned: number | null;
  points_redeemed: number | null;
  status: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
