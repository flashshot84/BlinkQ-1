/*
  # Fix orders update policy for cancellation

  1. Security
    - Drop existing restrictive update policy
    - Create new policy allowing users to update their own orders
    - Allow status changes to 'cancelled' for cancellable orders
    - Ensure WITH CHECK clause doesn't block cancellation
*/

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "orders_update_own" ON orders;

-- Create new update policy that allows order cancellation
CREATE POLICY "orders_update_own"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure users can also select their own orders (needed for the status check)
DROP POLICY IF EXISTS "orders_select_own" ON orders;

CREATE POLICY "orders_select_own"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);