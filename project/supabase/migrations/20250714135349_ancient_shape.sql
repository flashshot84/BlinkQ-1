/*
  # Create coupons table

  1. New Tables
    - `coupons`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `name` (text)
      - `description` (text, optional)
      - `type` (text) - 'percentage' or 'fixed'
      - `value` (decimal)
      - `minimum_amount` (decimal, optional)
      - `maximum_discount` (decimal, optional)
      - `usage_limit` (integer, optional)
      - `used_count` (integer, default 0)
      - `user_limit` (integer, optional) - per user limit
      - `is_active` (boolean, default true)
      - `starts_at` (timestamp, optional)
      - `expires_at` (timestamp, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `coupons` table
    - Add policy for public read access to active coupons
    - Add policy for admin write access
*/

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value decimal(10,2) NOT NULL CHECK (value > 0),
  minimum_amount decimal(10,2) CHECK (minimum_amount >= 0),
  maximum_discount decimal(10,2) CHECK (maximum_discount >= 0),
  usage_limit integer CHECK (usage_limit > 0),
  used_count integer DEFAULT 0 CHECK (used_count >= 0),
  user_limit integer CHECK (user_limit > 0),
  is_active boolean DEFAULT true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (starts_at IS NULL OR expires_at IS NULL OR starts_at < expires_at)
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON coupons(expires_at);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Public read access for active coupons
CREATE POLICY "Anyone can read active coupons"
  ON coupons
  FOR SELECT
  TO public
  USING (
    is_active = true 
    AND (starts_at IS NULL OR starts_at <= now())
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Admins can manage coupons
CREATE POLICY "Admins can manage coupons"
  ON coupons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default coupons
INSERT INTO coupons (code, name, description, type, value, minimum_amount, maximum_discount, usage_limit, user_limit, expires_at) VALUES
('BLINK10', 'Welcome Discount', 'Get 10% off on your first order', 'percentage', 10.00, 500.00, 200.00, 1000, 1, now() + interval '30 days'),
('SAVE50', 'Flat ₹50 Off', 'Get flat ₹50 off on orders above ₹999', 'fixed', 50.00, 999.00, NULL, 500, NULL, now() + interval '15 days'),
('MEGA20', 'Mega Sale', 'Get 20% off on orders above ₹2000', 'percentage', 20.00, 2000.00, 500.00, 200, NULL, now() + interval '7 days')
ON CONFLICT (code) DO NOTHING;