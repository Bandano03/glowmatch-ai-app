import { createClient } from '@supabase/supabase-js';
import { ENV } from '../config/environment';

// Jetzt sicher über Environment Variables
export const supabase = createClient(
  ENV.SUPABASE_URL || '', 
  ENV.SUPABASE_ANON_KEY || ''
);