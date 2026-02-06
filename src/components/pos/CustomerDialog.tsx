import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Customer } from "@/types/pos";
import { formatCurrency } from "@/lib/currency";
import { useCustomers, useCreateCustomer, useSearchCustomer } from "@/hooks/useCustomers";
import { Search, UserPlus, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer | null) => void;
  selectedCustomer: Customer | null;
}

export const CustomerDialog = ({ open, onClose, onSelectCustomer, selectedCustomer }: CustomerDialogProps) => {
  const [searchPhone, setSearchPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  
  const { data: customers = [] } = useCustomers();
  const { data: searchResult } = useSearchCustomer(searchPhone);
  const createCustomer = useCreateCustomer();
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    
    try {
      const customer = await createCustomer.mutateAsync({
        name: newName,
        phone: newPhone || undefined,
        email: newEmail || undefined,
      });
      onSelectCustomer(customer);
      toast({ title: "Success", description: "Customer created successfully" });
      setIsCreating(false);
      setNewName("");
      setNewPhone("");
      setNewEmail("");
      onClose();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create customer", variant: "destructive" });
    }
  };

  const filteredCustomers = searchPhone
    ? customers.filter(c => c.phone?.includes(searchPhone) || c.name.toLowerCase().includes(searchPhone.toLowerCase()))
    : customers;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isCreating ? "New Customer" : "Select Customer"}
          </DialogTitle>
        </DialogHeader>

        {isCreating ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-secondary border-border"
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="bg-secondary border-border"
                placeholder="Phone number"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="bg-secondary border-border"
                placeholder="Email address"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreate} className="flex-1 bg-primary text-primary-foreground">
                Create
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="bg-secondary border-border pl-10"
                placeholder="Search by name or phone..."
              />
            </div>

            {/* Customer list */}
            <div className="flex-1 overflow-y-auto space-y-2 mt-2">
              {selectedCustomer && (
                <button
                  onClick={() => {
                    onSelectCustomer(null);
                    onClose();
                  }}
                  className="w-full p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-left hover:bg-destructive/20 transition-colors"
                >
                  <span className="text-sm text-destructive">Remove selected customer</span>
                </button>
              )}
              
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    onSelectCustomer(customer);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedCustomer?.id === customer.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 bg-secondary/30"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-foreground">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.phone || "No phone"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Gift className="w-3 h-3 text-primary" />
                        {customer.loyalty_points || 0} pts
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(customer.total_spent || 0)} spent
                      </p>
                    </div>
                  </div>
                </button>
              ))}
              
              {filteredCustomers.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">
                  No customers found
                </p>
              )}
            </div>

            {/* Add new customer button */}
            <Button
              onClick={() => setIsCreating(true)}
              variant="outline"
              className="w-full mt-2"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              New Customer
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
