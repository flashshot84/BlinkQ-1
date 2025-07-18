/*
  # Create products table

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `slug` (text, unique)
      - `description` (text)
      - `short_description` (text)
      - `price` (decimal)
      - `compare_price` (decimal, optional)
      - `cost_price` (decimal, optional)
      - `sku` (text, unique)
      - `barcode` (text, optional)
      - `track_quantity` (boolean, default true)
      - `quantity` (integer, default 0)
      - `allow_backorder` (boolean, default false)
      - `weight` (decimal, optional)
      - `category_id` (uuid, foreign key)
      - `brand` (text, optional)
      - `tags` (text array, optional)
      - `images` (jsonb array)
      - `is_active` (boolean, default true)
      - `is_featured` (boolean, default false)
      - `meta_title` (text, optional)
      - `meta_description` (text, optional)
      - `rating` (decimal, default 0)
      - `reviews_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `products` table
    - Add policy for public read access to active products
    - Add policy for admin write access
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  short_description text,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  compare_price decimal(10,2) CHECK (compare_price >= 0),
  cost_price decimal(10,2) CHECK (cost_price >= 0),
  sku text UNIQUE NOT NULL,
  barcode text,
  track_quantity boolean DEFAULT true,
  quantity integer DEFAULT 0 CHECK (quantity >= 0),
  allow_backorder boolean DEFAULT false,
  weight decimal(8,2),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  brand text,
  tags text[],
  images jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  meta_title text,
  meta_description text,
  rating decimal(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count integer DEFAULT 0 CHECK (reviews_count >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description || ' ' || COALESCE(brand, '')));

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read access for active products
CREATE POLICY "Anyone can read active products"
  ON products
  FOR SELECT
  TO public
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();