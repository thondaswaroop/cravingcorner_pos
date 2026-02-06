# Product Variants & Subcategories Implementation Guide

## 🎯 What's Been Added

### 1. **Database Schema**
- ✅ `categories.parent_id` - For nested subcategories
- ✅ `product_variants` table - Store variant options (Small/Medium/Large)
- ✅ `products.has_variants` - Flag to indicate if product has variants
- ✅ `order_items.variant_id` - Track which variant was ordered

### 2. **UI Components**
- ✅ `VariantManager.tsx` - Manage product variants
- ✅ Hooks for CRUD operations on variants
- ✅ TypeScript types for variants

---

## 📋 Setup Instructions

### Step 1: Run Database Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open and run: `supabase/migrations/20260103000000_add_variants_subcategories.sql`
3. Verify tables created successfully

### Step 2: Update StockManagement Component

Add the "Manage Variants" button to each product in StockManagement.tsx:

```tsx
// Import at top
import { VariantManager } from './VariantManager';
import { Package } from 'lucide-react';

// Add state
const [variantProductId, setVariantProductId] = useState<string | null>(null);
const [variantProductName, setVariantProductName] = useState('');

// In the product table, add button:
<Button
  onClick={() => {
    setVariantProductId(product.id);
    setVariantProductName(product.name);
  }}
  variant="outline"
  size="sm"
>
  <Package className="w-4 h-4 mr-1" />
  Variants
</Button>

// At the bottom of component:
<VariantManager
  productId={variantProductId || ''}
  productName={variantProductName}
  open={!!variantProductId}
  onClose={() => setVariantProductId(null)}
/>
```

### Step 3: Update Product Creation

When adding a product, add checkbox for "Has Variants":

```tsx
<div className="flex items-center gap-2">
  <input 
    type="checkbox" 
    checked={hasVariants}
    onChange={(e) => setHasVariants(e.target.checked)}
  />
  <Label>This product has variants (sizes/options)</Label>
</div>
```

---

## 🗂️ Category Structure Examples

### Example 1: Waffles with Subcategories

```
📁 Waffles (Main Category)
  ├─ 🍡 Popsicles (Subcategory)
  │   ├─ Chocolate Popsicle (Product)
  │   └─ Strawberry Popsicle (Product)
  │
  └─ 🧇 Belgium (Subcategory)
      ├─ Classic Belgium Waffle (Product with variants)
      │   ├─ Small - ₹80
      │   ├─ Medium - ₹120
      │   └─ Large - ₹180
      └─ Chocolate Belgium Waffle (Product)
```

### Example 2: Mocktails (Flat Structure)

```
🍹 Mocktails (Main Category)
  ├─ Virgin Mojito (Product) - ₹150
  ├─ Blue Lagoon (Product) - ₹180
  └─ Fruit Punch (Product with variants)
      ├─ Regular - ₹120
      └─ Large - ₹180
```

### Example 3: French Fries with Variants

```
🍟 Snacks (Main Category)
  └─ French Fries (Product with variants)
      ├─ Small - ₹50
      ├─ Medium - ₹80
      └─ Large - ₹120
```

---

## 💻 How to Create Products with Variants

### Step 1: Create Main Category
1. Go to **Food Products** tab
2. Click **Add Category**
3. Enter name: "Snacks"
4. Save

### Step 2: Create Subcategory (Optional)
1. Add another category
2. Set parent to "Waffles"
3. Name: "Belgium"
4. Save

### Step 3: Add Product
1. Click **Add Product**
2. Name: "French Fries"
3. Category: "Snacks"
4. Check **"Has Variants"**
5. Set base price: 0 (variants will have prices)
6. Save

### Step 4: Add Variants
1. Find "French Fries" in product list
2. Click **"Variants"** button
3. Click **"Add Variant"**
4. Add each size:
   - Name: "Small", Price: 50, Stock: 100
   - Name: "Medium", Price: 80, Stock: 100
   - Name: "Large", Price: 120, Stock: 100
5. Close

---

## 🛒 How Variants Work in POS

