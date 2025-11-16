import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://guuywztafdxfqupmqmmq.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1dXl3enRhZmR4ZnF1cG1xbW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2OTQ0OTEsImV4cCI6MjA0NzI3MDQ5MX0.KUC-F-L2D5aZqIAUF4U_Wz5j0X6oykJ1pSIYSYSKiAc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get current user
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

// Helper to get session
export const getSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};
