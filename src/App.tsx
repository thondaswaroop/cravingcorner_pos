import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Login } from "@/pages/Login";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Theme configuration
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

const applyTheme = (selectedTheme: string) => {
  const themeConfig = THEMES[selectedTheme as keyof typeof THEMES];
  if (!themeConfig) return;
  
  const root = document.documentElement;
  
  root.style.setProperty("--primary", themeConfig.primary);
  root.style.setProperty("--background", themeConfig.background);
  root.style.setProperty("--card", themeConfig.card);
  root.style.setProperty("--ring", themeConfig.primary);
  
  const [bh, bs, bl] = themeConfig.background.split(" ");
  const isLight = parseInt(bl) > 50;
  
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
  
  const [h, s, l] = themeConfig.primary.split(" ");
  root.style.setProperty("--shadow-glow", `0 0 40px hsl(${h} ${s} ${l} / 0.2)`);
};

const App = () => {
  const { user, isLoading } = useAuth();

  // Load saved theme on app mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("pos_theme");
    if (savedTheme && THEMES[savedTheme as keyof typeof THEMES]) {
      applyTheme(savedTheme);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Login />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
