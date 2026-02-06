import { useState, useEffect } from 'react';
import { useProducts, useUpdateProduct } from '@/hooks/useProducts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';

interface InventoryManagerProps {
  open: boolean;
  onClose: () => void;
}

export const InventoryManager = ({ open, onClose }: InventoryManagerProps) => {
  const { data: allProducts = [] } = useProducts();
  const updateProduct = useUpdateProduct();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    stock_quantity: '',
    low_stock_threshold: '',
  });

  // Filter only inventory items (items that are not made fresh, like cooldrinks, ice creams)
  const inventoryProducts = allProducts.filter(
    (p) => (p as any).is_inventory_item && !p.deleted_at
  );

  const lowStockProducts = inventoryProducts.filter(
    (p) => p.stock_quantity <= ((p as any).low_stock_threshold || 10)
  );

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setEditForm({
      stock_quantity: product.stock_quantity?.toString() || '0',
      low_stock_threshold: (product.low_stock_threshold || 10).toString(),
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      await updateProduct.mutateAsync({
        id: editingId,
        stock_quantity: parseInt(editForm.stock_quantity) || 0,
        low_stock_threshold: parseInt(editForm.low_stock_threshold) || 10,
      } as any);
      toast({ title: 'Success', description: 'Inventory updated' });
      setEditingId(null);
      setEditForm({ stock_quantity: '', low_stock_threshold: '' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update inventory', variant: 'destructive' });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ stock_quantity: '', low_stock_threshold: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Inventory Management
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Manage stock levels for cooldrinks, ice creams, and other pre-stocked items
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-warning mb-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Low Stock Alert</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="px-3 py-2 bg-warning/20 rounded-lg text-sm"
                  >
                    <div className="font-semibold text-warning">{product.name}</div>
                    <div className="text-xs text-warning/80">
                      {product.stock_quantity} left (Alert at {(product as any).low_stock_threshold || 10})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Alert Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No inventory items found</p>
                      <p className="text-xs mt-1">
                        Mark products as "Inventory Item" in Product Management
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryProducts.map((product) => {
                    const isEditing = editingId === product.id;
                    const isLowStock = product.stock_quantity <= ((product as any).low_stock_threshold || 10);
                    const isOutOfStock = product.stock_quantity <= 0;

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editForm.stock_quantity}
                              onChange={(e) =>
                                setEditForm({ ...editForm, stock_quantity: e.target.value })
                              }
                              className="w-24"
                            />
                          ) : (
                            <Badge
                              variant={
                                isOutOfStock
                                  ? 'destructive'
                                  : isLowStock
                                  ? 'secondary'
                                  : 'default'
                              }
                            >
                              {product.stock_quantity}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editForm.low_stock_threshold}
                              onChange={(e) =>
                                setEditForm({ ...editForm, low_stock_threshold: e.target.value })
                              }
                              className="w-24"
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {(product as any).low_stock_threshold || 10}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isOutOfStock ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : isLowStock ? (
                            <Badge variant="secondary" className="bg-warning/20 text-warning">
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-success">
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-1">
                              <Button
                                onClick={handleSave}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-success"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={handleCancel}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleEdit(product)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
