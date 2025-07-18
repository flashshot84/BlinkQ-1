/*
  # Add admin policies for coupons table

  1. Security
    - Add policy for admins to insert coupons
    - Add policy for admins to update coupons
    - Add policy for admins to delete coupons
    - Add policy for admins to select all coupons (not just active ones)

  2. Changes
    - Allow authenticated users with is_admin=true to perform all operations on coupons
    - Maintain existing public select policy for active coupons
*/

-- Allow admins to insert coupons
CREATE POLICY "coupons_insert_admin"
  ON coupons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Allow admins to update coupons
CREATE POLICY "coupons_update_admin"
  ON coupons
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Allow admins to delete coupons
CREATE POLICY "coupons_delete_admin"
  ON coupons
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Allow admins to select all coupons (including inactive ones)
CREATE POLICY "coupons_select_admin"
  ON coupons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );