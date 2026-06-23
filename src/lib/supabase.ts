import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL: Missing Supabase Environment Variables.");
  console.error("Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseKey || 'placeholder-key'
);

export interface LedgerTransaction {
  id: string;
  amount_paisa: number;
  transaction_direction: 'inflow' | 'outflow';
  payment_method: 'online' | 'offline';
  category: string;
  description: string;
  created_at: string;
}
