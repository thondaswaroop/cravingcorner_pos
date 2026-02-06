import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CartItem, Customer, Order } from "@/types/pos";
import { CartItemWithVariant } from "@/types/variants";
import { Smartphone, Banknote, Gift, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { useSettings } from "@/hooks/useSettings";
import { Receipt } from "./Receipt";
import { useReceiptPrinter } from "./ReceiptPrinterProvider";

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  cart: CartItemWithVariant[];
  customer: Customer | null;
  onConfirm: (params: {
    discount: number;
    pointsRedeemed: number;
    paymentMethod: string;
  }) => Promise<Order>;
}

export const CheckoutDialog = ({ open, onClose, cart, customer, onConfirm }: CheckoutDialogProps) => {
  const { data: settings } = useSettings();
  const [discount, setDiscount] = useState(0);
  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");
  const [transactionNo, setTransactionNo] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [orderSnapshot, setOrderSnapshot] = useState<{
    cart: CartItemWithVariant[];
    subtotal: number;
    tax: number;
    discount: number;
    pointsDiscount: number;
    total: number;
    paymentMethod: string;
    transactionNo: string;
  } | null>(null);

  // Auto-generate unique transaction number when dialog opens
  useEffect(() => {
    if (open && !transactionNo) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      setTransactionNo(`TXN${timestamp}${random}`);
    }
  }, [open]);

  const taxRate = (settings?.tax_rate || 5) / 100;
  const subtotal = cart.reduce((sum, item) => {
    const price = item.variant?.price || item.product.price;
    return sum + price * item.quantity;
  }, 0);
  const tax = subtotal * taxRate;
  const pointsDiscount = pointsRedeemed * 0.01; // 100 points = ₹1
  const total = Math.max(0, subtotal + tax - discount - pointsDiscount);
  const maxPoints = customer?.loyalty_points || 0;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      // Save snapshot of current order values before cart is cleared
      const snapshot = {
        cart: [...cart],
        subtotal,
        tax,
        discount,
        pointsDiscount,
        total,
        paymentMethod,
        transactionNo,
      };
      
      const order = await onConfirm({ discount, pointsRedeemed, paymentMethod });
      setOrderSnapshot(snapshot);
      setCompletedOrder(order);
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const { printOrder } = useReceiptPrinter();

  const handlePrint = async () => {
    if (!completedOrder || !orderSnapshot) return;
    await printOrder({ orderId: completedOrder.id, snapshot: { ...orderSnapshot, createdAt: completedOrder.created_at, pointsEarned: completedOrder.points_earned } });
  };

  const handleClose = () => {
    setCompletedOrder(null);
    setOrderSnapshot(null);
    setDiscount(0);
    setPointsRedeemed(0);
    setTransactionNo("");
    onClose();
  };

    if (completedOrder && orderSnapshot) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-card border-border max-w-md max-h-[85vh] overflow-y-auto">
          <div className="text-center py-6 px-6">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground">Order #{completedOrder.id.slice(0, 8)}</p>
            
            {/* Receipt preview - visible on screen */}
            <div className="mt-6 p-4 bg-card text-foreground rounded-lg text-left text-sm font-mono border-2 border-dashed border-border max-h-[60vh] overflow-y-auto">
              <Receipt
                orderId={completedOrder.id}
                createdAt={completedOrder.created_at}
                transactionNo={orderSnapshot.transactionNo}
                paymentMethod={orderSnapshot.paymentMethod}
                items={orderSnapshot.cart}
                subtotal={orderSnapshot.subtotal}
                tax={orderSnapshot.tax}
                discount={orderSnapshot.discount + orderSnapshot.pointsDiscount}
                total={orderSnapshot.total}
                pointsEarned={completedOrder.points_earned}
                className=""
              />
            </div>

            {/* Printing handled by ReceiptPrinterProvider (no hidden local receipt needed) */}

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={handlePrint} className="flex-1">
                Print Receipt
              </Button>
              <Button onClick={handleClose} className="flex-1 bg-primary text-primary-foreground">
                New Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Checkout</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment method */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={cn(
                  "p-4 rounded-lg border flex flex-col items-center gap-2 transition-all",
                  paymentMethod === "cash"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Banknote className="w-6 h-6" />
                <span className="text-sm font-medium">Cash</span>
              </button>
              <button
                onClick={() => setPaymentMethod("online")}
                className={cn(
                  "p-4 rounded-lg border flex flex-col items-center gap-2 transition-all",
                  paymentMethod === "online"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Smartphone className="w-6 h-6" />
                <span className="text-sm font-medium">Online</span>
              </button>
            </div>
          </div>

          {/* Transaction Number for Online Payment */}
          {paymentMethod === "online" && (
            <div>
              <Label htmlFor="transaction-no">Transaction Number *</Label>
              <Input
                id="transaction-no"
                value={transactionNo}
                onChange={(e) => setTransactionNo(e.target.value)}
                placeholder="Enter transaction/reference number"
                className="bg-secondary border-border"
              />
            </div>
          )}

          {/* Discount */}
          <div>
            <Label htmlFor="discount" className="text-sm text-muted-foreground">
              Discount ({settings?.currency_symbol || "₹"})
            </Label>
            <Input
              id="discount"
              type="number"
              min="0"
              step="0.01"
              value={discount || ""}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="bg-secondary border-border"
            />
          </div>

          {/* Loyalty points */}
          {customer && maxPoints > 0 && (
            <div>
              <Label htmlFor="points" className="text-sm text-muted-foreground flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                Redeem Points (max {maxPoints})
              </Label>
              <Input
                id="points"
                type="number"
                min="0"
                max={maxPoints}
                value={pointsRedeemed || ""}
                onChange={(e) => setPointsRedeemed(Math.min(Number(e.target.value) || 0, maxPoints))}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                = {formatCurrency(pointsRedeemed * 0.01)} discount
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({settings?.tax_rate || 5}%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            {(discount > 0 || pointsDiscount > 0) && (
              <div className="flex justify-between text-sm text-accent">
                <span>Discount</span>
                <span>-{formatCurrency(discount + pointsDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="w-full h-12 bg-primary text-primary-foreground font-semibold glow-primary"
          >
            {isProcessing ? "Processing..." : `Pay ${formatCurrency(total)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
