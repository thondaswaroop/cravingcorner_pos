import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "./currency";
import { format } from "date-fns";

interface SalesReportData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalTax: number;
  dateRange: { start: Date; end: Date };
  dailySales: Array<{ date: string; revenue: number; orders: number }>;
  paymentMethods: Array<{ name: string; value: number }>;
  recentOrders: Array<{
    id: string;
    created_at: string;
    total: number;
    payment_method: string | null;
  }>;
}

export function generateSalesReportPDF(data: SalesReportData, pageSize?: { widthMm: number; heightMm: number }) {
  const doc = pageSize
    ? new jsPDF({ unit: "mm", format: [pageSize.widthMm, pageSize.heightMm] })
    : new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // sensible small margins for narrow receipt paper (reduced to avoid right-side clipping)
  const marginLeft = 2;
  const marginRight = 2;
  const availableWidth = pageWidth - marginLeft - marginRight;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("Restaurant POS - Sales Report", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Period: ${format(data.dateRange.start, "dd MMM yyyy")} - ${format(data.dateRange.end, "dd MMM yyyy")}`,
    pageWidth / 2,
    28,
    { align: "center" }
  );
  doc.text(`Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}`, pageWidth / 2, 34, { align: "center" });

  // Summary Statistics
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("Summary Statistics", marginLeft, 45);

  const summaryData = [
    ["Total Revenue", formatCurrency(data.totalRevenue)],
    ["Total Orders", data.totalOrders.toString()],
    ["Average Order Value", formatCurrency(data.avgOrderValue)],
    ["Total Tax Collected", formatCurrency(data.totalTax)],
  ];

  autoTable(doc, {
    startY: 50,
    head: [["Metric", "Value"]],
    body: summaryData,
    theme: "grid",
    headStyles: { fillColor: [255, 140, 50], textColor: [255, 255, 255] },
    styles: { fontSize: 10 },
    margin: { left: marginLeft, right: marginRight },
    columnStyles: {
      0: { cellWidth: availableWidth * 0.6 },
      1: { cellWidth: availableWidth * 0.4, halign: "right", fontStyle: "bold" },
    },
  });
  
  // Payment Methods
  let currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text("Payment Methods", marginLeft, currentY);

  const paymentData = data.paymentMethods.map((pm) => [
    pm.name,
    formatCurrency(pm.value),
    `${((pm.value / data.totalRevenue) * 100).toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Method", "Amount", "Percentage"]],
    body: paymentData,
    theme: "grid",
    headStyles: { fillColor: [50, 180, 130], textColor: [255, 255, 255] },
    styles: { fontSize: 10 },
    margin: { left: marginLeft, right: marginRight },
    columnStyles: {
      0: { cellWidth: availableWidth * 0.5 },
      1: { cellWidth: availableWidth * 0.3, halign: "right" },
      2: { cellWidth: availableWidth * 0.2, halign: "right" },
    },
  });
  
  // Daily Sales
  currentY = (doc as any).lastAutoTable.finalY + 15;
  
  // Check if we need a new page
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(14);
  doc.text("Daily Sales Breakdown", marginLeft, currentY);
  
  const dailySalesData = data.dailySales.map((ds) => [
    ds.date,
    ds.orders.toString(),
    formatCurrency(ds.revenue),
  ]);
  
  autoTable(doc, {
    startY: currentY + 5,
    head: [["Date", "Orders", "Revenue"]],
    body: dailySalesData,
    theme: "striped",
    headStyles: { fillColor: [255, 180, 50], textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
    margin: { left: marginLeft, right: marginRight },
    columnStyles: {
      0: { cellWidth: availableWidth * 0.45 },
      1: { cellWidth: availableWidth * 0.2, halign: "center" },
      2: { cellWidth: availableWidth * 0.35, halign: "right" },
    },
  });
  
  // Recent Orders
  currentY = (doc as any).lastAutoTable.finalY + 15;
  
  // Check if we need a new page
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(14);
  doc.text("Recent Orders", marginLeft, currentY);
  
  const recentOrdersData = data.recentOrders.slice(0, 15).map((order) => [
    `#${order.id.slice(0, 8)}`,
    format(new Date(order.created_at), "dd MMM HH:mm"),
    (order.payment_method || "cash").toUpperCase(),
    formatCurrency(order.total),
  ]);
  
  autoTable(doc, {
    startY: currentY + 5,
    head: [["Order ID", "Date & Time", "Payment", "Amount"]],
    body: recentOrdersData,
    theme: "striped",
    headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
    margin: { left: marginLeft, right: marginRight },
    columnStyles: {
      0: { cellWidth: availableWidth * 0.25 },
      1: { cellWidth: availableWidth * 0.3 },
      2: { cellWidth: availableWidth * 0.2, halign: "center" },
      3: { cellWidth: availableWidth * 0.25, halign: "right" },
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  
  // Save the PDF
  const filename = `sales-report-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`;
  doc.save(filename);
}

export function generateInventoryReportPDF(items: any[]) {
  // Accept optional page size for narrow receipt printers
  const doc = new jsPDF({ unit: "mm", format: [72, 3276] });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginLeft = 2;
  const marginRight = 2;
  const availableWidth = pageWidth - marginLeft - marginRight;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("Restaurant POS - Inventory Report", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}`, pageWidth / 2, 28, { align: "center" });

  // Group items by category
  const categories = ["utensils", "ingredients", "vegetables", "beverages", "other"];
  let currentY = 40;

  categories.forEach((category) => {
    const categoryItems = items.filter((item) => item.category === category);
    if (categoryItems.length === 0) return;

    // Check if we need a new page
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(category.charAt(0).toUpperCase() + category.slice(1), marginLeft, currentY);

    const tableData = categoryItems.map((item) => {
      const isLowStock = item.current_stock <= item.minimum_stock;
      return [
        item.name,
        `${item.current_stock} ${item.unit}`,
        `${item.minimum_stock} ${item.unit}`,
        formatCurrency(item.cost_per_unit),
        isLowStock ? "⚠️ LOW" : "✓ OK",
      ];
    });

    autoTable(doc, {
      startY: currentY + 5,
      head: [["Item", "Current Stock", "Min Stock", "Cost/Unit", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [255, 140, 50], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
      margin: { left: marginLeft, right: marginRight },
      columnStyles: {
        0: { cellWidth: availableWidth * 0.4 },
        1: { cellWidth: availableWidth * 0.15, halign: "center" },
        2: { cellWidth: availableWidth * 0.15, halign: "center" },
        3: { cellWidth: availableWidth * 0.2, halign: "right" },
        4: { cellWidth: availableWidth * 0.1, halign: "center" },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  
  const filename = `inventory-report-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`;
  doc.save(filename);
}
