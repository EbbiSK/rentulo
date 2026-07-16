const SUPABASE_URL = "https://vspposovhdgvbeukoivh.supabase.co/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_1WQZ-gW9198Qu2amXZ-nPg_1dkadBSz";

const rentuloSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
function getSupabaseClient() {
  if (window.rentuloSupabase) {
    return window.rentuloSupabase;
  }

  if (typeof rentuloSupabase !== "undefined") {
    return rentuloSupabase;
  }

  return null;
}
async function getCurrentSupabaseUser() {
  const supabaseClient = getSupabaseClient();

  if (!supabaseClient) {
    return null;
  }

  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data || !data.user) {
    return null;
  }

  return data.user;
}