import { useState } from "react";
import { POSTerminal } from "@/components/pos/POSTerminal";
import { OrderHistory } from "@/components/pos/OrderHistory";
import { StockManagement } from "@/components/admin/StockManagement";
import { InventoryManagement } from "@/components/admin/InventoryManagement";
import { SalesReports } from "@/components/admin/SalesReports";
import { LoyaltyDashboard } from "@/components/admin/LoyaltyDashboard";
import { Settings } from "@/components/admin/Settings";
import { UserManagement } from "@/components/admin/UserManagement";
import { useAuth } from "@/contexts/AuthContext";
import { APP_CONFIG } from "@/config/app.config";
import { cn } from "@/lib/utils";
import { ShoppingCart, Package, BarChart3, Gift, Store, UtensilsCrossed, Settings as SettingsIcon, Users, LogOut, History } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tab = "pos" | "orders" | "products" | "inventory" | "sales" | "loyalty" | "settings" | "users";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("pos");
  const { user, logout } = useAuth();

  // Define all tabs with role restrictions
  const allTabs = [
    { id: "pos" as Tab, label: "POS Terminal", icon: ShoppingCart, component: POSTerminal, roles: ['admin', 'cashier'] },
    { id: "orders" as Tab, label: "Order History", icon: History, component: OrderHistory, roles: ['admin', 'cashier'] },
    { id: "products" as Tab, label: "Food Products", icon: UtensilsCrossed, component: StockManagement, roles: ['admin'] },
    { id: "inventory" as Tab, label: "Inventory", icon: Package, component: InventoryManagement, roles: ['admin'] },
    { id: "sales" as Tab, label: "Sales", icon: BarChart3, component: SalesReports, roles: ['admin'] },
    { id: "loyalty" as Tab, label: "Loyalty", icon: Gift, component: LoyaltyDashboard, roles: ['admin'] },
    { id: "settings" as Tab, label: "Settings", icon: SettingsIcon, component: Settings, roles: ['admin'] },
    { id: "users" as Tab, label: "Users", icon: Users, component: UserManagement, roles: ['admin'] },
  ];

  // Filter tabs based on user role
  const tabs = allTabs.filter(tab => tab.roles.includes(user?.role || 'cashier'));
  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || POSTerminal;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center glow-primary">
            <Store className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-foreground">{APP_CONFIG.APP_NAME}</h1>
            <p className="text-xs text-muted-foreground">{APP_CONFIG.APP_TAGLINE}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <>
              <div className="text-right hidden lg:block">
                <p className="text-sm font-medium text-foreground">{user.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
              <Button onClick={logout} variant="outline" size="sm" className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-card/30 backdrop-blur-xl overflow-x-auto scrollbar-hide flex-shrink-0">
        <div className="flex gap-1 px-3 sm:px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 font-medium text-sm transition-all duration-200 whitespace-nowrap border-b-2",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-3 sm:p-6 overflow-auto">
        <div className="h-full animate-fade-in">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
};

export default Index;
