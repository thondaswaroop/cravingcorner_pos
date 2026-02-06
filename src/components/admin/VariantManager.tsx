import { useState } from 'react';
import { useProductVariants, useCreateVariant, useUpdateVariant, useDeleteVariant } from '@/hooks/useProductVariants';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';

interface VariantManagerProps {
  productId: string;
  productName: string;
  open: boolean;
  onClose: () => void;
}

export const VariantManager = ({ productId, productName, open, onClose }: VariantManagerProps) => {
  const { data: variants = [] } = useProductVariants(productId);
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const deleteVariant = useDeleteVariant();
  const { toast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock_quantity: '',
  });

  const resetForm = () => {
    setFormData({ name: '', price: '', stock_quantity: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast({ title: 'Error', description: 'Name and price are required', variant: 'destructive' });
      return;
    }

    try {
      if (editingId) {
        await updateVariant.mutateAsync({
          id: editingId,
          name: formData.name,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity) || 0,
        });
        toast({ title: 'Success', description: 'Variant updated' });
      } else {
        await createVariant.mutateAsync({
          product_id: productId,
          name: formData.name,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          is_available: true,
          display_order: variants.length,
        });
        toast({ title: 'Success', description: 'Variant added' });
      }
      resetForm();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save variant', variant: 'destructive' });
    }
  };

  const handleEdit = (variant: any) => {
    setEditingId(variant.id);
    setFormData({
      name: variant.name,
      price: variant.price.toString(),
      stock_quantity: variant.stock_quantity.toString(),
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVariant.mutateAsync({ id, productId });
      toast({ title: 'Success', description: 'Variant deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete variant', variant: 'destructive' });
    }
  };

  const handleToggleAvailability = async (id: string, isAvailable: boolean) => {
    try {
      await updateVariant.mutateAsync({ id, is_available: isAvailable });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update availability', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Manage Variants - {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add/Edit Form */}
          {isAdding ? (
            <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm">{editingId ? 'Edit Variant' : 'Add New Variant'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="variant-name">Variant Name</Label>
                  <Input
                    id="variant-name"
                    placeholder="e.g., Small, Medium, Large"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="variant-price">Price (₹)</Label>
                  <Input
                    id="variant-price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="variant-stock">Stock</Label>
                  <Input
                    id="variant-stock"
                    type="number"
                    placeholder="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">
                  {editingId ? 'Update' : 'Add'} Variant
                </Button>
                <Button onClick={resetForm} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Variant
            </Button>
          )}

          {/* Variants List */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No variants added yet
                    </TableCell>
                  </TableRow>
                ) : (
                  variants.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell className="font-medium">{variant.name}</TableCell>
                      <TableCell>{formatCurrency(variant.price)}</TableCell>
                      <TableCell>
                        <Badge variant={variant.stock_quantity > 0 ? 'default' : 'destructive'}>
                          {variant.stock_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={variant.is_available}
                          onCheckedChange={(checked) => handleToggleAvailability(variant.id, checked)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            onClick={() => handleEdit(variant)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(variant.id)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
