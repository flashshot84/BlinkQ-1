/*
  # Create orders and order_items tables

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `order_number` (text, unique)
      - `user_id` (uuid, foreign key)
      - `status` (text, default 'pending')
      - `payment_status` (text, default 'pending')
      - `payment_method` (text)
      - `subtotal` (decimal)
      - `tax_amount` (decimal, default 0)
      - `shipping_amount` (decimal, default 0)
      - `discount_amount` (decimal, default 0)
      - `total_amount` (decimal)
      - `currency` (text, default 'INR')
      - `coupon_code` (text, optional)
      - `razorpay_order_id` (text, optional)
      - `razorpay_payment_id` (text, optional)
      - `razorpay_signature` (text, optional)
      - `shipping_address` (jsonb)
      - `billing_address` (jsonb, optional)
      - `notes` (text, optional)
      - `shipped_at` (timestamp, optional)
      - `delivered_at` (timestamp, optional)
      - `cancelled_at` (timestamp, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `product_name` (text)
      - `product_sku` (text)
      - `product_image` (text, optional)
      - `quantity` (integer)
      - `unit_price` (decimal)
      - `total_price` (decimal)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to access their own orders
    - Add policies for admin access
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  payment_method text NOT NULL CHECK (payment_method IN ('razorpay', 'cod')),
  subtotal decimal(10,2) NOT NULL CHECK (subtotal >= 0),
  tax_amount decimal(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
  shipping_amount decimal(10,2) DEFAULT 0 CHECK (shipping_amount >= 0),
  discount_amount decimal(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount decimal(10,2) NOT NULL CHECK (total_amount >= 0),
  currency text DEFAULT 'INR' NOT NULL,
  coupon_code text,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  shipping_address jsonb NOT NULL,
  billing_address jsonb,
  notes text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_sku text NOT NULL,
  product_image text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price decimal(10,2) NOT NULL CHECK (total_price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users can access their own orders
CREATE POLICY "Users can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can access all orders
CREATE POLICY "Admins can manage all orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage all order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Service role can insert orders (for checkout process)
CREATE POLICY "Service role can insert orders"
  ON orders
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert order items"
  ON order_items
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  order_num text;
  counter integer;
BEGIN
  -- Get current date in YYYYMMDD format
  order_num := 'BQ' || to_char(now(), 'YYYYMMDD');
  
  -- Get count of orders created today
  SELECT COUNT(*) + 1 INTO counter
  FROM orders
  WHERE created_at::date = CURRENT_DATE;
  
  -- Append counter with leading zeros
  order_num := order_num || lpad(counter::text, 4, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;