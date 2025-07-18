/*
  # Create wishlist table

  1. New Tables
    - `wishlist`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `wishlist` table
    - Add policy for users to manage their own wishlist
*/

CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Users can manage their own wishlist
CREATE POLICY "Users can manage own wishlist"
  ON wishlist
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all wishlists
CREATE POLICY "Admins can read all wishlists"
  ON wishlist
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );