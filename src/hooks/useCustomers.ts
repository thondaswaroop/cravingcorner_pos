import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/pos";

export const useCustomers = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Customer[];
    },
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customer: { name: string; phone?: string; email?: string }) => {
      const { data, error } = await supabase
        .from("customers")
        .insert(customer)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useSearchCustomer = (phone: string) => {
  return useQuery({
    queryKey: ["customer-search", phone],
    queryFn: async () => {
      if (!phone || phone.length < 3) return null;
      
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", phone)
        .maybeSingle();
      
      if (error) throw error;
      return data as Customer | null;
    },
    enabled: phone.length >= 3,
  });
};