### Without Variants (Normal Product):
- Click product → Adds to cart immediately
- Shows: "Virgin Mojito - ₹150"

### With Variants:
- Click product → Shows variant selector dialog
- Customer selects: "Medium"
- Cart shows: "French Fries (Medium) - ₹80"

### In Cart:
```
French Fries (Small) x 2  = ₹100
French Fries (Large) x 1  = ₹120
Virgin Mojito x 1         = ₹150
------------------------
Total                     = ₹370
```

---

## 🔄 Next Steps to Implement

### 1. Update ProductGrid Component
Add variant selection when clicking products with variants:

```tsx
const handleProductClick = (product) => {
  if (product.has_variants) {
    // Show variant selector dialog
    setSelectedProduct(product);
    setShowVariantSelector(true);
  } else {
    // Add directly to cart
    onAddToCart(product);
  }
};
```

### 2. Create VariantSelector Dialog
Shows available variants when customer clicks product:

```tsx
<Dialog open={showVariantSelector} onOpenChange={setShowVariantSelector}>
  <DialogContent>
    <DialogTitle>Choose Size</DialogTitle>
    {variants.map(variant => (
      <Button 
        key={variant.id}
        onClick={() => addToCart(product, variant)}
      >
        {variant.name} - {formatCurrency(variant.price)}
      </Button>
    ))}
  </DialogContent>
</Dialog>
```

### 3. Update Cart to Show Variants
```tsx
<CartItem>
  {item.product.name}
  {item.variant && ` (${item.variant.name})`}
  - {formatCurrency(item.variant?.price || item.product.price)}
</CartItem>
```

### 4. Update Order Creation
Include variant info when creating orders:

```tsx
await supabase.from('order_items').insert({
  order_id: orderId,
  product_id: item.product.id,
  variant_id: item.variant?.id,
  variant_name: item.variant?.name,
  unit_price: item.variant?.price || item.product.price,
  quantity: item.quantity
});
```

---

## 📊 Database Queries

### Get Categories with Subcategories:
```sql
SELECT 
  c1.*,
  array_agg(c2.*) as subcategories
FROM categories c1
LEFT JOIN categories c2 ON c2.parent_id = c1.id
WHERE c1.parent_id IS NULL
GROUP BY c1.id;
```

### Get Products with Variants:
```sql
SELECT 
  p.*,
  array_agg(v.*) as variants
FROM products p
LEFT JOIN product_variants v ON v.product_id = p.id
WHERE p.has_variants = true
GROUP BY p.id;
```

### Get Order with Variant Details:
```sql
SELECT 
  oi.*,
  p.name as product_name,
  v.name as variant_name,
  v.price as variant_price
FROM order_items oi
JOIN products p ON p.id = oi.product_id
LEFT JOIN product_variants v ON v.id = oi.variant_id
WHERE oi.order_id = 'xxx';
```

---

## ✅ Implementation Checklist

- [x] Database migration created
- [x] TypeScript types defined
- [x] Variant hooks created
- [x] VariantManager component created
- [ ] Update StockManagement to show variant button
- [ ] Create VariantSelector for POS
- [ ] Update ProductGrid to handle variant selection
- [ ] Update Cart to display variants
- [ ] Update checkout to save variant info
- [ ] Update receipt to show variants
- [ ] Update sales reports to include variant data
- [ ] Add subcategory navigation in CategoryTabs
- [ ] Update stock deduction to use variant stock

---

## 🎨 UI Flow

1. **Admin adds product**: Sets "has_variants" checkbox
2. **Admin manages variants**: Opens VariantManager, adds Small/Medium/Large
3. **Customer browses menu**: Sees "French Fries" with variant indicator
4. **Customer clicks product**: Popup shows variant options
5. **Customer selects variant**: "Medium" selected
6. **Cart shows**: "French Fries (Medium) - ₹80"
7. **Checkout**: Variant info saved to order_items
8. **Receipt prints**: Shows "French Fries (Medium) x 2"

---

Need help implementing any specific part? Let me know!
