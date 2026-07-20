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
function escapeHtml(value) {
  return String(value === undefined || value === null ? "" : value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("cs-CZ");
}
function getStars(rating) {
  const count = Math.max(0, Math.min(5, Number(rating) || 0));
  let stars = "";

  for (let i = 1; i <= 5; i++) {
    stars += i <= count ? "★" : "☆";
  }

  return stars;
}
function normalizeText(value) {
  return String(value === undefined || value === null ? "" : value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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
window.apiGetSupabaseClient = apiGetSupabaseClient;