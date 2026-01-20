-- Judge Joody AI - Stats Table Setup
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- Create stats table
CREATE TABLE IF NOT EXISTS stats (
  id TEXT PRIMARY KEY,
  cases_filed INTEGER DEFAULT 0,
  verdicts_accepted INTEGER DEFAULT 0,
  verdicts_rejected INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial row (ignore if exists)
INSERT INTO stats (id, cases_filed, verdicts_accepted, verdicts_rejected)
VALUES ('global', 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- RPC function: increment cases filed
CREATE OR REPLACE FUNCTION increment_cases_filed()
RETURNS void AS $$
  UPDATE stats SET cases_filed = cases_filed + 1, updated_at = NOW() WHERE id = 'global';
$$ LANGUAGE sql;

-- RPC function: increment verdicts accepted
CREATE OR REPLACE FUNCTION increment_verdicts_accepted()
RETURNS void AS $$
  UPDATE stats SET verdicts_accepted = verdicts_accepted + 1, updated_at = NOW() WHERE id = 'global';
$$ LANGUAGE sql;

-- RPC function: increment verdicts rejected
CREATE OR REPLACE FUNCTION increment_verdicts_rejected()
RETURNS void AS $$
  UPDATE stats SET verdicts_rejected = verdicts_rejected + 1, updated_at = NOW() WHERE id = 'global';
$$ LANGUAGE sql;
