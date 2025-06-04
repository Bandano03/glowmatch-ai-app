import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gtvajpsjnymcjzesnzth.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dmFqcHNqbnltY2p6ZXNuenRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NTQxNzEsImV4cCI6MjA2NDQzMDE3MX0.v1NANA5U1_7_dgdKSDgu9NedQSYnZWnTWc0sRVi5trE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);