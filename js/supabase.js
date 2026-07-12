const SUPABASE_URL =
  "https://ugcuebkwdamrkhmdhwar.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_BuFTicPntrVFwUg4VnCLOg_Uc4zyavO";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);