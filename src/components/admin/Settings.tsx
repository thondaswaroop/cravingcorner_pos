import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Palette, Store, Receipt, Save, Building2, Mail, Phone, MapPin, DollarSign, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const THEMES = {
  yellowDark: { name: "Yellow - Dark", primary: "45 100% 50%", background: "0 0% 8%", card: "0 0% 12%" },
  yellowLight: { name: "Yellow - Light", primary: "45 100% 45%", background: "0 0% 98%", card: "0 0% 100%" },
  blueDark: { name: "Blue - Dark", primary: "217 91% 60%", background: "0 0% 8%", card: "0 0% 12%" },
  blueLight: { name: "Blue - Light", primary: "217 91% 50%", background: "0 0% 98%", card: "0 0% 100%" },
  redDark: { name: "Red - Dark", primary: "0 84% 60%", background: "0 0% 8%", card: "0 0% 12%" },
  redLight: { name: "Red - Light", primary: "0 84% 50%", background: "0 0% 98%", card: "0 0% 100%" },
  greenDark: { name: "Green - Dark", primary: "142 76% 50%", background: "0 0% 8%", card: "0 0% 12%" },
  greenLight: { name: "Green - Light", primary: "142 76% 40%", background: "0 0% 98%", card: "0 0% 100%" },
  purpleDark: { name: "Purple - Dark", primary: "270 80% 60%", background: "0 0% 8%", card: "0 0% 12%" },
  purpleLight: { name: "Purple - Light", primary: "270 80% 50%", background: "0 0% 98%", card: "0 0% 100%" },
  orangeDark: { name: "Orange - Dark", primary: "25 95% 53%", background: "0 0% 8%", card: "0 0% 12%" },
  orangeLight: { name: "Orange - Light", primary: "25 95% 48%", background: "0 0% 98%", card: "0 0% 100%" },
};

interface SettingsData {
  business_name: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  tax_rate: number;
  currency_symbol: string;
  currency_code: string;
  receipt_footer: string;
}

