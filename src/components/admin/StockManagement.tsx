import { useAllProducts, useUpdateProduct, useCreateProduct, useSoftDeleteProduct, useDeletedProducts, useRestoreProduct } from "@/hooks/useProducts";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { formatCurrency } from "@/lib/currency";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Package, Plus, Edit2, Trash2, RotateCcw, Save, X, Tags, Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/pos";
import { VariantManager } from "./VariantManager";
import { InventoryManager } from "./InventoryManager";
import { Switch } from "@/components/ui/switch";

export const StockManagement = () => {
  const { data: products = [], isLoading } = useAllProducts();
  const { data: deletedProducts = [] } = useDeletedProducts();
  const { data: categories = [] } = useCategories();
  const updateProduct = useUpdateProduct();
  const createProduct = useCreateProduct();
  const softDeleteProduct = useSoftDeleteProduct();
  const restoreProduct = useRestoreProduct();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const { toast } = useToast();

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", icon: "" });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [variantProductId, setVariantProductId] = useState<string | null>(null);
  const [variantProductName, setVariantProductName] = useState("");
  const [isInventoryManagerOpen, setIsInventoryManagerOpen] = useState(false);
  
  const [newProduct, setNewProduct] = useState({ name: "", price: "", stock: "", category: "", hasVariants: false, isInventoryItem: false });
  const [newCategory, setNewCategory] = useState({ name: "", icon: "" });
  const [editForm, setEditForm] = useState({ name: "", price: "", stock: "", category: "", hasVariants: false, isInventoryItem: false });
  

  const handleAddProduct = async () => {
    if (!newProduct.name) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    
    if (!newProduct.hasVariants && !newProduct.price) {
      toast({ title: "Error", description: "Price is required for products without variants", variant: "destructive" });
      return;
    }
    
    try {
      await createProduct.mutateAsync({
        name: newProduct.name,
        price: newProduct.hasVariants ? 0 : parseFloat(newProduct.price),
        stock_quantity: newProduct.hasVariants ? 0 : (parseInt(newProduct.stock) || 0),
        category_id: newProduct.category || undefined,
        has_variants: newProduct.hasVariants,
        is_inventory_item: newProduct.isInventoryItem,
      } as any);
      toast({ title: "Success", description: "Product added" });
      setNewProduct({ name: "", price: "", stock: "", category: "", hasVariants: false, isInventoryItem: false });
      setIsAddProductOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add product", variant: "destructive" });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock_quantity.toString(),
      category: product.category_id || "",
      hasVariants: (product as any).has_variants || false,
      isInventoryItem: (product as any).is_inventory_item || false,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !editForm.name) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    
    if (!editForm.hasVariants && !editForm.price) {
      toast({ title: "Error", description: "Price is required for products without variants", variant: "destructive" });
      return;
    }
    
    try {
      await updateProduct.mutateAsync({
        id: editingProduct.id,
        name: editForm.name,
        price: editForm.hasVariants ? 0 : parseFloat(editForm.price),
        stock_quantity: editForm.hasVariants ? 0 : (parseInt(editForm.stock) || 0),
        category_id: editForm.category || null,
        has_variants: editForm.hasVariants,
        is_inventory_item: editForm.isInventoryItem,
      } as any);
      toast({ title: "Success", description: "Product updated" });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update product", variant: "destructive" });
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Delete "${productName}"? It will be moved to trash.`)) return;
    
    try {
      await softDeleteProduct.mutateAsync(productId);
      toast({ title: "Success", description: "Product moved to trash" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
    }
  };

  const handleRestoreProduct = async (productId: string, productName: string) => {
    try {
      await restoreProduct.mutateAsync(productId);
      toast({ title: "Success", description: `"${productName}" restored` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to restore product", variant: "destructive" });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast({ title: "Error", description: "Name required", variant: "destructive" });
      return;
    }
    
    try {
      await createCategory.mutateAsync({
        name: newCategory.name,
        icon: newCategory.icon || undefined,
      });
      toast({ title: "Success", description: "Category added" });
      setNewCategory({ name: "", icon: "" });
      setIsAddCategoryOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add category", variant: "destructive" });
    }
  };

  const handleUpdateStock = async (productId: string) => {
    const newQuantity = parseInt(editForm.stock);
    if (isNaN(newQuantity) || newQuantity < 0) {
      toast({ title: "Error", description: "Invalid quantity", variant: "destructive" });
      return;
    }
    
    try {
      await updateProduct.mutateAsync({ id: productId, stock_quantity: newQuantity });
      toast({ title: "Success", description: "Stock updated" });
      setEditingProduct(null);
      setEditForm({ name: "", price: "", stock: "", category: "", hasVariants: false, isInventoryItem: false });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Food Products Management</h2>
          <p className="text-sm text-muted-foreground">Manage menu items, prices, and stock</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button
            onClick={() => setIsInventoryManagerOpen(true)}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-initial"
          >
            <AlertTriangle className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Inventory</span>
          </Button>
          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Category</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Add Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div>
                  <Label>Icon (emoji)</Label>
                  <Input
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    className="bg-secondary border-border"
                    placeholder="🍔"
                  />
                </div>
                <Button onClick={handleAddCategory} className="w-full bg-primary text-primary-foreground">
                  Add Category
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground flex-1 sm:flex-initial" size="sm">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Product</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Add Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div>
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="bg-secondary border-border"
                    disabled={newProduct.hasVariants}
                    placeholder={newProduct.hasVariants ? "Will be set in variants" : "0.00"}
                  />
                  {newProduct.hasVariants && (
                    <p className="text-xs text-muted-foreground mt-1">Price will be set for each variant</p>
                  )}
                </div>
                <div>
                  <Label>Stock Quantity</Label>
                  <Input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="bg-secondary border-border"
                    disabled={newProduct.hasVariants}
                    placeholder={newProduct.hasVariants ? "Will be set in variants" : "0"}
                  />
                  {newProduct.hasVariants && (
                    <p className="text-xs text-muted-foreground mt-1">Stock will be managed per variant</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newProduct.hasVariants}
                    onCheckedChange={(checked) => setNewProduct({ ...newProduct, hasVariants: checked })}
                  />
                  <Label>Product has variants (e.g., Small/Medium/Large)</Label>
                </div>                <div className="flex items-center gap-2">
                  <Switch
                    checked={newProduct.isInventoryItem}
                    onCheckedChange={(checked) => setNewProduct({ ...newProduct, isInventoryItem: checked })}
                  />
                  <Label className="text-sm">Inventory Item (Cooldrinks, Ice Cream - stock matters)</Label>
                </div>                <div>
                  <Label>Category</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddProduct} className="w-full bg-primary text-primary-foreground">
                  Add Product
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Low stock alerts removed - only for inventory items, not food products */}

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <Label>Price (₹)</Label>
              <Input
                type="number"
                step="0.01"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                className="bg-secondary border-border"
                disabled={editForm.hasVariants}
                placeholder={editForm.hasVariants ? "Will be set in variants" : "0.00"}
              />
              {editForm.hasVariants && (
                <p className="text-xs text-muted-foreground mt-1">Price will be set for each variant</p>
              )}
            </div>
            <div>
              <Label>Stock Quantity</Label>
              <Input
                type="number"
                value={editForm.stock}
                onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                className="bg-secondary border-border"
                disabled={editForm.hasVariants}
                placeholder={editForm.hasVariants ? "Will be set in variants" : "0"}
              />
              {editForm.hasVariants && (
                <p className="text-xs text-muted-foreground mt-1">Stock will be managed per variant</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editForm.hasVariants}
                onCheckedChange={(checked) => setEditForm({ ...editForm, hasVariants: checked })}
              />
              <Label className="text-sm">Has Variants (e.g., Small/Medium/Large)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editForm.isInventoryItem}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isInventoryItem: checked })}
              />
              <Label className="text-sm">Inventory Item (Cooldrinks, Ice Cream - stock matters)</Label>
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={editForm.category}
                onValueChange={(v) => setEditForm({ ...editForm, category: v })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon && <span>{cat.icon} </span>}
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editForm.hasVariants && editingProduct && (
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-sm text-primary mb-2">💡 Manage variants after saving</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setVariantProductId(editingProduct.id);
                    setVariantProductName(editForm.name || editingProduct.name);
                  }}
                  className="w-full"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Manage Variants
                </Button>
              </div>
            )}
            <Button onClick={handleUpdateProduct} className="w-full bg-primary text-primary-foreground">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs for Active and Deleted Products */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="active" className="text-xs sm:text-sm">Products ({products.length})</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm flex items-center gap-1">
            <Tags className="w-3 h-3" />
            <span>Categories</span>
          </TabsTrigger>
          <TabsTrigger value="deleted" className="text-xs sm:text-sm">Trash ({deletedProducts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 sm:mt-6">
          <div className="bg-card rounded-xl border border-border overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Product</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Category</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Price</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Stock</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const category = categories.find((c) => c.id === product.category_id);
                  const isInventoryItem = (product as any).is_inventory_item;
                  const isLow = isInventoryItem && product.stock_quantity <= ((product as any).low_stock_threshold || 10);
                  const isOut = isInventoryItem && product.stock_quantity <= 0;
                  
                  return (
                    <tr key={product.id} className="border-t border-border hover:bg-secondary/20">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-foreground">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {category ? (
                          <>
                            {category.icon && <span>{category.icon} </span>}
                            {category.name}
                          </>
                        ) : "—"}
                      </td>
                      <td className="p-4 text-foreground">{formatCurrency(product.price)}</td>
                      <td className="p-4">
                        {isInventoryItem ? (
                          <span className={isOut ? "text-destructive font-semibold" : isLow ? "text-warning font-semibold" : "text-foreground"}>
                            {product.stock_quantity}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        {isInventoryItem ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isOut
                                ? "bg-destructive/20 text-destructive"
                                : isLow
                                ? "bg-warning/20 text-warning"
                                : "bg-success/20 text-success"
                            }`}
                          >
                            {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                            Made Fresh
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setVariantProductId(product.id);
                              setVariantProductName(product.name);
                            }}
                            className="h-8"
                            title="Manage Variants"
                          >
                            <Package className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            className="h-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No products yet. Add your first product to get started!
              </div>
            )}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-4 sm:mt-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold">Product Categories</h3>
                <p className="text-sm text-muted-foreground mt-1">Manage categories for organizing your products</p>
              </div>
              <Button 
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({ name: "", icon: "" });
                  setIsCategoryDialogOpen(true);
                }}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No categories yet. Add your first category!
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell><span className="text-2xl">{category.icon || "-"}</span></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(category);
                              setCategoryForm({ name: category.name, icon: category.icon || "" });
                              setIsCategoryDialogOpen(true);
                            }}
                            className="h-8"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (confirm(`Delete category "${category.name}"? Products in this category will be uncategorized.`)) {
                                try {
                                  await deleteCategory.mutateAsync(category.id);
                                  toast({
                                    title: "Category Deleted",
                                    description: "Category has been removed successfully",
                                  });
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description: error.message || "Failed to delete category",
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="deleted" className="mt-4 sm:mt-6">
          <div className="bg-card rounded-xl border border-border overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Product</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Category</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Price</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Deleted At</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedProducts.map((product) => {
                  const category = categories.find((c) => c.id === product.category_id);
                  
                  return (
                    <tr key={product.id} className="border-t border-border hover:bg-secondary/20">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center opacity-50">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-muted-foreground">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {category ? (
                          <>
                            {category.icon && <span>{category.icon} </span>}
                            {category.name}
                          </>
                        ) : "—"}
                      </td>
                      <td className="p-4 text-muted-foreground">{formatCurrency(product.price)}</td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {product.deleted_at ? new Date(product.deleted_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreProduct(product.id, product.name)}
                          className="h-8"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restore
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {deletedProducts.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Trash is empty. Deleted products will appear here.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="category_name">Category Name</Label>
              <Input
                id="category_name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g., Beverages, Snacks"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="category_icon">Icon (Optional)</Label>
              <Input
                id="category_icon"
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                placeholder="e.g., 🍔, 🍕, 🥤"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1.5">Use an emoji or leave blank</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!categoryForm.name.trim()) {
                  toast({
                    title: "Error",
                    description: "Category name is required",
                    variant: "destructive",
                  });
                  return;
                }

                try {
                  if (editingCategory) {
                    await updateCategory.mutateAsync({
                      id: editingCategory.id,
                      name: categoryForm.name.trim(),
                      icon: categoryForm.icon.trim() || undefined,
                    });
                    toast({
                      title: "Category Updated",
                      description: "Category has been updated successfully",
                    });
                  } else {
                    await createCategory.mutateAsync({
                      name: categoryForm.name.trim(),
                      icon: categoryForm.icon.trim() || undefined,
                    });
                    toast({
                      title: "Category Added",
                      description: "Category has been created successfully",
                    });
                  }
                  setIsCategoryDialogOpen(false);
                  setCategoryForm({ name: "", icon: "" });
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to save category",
                    variant: "destructive",
                  });
                }
              }}
            >
              {editingCategory ? "Update" : "Add"} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variant Manager Dialog */}
      <VariantManager
        productId={variantProductId || ''}
        productName={variantProductName}
        open={!!variantProductId}
        onClose={() => setVariantProductId(null)}
      />

      <InventoryManager
        open={isInventoryManagerOpen}
        onClose={() => setIsInventoryManagerOpen(false)}
      />
    </div>
  );
};
