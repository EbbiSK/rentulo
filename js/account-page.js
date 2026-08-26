(function () {
  const ACCOUNT_LOCALES = {
    cs: "cs-CZ",
    en: "en-GB",
    de: "de-DE",
    pl: "pl-PL"
  };

  let verifiedAccountUser = null;
  let accountLoadState = "idle";

  function getSupabaseClient() {
    if (window.rentuloSupabase) return window.rentuloSupabase;
    if (typeof rentuloSupabase !== "undefined") return rentuloSupabase;
    return null;
  }

  function t(key, fallback, replacements) {
    let text = typeof window.rentuloTranslate === "function"
      ? window.rentuloTranslate(key)
      : fallback;

    if (!text || text === key) text = fallback || key;

    Object.keys(replacements || {}).forEach(function (name) {
      text = text.replaceAll("{" + name + "}", String(replacements[name]));
    });

    return text;
  }


  function homeT(key, fallback, replacements) {
    if (typeof window.accountHomeT === "function") {
      return window.accountHomeT(key, fallback, replacements);
    }

    return t(key, fallback, replacements);
  }

  function currentLocale() {
    const language = typeof window.getRentuloLanguage === "function"
      ? window.getRentuloLanguage()
      : "cs";

    return ACCOUNT_LOCALES[language] || ACCOUNT_LOCALES.cs;
  }

  function formatNumber(value, options) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return String(value ?? "");
    return numberValue.toLocaleString(currentLocale(), options);
  }

  function renderLoadState() {
    const status = document.getElementById("accountLoadStatus");
    const statusText = document.getElementById("accountLoadStatusText");
    const retry = document.getElementById("accountLoadRetry");

    if (!status || !statusText || !retry) return;

    status.classList.remove("hidden", "error");
    retry.hidden = true;
    retry.disabled = false;

    if (accountLoadState === "ready") {
      status.classList.add("hidden");
      return;
    }

    if (accountLoadState === "error") {
      status.classList.add("error");
      statusText.textContent = t(
        "account.load.error",
        "Údaje účtu se teď nepodařilo načíst. Zkuste to znovu."
      );
      retry.textContent = t("account.load.retry", "Zkusit znovu");
      retry.hidden = false;
      return;
    }

    statusText.textContent = t("account.load.loading", "Načítám údaje účtu...");
    retry.disabled = true;
  }

  async function getCurrentUser() {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client.auth.getUser();
    if (error || !data || !data.user) return null;
    return data.user;
  }

  function fallbackUserName(user) {
    const metadata = (user && user.user_metadata) || {};
    return (
      metadata.full_name ||
      metadata.name ||
      (user && (user.full_name || user.name)) ||
      homeT("accountHome.userFallback", "Uživatel")
    );
  }

  async function loadProfile(user) {
    const client = getSupabaseClient();
    if (!client || !user || !user.id) return null;

    const { data, error } = await client
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data || null;
  }

  async function loadRating(user) {
    const client = getSupabaseClient();
    if (!client || !user || !user.id) return null;

    const { data, error } = await client
      .from("user_rating_summary")
      .select("average_rating, rating_count")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("Hodnocení uživatele se nepodařilo načíst:", error);
      return null;
    }

    return data || null;
  }

  function renderRating(rating) {
    const ratingElement = document.getElementById("profileRating");
    if (!ratingElement) return;

    if (rating && Number(rating.rating_count) > 0) {
      ratingElement.textContent = homeT(
        "accountHome.ratingCompact",
        "Hodnocení: ⭐ {average} / 5 ({count})",
        {
          average: formatNumber(rating.average_rating, { maximumFractionDigits: 1 }),
          count: formatNumber(rating.rating_count)
        }
      );
      return;
    }

    ratingElement.textContent = homeT("accountHome.ratingNone", "Hodnocení: zatím bez hodnocení");
  }

  async function loadAndRenderProfile(user) {
    const profile = await loadProfile(user);
    const rating = await loadRating(user);
    const name = (profile && profile.full_name) || fallbackUserName(user);
    const email = (profile && profile.email) || (user && user.email) || "";

    const nameElement = document.getElementById("profileName");
    const emailElement = document.getElementById("profileEmail");
    const avatarElement = document.getElementById("profileAvatar");
    const profileCard = document.getElementById("accountProfileCard");

    if (nameElement) nameElement.textContent = name;
    if (emailElement) {
      emailElement.textContent = email || homeT("accountHome.emailMissing", "E-mail není uložen");
    }
    if (avatarElement) {
      avatarElement.textContent = String(name || "U").trim().charAt(0).toUpperCase() || "U";
    }

    renderRating(rating);

    if (profileCard) {
      profileCard.hidden = false;
    }
  }

  async function initializeAccountPage() {
    accountLoadState = "loading";
    renderLoadState();

    if (!window.rentuloAuthGuard) {
      window.location.replace("prihlaseni.html");
      return;
    }

    const user = await window.rentuloAuthGuard.requireUser();
    if (!user) return;

    verifiedAccountUser = user;

    try {
      await loadAndRenderProfile(user);
      accountLoadState = "ready";
    } catch (error) {
      console.error("Profil uživatele se nepodařilo načíst:", error);
      accountLoadState = "error";
    }

    renderLoadState();
  }

  async function retryAccountDataLoad() {
    if (accountLoadState === "loading") return;

    const user = verifiedAccountUser || await getCurrentUser();
    if (!user) {
      window.location.replace("prihlaseni.html");
      return;
    }

    accountLoadState = "loading";
    renderLoadState();

    try {
      await loadAndRenderProfile(user);
      accountLoadState = "ready";
    } catch (error) {
      console.error("Profil uživatele se nepodařilo načíst:", error);
      accountLoadState = "error";
    }

    renderLoadState();
  }

  document.addEventListener("rentuloLanguageChanged", async function () {
    renderLoadState();

    if (typeof window.renderAccountHomeTranslations === "function") {
      window.renderAccountHomeTranslations();
    }

    if (verifiedAccountUser && accountLoadState === "ready") {
      const rating = await loadRating(verifiedAccountUser);
      renderRating(rating);
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    const retry = document.getElementById("accountLoadRetry");
    if (retry) retry.addEventListener("click", retryAccountDataLoad);

    void initializeAccountPage();
  });
})();
