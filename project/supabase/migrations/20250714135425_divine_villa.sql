/*
  # Create reviews table

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `order_id` (uuid, foreign key, optional)
      - `rating` (integer, 1-5)
      - `title` (text, optional)
      - `comment` (text, optional)
      - `images` (text array, optional)
      - `is_verified` (boolean, default false)
      - `is_approved` (boolean, default true)
      - `helpful_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `reviews` table
    - Add policies for public read access to approved reviews
    - Add policies for users to manage their own reviews
    - Add policies for admin management
*/

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text,
  images text[],
  is_verified boolean DEFAULT false,
  is_approved boolean DEFAULT true,
  helpful_count integer DEFAULT 0 CHECK (helpful_count >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public read access for approved reviews
CREATE POLICY "Anyone can read approved reviews"
  ON reviews
  FOR SELECT
  TO public
  USING (is_approved = true);

-- Users can manage their own reviews
CREATE POLICY "Users can manage own reviews"
  ON reviews
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
  ON reviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update product rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS trigger AS $$
BEGIN
  -- Update product rating and review count
  UPDATE products
  SET 
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND is_approved = true
    ), 0),
    reviews_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND is_approved = true
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();