import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Receipt as ReceiptIcon, User, Calendar, CreditCard, Package, Printer } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { Order, OrderItem } from "@/types/pos";
import { useSettings } from "@/hooks/useSettings";
import { Receipt } from "./Receipt";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OrderWithCustomer extends Order {
  customer?: {
    name: string;
    phone: string;
    email: string;
  };
}

export const OrderHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const { data: settings } = useSettings();

  const handlePrint = () => {
    window.print();
  };

  // Fetch last 20 orders with customer info
  const { data: orders, isLoading } = useQuery({
    queryKey: ["recent-orders", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select(`
          *,
          customer:customers(name, phone, email)
        `)
        .order("created_at", { ascending: false });

      // If search term exists, filter by customer info
      if (searchTerm) {
        // Get matching customer IDs by name, phone, or email
        const { data: customerResults } = await supabase
          .from("customers")
          .select("id")
          .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);

        const customerIds = customerResults?.map(c => c.id) || [];

        if (customerIds.length > 0) {
          // Filter orders by matching customer IDs
          query = query.in("customer_id", customerIds);
        } else {
          // No matching customers, return empty result
          query = query.eq("id", "00000000-0000-0000-0000-000000000000"); // Non-existent ID
        }
        
        query = query.limit(20);
      } else {
        // No search term, just get last 20
        query = query.limit(20);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as OrderWithCustomer[];
    },
  });

  // Fetch order details when selected
  const { data: orderDetails } = useQuery({
    queryKey: ["order-details", selectedOrder],
    queryFn: async () => {
      if (!selectedOrder) return null;

      const [orderResult, itemsResult] = await Promise.all([
        supabase
          .from("orders")
          .select(`
            *,
            customer:customers(name, phone, email)
          `)
          .eq("id", selectedOrder)
          .single(),
        supabase
          .from("order_items")
          .select("*")
          .eq("order_id", selectedOrder),
      ]);

      if (orderResult.error) throw orderResult.error;
      if (itemsResult.error) throw itemsResult.error;

      return {
        order: orderResult.data as OrderWithCustomer,
        items: itemsResult.data as OrderItem[],
      };
    },
    enabled: !!selectedOrder,
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b bg-card">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <ReceiptIcon className="h-6 w-6" />
          Order History
        </h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">Search Orders</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by Customer Name, Phone, or Email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setSearchTerm("")}
            disabled={!searchTerm}
          >
            Clear
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading orders...
            </div>
          ) : orders && orders.length > 0 ? (
            orders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedOrder(order.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm font-semibold">
                          #{order.id.slice(0, 8)}
                        </span>
                        <Badge
                          variant={order.payment_method === "cash" ? "secondary" : "default"}
                          className="text-xs"
                        >
                          {order.payment_method}
                        </Badge>
                      </div>

                      {order.customer && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          <span>{order.customer.name}</span>
                          {order.customer.phone && (
                            <span className="text-xs">• {order.customer.phone}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(order.created_at).toLocaleDateString()} at{" "}
                          {new Date(order.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        {formatCurrency(order.total)}
                      </div>
                      {order.discount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Disc: {formatCurrency(order.discount)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <ReceiptIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No orders found matching your search"
                  : "No recent orders"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5" />
              Order Details
            </DialogTitle>
          </DialogHeader>

          {orderDetails && (
            <div className="space-y-6">
              {/* Order Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <p className="font-mono font-semibold mt-1">
                        {orderDetails.order.id}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date & Time:</span>
                      <p className="font-semibold mt-1">
                        {new Date(orderDetails.order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Payment Method:</span>
                      <p className="font-semibold mt-1 capitalize">
                        {orderDetails.order.payment_method}
                      </p>
                    </div>
                    {orderDetails.order.points_earned > 0 && (
                      <div>
                        <span className="text-muted-foreground">Points Earned:</span>
                        <p className="font-semibold mt-1 text-success">
                          +{orderDetails.order.points_earned}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info */}
              {orderDetails.order.customer && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-semibold">{orderDetails.order.customer.name}</p>
                    </div>
                    {orderDetails.order.customer.phone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p className="font-semibold">{orderDetails.order.customer.phone}</p>
                      </div>
                    )}
                    {orderDetails.order.customer.email && (
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-semibold">{orderDetails.order.customer.email}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Order Items */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Items ({orderDetails.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orderDetails.items.map((item, index) => (
                      <div
                        key={`${item.product_id}-${item.variant_id || "base"}-${index}`}
                        className="flex justify-between items-start pb-3 border-b last:border-0"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {item.product_name}
                            {item.variant_name && (
                              <span className="text-sm text-muted-foreground ml-2">
                                ({item.variant_name})
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.quantity} × {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <div className="font-semibold">
                          {formatCurrency(item.total_price)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="border-primary">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>{formatCurrency(orderDetails.order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax:</span>
                      <span>{formatCurrency(orderDetails.order.tax)}</span>
                    </div>
                    {orderDetails.order.discount > 0 && (
                      <div className="flex justify-between text-success">
                        <span>Discount:</span>
                        <span>-{formatCurrency(orderDetails.order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-primary">
                        {formatCurrency(orderDetails.order.total)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Print Receipt Button */}
              <div className="flex gap-3">
                <Button onClick={handlePrint} className="flex-1 gap-2">
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </Button>
                <Button variant="outline" onClick={() => setSelectedOrder(null)} className="flex-1">
                  Close
                </Button>
              </div>

              {/* Hidden Receipt for Printing */}
              <Receipt
                orderId={orderDetails.order.id}
                createdAt={orderDetails.order.created_at}
                paymentMethod={orderDetails.order.payment_method}
                items={orderDetails.items}
                subtotal={orderDetails.order.subtotal}
                tax={orderDetails.order.tax}
                discount={orderDetails.order.discount}
                total={orderDetails.order.total}
                pointsEarned={orderDetails.order.points_earned}
                className="print-only"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
