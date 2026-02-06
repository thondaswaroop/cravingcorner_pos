import { useState } from "react";
import { useInventoryItems, useLowStockItems, useCreateInventoryItem, useUpdateInventoryItem, useCreateInventoryTransaction } from "@/hooks/useInventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Package, Plus, Edit2, FileDown, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { generateInventoryReportPDF } from "@/lib/pdfGenerator";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { value: "utensils", label: "Utensils", icon: "🍽️" },
  { value: "ingredients", label: "Ingredients", icon: "🥘" },
  { value: "vegetables", label: "Vegetables", icon: "🥬" },
  { value: "beverages", label: "Beverages", icon: "🥤" },
  { value: "other", label: "Other", icon: "📦" },
];

const UNITS = ["pieces", "kg", "liters", "packets", "bottles", "grams", "ml"];
const TRANSACTION_TYPES = [
  { value: "purchase", label: "Purchase", icon: TrendingUp },
  { value: "usage", label: "Usage", icon: TrendingDown },
  { value: "wastage", label: "Wastage", icon: AlertTriangle },
  { value: "adjustment", label: "Adjustment", icon: Activity },
];

export const InventoryManagement = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const { data: items = [], isLoading } = useInventoryItems(selectedCategory);
  const { data: lowStockItems = [] } = useLowStockItems();
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const createTransaction = useCreateInventoryTransaction();
  const { toast } = useToast();

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const [newItem, setNewItem] = useState({
    name: "",
    category: "ingredients",
    unit: "kg",
    current_stock: "0",
    minimum_stock: "10",
    cost_per_unit: "0",
    supplier: "",
  });

  const [transaction, setTransaction] = useState({
    transaction_type: "purchase",
    quantity: "",
    cost: "",
    notes: "",
  });

  const handleAddItem = async () => {
    if (!newItem.name) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }

    try {
      await createItem.mutateAsync({
        name: newItem.name,
        category: newItem.category,
        unit: newItem.unit,
        current_stock: parseFloat(newItem.current_stock) || 0,
        minimum_stock: parseFloat(newItem.minimum_stock) || 10,
        cost_per_unit: parseFloat(newItem.cost_per_unit) || 0,
        supplier: newItem.supplier || null,
        notes: null,
      });
      toast({ title: "Success", description: "Item added successfully" });
      setNewItem({
        name: "",
        category: "ingredients",
        unit: "kg",
        current_stock: "0",
        minimum_stock: "10",
        cost_per_unit: "0",
        supplier: "",
      });
      setIsAddItemOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    }
  };

  const handleTransaction = async () => {
    if (!selectedItem || !transaction.quantity) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    try {
      await createTransaction.mutateAsync({
        inventory_item_id: selectedItem.id,
        transaction_type: transaction.transaction_type,
        quantity: parseFloat(transaction.quantity),
        cost: transaction.cost ? parseFloat(transaction.cost) : null,
        notes: transaction.notes || null,
        created_by: null,
      });
      toast({ title: "Success", description: `${transaction.transaction_type} recorded successfully` });
      setTransaction({
        transaction_type: "purchase",
        quantity: "",
        cost: "",
        notes: "",
      });
      setSelectedItem(null);
      setIsTransactionOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to record transaction", variant: "destructive" });
    }
  };

  const handleExportPDF = () => {
    try {
      generateInventoryReportPDF(items);
      toast({ title: "Success", description: "Inventory report exported to PDF" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    }
  };

  const openTransactionDialog = (item: any) => {
    setSelectedItem(item);
    setIsTransactionOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Inventory Management</h2>
          <p className="text-sm text-muted-foreground">Manage all inventory items and stock levels</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button variant="outline" onClick={handleExportPDF} size="sm" className="flex-1 sm:flex-initial">
            <FileDown className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground flex-1 sm:flex-initial" size="sm">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Item</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Item Name</Label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="bg-secondary border-border"
                    placeholder="e.g., Tomatoes, Plates, Oil"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select value={newItem.unit} onValueChange={(v) => setNewItem({ ...newItem, unit: v })}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Current Stock</Label>
                    <Input
                      type="number"
                      value={newItem.current_stock}
                      onChange={(e) => setNewItem({ ...newItem, current_stock: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <Label>Minimum Stock</Label>
                    <Input
                      type="number"
                      value={newItem.minimum_stock}
                      onChange={(e) => setNewItem({ ...newItem, minimum_stock: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <div>
                  <Label>Cost per Unit (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.cost_per_unit}
                    onChange={(e) => setNewItem({ ...newItem, cost_per_unit: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div>
                  <Label>Supplier (optional)</Label>
                  <Input
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                    className="bg-secondary border-border"
                    placeholder="Supplier name"
                  />
                </div>
                <Button onClick={handleAddItem} className="w-full bg-primary text-primary-foreground">
                  Add Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive mb-2">Low Stock Alert</h3>
              <div className="space-y-1">
                {lowStockItems.map((item) => (
                  <p key={item.id} className="text-sm text-foreground">
                    <span className="font-medium">{item.name}</span> - Only {item.current_stock} {item.unit} left 
                    (Min: {item.minimum_stock} {item.unit})
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <Tabs value={selectedCategory || "all"} onValueChange={(v) => setSelectedCategory(v === "all" ? undefined : v)}>
        <TabsList className="bg-secondary w-full overflow-x-auto flex-nowrap">
          <TabsTrigger value="all" className="text-xs sm:text-sm whitespace-nowrap">All</TabsTrigger>
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value} className="text-xs sm:text-sm whitespace-nowrap">
              <span className="hidden sm:inline">{cat.icon} </span>{cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory || "all"} className="mt-4 sm:mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No items in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => {
                const isLowStock = item.current_stock <= item.minimum_stock;
                const stockPercentage = (item.current_stock / item.minimum_stock) * 100;

                return (
                  <div key={item.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                      </div>
                      {isLowStock && <Badge variant="destructive">Low Stock</Badge>}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Stock</span>
                        <span className={`font-semibold ${isLowStock ? "text-destructive" : "text-foreground"}`}>
                          {item.current_stock} {item.unit}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Min Stock</span>
                        <span className="text-foreground">{item.minimum_stock} {item.unit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cost/Unit</span>
                        <span className="text-foreground">{formatCurrency(item.cost_per_unit)}</span>
                      </div>
                      {item.supplier && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Supplier</span>
                          <span className="text-foreground text-xs">{item.supplier}</span>
                        </div>
                      )}
                    </div>

                    {/* Stock level bar */}
                    <div className="mb-4">
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isLowStock ? "bg-destructive" : "bg-success"
                          }`}
                          style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => openTransactionDialog(item)}
                    >
                      <Edit2 className="w-3 h-3 mr-2" />
                      Record Transaction
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Transaction Dialog */}
      <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Record Transaction: {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Transaction Type</Label>
              <Select value={transaction.transaction_type} onValueChange={(v) => setTransaction({ ...transaction, transaction_type: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantity ({selectedItem?.unit})</Label>
              <Input
                type="number"
                step="0.01"
                value={transaction.quantity}
                onChange={(e) => setTransaction({ ...transaction, quantity: e.target.value })}
                className="bg-secondary border-border"
                placeholder={transaction.transaction_type === "adjustment" ? "New total stock" : "Amount"}
              />
              {transaction.transaction_type === "adjustment" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the new total stock amount
                </p>
              )}
            </div>

            {transaction.transaction_type === "purchase" && (
              <div>
                <Label>Cost (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={transaction.cost}
                  onChange={(e) => setTransaction({ ...transaction, cost: e.target.value })}
                  className="bg-secondary border-border"
                  placeholder="Total purchase cost"
                />
              </div>
            )}

            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={transaction.notes}
                onChange={(e) => setTransaction({ ...transaction, notes: e.target.value })}
                className="bg-secondary border-border"
                placeholder="Any additional notes"
              />
            </div>

            <Button onClick={handleTransaction} className="w-full bg-primary text-primary-foreground">
              Record Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
