import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrders, useOrderWithItems } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { DollarSign, ShoppingBag, TrendingUp, Users, FileDown, ChevronDown, ChevronUp, Receipt, Search, Filter, X } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { generateSalesReportPDF } from "@/lib/pdfGenerator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COLORS = ["hsl(32, 95%, 55%)", "hsl(160, 70%, 45%)", "hsl(45, 95%, 55%)", "hsl(0, 75%, 55%)"];

export const SalesReports = () => {
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [startInput, setStartInput] = useState(format(dateRange.start, "yyyy-MM-dd"));
  const [endInput, setEndInput] = useState(format(dateRange.end, "yyyy-MM-dd"));
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterTransactionId, setFilterTransactionId] = useState("");
  const [filterCustomerName, setFilterCustomerName] = useState("");

  const { data: orders = [] } = useOrders(dateRange);
  const { data: customers = [] } = useCustomers();
  const { data: expandedOrderData } = useOrderWithItems(expandedOrderId || "");
  const { toast } = useToast();


  // previous period for delta comparison
  const prevRange = useMemo(() => {
    const days = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24) + 1;
    const prevEnd = subDays(dateRange.start, 1);
    const prevStart = subDays(prevEnd, days - 1);
    return { start: prevStart, end: prevEnd };
  }, [dateRange]);

  const prevRevenue = useMemo(() => {
    const prevOrders = orders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= prevRange.start && d <= prevRange.end;
    });
    return prevOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  }, [orders, prevRange]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalTax = orders.reduce((sum, o) => sum + Number(o.tax || 0), 0);

    return { totalRevenue, totalOrders, avgOrderValue, totalTax };
  }, [orders]);

  const dailySales = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    
    return days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayOrders = orders.filter((o) => {
        const orderDate = new Date(o.created_at);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });
      
      return {
        date: format(day, "MMM dd"),
        revenue: dayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
        orders: dayOrders.length,
      };
    });
  }, [orders, dateRange]);

  const paymentMethodData = useMemo(() => {
    const methods: Record<string, number> = {};
    orders.forEach((o) => {
      const method = o.payment_method || "cash";
      methods[method] = (methods[method] || 0) + Number(o.total || 0);
    });
    
    return Object.entries(methods).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [orders]);

  const recentOrders = orders.slice(0, 10);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (filterDate) {
      filtered = filtered.filter((order) => {
        const orderDate = format(new Date(order.created_at), "yyyy-MM-dd");
        return orderDate === filterDate;
      });
    }

    if (filterTransactionId) {
      filtered = filtered.filter((order) =>
        order.id.toLowerCase().includes(filterTransactionId.toLowerCase())
      );
    }

    if (filterCustomerName) {
      filtered = filtered.filter((order) => {
        if (!order.customer_id) return false;
        const customer = customers.find((c) => c.id === order.customer_id);
        return customer?.name.toLowerCase().includes(filterCustomerName.toLowerCase());
      });
    }

    return filtered;
  }, [orders, filterDate, filterTransactionId, filterCustomerName, customers]);

  // Fetch order items for filtered orders to compute top products
  const { data: orderItems = [] } = useQuery({
    queryKey: ["order-items", filteredOrders.map((o) => o.id).join(",")],
    queryFn: async () => {
      if (filteredOrders.length === 0) return [];
      const ids = filteredOrders.map((o) => o.id);
      const { data, error } = await supabase.from("order_items").select("*").in("order_id", ids);
      if (error) throw error;
      return data || [];
    },
  });

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    (orderItems as any[]).forEach((it: any) => {
      const key = it.product_id || it.product_name;
      if (!map[key]) map[key] = { name: it.product_name, qty: 0, revenue: 0 };
      map[key].qty += it.quantity || 0;
      map[key].revenue += (it.total_price || (it.unit_price || 0) * (it.quantity || 0));
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [orderItems]);

  const clearFilters = () => {
    setFilterDate("");
    setFilterTransactionId("");
    setFilterCustomerName("");
  };

  const handleExportPDF = () => {
    try {
      generateSalesReportPDF({
        totalRevenue: stats.totalRevenue,
        totalOrders: stats.totalOrders,
        avgOrderValue: stats.avgOrderValue,
        totalTax: stats.totalTax,
        dateRange,
        dailySales,
        paymentMethods: paymentMethodData,
        recentOrders: orders,
      });
      toast({ title: "Success", description: "Sales report exported to PDF" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Sales Reports</h2>
          <p className="text-sm text-muted-foreground">Last 30 days overview</p>
        </div>
        <Button onClick={handleExportPDF} className="bg-primary text-primary-foreground w-full sm:w-auto">
          <FileDown className="w-4 h-4 mr-2" />
          <span>Export PDF</span>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.avgOrderValue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tax</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalTax)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(32, 95%, 55%)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders chart */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Daily Orders</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="orders" fill="hsl(160, 70%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Payment methods */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Payment Methods</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {paymentMethodData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Order History */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Recent Billing (Last 10)
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{orders.length} total orders</Badge>
            <Button onClick={() => setShowAllOrders(true)} variant="outline" size="sm">
              View More
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No orders found for this period
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((order) => (
                  <>
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                    >
                      <TableCell>
                        {expandedOrderId === order.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">#{order.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(order.created_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.payment_method === "cash" ? "secondary" : "default"} className="capitalize">
                          {order.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(order.subtotal)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(order.tax || 0)}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {order.discount ? `-${formatCurrency(order.discount)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(order.total)}</TableCell>
                    </TableRow>
                    
                    {/* Expanded row with order items */}
                    {expandedOrderId === order.id && expandedOrderData && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-secondary/30">
                          <div className="p-4 space-y-3">
                            <h4 className="font-semibold text-sm">Order Items:</h4>
                            <div className="bg-card rounded-lg border border-border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {expandedOrderData.items.map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell className="font-medium">{item.product_name}</TableCell>
                                      <TableCell className="text-right">{item.quantity}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                                      <TableCell className="text-right font-semibold">
                                        {formatCurrency(item.unit_price * item.quantity)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            {order.points_earned && (
                              <p className="text-xs text-muted-foreground">
                                Points earned: +{order.points_earned}
                              </p>
                            )}
                            {order.points_redeemed && (
                              <p className="text-xs text-muted-foreground">
                                Points redeemed: -{order.points_redeemed}
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View More Dialog */}
      <Dialog open={showAllOrders} onOpenChange={setShowAllOrders}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              All Orders & Billing Details
            </DialogTitle>
          </DialogHeader>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b">
            <div>
              <Label htmlFor="filter-date" className="text-xs flex items-center gap-1">
                <Search className="w-3 h-3" />
                Filter by Date
              </Label>
              <Input
                id="filter-date"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="filter-txn" className="text-xs flex items-center gap-1">
                <Search className="w-3 h-3" />
                Transaction ID
              </Label>
              <Input
                id="filter-txn"
                placeholder="Search by ID..."
                value={filterTransactionId}
                onChange={(e) => setFilterTransactionId(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="filter-customer" className="text-xs flex items-center gap-1">
                <Search className="w-3 h-3" />
                Customer Name
              </Label>
              <Input
                id="filter-customer"
                placeholder="Search by name..."
                value={filterCustomerName}
                onChange={(e) => setFilterCustomerName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Filter Actions */}
          {(filterDate || filterTransactionId || filterCustomerName) && (
            <div className="flex items-center justify-between py-2">
              <p className="text-sm text-muted-foreground">
                Showing {filteredOrders.length} of {orders.length} orders
              </p>
              <Button onClick={clearFilters} variant="ghost" size="sm">
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          )}

          {/* Orders Table */}
          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      {filterDate || filterTransactionId || filterCustomerName
                        ? "No orders match your filters"
                        : "No orders found for this period"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const customer = customers.find((c) => c.id === order.customer_id);
                    return (
                      <>
                        <TableRow
                          key={order.id}
                          className="cursor-pointer hover:bg-secondary/50"
                          onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                        >
                          <TableCell>
                            {expandedOrderId === order.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">#{order.id.slice(0, 8)}</TableCell>
                          <TableCell className="text-sm">
                            {customer ? customer.name : <span className="text-muted-foreground">Guest</span>}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(order.created_at), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={order.payment_method === "cash" ? "secondary" : "default"} className="capitalize">
                              {order.payment_method}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(order.subtotal)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(order.tax || 0)}</TableCell>
                          <TableCell className="text-right text-success">
                            {order.discount ? `-${formatCurrency(order.discount)}` : "-"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(order.total)}</TableCell>
                        </TableRow>

                        {/* Expanded row with order items */}
                        {expandedOrderId === order.id && expandedOrderData && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-secondary/30">
                              <div className="p-4 space-y-3">
                                <h4 className="font-semibold text-sm">Order Items:</h4>
                                <div className="bg-card rounded-lg border border-border overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Item Name</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                        <TableHead className="text-right">Unit Price</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {expandedOrderData.items.map((item) => (
                                        <TableRow key={item.id}>
                                          <TableCell className="font-medium">{item.product_name}</TableCell>
                                          <TableCell className="text-right">{item.quantity}</TableCell>
                                          <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                                          <TableCell className="text-right font-semibold">
                                            {formatCurrency(item.unit_price * item.quantity)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                                {order.points_earned && (
                                  <p className="text-xs text-muted-foreground">
                                    Points earned: +{order.points_earned}
                                  </p>
                                )}
                                {order.points_redeemed && (
                                  <p className="text-xs text-muted-foreground">
                                    Points redeemed: -{order.points_redeemed}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
