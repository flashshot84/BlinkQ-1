/*
  # Create admin activity logs table

  1. New Tables
    - `admin_logs`
      - `id` (uuid, primary key)
      - `admin_id` (uuid, foreign key)
      - `action` (text)
      - `resource_type` (text)
      - `resource_id` (uuid, optional)
      - `details` (jsonb, optional)
      - `ip_address` (text, optional)
      - `user_agent` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `admin_logs` table
    - Add policy for admins to read logs
*/

CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_resource_type ON admin_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs
CREATE POLICY "Admins can read all logs"
  ON admin_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Service role can insert logs
CREATE POLICY "Service role can insert logs"
  ON admin_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);