export const Settings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState("yellowDark");
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    business_name: "",
    business_address: "",
    business_phone: "",
    business_email: "",
    tax_rate: 5,
    currency_symbol: "₹",
    currency_code: "INR",
    receipt_footer: "",
  });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    const savedTheme = localStorage.getItem("pos_theme");
    if (savedTheme && THEMES[savedTheme as keyof typeof THEMES]) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings({
          business_name: data.business_name || "",
          business_address: data.business_address || "",
          business_phone: data.business_phone || "",
          business_email: data.business_email || "",
          tax_rate: data.tax_rate || 5,
          currency_symbol: data.currency_symbol || "₹",
          currency_code: data.currency_code || "INR",
          receipt_footer: data.receipt_footer || "",
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({
          id: 1,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Invalidate settings query to refresh all components using useSettings
      queryClient.invalidateQueries({ queryKey: ["settings"] });

      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const applyTheme = (selectedTheme: string) => {
    const themeConfig = THEMES[selectedTheme as keyof typeof THEMES];
    const root = document.documentElement;
    
    root.style.setProperty("--primary", themeConfig.primary);
    root.style.setProperty("--background", themeConfig.background);
    root.style.setProperty("--card", themeConfig.card);
    root.style.setProperty("--ring", themeConfig.primary);
    
    // Update border and input based on background
    const [bh, bs, bl] = themeConfig.background.split(" ");
    const isLight = parseInt(bl) > 50;
    
    // Light theme adjustments
    if (isLight) {
      root.style.setProperty("--border", "0 0% 85%");
      root.style.setProperty("--input", "0 0% 85%");
      root.style.setProperty("--foreground", "0 0% 3.9%");
      root.style.setProperty("--card-foreground", "0 0% 3.9%");
      root.style.setProperty("--popover-foreground", "0 0% 3.9%");
      root.style.setProperty("--primary-foreground", "0 0% 100%");
      root.style.setProperty("--secondary", "0 0% 93%");
      root.style.setProperty("--secondary-foreground", "0 0% 9%");
      root.style.setProperty("--muted", "0 0% 93%");
      root.style.setProperty("--muted-foreground", "0 0% 45%");
      root.style.setProperty("--accent", "0 0% 93%");
      root.style.setProperty("--accent-foreground", "0 0% 9%");
      root.style.setProperty("--destructive", "0 84.2% 60.2%");
      root.style.setProperty("--destructive-foreground", "0 0% 98%");
      root.style.setProperty("--success", "142 76% 36%");
      root.style.setProperty("--success-foreground", "0 0% 100%");
      root.style.setProperty("--warning", "25 95% 53%");
      root.style.setProperty("--warning-foreground", "0 0% 100%");
    } else {
      // Dark theme adjustments
      root.style.setProperty("--border", "0 0% 20%");
      root.style.setProperty("--input", "0 0% 20%");
      root.style.setProperty("--foreground", "0 0% 95%");
      root.style.setProperty("--card-foreground", "0 0% 95%");
      root.style.setProperty("--popover-foreground", "0 0% 95%");
      root.style.setProperty("--primary-foreground", "0 0% 0%");
      root.style.setProperty("--secondary", "0 0% 20%");
      root.style.setProperty("--secondary-foreground", "0 0% 95%");
      root.style.setProperty("--muted", "0 0% 15%");
      root.style.setProperty("--muted-foreground", "0 0% 70%");
      root.style.setProperty("--accent", "0 0% 25%");
      root.style.setProperty("--accent-foreground", "0 0% 95%");
      root.style.setProperty("--destructive", "0 84% 60%");
      root.style.setProperty("--destructive-foreground", "0 0% 100%");
      root.style.setProperty("--success", "142 76% 36%");
      root.style.setProperty("--success-foreground", "0 0% 100%");
      root.style.setProperty("--warning", "25 95% 53%");
      root.style.setProperty("--warning-foreground", "0 0% 0%");
    }
    
    root.style.setProperty("--popover", themeConfig.card);
    
    // Update glow effects
    const [h, s, l] = themeConfig.primary.split(" ");
    root.style.setProperty("--shadow-glow", `0 0 40px hsl(${h} ${s} ${l} / 0.2)`);
  };

  const handleThemeChange = (value: string) => {
    setTheme(value);
    applyTheme(value);
    localStorage.setItem("pos_theme", value);
    toast({
      title: "Theme Updated",
      description: `Switched to ${THEMES[value as keyof typeof THEMES].name} theme`,
    });
  };

  return (
    <div className="h-full overflow-auto p-6 bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your store preferences and configurations</p>
          </div>
          <Button onClick={saveSettings} size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger value="receipt" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            <span className="hidden sm:inline">Receipt</span>
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Theme</span>
          </TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-6 mt-6">
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5 text-primary" />
                Business Information
              </CardTitle>
              <CardDescription>Update your business details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="business_name" className="text-sm font-medium flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5" />
                  Business Name
                </Label>
                <Input
                  id="business_name"
                  value={settings.business_name}
                  onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                  placeholder="Craving Corner"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_address" className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Business Address
                </Label>
                <Textarea
                  id="business_address"
                  value={settings.business_address}
                  onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
                  placeholder="Street, City, State, PIN"
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="business_phone" className="text-sm font-medium flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Phone Number
                  </Label>
                  <Input
                    id="business_phone"
                    value={settings.business_phone}
                    onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                    placeholder="+91 1234567890"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_email" className="text-sm font-medium flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Email Address
                  </Label>
                  <Input
                    id="business_email"
                    type="email"
                    value={settings.business_email}
                    onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
                    placeholder="business@example.com"
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <DollarSign className="h-5 w-5 text-primary" />
                Tax & Currency
              </CardTitle>
              <CardDescription>Configure tax rates and currency preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="tax_rate" className="text-sm font-medium">
                    Tax Rate (%)
                  </Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.tax_rate}
                    onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency_symbol" className="text-sm font-medium">
                    Currency Symbol
                  </Label>
                  <Input
                      id="currency_symbol"
                    value={settings.currency_symbol}
                    onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                    placeholder="₹"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency_code" className="text-sm font-medium">
                    Currency Code
                  </Label>
                  <Input
                    id="currency_code"
                    value={settings.currency_code}
                    onChange={(e) => setSettings({ ...settings, currency_code: e.target.value.toUpperCase() })}
                    placeholder="INR"
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipt Settings */}
        <TabsContent value="receipt" className="space-y-6 mt-6">
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-primary" />
                Receipt Configuration
              </CardTitle>
              <CardDescription>Customize the footer message on your receipts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="receipt_footer" className="text-sm font-medium">
                Footer Message
              </Label>
              <Textarea
                id="receipt_footer"
                value={settings.receipt_footer}
                onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
                placeholder="Thank you for your purchase! Visit us again!"
                className="min-h-[140px] resize-none"
              />
              <p className="text-xs text-muted-foreground pt-1">
                This message will appear at the bottom of every printed receipt
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Settings */}
        <TabsContent value="theme" className="space-y-6 mt-6">
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Palette className="h-5 w-5 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel of your POS system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="theme-select" className="text-sm font-medium">
                  Select Theme
                </Label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger id="theme-select" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(THEMES).map(([key, { name, primary, background }]) => {
                      const [ph, ps, pl] = primary.split(" ");
                      const [bh, bs, bl] = background.split(" ");
                      const isLight = parseInt(bl) > 50;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                              <div
                                className="w-5 h-5 rounded-full border-2 shadow-sm"
                                style={{ backgroundColor: `hsl(${ph} ${ps} ${pl})` }}
                              />
                              <div
                                className="w-5 h-5 rounded-full border-2 shadow-sm"
                                style={{ 
                                  backgroundColor: `hsl(${bh} ${bs} ${bl})`,
                                  borderColor: isLight ? "#ccc" : "#444"
                                }}
                              />
                            </div>
                            <span className="font-medium">{name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Theme changes apply instantly and are saved automatically
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

