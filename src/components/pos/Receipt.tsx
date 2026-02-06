import { formatCurrency } from "@/lib/currency";
import { CartItemWithVariant } from "@/types/variants";
import { OrderItem } from "@/types/pos";
import { useSettings } from "@/hooks/useSettings";

interface ReceiptProps {
  orderId: string;
  createdAt: string;
  transactionNo?: string;
  paymentMethod: string;
  items: (CartItemWithVariant | OrderItem)[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  pointsEarned?: number;
  className?: string;
}

export const Receipt = ({
  orderId,
  createdAt,
  transactionNo,
  paymentMethod,
  items,
  subtotal,
  tax,
  discount,
  total,
  pointsEarned,
  className = "",
}: ReceiptProps) => {
  const { data: settings } = useSettings();

  const isCartItem = (item: any): item is CartItemWithVariant => {
    return 'product' in item;
  };

  return (
    <div className={`receipt-content ${className}`}>
      {/* Header */}
      <div className="text-center mb-3 pb-3 border-b-2 border-dotted border-border">
        <h3 className="font-bold text-base tracking-wider mb-1">
          {settings?.business_name || "CRAVING CORNER"}
        </h3>
        {settings?.business_address && (
          <div className="text-xs whitespace-pre-line leading-tight">
            {settings.business_address}
          </div>
        )}
        {settings?.business_phone && (
          <p className="text-xs mt-1">{settings.business_phone}</p>
        )}
      </div>

      {/* Transaction Info */}
      <div className="mb-2 pb-2 border-b border-dotted border-border space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Date:</span>
          <span className="font-semibold">
            {new Date(createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}{' '}
            {new Date(createdAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Payment:</span>
          <span className="font-semibold capitalize">{paymentMethod}</span>
        </div>
      </div>

      {/* Items */}
      <div className="mb-2 pb-2 border-b border-dotted border-border">
        {items.map((item, index) => {
          let itemName: string;
          let itemPrice: number;
          let itemQuantity: number;
          let itemTotal: number;

          if (isCartItem(item)) {
            // CartItemWithVariant
            itemPrice = item.variant?.price || item.product.price;
            itemQuantity = item.quantity;
            itemTotal = itemPrice * itemQuantity;
            itemName = item.variant
              ? `${item.product.name} (${item.variant.name})`
              : item.product.name;
          } else {
            // OrderItem
            itemName = item.product_name;
            if (item.variant_name) {
              itemName += ` (${item.variant_name})`;
            }
            itemPrice = item.unit_price;
            itemQuantity = item.quantity;
            itemTotal = item.total_price;
          }

          const itemKey = isCartItem(item)
            ? `${item.product.id}-${item.variant?.id || 'base'}-${index}`
            : `${item.product_id}-${item.variant_id || 'base'}-${index}`;

          return (
            <div key={itemKey} className="mb-1.5">
              <div className="flex justify-between text-xs">
                <span className="flex-1 pr-2">{itemName}</span>
                <span className="font-semibold">{formatCurrency(itemTotal)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {itemQuantity} x {formatCurrency(itemPrice)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="space-y-1 text-xs mb-2">
        <div className="flex justify-between">
          <span>Sub Total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm pt-1 border-t border-dotted border-border">
          <span>TOTAL</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-2 pt-2 border-t border-dotted border-border">
        {pointsEarned && pointsEarned > 0 && (
          <p className="text-xs mb-1">Points: +{pointsEarned}</p>
        )}
        <p className="text-xs uppercase font-bold">
          {settings?.receipt_footer || "Thank you!"}
        </p>
      </div>
    </div>
  );
};
