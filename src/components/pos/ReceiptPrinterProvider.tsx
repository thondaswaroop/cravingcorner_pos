import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Receipt } from "./Receipt";

type PrintOrderParams = {
  orderId?: string;
  // snapshot contains precomputed values for checkout (cart, subtotal, tax, discount, total, paymentMethod, transactionNo, pointsEarned)
  snapshot?: any;
};

type ContextType = {
  printOrder: (params: PrintOrderParams) => Promise<void>;
};

const ReceiptPrinterContext = createContext<ContextType | undefined>(undefined);

export const useReceiptPrinter = () => {
  const ctx = useContext(ReceiptPrinterContext);
  if (!ctx) throw new Error("useReceiptPrinter must be used within ReceiptPrinterProvider");
  return ctx;
};

export const ReceiptPrinterProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [currentData, setCurrentData] = useState<any | null>(null);
  const [shouldPrint, setShouldPrint] = useState(false);

  const clear = () => {
    setTimeout(() => {
      setCurrentData(null);
      setShouldPrint(false);
    }, 1000);
  };

  const printOrder = useCallback(async ({ orderId, snapshot }: PrintOrderParams) => {
    // If snapshot provided (from checkout), use it directly
    if (snapshot && orderId) {
      const order = snapshot.order || null;
      const items = snapshot.cart || snapshot.items || [];

      const payload = {
        order: {
          id: orderId,
          created_at: snapshot.createdAt || new Date().toISOString(),
          payment_method: snapshot.paymentMethod || snapshot.paymentMethod || "cash",
          subtotal: snapshot.subtotal,
          tax: snapshot.tax,
          discount: snapshot.discount || 0,
          total: snapshot.total,
          points_earned: snapshot.pointsEarned || 0,
        },
        items,
      };

      setCurrentData(payload);
      // allow DOM to update
      requestAnimationFrame(() => setShouldPrint(true));
      return;
    }

    if (!orderId) return;

    // Fetch order and items from supabase
    const [orderResult, itemsResult] = await Promise.all([
      supabase.from("orders").select(`*, customer:customers(name, phone, email)`).eq("id", orderId).single(),
      supabase.from("order_items").select("*").eq("order_id", orderId),
    ]);

    if (orderResult.error) {
      console.error("Error fetching order for print:", orderResult.error);
      return;
    }
    if (itemsResult.error) {
      console.error("Error fetching order items for print:", itemsResult.error);
      return;
    }

    setCurrentData({ order: orderResult.data, items: itemsResult.data });
    requestAnimationFrame(() => setShouldPrint(true));
  }, []);

  useEffect(() => {
    if (shouldPrint && currentData) {
      // Give browser a tick to render hidden DOM
      setTimeout(() => {
        window.print();
        clear();
      }, 200);
    }
  }, [shouldPrint, currentData]);

  return (
    <ReceiptPrinterContext.Provider value={{ printOrder }}>
      {children}

      {/* Print container — hidden on screen, visible in print via .print-only */}
      <div className="print-only">
        {currentData && (
          <Receipt
            orderId={currentData.order.id}
            createdAt={currentData.order.created_at}
            transactionNo={currentData.order.transaction_no}
            paymentMethod={currentData.order.payment_method}
            items={currentData.items}
            subtotal={currentData.order.subtotal}
            tax={currentData.order.tax}
            discount={currentData.order.discount}
            total={currentData.order.total}
            pointsEarned={currentData.order.points_earned}
            className="print-only"
          />
        )}
      </div>
    </ReceiptPrinterContext.Provider>
  );
};
