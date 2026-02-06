import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { useCreateOrder } from "@/hooks/useOrders";
import { CategoryTabs } from "./CategoryTabs";
import { ProductGrid } from "./ProductGrid";
import { Cart } from "./Cart";
import { CheckoutDialog } from "./CheckoutDialog";
import { CustomerDialog } from "./CustomerDialog";
import { VariantSelector } from "./VariantSelector";
import { CartItem, Product, Customer } from "@/types/pos";
import { ProductWithVariants, ProductVariant, CartItemWithVariant } from "@/types/variants";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";

export const POSTerminal = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItemWithVariant[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [variantSelectorProduct, setVariantSelectorProduct] = useState<ProductWithVariants | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: products = [], isLoading: productsLoading } = useProducts(selectedCategory || undefined);
  const createOrder = useCreateOrder();
  const { toast } = useToast();

  const addToCart = (product: ProductWithVariants, variant?: ProductVariant) => {
    // Check if product has variants
    if ((product as any).has_variants && !variant) {
      // Show variant selector
      setVariantSelectorProduct(product);
      return;
    }

    const effectivePrice = variant?.price || product.price;
    const cartKey = variant ? `${product.id}-${variant.id}` : product.id;
    
    // Only check stock for inventory items (cooldrinks, ice cream, etc.)
    const isInventoryItem = (product as any).is_inventory_item;
    const effectiveStock = variant?.stock_quantity || product.stock_quantity;

    setCart((prev) => {
      const existing = prev.find((item) => {
        const itemKey = item.variant ? `${item.product.id}-${item.variant.id}` : item.product.id;
        return itemKey === cartKey;
      });

      if (existing) {
        // Check stock limit only for inventory items
        if (isInventoryItem && existing.quantity >= effectiveStock) {
          toast({
            title: "Stock limit reached",
            description: `Only ${effectiveStock} available`,
            variant: "destructive",
          });
          return prev;
        }
        return prev.map((item) => {
          const itemKey = item.variant ? `${item.product.id}-${item.variant.id}` : item.product.id;
          return itemKey === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item;
        });
      }
      return [...prev, { product, variant, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    
    const item = cart.find((i) => {
      if (variantId) {
        return i.product.id === productId && i.variant?.id === variantId;
      }
      return i.product.id === productId && !i.variant;
    });

    // Only check stock for inventory items
    const isInventoryItem = item ? (item.product as any).is_inventory_item : false;
    const effectiveStock = item?.variant?.stock_quantity || item?.product.stock_quantity || 0;
    
    if (isInventoryItem && item && quantity > effectiveStock) {
      toast({
        title: "Stock limit reached",
        description: `Only ${effectiveStock} available`,
        variant: "destructive",
      });
      return;
    }
    
    setCart((prev) =>
      prev.map((item) => {
        if (variantId) {
          return item.product.id === productId && item.variant?.id === variantId
            ? { ...item, quantity }
            : item;
        }
        return item.product.id === productId && !item.variant ? { ...item, quantity } : item;
      })
    );
  };

  const removeItem = (productId: string, variantId?: string) => {
    setCart((prev) => prev.filter((item) => {
      if (variantId) {
        return !(item.product.id === productId && item.variant?.id === variantId);
      }
      return !(item.product.id === productId && !item.variant);
    }));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
  };

  const handleCheckout = async (params: {
    discount: number;
    pointsRedeemed: number;
    paymentMethod: string;
  }) => {
    const order = await createOrder.mutateAsync({
      cart,
      customerId: selectedCustomer?.id,
      ...params,
    });
    
    setCart([]);
    setSelectedCustomer(null);
    
    return order;
  };

  const isLoading = categoriesLoading || productsLoading;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => {
    const price = item.variant?.price || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 relative">
      {/* Left side - Menu (Full width on mobile, flexible on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        
        <div className="flex-1 overflow-y-auto mt-4 pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>No products found</p>
            </div>
          ) : (
            <ProductGrid products={products} onAddToCart={addToCart} />
          )}
        </div>
      </div>

      {/* Right side - Cart (Sidebar on desktop only) */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <Cart
          items={cart}
          customer={selectedCustomer}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClearCart={clearCart}
          onCheckout={() => setIsCheckoutOpen(true)}
          onSelectCustomer={() => setIsCustomerDialogOpen(true)}
        />
      </div>

      {/* Floating Cart Button - Mobile only */}
      <div className="lg:hidden fixed bottom-4 left-0 right-0 z-50 px-4">
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="w-full h-16 rounded-2xl shadow-2xl bg-primary hover:bg-primary/90 flex items-center justify-between px-6"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs">
                      {totalItems}
                    </Badge>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">View Cart</p>
                  <p className="text-xs opacity-90">{totalItems} {totalItems === 1 ? 'item' : 'items'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] p-0">
            <Cart
              items={cart}
              customer={selectedCustomer}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onClearCart={clearCart}
              onCheckout={() => {
                setIsCartOpen(false);
                setIsCheckoutOpen(true);
              }}
              onSelectCustomer={() => setIsCustomerDialogOpen(true)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Dialogs */}
      <CheckoutDialog
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        customer={selectedCustomer}
        onConfirm={handleCheckout}
      />
      
      <CustomerDialog
        open={isCustomerDialogOpen}
        onClose={() => setIsCustomerDialogOpen(false)}
        onSelectCustomer={setSelectedCustomer}
        selectedCustomer={selectedCustomer}
      />

      {/* Variant Selector Dialog */}
      <VariantSelector
        product={variantSelectorProduct}
        open={!!variantSelectorProduct}
        onClose={() => setVariantSelectorProduct(null)}
        onSelectVariant={(product, variant) => addToCart(product, variant)}
      />
    </div>
  );
};
