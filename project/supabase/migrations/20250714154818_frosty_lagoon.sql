/*
  # Fix orders table INSERT policy

  1. Security Changes
    - Add INSERT policy for orders table to allow authenticated users to create their own orders
    - Users can only insert orders where user_id matches their auth.uid()
    - Maintains security while enabling order creation functionality

  2. Policy Details
    - Policy name: "orders_insert_own" 
    - Allows INSERT operations for authenticated users
    - Restricts to orders where user_id = auth.uid()
*/

-- Add INSERT policy for orders table
CREATE POLICY "orders_insert_own"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);