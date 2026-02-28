import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jynsqindbhbiuekuefuh.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bnNxaW5kYmhiaXVla3VlZnVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMTEyNTgsImV4cCI6MjA4Nzg4NzI1OH0.tvqMMiKoH5hQfbmyt37glSuIoFvlu8JropC1r8874zQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);