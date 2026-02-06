import { createRoot } from "react-dom/client";
import { AuthProvider } from "@/contexts/AuthContext";
import App from "./App.tsx";
import "./index.css";
import { ReceiptPrinterProvider } from "./components/pos/ReceiptPrinterProvider";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ReceiptPrinterProvider>
      <App />
    </ReceiptPrinterProvider>
  </AuthProvider>
);
