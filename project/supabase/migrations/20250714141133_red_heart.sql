/*
  # Remove all recursive RLS policies and create simple ones

  1. Security Changes
    - Drop all existing policies that could cause recursion
    - Create simple, non-recursive policies
    - Remove any policies that reference other tables in complex ways
    - Use only auth.uid() for user identification

  2. Tables affected
    - users: Simple policies for own data access
    - products: Public read access for active products
    - categories: Public read access for active categories
    - All other tables: Basic user-scoped policies
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;

DROP POLICY IF EXISTS "Anyone can read active products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

DROP POLICY IF EXISTS "Anyone can read active categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

DROP POLICY IF EXISTS "Users can manage own cart" ON cart;
DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;
DROP POLICY IF EXISTS "Admins can read all addresses" ON addresses;

DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
DROP POLICY IF EXISTS "Service role can insert orders" ON orders;

DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;
DROP POLICY IF EXISTS "Service role can insert order items" ON order_items;

DROP POLICY IF EXISTS "Users can manage own reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;

DROP POLICY IF EXISTS "Anyone can read active coupons" ON coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;

DROP POLICY IF EXISTS "Admins can read all logs" ON admin_logs;
DROP POLICY IF EXISTS "Service role can insert logs" ON admin_logs;

DROP POLICY IF EXISTS "Users can read own wishlists" ON wishlist;
DROP POLICY IF EXISTS "Admins can read all wishlists" ON wishlist;

-- Create simple, non-recursive policies

-- Users table - only basic self-access
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_service" ON users
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Products table - public read access
CREATE POLICY "products_select_public" ON products
  FOR SELECT TO public
  USING (is_active = true);

-- Categories table - public read access
CREATE POLICY "categories_select_public" ON categories
  FOR SELECT TO public
  USING (is_active = true);

-- Cart table - user owns their cart
CREATE POLICY "cart_all_own" ON cart
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Wishlist table - user owns their wishlist
CREATE POLICY "wishlist_all_own" ON wishlist
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Addresses table - user owns their addresses
CREATE POLICY "addresses_all_own" ON addresses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Orders table - user can read their orders
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_service" ON orders
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Order items table - user can read their order items
CREATE POLICY "order_items_select_own" ON order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "order_items_insert_service" ON order_items
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Reviews table - public read for approved, users manage own
CREATE POLICY "reviews_select_approved" ON reviews
  FOR SELECT TO public
  USING (is_approved = true);

CREATE POLICY "reviews_all_own" ON reviews
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Coupons table - public read for active coupons
CREATE POLICY "coupons_select_active" ON coupons
  FOR SELECT TO public
  USING (
    is_active = true 
    AND (starts_at IS NULL OR starts_at <= now()) 
    AND (expires_at IS NULL OR expires_at > now())
  );