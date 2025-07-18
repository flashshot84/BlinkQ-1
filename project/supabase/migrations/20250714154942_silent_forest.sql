/*
  # Fix order_items INSERT policy

  1. Security
    - Add INSERT policy for order_items table
    - Allow authenticated users to insert order items for their own orders
    - Maintain security by checking order ownership through orders table
*/

-- Add INSERT policy for order_items table
CREATE POLICY "order_items_insert_own"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );