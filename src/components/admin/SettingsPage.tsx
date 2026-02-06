import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Percent, Save } from "lucide-react";

export const SettingsPage = () => {
  const [taxRate, setTaxRate] = useState("10");
  const { toast } = useToast();

  useEffect(() => {
    const savedTaxRate = localStorage.getItem('pos_tax_rate');
    if (savedTaxRate) {
      setTaxRate(savedTaxRate);
    }
  }, []);

  const handleSave = () => {
    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({
        title: "Invalid Tax Rate",
        description: "Please enter a valid tax rate between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('pos_tax_rate', taxRate);
    toast({
      title: "Settings Saved",
      description: `Tax rate set to ${taxRate}%`,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Settings
        </h2>
        <p className="text-sm text-muted-foreground">Manage POS system settings</p>
      </div>

      {/* Tax Settings */}
      <Card className="p-4 sm:p-6 bg-card border-border">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Tax Configuration</h3>
          </div>

          <div className="max-w-md space-y-4">
            <div>
              <Label htmlFor="tax-rate">Tax Rate (%)</Label>
              <div className="flex gap-3 mt-2">
                <Input
                  id="tax-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="bg-secondary border-border"
                  placeholder="Enter tax rate"
                />
                <Button
                  onClick={handleSave}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Current tax rate: {taxRate}% - This will be applied to all orders
              </p>
            </div>

            <div className="bg-secondary/30 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Example Calculation:</h4>
              <div className="text-sm space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹1,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({taxRate}%):</span>
                  <span>₹{(1000 * parseFloat(taxRate || '0') / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border">
                  <span>Total:</span>
                  <span>₹{(1000 + (1000 * parseFloat(taxRate || '0') / 100)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Settings Card (for future expansion) */}
      <Card className="p-4 sm:p-6 bg-card border-border opacity-50">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Other Settings</h3>
          <p className="text-sm text-muted-foreground">More settings coming soon...</p>
        </div>
      </Card>
    </div>
  );
};
