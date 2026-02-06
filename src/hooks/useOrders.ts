import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderItem, CartItem } from "@/types/pos";

export const useOrders = (dateRange?: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ["orders", dateRange],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (dateRange) {
        query = query
          .gte("created_at", dateRange.start.toISOString())
          .lte("created_at", dateRange.end.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Order[];
    },
  });
};

export const useOrderWithItems = (orderId: string) => {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const [orderResult, itemsResult] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).single(),
        supabase.from("order_items").select("*").eq("order_id", orderId),
      ]);
      
      if (orderResult.error) throw orderResult.error;
      if (itemsResult.error) throw itemsResult.error;
      
      return {
        order: orderResult.data as Order,
        items: itemsResult.data as OrderItem[],
      };
    },
    enabled: !!orderId,
  });
};

interface CreateOrderParams {
  cart: CartItem[];
  customerId?: string;
  discount?: number;
  pointsRedeemed?: number;
  paymentMethod?: string;
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ cart, customerId, discount = 0, pointsRedeemed = 0, paymentMethod = 'cash' }: CreateOrderParams) => {
      const subtotal = cart.reduce((sum, item) => {
        const price = item.variant?.price || item.product.price;
        return sum + price * item.quantity;
      }, 0);
      const tax = subtotal * 0.1; // 10% tax
      const pointsDiscount = pointsRedeemed * 0.01; // 1 point = ₹0.01 (100 points = ₹1)
      const total = Math.max(0, subtotal + tax - discount - pointsDiscount);
      const pointsEarned = Math.floor(total); // 1 point per ₹1 spent
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId || null,
          subtotal,
          discount: discount + pointsDiscount,
          tax,
          total,
          payment_method: paymentMethod,
          points_earned: pointsEarned,
          points_redeemed: pointsRedeemed,
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items with variant support
      const orderItems = cart.map(item => {
        const itemPrice = item.variant?.price || item.product.price;
        return {
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: itemPrice,
          total_price: itemPrice * item.quantity,
          variant_id: item.variant?.id || null,
          variant_name: item.variant?.name || null,
        };
      });
      
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Update stock quantities (only for inventory items)
      for (const item of cart) {
        const isInventoryItem = (item.product as any).is_inventory_item;
        if (isInventoryItem) {
          if (item.variant) {
            // Update variant stock
            const { data: variantData } = await supabase
              .from("product_variants")
              .select("stock_quantity")
              .eq("id", item.variant.id)
              .single();
            
            if (variantData) {
              await supabase
                .from("product_variants")
                .update({ 
                  stock_quantity: variantData.stock_quantity - item.quantity 
                })
                .eq("id", item.variant.id);
            }
          } else {
            // Update product stock
            const { error: stockError } = await supabase
              .from("products")
              .update({ 
                stock_quantity: item.product.stock_quantity - item.quantity 
              })
              .eq("id", item.product.id);
            
            if (stockError) {
              console.error("Error updating stock:", stockError);
            }
          }
        }
      }
      
      // Update customer loyalty points and total spent
      if (customerId) {
        // Get current customer data
        const { data: customer, error: customerFetchError } = await supabase
          .from("customers")
          .select("loyalty_points, total_spent")
          .eq("id", customerId)
          .single();
        
        if (customerFetchError) {
          console.error("Error fetching customer:", customerFetchError);
        } else {
          const currentPoints = customer.loyalty_points || 0;
          const currentSpent = customer.total_spent || 0;
          
          // Update with new points (earned - redeemed) and total spent
          const { error: customerUpdateError } = await supabase
            .from("customers")
            .update({
              loyalty_points: currentPoints + pointsEarned - pointsRedeemed,
              total_spent: currentSpent + total,
            })
            .eq("id", customerId);
          
          if (customerUpdateError) {
            console.error("Error updating customer loyalty:", customerUpdateError);
          }
        }
      }
      
      return order as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["all-products"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};
