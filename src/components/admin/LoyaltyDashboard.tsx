import { useCustomers } from "@/hooks/useCustomers";
import { Gift, TrendingUp, Users } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export const LoyaltyDashboard = () => {
  const { data: customers = [] } = useCustomers();

  const topCustomers = [...customers]
    .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
    .slice(0, 10);

  const totalPoints = customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0);
  const totalCustomers = customers.length;
  const avgPoints = totalCustomers > 0 ? totalPoints / totalCustomers : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Loyalty Program</h2>
        <p className="text-muted-foreground">Customer rewards and points management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold text-foreground">{totalCustomers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Gift className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="text-2xl font-bold text-foreground">{totalPoints.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Points</p>
              <p className="text-2xl font-bold text-foreground">{Math.round(avgPoints)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loyalty info */}
      <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl border border-primary/30 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">How Loyalty Points Work</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-background/50 rounded-lg p-4">
            <p className="font-medium text-primary">Earning Points</p>
            <p className="text-muted-foreground mt-1">1 point for every ₹1 spent</p>
          </div>
          <div className="bg-background/50 rounded-lg p-4">
            <p className="font-medium text-accent">Redeeming Points</p>
            <p className="text-muted-foreground mt-1">100 points = ₹1 discount</p>
          </div>
          <div className="bg-background/50 rounded-lg p-4">
            <p className="font-medium text-success">Benefits</p>
            <p className="text-muted-foreground mt-1">Points never expire</p>
          </div>
        </div>
      </div>

      {/* Top customers */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Top Customers</h3>
        </div>
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Rank</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Customer</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Contact</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Points</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((customer, index) => (
              <tr key={customer.id} className="border-t border-border hover:bg-secondary/20">
                <td className="p-4">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? "bg-primary/20 text-primary"
                        : index === 1
                        ? "bg-muted text-foreground"
                        : index === 2
                        ? "bg-warning/20 text-warning"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                </td>
                <td className="p-4 font-medium text-foreground">{customer.name}</td>
                <td className="p-4 text-muted-foreground">
                  {customer.phone || customer.email || "—"}
                </td>
                <td className="p-4">
                  <span className="flex items-center gap-1 text-primary">
                    <Gift className="w-4 h-4" />
                    {customer.loyalty_points || 0}
                  </span>
                </td>
                <td className="p-4 font-semibold text-foreground">
                  {formatCurrency(customer.total_spent || 0)}
                </td>
              </tr>
            ))}
            {topCustomers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No customers yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
