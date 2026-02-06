import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProductVariants } from '@/hooks/useProductVariants';
import { ProductVariant, ProductWithVariants } from '@/types/variants';
import { formatCurrency } from '@/lib/currency';
import { Package, Check } from 'lucide-react';

interface VariantSelectorProps {
  product: ProductWithVariants | null;
  open: boolean;
  onClose: () => void;
  onSelectVariant: (product: ProductWithVariants, variant: ProductVariant) => void;
}

export const VariantSelector = ({ product, open, onClose, onSelectVariant }: VariantSelectorProps) => {
  const { data: variants = [] } = useProductVariants(product?.id || null);

  const handleSelectVariant = (variant: ProductVariant) => {
    if (product && variant.is_available) {
      onSelectVariant(product, variant);
      onClose();
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {product.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Choose a size or option</p>
        </DialogHeader>

        <div className="space-y-2 py-4 overflow-hidden">
          {variants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No variants available</p>
              <p className="text-xs mt-1">Please add variants in Product Management</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh] space-y-2">
            {variants.map((variant) => {
              const isAvailable = variant.is_available;
              
              return (
                <Button
                  key={variant.id}
                  onClick={() => handleSelectVariant(variant)}
                  disabled={!isAvailable}
                  variant={isAvailable ? "outline" : "ghost"}
                  className={`w-full justify-between h-auto p-4 ${
                    isAvailable ? 'hover:bg-primary/10 hover:border-primary' : 'opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isAvailable ? 'bg-primary/20' : 'bg-secondary'
                    }`}>
                      <Package className={`w-5 h-5 ${isAvailable ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base">{variant.name}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatCurrency(variant.price)}</div>
                      {!isAvailable && (
                        <Badge variant="destructive" className="text-xs">
                          Unavailable
                        </Badge>
                      )}
                    </div>
                    {isAvailable && <Check className="w-5 h-5 text-muted-foreground" />}
                  </div>
                </Button>
              );
            })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
