-- Create settings table for POS configuration
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  business_name TEXT NOT NULL DEFAULT 'Craving Corner',
  business_address TEXT,
  business_phone TEXT,
  business_email TEXT,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  currency_code TEXT NOT NULL DEFAULT 'INR',
  receipt_footer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure only one row exists
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Insert default settings
INSERT INTO settings (
  id,
  business_name,
  business_address,
  business_phone,
  business_email,
  tax_rate,
  currency_symbol,
  currency_code,
  receipt_footer
) VALUES (
  1,
  'CRAVING CORNER',
  'Beside Sai Hospitals Lane
Rajahmundry Road, Jaggampeta
East Godavari, AP 533435',
  '+91 8688188893',
  'cravingcorner.jaggampeta@gmail.com',
  5.00,
  '₹',
  'INR',
  'Thank you for your purchase! Show us your love by sharing your experience on social media and get best discounts for your next visit.'
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow all users to read settings
CREATE POLICY "Allow all users to read settings"
  ON settings
  FOR SELECT
  USING (true);

-- Allow all users to update settings
CREATE POLICY "Allow all users to update settings"
  ON settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow all users to insert settings (only one row with id=1)
CREATE POLICY "Allow all users to insert settings"
  ON settings
  FOR INSERT
  WITH CHECK (id = 1);
