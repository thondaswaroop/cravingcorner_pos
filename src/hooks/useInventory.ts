import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  cost_per_unit: number;
  supplier: string | null;
  notes: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  inventory_item_id: string;
  transaction_type: string;
  quantity: number;
  cost: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

// Get all inventory items
export const useInventoryItems = (category?: string) => {
  return useQuery({
    queryKey: ["inventory-items", category],
    queryFn: async () => {
      let query = (supabase as any)
        .from("inventory_items")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (category) {
        query = query.eq("category", category);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as InventoryItem[];
    },
  });
};

// Get low stock items
export const useLowStockItems = () => {
  return useQuery({
    queryKey: ["low-stock-items"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("inventory_items")
        .select("*")
        .eq("is_active", true)
        .filter("current_stock", "lte", "minimum_stock")
        .order("current_stock");
      
      if (error) throw error;
      return data as InventoryItem[];
    },
  });
};

// Create inventory item
export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<InventoryItem, "id" | "created_at" | "updated_at" | "is_active">) => {
      const { data, error } = await (supabase as any)
        .from("inventory_items")
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-items"] });
    },
  });
};

// Update inventory item
export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("inventory_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-items"] });
    },
  });
};

// Get inventory transactions
export const useInventoryTransactions = (itemId?: string) => {
  return useQuery({
    queryKey: ["inventory-transactions", itemId],
    queryFn: async () => {
      let query = (supabase as any)
        .from("inventory_transactions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (itemId) {
        query = query.eq("inventory_item_id", itemId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as InventoryTransaction[];
    },
  });
};

// Create inventory transaction
export const useCreateInventoryTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transaction: Omit<InventoryTransaction, "id" | "created_at">) => {
      // Start a transaction
      const { data: item } = await (supabase as any)
        .from("inventory_items")
        .select("current_stock")
        .eq("id", transaction.inventory_item_id)
        .single();
      
      if (!item) throw new Error("Item not found");
      
      // Calculate new stock based on transaction type
      let newStock = item.current_stock;
      if (transaction.transaction_type === "purchase") {
        newStock += transaction.quantity;
      } else if (["usage", "wastage"].includes(transaction.transaction_type)) {
        newStock -= transaction.quantity;
      } else if (transaction.transaction_type === "adjustment") {
        newStock = transaction.quantity; // Direct adjustment
      }
      
      // Update stock
      const { error: updateError } = await (supabase as any)
        .from("inventory_items")
        .update({ current_stock: newStock })
        .eq("id", transaction.inventory_item_id);
      
      if (updateError) throw updateError;
      
      // Record transaction
      const { data, error } = await (supabase as any)
        .from("inventory_transactions")
        .insert(transaction)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-items"] });
    },
  });
};
