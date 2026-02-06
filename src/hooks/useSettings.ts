import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Settings {
  id: number;
  business_name: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  tax_rate: number;
  currency_symbol: string;
  currency_code: string;
  receipt_footer: string;
}

export const useSettings = () => {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Error loading settings:", error);
        // Return defaults if settings don't exist
        return {
          id: 1,
          business_name: "CRAVING CORNER",
          business_address: "Beside Sai Hospitals Lane\nRajahmundry Road, Jaggampeta\nEast Godavari, AP 533435",
          business_phone: "+91 8688188893",
          business_email: "cravingcorner.jaggampeta@gmail.com",
          tax_rate: 5,
          currency_symbol: "₹",
          currency_code: "INR",
          receipt_footer: "Thank you for your purchase!",
        } as Settings;
      }

      return data as Settings;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
