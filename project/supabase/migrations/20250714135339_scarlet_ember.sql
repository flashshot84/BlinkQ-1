/*
  # Create addresses table

  1. New Tables
    - `addresses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `type` (text, default 'shipping')
      - `first_name` (text)
      - `last_name` (text)
      - `company` (text, optional)
      - `address_line_1` (text)
      - `address_line_2` (text, optional)
      - `city` (text)
      - `state` (text)
      - `postal_code` (text)
      - `country` (text, default 'India')
      - `phone` (text, optional)
      - `is_default` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `addresses` table
    - Add policy for users to manage their own addresses
*/

CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text DEFAULT 'shipping' CHECK (type IN ('shipping', 'billing')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  company text,
  address_line_1 text NOT NULL,
  address_line_2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text DEFAULT 'India' NOT NULL,
  phone text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses(is_default);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Users can manage their own addresses
CREATE POLICY "Users can manage own addresses"
  ON addresses
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all addresses
CREATE POLICY "Admins can read all addresses"
  ON addresses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one default address per user per type
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE addresses 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
      AND type = NEW.type 
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_address();