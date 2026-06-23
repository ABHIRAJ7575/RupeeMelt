-- Supabase PostgreSQL Relational Schema for RupeeMelt (Single-User Pivot)

CREATE TABLE IF NOT EXISTS public.user_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount_paisa BIGINT NOT NULL, 
  transaction_direction TEXT CHECK (transaction_direction IN ('inflow', 'outflow')), 
  payment_method TEXT CHECK (payment_method IN ('online', 'offline')), 
  category TEXT NOT NULL, 
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_ledger;
