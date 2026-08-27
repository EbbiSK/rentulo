function navEnsureSharedTheme() {
  if (!document.getElementById("rentuloSharedTheme")) {
    const theme = document.createElement("link");
    theme.id = "rentuloSharedTheme";
    theme.rel = "stylesheet";
    theme.href = "css/rentulo-theme.css";
    document.head.appendChild(theme);
  }

  if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Manrope"]')) {
    const font = document.createElement("link");
    font.rel = "stylesheet";
    font.href = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(font);
  }
}

navEnsureSharedTheme();

let navVerifiedUser = null;
let navAuthPromise = null;
let navAuthListenerRegistered = false;
let navPreferredLanguageSaveRunning = false;
let navPendingPreferredLanguage = null;
let navGlobalDropdownDismissalBound = false;
let navProfileSummary = null;

function navIsLoggedIn() {
  return Boolean(navVerifiedUser);
}

function navGetCurrentUser() {
  return navVerifiedUser;
}

function navGetSupabaseClient() {
  if (window.rentuloSupabase) {
    return window.rentuloSupabase;
  }

  if (typeof rentuloSupabase !== "undefined") {
    return rentuloSupabase;
  }

  return null;
}

async function navResolveSupabaseUser() {
  const supabaseClient = navGetSupabaseClient();

  if (!supabaseClient || !supabaseClient.auth) {
    navVerifiedUser = null;
    return null;
  }

  try {
    const { data, error } = await supabaseClient.auth.getUser();
    navVerifiedUser = !error && data && data.user ? data.user : null;
  } catch (error) {
    console.warn("Stav přihlášení pro navigaci se nepodařilo ověřit.", error);
    navVerifiedUser = null;
  }

  return navVerifiedUser;
}

function navGetVerifiedUser() {
  if (!navAuthPromise) {
    navAuthPromise = navResolveSupabaseUser();
  }

  return navAuthPromise;
}

function navTranslate(key, fallback) {
  if (typeof window.rentuloTranslate === "function") {
    const translated = window.rentuloTranslate(key);
    if (translated && translated !== key) {
      return translated;
    }
  }

  return fallback;
}

function navGetLanguage() {
  if (typeof window.getRentuloLanguage === "function") {
    return window.getRentuloLanguage();
  }

  return localStorage.getItem("rentuloLanguage") || "cs";
}

function navProfileText(key) {
  const translations = {
    cs: {
      open: "Otevřít uživatelské menu",
      user: "Uživatel",
      reservations: "Moje rezervace",
      offers: "Moje nabídky",
      history: "Historie",
      settings: "Nastavení",
      logout: "Odhlásit se",
      notifications: "upozornění",
      ratingNone: "Hodnocení: zatím bez hodnocení",
      rating: "Hodnocení: {average} / 5 ({count})"
    },
    en: {
      open: "Open user menu",
      user: "User",
      reservations: "My reservations",
      offers: "My listings",
      history: "History",
      settings: "Settings",
      logout: "Log out",
      notifications: "notifications",
      ratingNone: "Rating: no ratings yet",
      rating: "Rating: {average} / 5 ({count})"
    },
    de: {
      open: "Benutzermenü öffnen",
      user: "Benutzer",
      reservations: "Meine Reservierungen",
      offers: "Meine Angebote",
      history: "Verlauf",
      settings: "Einstellungen",
      logout: "Abmelden",
      notifications: "Benachrichtigungen",
      ratingNone: "Bewertung: noch keine Bewertungen",
      rating: "Bewertung: {average} / 5 ({count})"
    },
    pl: {
      open: "Otwórz menu użytkownika",
      user: "Użytkownik",
      reservations: "Moje rezerwacje",
      offers: "Moje oferty",
      history: "Historia",
      settings: "Ustawienia",
      logout: "Wyloguj się",
      notifications: "powiadomienia",
      ratingNone: "Ocena: jeszcze bez ocen",
      rating: "Ocena: {average} / 5 ({count})"
    }
  };

  const language = navGetLanguage();
  const map = translations[language] || translations.cs;
  return map[key] || translations.cs[key] || key;
}

function navEscapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function navGetProfileFallbackName(user) {
  const metadata = user && user.user_metadata ? user.user_metadata : {};
  const email = navGetUserEmail(user);

  return (
    metadata.full_name ||
    metadata.name ||
    (email ? email.split("@")[0] : "") ||
    navProfileText("user")
  );
}

function navGetProfileInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  function initialPart(part) {
    const normalized = String(part || "").trim();
    if (!normalized) return "";

    if (normalized.toLocaleLowerCase("cs-CZ").startsWith("ch")) {
      return "Ch";
    }

    return normalized.charAt(0).toLocaleUpperCase("cs-CZ");
  }

  if (!parts.length) {
    return "U";
  }

  const first = initialPart(parts[0]);
  const last = parts.length > 1 ? initialPart(parts[parts.length - 1]) : "";
  return (first + last) || "U";
}

function navEnsureProfileSummary(user) {
  const userId = user && user.id ? String(user.id) : "";

  if (!navProfileSummary || navProfileSummary.userId !== userId) {
    navProfileSummary = {
      userId: userId,
      name: navGetProfileFallbackName(user),
      email: navGetUserEmail(user),
      averageRating: null,
      ratingCount: 0
    };
  }

  return navProfileSummary;
}

function navProfileLocale() {
  return {
    cs: "cs-CZ",
    en: "en-GB",
    de: "de-DE",
    pl: "pl-PL"
  }[navGetLanguage()] || "cs-CZ";
}

function navFormatProfileRating(summary) {
  if (!summary || Number(summary.ratingCount) <= 0) {
    return navProfileText("ratingNone");
  }

  const average = Number(summary.averageRating);
  const averageText = Number.isFinite(average)
    ? average.toLocaleString(navProfileLocale(), { maximumFractionDigits: 1 })
    : "-";
  const countText = Number(summary.ratingCount).toLocaleString(navProfileLocale());

  return navProfileText("rating")
    .replace("{average}", averageText)
    .replace("{count}", countText);
}

function navRefreshProfileSummaryView() {
  const summary = navEnsureProfileSummary(navGetCurrentUser());
  const name = document.getElementById("sharedProfileName");
  const email = document.getElementById("sharedProfileEmail");
  const rating = document.getElementById("sharedProfileRating");
  const avatar = document.getElementById("sharedProfileAvatar");
  const buttonInitials = document.getElementById("sharedProfileButtonInitials");
  const mobileButtonInitials = document.getElementById("sharedMobileProfileInitials");
  const mobileAvatar = document.getElementById("sharedMobileProfileAvatar");
  const mobileName = document.getElementById("sharedMobileProfileName");
  const mobileEmail = document.getElementById("sharedMobileProfileEmail");
  const mobileRating = document.getElementById("sharedMobileProfileRating");
  const mobileLabel = document.querySelector(".nav-profile-mobile-label");
  const initials = navGetProfileInitials(summary.name);

  if (name) name.textContent = summary.name;
  if (email) email.textContent = summary.email;
  if (rating) rating.textContent = navFormatProfileRating(summary);
  if (avatar) avatar.textContent = initials;
  if (buttonInitials) {
    buttonInitials.textContent = initials;
    buttonInitials.classList.toggle("is-three-characters", initials.length > 2);
  }
  if (mobileButtonInitials) {
    mobileButtonInitials.textContent = initials;
    mobileButtonInitials.classList.toggle("is-three-characters", initials.length > 2);
  }
  if (mobileAvatar) mobileAvatar.textContent = initials;
  if (mobileName) mobileName.textContent = summary.name;
  if (mobileEmail) mobileEmail.textContent = summary.email;
  if (mobileRating) mobileRating.textContent = navFormatProfileRating(summary);
  if (mobileLabel) mobileLabel.textContent = summary.name;
}

async function navLoadProfileSummary(user) {
  const client = navGetSupabaseClient();
  const summary = navEnsureProfileSummary(user);

  if (!client || !user || !user.id) {
    navRefreshProfileSummaryView();
    return;
  }

  try {
    const [profileResult, ratingResult] = await Promise.all([
      client
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle(),
      client
        .from("user_rating_summary")
        .select("average_rating, rating_count")
        .eq("user_id", user.id)
        .maybeSingle()
    ]);

    if (!navVerifiedUser || String(navVerifiedUser.id || "") !== String(user.id)) {
      return;
    }

    if (!profileResult.error && profileResult.data) {
      summary.name = profileResult.data.full_name || summary.name;
      summary.email = profileResult.data.email || summary.email;
    }

    if (!ratingResult.error && ratingResult.data) {
      summary.averageRating = ratingResult.data.average_rating;
      summary.ratingCount = Number(ratingResult.data.rating_count) || 0;
    }

    navRefreshProfileSummaryView();
  } catch (error) {
    console.warn("Profil v uživatelském menu se nepodařilo načíst.", error);
  }
}

function navFlagMarkup(language) {
  const flagClass = {
    cs: "flag-cz",
    en: "flag-gb",
    de: "flag-de",
    pl: "flag-pl"
  }[language] || "flag-cz";

  return `<span class="nav-language-flag ${flagClass}" aria-hidden="true"></span>`;
}

function navLanguageControl() {
  const language = navGetLanguage();
  const label = navTranslate("nav.language", "Jazyk");

  return `
    <div class="nav-language-control">
      <span class="nav-language-label">${label}</span>
      <button
        type="button"
        id="sharedLanguageButton"
        class="nav-language-button"
        aria-label="${label}"
        aria-haspopup="true"
        aria-expanded="false"
        aria-controls="sharedLanguageMenu"
      >
        ${navFlagMarkup(language)}
        <span class="nav-language-chevron" aria-hidden="true">⌄</span>
      </button>
      <div id="sharedLanguageMenu" class="nav-language-menu" role="menu" hidden>
        <button type="button" role="menuitem" data-language="cs" aria-label="Čeština">${navFlagMarkup("cs")}</button>
        <button type="button" role="menuitem" data-language="en" aria-label="English">${navFlagMarkup("en")}</button>
        <button type="button" role="menuitem" data-language="de" aria-label="Deutsch">${navFlagMarkup("de")}</button>
        <button type="button" role="menuitem" data-language="pl" aria-label="Polski">${navFlagMarkup("pl")}</button>
      </div>
    </div>
  `;
}

function navEnsureLanguageStyles() {
  if (document.getElementById("rentuloLanguageStyles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "rentuloLanguageStyles";
  style.textContent = `
    .nav-language-control {
      position: relative;
      display: inline-flex;
      flex-shrink: 0;
    }
    .nav-language-label {
      display: none;
    }
    .nav-language-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 58px;
      height: 40px;
      padding: 0 9px;
      border: 1px solid #cbeab8;
      border-radius: 14px;
      background: #f0faea;
      color: #173f35;
      cursor: pointer;
      appearance: none;
      box-shadow: none;
    }
    .nav-language-button:hover {
      background: #e8f7df;
      border-color: #aeda98;
    }
    .nav-language-button:focus {
      outline: none;
      box-shadow: none;
    }
    .nav-language-button:focus-visible {
      border-color: #9fd486;
      box-shadow: none;
    }
    html[data-focus-input="pointer"] .nav-language-button:focus {
      outline: none !important;
      outline-offset: 0 !important;
      box-shadow: none !important;
    }
    .nav-language-chevron {
      font-size: 15px;
      line-height: 1;
      transform: translateY(-1px);
    }
    .nav-language-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      z-index: 1300;
      display: grid;
      gap: 4px;
      min-width: 62px;
      padding: 5px;
      border: 1px solid #cbeab8;
      border-radius: 14px;
      background: #f8fff4;
      box-shadow: 0 10px 24px rgba(23, 63, 53, 0.10);
    }
    .nav-language-menu[hidden] {
      display: none;
    }
    .nav-language-menu button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 34px;
      padding: 0;
      border: 0;
      border-radius: 8px;
      background: transparent;
      cursor: pointer;
    }
    .nav-language-menu button:hover,
    .nav-language-menu button:focus-visible {
      outline: none;
      background: #edf8f3;
    }
    .nav-language-flag {
      position: relative;
      display: inline-block;
      width: 26px;
      height: 18px;
      overflow: hidden;
      border: 1px solid rgba(23, 63, 53, 0.18);
      border-radius: 3px;
      box-shadow: 0 1px 2px rgba(23, 63, 53, 0.12);
      flex: 0 0 26px;
    }
    .flag-cz {
      background: linear-gradient(to bottom, #ffffff 0 50%, #d7141a 50% 100%);
    }
    .flag-cz::before {
      content: "";
      position: absolute;
      inset: 0 auto 0 0;
      width: 52%;
      background: #11457e;
      clip-path: polygon(0 0, 100% 50%, 0 100%);
    }
    .flag-gb {
      background:
        linear-gradient(33deg, transparent 42%, #ffffff 42% 47%, #c8102e 47% 53%, #ffffff 53% 58%, transparent 58%),
        linear-gradient(-33deg, transparent 42%, #ffffff 42% 47%, #c8102e 47% 53%, #ffffff 53% 58%, transparent 58%),
        linear-gradient(to right, transparent 39%, #ffffff 39% 45%, #c8102e 45% 55%, #ffffff 55% 61%, transparent 61%),
        linear-gradient(to bottom, transparent 34%, #ffffff 34% 42%, #c8102e 42% 58%, #ffffff 58% 66%, transparent 66%),
        #012169;
    }
    .flag-de {
      background: linear-gradient(to bottom, #000000 0 33.333%, #dd0000 33.333% 66.666%, #ffce00 66.666% 100%);
    }
    .flag-pl {
      background: linear-gradient(to bottom, #ffffff 0 50%, #dc143c 50% 100%);
    }
    @media (max-width: 760px) {
      .nav-language-button {
        width: 56px;
        height: 38px;
      }
    }
  `;
  document.head.appendChild(style);
}

async function navPersistPreferredLanguage(language) {
  const client = navGetSupabaseClient();
  const user = navGetCurrentUser();

  if (!client || !user || !user.id) {
    return;
  }

  try {
    const { error: profileError } = await client
      .from("profiles")
      .update({
        preferred_language: language,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (profileError) {
      console.warn("Jazyk se nepodařilo uložit do profilu.", profileError);
    }

    const { data: authData, error: authError } = await client.auth.updateUser({
      data: { preferred_language: language }
    });

    if (authError) {
      console.warn("Jazyk se nepodařilo uložit do Auth metadata.", authError);
      return;
    }

    if (authData && authData.user) {
      navVerifiedUser = authData.user;
    }
  } catch (error) {
    console.warn("Jazyk se nepodařilo uložit do profilu.", error);
  }
}

async function navFlushPreferredLanguageSaveQueue() {
  if (navPreferredLanguageSaveRunning) {
    return;
  }

  navPreferredLanguageSaveRunning = true;

  try {
    while (navPendingPreferredLanguage) {
      const language = navPendingPreferredLanguage;
      navPendingPreferredLanguage = null;
      await navPersistPreferredLanguage(language);
    }
  } finally {
    navPreferredLanguageSaveRunning = false;

    if (navPendingPreferredLanguage) {
      void navFlushPreferredLanguageSaveQueue();
    }
  }
}

function navSavePreferredLanguage(language) {
  navPendingPreferredLanguage = language;
  void navFlushPreferredLanguageSaveQueue();
}

function navNormalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function navGetUserEmail(user) {
  if (typeof getUserEmail === "function") {
    return getUserEmail(user);
  }

  if (!user) {
    return "";
  }

  return user.email || user.userEmail || user.mail || "";
}

function navGetReservationStatus(reservation) {
  if (typeof getReservationStatus === "function") {
    return getReservationStatus(reservation);
  }

  if (!reservation) {
    return "pending";
  }

  return reservation.status || "pending";
}

function navNormalizeReservationStatus(status) {
  if (typeof normalizeReservationStatus === "function") {
    return normalizeReservationStatus(status);
  }

  const normalizedStatus = String(status || "pending").trim().toLowerCase();

  if (normalizedStatus === "čeká na potvrzení") return "pending";
  if (normalizedStatus === "čeká na platbu") return "approved";
  if (normalizedStatus === "zaplaceno") return "paid";
  if (normalizedStatus === "vyzvednuto") return "picked_up";
  if (normalizedStatus === "vráceno") return "returned";
  if (normalizedStatus === "odmítnuto") return "rejected";
  if (normalizedStatus === "zrušeno") return "cancelled";

  return normalizedStatus || "pending";
}

function navIsReservationWaitingForPayment(status) {
  return navNormalizeReservationStatus(status) === "approved";
}

function navRequiresOwnerAction(status) {
  const normalizedStatus = navNormalizeReservationStatus(status);
  return normalizedStatus === "pending" || normalizedStatus === "paid" || normalizedStatus === "picked_up";
}

function navInjectStyles() {
  if (document.getElementById("sharedNavigationStyles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "sharedNavigationStyles";
  style.textContent = `
    .nav-profile-control {
      position: relative;
      display: inline-flex;
      flex: 0 0 auto;
    }

    .nav-profile-button {
      position: relative;
      display: inline-flex;
      width: auto;
      height: 48px;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 1px 5px 1px 1px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: #173f35;
      cursor: pointer;
      box-shadow: none;
      transition: background 0.16s ease, transform 0.16s ease;
    }

    .nav-profile-button:hover,
    .nav-profile-button.is-active {
      background: #edf5f1;
    }

    .nav-profile-button:hover {
      transform: translateY(-1px);
    }

    html[data-focus-input="pointer"] .nav-profile-button:focus,
    html[data-focus-input="pointer"] .nav-profile-button:focus-visible {
      outline: none !important;
      outline-offset: 0 !important;
      box-shadow: none !important;
    }

    .nav-profile-button-initials {
      display: inline-flex;
      width: 46px;
      height: 46px;
      flex: 0 0 46px;
      align-items: center;
      justify-content: center;
      border: 1px solid #9fcab7;
      border-radius: 50%;
      background: #deeee6;
      color: #101c18;
      font-size: 16px;
      font-weight: 800;
      line-height: 1;
      letter-spacing: -0.05em;
      white-space: nowrap;
      box-shadow: 0 5px 14px rgba(18, 76, 57, 0.11);
    }

    .nav-profile-button-initials.is-three-characters {
      font-size: 15px;
      letter-spacing: -0.08em;
    }

    .nav-profile-mobile-label {
      display: none;
    }

    .nav-profile-chevron {
      margin-left: 0;
      color: #176747;
      font-size: 12px;
      line-height: 1;
      transform: translateY(1px);
      opacity: 0.9;
    }

    .nav-notification-badge {
      position: absolute;
      top: -4px;
      right: auto;
      left: 34px;
      display: inline-flex;
      min-width: 20px;
      height: 20px;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
      border: 2px solid var(--rentulo-page, #f5f8f6);
      border-radius: 999px;
      background: #FF6A00;
      color: #ffffff;
      font-size: 10px;
      line-height: 1;
      font-weight: 800;
      text-align: center;
      pointer-events: none;
    }

    .nav-menu-notification-badge {
      display: inline-flex;
      min-width: 20px;
      height: 20px;
      margin-left: auto;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
      border-radius: 999px;
      background: #FF6A00;
      color: #ffffff;
      font-size: 10px;
      line-height: 1;
      font-weight: 800;
      text-align: center;
      flex: 0 0 auto;
      pointer-events: none;
    }

    .nav-profile-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      z-index: 1300;
      width: 280px;
      padding: 7px;
      border: 1px solid #dce5df;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 18px 44px rgba(16, 32, 25, 0.15);
    }

    .nav-profile-menu[hidden] {
      display: none;
    }

    .nav-profile-summary {
      display: grid;
      grid-template-columns: 42px minmax(0, 1fr);
      gap: 10px;
      align-items: center;
      margin: 0 4px 6px;
      padding: 10px 8px 12px;
      border-bottom: 1px solid #e8ece9;
    }

    .nav-profile-summary-avatar {
      display: grid;
      width: 42px;
      height: 42px;
      place-items: center;
      border: 1px solid #c8e0d3;
      border-radius: 50%;
      background: #e9f4ee;
      color: #0e5037;
      font-size: 17px;
      font-weight: 800;
      line-height: 1;
    }

    .nav-profile-summary-copy {
      min-width: 0;
    }

    .nav-profile-summary-copy strong,
    .nav-profile-summary-copy span,
    .nav-profile-summary-copy small {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .nav-profile-summary-copy strong {
      color: #102019;
      font-size: 13px;
      font-weight: 800;
      line-height: 1.3;
    }

    .nav-profile-summary-copy span {
      margin-top: 2px;
      color: #64706b;
      font-size: 11px;
      font-weight: 600;
      line-height: 1.35;
    }

    .nav-profile-summary-copy small {
      margin-top: 4px;
      color: #176747;
      font-size: 10px;
      font-weight: 700;
      line-height: 1.35;
    }

    .nav-profile-menu a,
    .nav-profile-menu button {
      display: flex;
      width: 100%;
      min-height: 42px;
      align-items: center;
      justify-content: flex-start;
      padding: 0 12px;
      border: 0;
      border-radius: 10px;
      background: transparent;
      color: #17251f !important;
      font-family: inherit;
      font-size: 13px !important;
      font-weight: 700 !important;
      line-height: 1.25;
      text-align: left;
      text-decoration: none !important;
      cursor: pointer;
      box-shadow: none !important;
    }

    .nav-profile-menu a:hover,
    .nav-profile-menu button:hover,
    .nav-profile-menu a.is-current {
      background: #edf5f1 !important;
      color: #102019 !important;
    }

    .nav-profile-menu-divider {
      height: 1px;
      margin: 6px 4px;
      background: #e8ece9;
    }

    .nav-profile-menu .nav-profile-menu-logout {
      color: #8c3521 !important;
      font-weight: 800 !important;
    }

    .nav-profile-menu .nav-profile-menu-logout:hover {
      background: #fff4ef !important;
      color: #7b2c1c !important;
    }

    .shared-mobile-menu-button {
      display: none;
    }

    .nav-mobile-profile-summary,
    .nav-mobile-account-menu {
      display: none;
    }

    @media (max-width: 1100px) {
      .header,
      .header-inner {
        position: relative;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .shared-mobile-menu-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 42px;
        padding: 0 13px;
        border: 1px solid #dbe4de;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.94);
        color: #102019;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 7px 18px rgba(16, 32, 25, 0.06);
        flex: 0 0 auto;
      }

      .shared-mobile-menu-button:hover {
        border-color: #c9d9cf;
        background: #ffffff;
      }

      .shared-mobile-menu-button.is-profile-trigger {
        position: relative;
        gap: 4px;
        min-height: 50px;
        padding: 1px 2px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        box-shadow: none;
      }

      .shared-mobile-menu-button.is-profile-trigger:hover {
        background: #edf5f1;
      }

      html[data-focus-input="pointer"] .shared-mobile-menu-button.is-profile-trigger:focus,
      html[data-focus-input="pointer"] .shared-mobile-menu-button.is-profile-trigger:focus-visible {
        outline: none !important;
        box-shadow: none !important;
      }

      .shared-mobile-menu-button.is-profile-trigger .nav-profile-button-initials {
        width: 48px;
        height: 48px;
        flex-basis: 48px;
      }

      .shared-mobile-menu-button.is-profile-trigger .nav-notification-badge {
        top: -3px;
        left: 37px;
      }

      .header #mainNav,
      .header-inner #mainNav {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        z-index: 1200;
        display: none;
        width: 100%;
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
        gap: 2px;
        padding: 7px 8px 8px;
        border: 1px solid #dde5df;
        border-radius: 16px;
        background: #ffffff;
        box-shadow: 0 18px 42px rgba(16, 32, 25, 0.13);
      }

      .header #mainNav.is-mobile-open,
      .header-inner #mainNav.is-mobile-open {
        display: flex;
      }

      #mainNav > a {
        width: 100%;
        padding: 9px 10px;
        border-radius: 10px;
        color: #17251f !important;
        font-size: 14px !important;
        font-weight: 700 !important;
        line-height: 1.25;
        text-decoration: none !important;
      }

      #mainNav > a:not(.btn-register) {
        border-bottom: 0;
      }

      #mainNav > a:not(.btn-register):hover,
      #mainNav > a.active-link:not(.btn-register) {
        border-bottom-color: transparent;
        background: #e9f4ee !important;
        color: #102019 !important;
      }

      #mainNav .btn-register {
        width: 100%;
        min-height: 42px;
        padding: 0 14px;
        border-radius: 10px;
        background: #FF6A00 !important;
        color: #ffffff !important;
        font-weight: 800 !important;
        box-shadow: 0 10px 24px rgba(255, 106, 0, 0.16) !important;
      }

      #mainNav .btn-register:hover {
        background: #E85F00 !important;
        color: #ffffff !important;
      }

      #mainNav.is-user-navigation .nav-profile-control {
        display: none;
      }

      #mainNav.is-user-navigation .nav-mobile-profile-summary {
        display: block;
        width: 100%;
      }

      #mainNav.is-user-navigation .nav-mobile-profile-summary .nav-profile-summary {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        margin: 0;
        padding: 4px 8px 9px;
        text-align: center;
      }

      #mainNav.is-user-navigation .nav-mobile-profile-summary .nav-profile-summary-avatar {
        width: 44px;
        height: 44px;
        margin-bottom: 6px;
        font-size: 14px;
      }

      #mainNav.is-user-navigation .nav-mobile-profile-summary .nav-profile-summary-copy {
        width: 100%;
      }

      #mainNav.is-user-navigation .nav-mobile-profile-summary .nav-profile-summary-copy strong {
        font-size: 14px;
      }

      #mainNav.is-user-navigation .nav-mobile-account-menu {
        position: static;
        display: block;
        width: 100%;
        margin-top: 4px;
        padding: 4px 0 0;
        border: 0;
        border-top: 1px solid #e8ece9;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }

      #mainNav.is-user-navigation .nav-mobile-account-menu a,
      #mainNav.is-user-navigation .nav-mobile-account-menu button {
        min-height: 40px;
        padding: 0 10px;
        font-size: 14px !important;
        font-weight: 700 !important;
        line-height: 1.25;
      }

      #mainNav.is-user-navigation .nav-mobile-account-menu .nav-profile-menu-logout {
        font-size: 14px !important;
        font-weight: 800 !important;
      }

      #mainNav.is-user-navigation .nav-mobile-account-menu .nav-profile-menu-divider {
        margin: 4px;
      }

      #mainNav .nav-language-control {
        align-self: flex-start;
        margin-top: 0;
      }

      #mainNav.is-user-navigation > .nav-language-control {
        width: 100%;
        align-self: stretch;
        align-items: center;
        justify-content: space-between;
        margin-top: 0;
        padding: 4px 10px 0;
      }

      #mainNav.is-user-navigation > .nav-language-control .nav-language-label {
        display: block;
        color: #17251f;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.25;
      }

      #mainNav.is-user-navigation > .nav-language-control .nav-language-menu {
        right: 10px;
      }
    }

    :where(
      a[href],
      button,
      input,
      select,
      textarea,
      summary,
      [role="button"],
      [tabindex]:not([tabindex="-1"])
    ):focus {
      outline: none !important;
    }

    :where(
      input,
      select,
      textarea,
      summary,
      [tabindex]:not([tabindex="-1"])
    ):focus-visible {
      outline: 1px solid rgba(64, 127, 101, 0.35) !important;
      outline-offset: 1px !important;
    }

    :where(a[href], button, [role="button"]):focus-visible {
      outline: 1px solid rgba(20, 82, 62, 0.72) !important;
      outline-offset: 2px !important;
    }

    .nav > a[href]:not(.btn-register):focus-visible {
      outline: 1px solid rgba(20, 82, 62, 0.58) !important;
      outline-offset: 3px !important;
      border-radius: 6px;
    }

    .logo:focus-visible {
      outline: 1px solid rgba(20, 82, 62, 0.58) !important;
      outline-offset: 3px !important;
      border-radius: 8px;
    }

    a.back-link,
    a.results-back-link,
    a.manual-back {
      position: relative;
    }

    a.back-link:hover,
    a.results-back-link:hover,
    a.manual-back:hover {
      text-decoration: none !important;
    }

    a.back-link:focus-visible,
    a.results-back-link:focus-visible,
    a.manual-back:focus-visible {
      outline: none !important;
    }

    a.back-link:focus-visible::after,
    a.results-back-link:focus-visible::after,
    a.manual-back:focus-visible::after {
      content: "";
      position: absolute;
      inset: -3px;
      border: 1px solid rgba(20, 82, 62, 0.52);
      border-radius: 7px;
      pointer-events: none;
    }

    html[data-focus-input="keyboard"] .switch input:focus-visible + .switch-slider,
    .photo-file-input:focus-visible + .photo-file-control {
      outline: 1px solid rgba(64, 127, 101, 0.35) !important;
      outline-offset: 1px !important;
    }
  `;

  document.head.appendChild(style);
}

function navGetMobileMenuLabel() {
  const translated = navTranslate("nav.menu", "");

  if (translated && translated !== "nav.menu") {
    return translated;
  }

  return {
    cs: "Menu",
    en: "Menu",
    de: "Menü",
    pl: "Menu"
  }[navGetLanguage()] || "Menu";
}

function navSetMobileMenuOpen(nav, button, isOpen) {
  nav.classList.toggle("is-mobile-open", isOpen);
  button.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function navEnsureMobileMenuButton(nav) {
  const headerContainer = nav.closest(".header, .header-inner");

  if (!headerContainer) {
    return null;
  }

  let button = headerContainer.querySelector(".shared-mobile-menu-button");

  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "shared-mobile-menu-button";
    button.setAttribute("aria-controls", nav.id || "mainNav");
    button.setAttribute("aria-expanded", "false");
    headerContainer.insertBefore(button, nav);
  }

  const currentUser = navGetCurrentUser();

  if (currentUser) {
    const summary = navEnsureProfileSummary(currentUser);
    const initials = navGetProfileInitials(summary.name);
    const initialsClass = initials.length > 2 ? " is-three-characters" : "";
    const storedNotificationCount = Number(window.rentuloAccountNotificationCount);
    const notificationCount = Number.isFinite(storedNotificationCount) ? storedNotificationCount : 0;
    const badge = notificationCount > 0
      ? `<span class="nav-notification-badge" aria-hidden="true">${notificationCount > 99 ? "99+" : notificationCount}</span>`
      : "";

    button.classList.add("is-profile-trigger");
    button.setAttribute("aria-label", navProfileText("open"));
    button.innerHTML = `
      <span class="nav-profile-button-initials${initialsClass}" id="sharedMobileProfileInitials" aria-hidden="true">${navEscapeHtml(initials)}</span>
      <span class="nav-profile-chevron" aria-hidden="true">⌄</span>
      ${badge}
    `;
  } else {
    button.classList.remove("is-profile-trigger");
    button.setAttribute("aria-label", navGetMobileMenuLabel());
    button.innerHTML = `
      <span class="shared-mobile-menu-icon" aria-hidden="true">
        <span></span><span></span><span></span>
      </span>
      <span class="shared-mobile-menu-label">${navGetMobileMenuLabel()}</span>
    `;
  }

  return button;
}

function navSetupSharedMobileNavigation(nav) {
  const button = navEnsureMobileMenuButton(nav);

  if (!button || button.dataset.mobileNavigationBound === "true") {
    return;
  }

  const headerContainer = button.closest(".header, .header-inner");
  const mobileQuery = window.matchMedia("(max-width: 1100px)");

  function closeMobileMenu() {
    navSetMobileMenuOpen(nav, button, false);
  }

  button.addEventListener("click", function (event) {
    event.stopPropagation();
    const isOpen = button.getAttribute("aria-expanded") === "true";
    navSetMobileMenuOpen(nav, button, !isOpen);
  });

  nav.addEventListener("click", function (event) {
    if (mobileQuery.matches && event.target.closest("a")) {
      closeMobileMenu();
    }
  });

  document.addEventListener("click", function (event) {
    if (!mobileQuery.matches || !nav.classList.contains("is-mobile-open")) {
      return;
    }

    if (headerContainer && headerContainer.contains(event.target)) {
      return;
    }

    closeMobileMenu();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && nav.classList.contains("is-mobile-open")) {
      closeMobileMenu();
      button.focus();
    }
  });

  const handleViewportChange = function (event) {
    if (!event.matches) {
      closeMobileMenu();
    }
  };

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", handleViewportChange);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(handleViewportChange);
  }

  button.dataset.mobileNavigationBound = "true";
}

function navEnableFocusInputTracking() {
  const root = document.documentElement;

  document.addEventListener("keydown", function (event) {
    if (event.key === "Tab") {
      root.dataset.focusInput = "keyboard";
    }
  }, true);

  document.addEventListener("pointerdown", function () {
    root.dataset.focusInput = "pointer";
  }, true);
}

function renderSharedBranding() {
  const logoTextTitle = document.querySelector(".logo-text strong");
  if (logoTextTitle) {
    logoTextTitle.textContent = "Rentulo";
  }

  const logoTextSubtitle = document.querySelector(".logo-text small");
  if (logoTextSubtitle) {
    logoTextSubtitle.remove();
  }

  const logoTitle = document.querySelector(".logo-title");
  if (logoTitle) {
    logoTitle.textContent = "Rentulo";
  }

  const logoSubtitle = document.querySelector(".logo-subtitle");
  if (logoSubtitle) {
    logoSubtitle.remove();
  }
}

function navClearLocalLogin() {
  if (typeof clearCurrentUser === "function") {
    clearCurrentUser();
  }

  localStorage.removeItem("rentuloLoggedIn");
  localStorage.removeItem("rentuloUser");
  localStorage.removeItem("rentuloRememberLogin");
}

async function navLogoutUser() {
  const supabaseClient = navGetSupabaseClient();

  if (supabaseClient && supabaseClient.auth && typeof supabaseClient.auth.signOut === "function") {
    try {
      await supabaseClient.auth.signOut();
    } catch (error) {
      console.warn("Supabase odhlášení se nepodařilo, pokračuji lokálním odhlášením.", error);
    }
  }

  navClearLocalLogin();
  window.location.href = "index.html";
}

async function navLoadNotificationCountFromSupabase(activePage) {
  const currentUser = navGetCurrentUser();

  if (!currentUser || typeof apiGetReservations !== "function") {
    return;
  }

  try {
    const reservations = await apiGetReservations();

    if (!Array.isArray(reservations)) {
      return;
    }

    const userId = String(currentUser.id || "");
    const userEmail = navNormalizeEmail(navGetUserEmail(currentUser));

    let offersNotificationCount = 0;
    let reservationsNotificationCount = 0;

    reservations.forEach(function (reservation) {
      const ownerId = String(reservation.ownerId || reservation.owner_id || "");
      const renterId = String(reservation.renterId || reservation.renter_id || "");
      const renterEmail = navNormalizeEmail(reservation.renterEmail || reservation.renter_email || "");
      const status = navGetReservationStatus(reservation);

      const ownerNeedsAction = ownerId === userId && navRequiresOwnerAction(status);
      const renterNeedsPayment = (renterId === userId || renterEmail === userEmail) && navIsReservationWaitingForPayment(status);

      if (ownerNeedsAction) {
        offersNotificationCount += 1;
      }

      if (renterNeedsPayment) {
        reservationsNotificationCount += 1;
      }
    });

    const notificationCount = offersNotificationCount + reservationsNotificationCount;

    window.rentuloAccountNotificationCounts = {
      reservations: reservationsNotificationCount,
      offers: offersNotificationCount
    };
    window.rentuloAccountNotificationCount = notificationCount;
    renderSharedNavigation(activePage);
  } catch (error) {
    console.warn("Počet upozornění se nepodařilo načíst.", error);
  }
}

window.refreshRentuloNotificationBadge = async function () {
  const activePage = document.body.dataset.navigationPage || "";
  if (!activePage) {
    return;
  }

  await navLoadNotificationCountFromSupabase(activePage);
};

function navCloseProfileMenu() {
  const button = document.getElementById("sharedProfileButton");
  const menu = document.getElementById("sharedProfileMenu");

  if (!button || !menu) {
    return;
  }

  menu.hidden = true;
  button.setAttribute("aria-expanded", "false");
}

function navCloseLanguageMenu() {
  const button = document.getElementById("sharedLanguageButton");
  const menu = document.getElementById("sharedLanguageMenu");

  if (!button || !menu) {
    return;
  }

  menu.hidden = true;
  button.setAttribute("aria-expanded", "false");
}

function navBindGlobalDropdownDismissal() {
  if (navGlobalDropdownDismissalBound) {
    return;
  }

  document.addEventListener("click", function () {
    navCloseProfileMenu();
    navCloseLanguageMenu();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") {
      return;
    }

    const profileButton = document.getElementById("sharedProfileButton");
    const profileMenu = document.getElementById("sharedProfileMenu");
    const languageButton = document.getElementById("sharedLanguageButton");
    const languageMenu = document.getElementById("sharedLanguageMenu");

    if (profileButton && profileMenu && !profileMenu.hidden) {
      navCloseProfileMenu();
      profileButton.focus();
      return;
    }

    if (languageButton && languageMenu && !languageMenu.hidden) {
      navCloseLanguageMenu();
      languageButton.focus();
    }
  });

  navGlobalDropdownDismissalBound = true;
}

function navGetAccountNotificationCounts() {
  const storedCounts = window.rentuloAccountNotificationCounts || {};
  const reservationsCount = Number(storedCounts.reservations);
  const offersCount = Number(storedCounts.offers);

  return {
    reservations: Number.isFinite(reservationsCount) && reservationsCount > 0
      ? Math.floor(reservationsCount)
      : 0,
    offers: Number.isFinite(offersCount) && offersCount > 0
      ? Math.floor(offersCount)
      : 0
  };
}

function navMenuNotificationBadge(count) {
  if (!count) {
    return "";
  }

  const label = count > 99 ? "99+" : String(count);
  return `<span class="nav-menu-notification-badge" aria-hidden="true">${label}</span>`;
}

function navProfileControl(notificationCount) {
  const badge = notificationCount > 0
    ? `<span class="nav-notification-badge" aria-hidden="true">${notificationCount > 99 ? "99+" : notificationCount}</span>`
    : "";

  const notificationLabel = notificationCount > 0
    ? `, ${notificationCount} ${navProfileText("notifications")}`
    : "";

  const summary = navEnsureProfileSummary(navGetCurrentUser());
  const profileName = navEscapeHtml(summary.name);
  const profileEmail = navEscapeHtml(summary.email);
  const profileRating = navEscapeHtml(navFormatProfileRating(summary));
  const profileInitials = navGetProfileInitials(summary.name);
  const escapedProfileInitials = navEscapeHtml(profileInitials);
  const initialsClass = profileInitials.length > 2 ? " is-three-characters" : "";
  const accountNotificationCounts = navGetAccountNotificationCounts();

  return `
    <div class="nav-profile-control">
      <button
        type="button"
        id="sharedProfileButton"
        class="nav-profile-button"
        aria-label="${navProfileText("open")}${notificationLabel}"
        aria-haspopup="true"
        aria-expanded="false"
        aria-controls="sharedProfileMenu"
      >
        <span
          class="nav-profile-button-initials${initialsClass}"
          id="sharedProfileButtonInitials"
          aria-hidden="true"
        >${escapedProfileInitials}</span>
        <span class="nav-profile-mobile-label">${profileName}</span>
        <span class="nav-profile-chevron" aria-hidden="true">⌄</span>
        ${badge}
      </button>

      <div id="sharedProfileMenu" class="nav-profile-menu" role="menu" hidden>
        <div class="nav-profile-summary">
          <div class="nav-profile-summary-avatar" id="sharedProfileAvatar" aria-hidden="true">${escapedProfileInitials}</div>
          <div class="nav-profile-summary-copy">
            <strong id="sharedProfileName">${profileName}</strong>
            <span id="sharedProfileEmail">${profileEmail}</span>
            <small id="sharedProfileRating">${profileRating}</small>
          </div>
        </div>
        <a href="moje-rezervace.html" role="menuitem">
          <span>${navProfileText("reservations")}</span>
          ${navMenuNotificationBadge(accountNotificationCounts.reservations)}
        </a>
        <a href="moje-nabidky.html" role="menuitem">
          <span>${navProfileText("offers")}</span>
          ${navMenuNotificationBadge(accountNotificationCounts.offers)}
        </a>
        <a href="historie.html" role="menuitem">${navProfileText("history")}</a>
        <a href="nastaveni.html" role="menuitem">${navProfileText("settings")}</a>
        <div class="nav-profile-menu-divider" aria-hidden="true"></div>
        <button type="button" id="sharedLogoutBtn" class="nav-profile-menu-logout" role="menuitem">${navProfileText("logout")}</button>
      </div>
    </div>
  `;
}

function navMobileProfileSummary() {
  const summary = navEnsureProfileSummary(navGetCurrentUser());
  const initials = navGetProfileInitials(summary.name);

  return `
    <div class="nav-mobile-profile-summary">
      <div class="nav-profile-summary">
        <div class="nav-profile-summary-avatar" id="sharedMobileProfileAvatar" aria-hidden="true">${navEscapeHtml(initials)}</div>
        <div class="nav-profile-summary-copy">
          <strong id="sharedMobileProfileName">${navEscapeHtml(summary.name)}</strong>
          <span id="sharedMobileProfileEmail">${navEscapeHtml(summary.email)}</span>
          <small id="sharedMobileProfileRating">${navEscapeHtml(navFormatProfileRating(summary))}</small>
        </div>
      </div>
    </div>
  `;
}

function navMobileAccountMenu() {
  const accountNotificationCounts = navGetAccountNotificationCounts();

  return `
    <div class="nav-profile-menu nav-mobile-account-menu">
      <a href="moje-rezervace.html">
        <span>${navProfileText("reservations")}</span>
        ${navMenuNotificationBadge(accountNotificationCounts.reservations)}
      </a>
      <a href="moje-nabidky.html">
        <span>${navProfileText("offers")}</span>
        ${navMenuNotificationBadge(accountNotificationCounts.offers)}
      </a>
      <a href="historie.html">${navProfileText("history")}</a>
      <a href="nastaveni.html">${navProfileText("settings")}</a>
      <div class="nav-profile-menu-divider" aria-hidden="true"></div>
      <button type="button" class="nav-profile-menu-logout" data-nav-logout="true">${navProfileText("logout")}</button>
      <div class="nav-profile-menu-divider" aria-hidden="true"></div>
    </div>
  `;
}

function renderSharedNavigation(activePage) {
  renderSharedBranding();
  navEnsureLanguageStyles();
  navBindGlobalDropdownDismissal();

  const nav = document.getElementById("mainNav") || document.querySelector(".nav");
  if (!nav) {
    return;
  }

  navInjectStyles();

  const currentUser = navGetCurrentUser();
  nav.classList.toggle("is-user-navigation", Boolean(currentUser));

  const storedNotificationCount = Number(window.rentuloAccountNotificationCount);
  const notificationCount = Number.isFinite(storedNotificationCount) ? storedNotificationCount : 0;

  const isHowActive = activePage === "jak-to-funguje" ? "active-link" : "";
  const isResultsActive = activePage === "vysledky" ? "active-link" : "";
  const isOfferActive = activePage === "nabidnout" ? "active-link" : "";
  const isLoginActive = activePage === "prihlaseni" ? "active-link" : "";
  const isRegisterActive = activePage === "registrace" ? "active-link" : "";

  const howItWorksText = navTranslate("nav.howItWorks", "Jak to funguje");
  const browseText = navTranslate("nav.browse", "Prohlédnout nabídky");
  const offerText = navTranslate("nav.offer", "Nabídnout cokoli");
  const loginText = navTranslate("nav.login", "Přihlásit se");
  const registerText = navTranslate("nav.register", "Registrovat se");

  if (currentUser) {
    nav.innerHTML = `
      ${navMobileProfileSummary()}
      <a href="jak-to-funguje.html" class="${isHowActive}">${howItWorksText}</a>
      <a href="vysledky.html" class="${isResultsActive}">${browseText}</a>
      <a href="nabidnout.html" class="${isOfferActive}">${offerText}</a>
      ${navProfileControl(notificationCount)}
      ${navMobileAccountMenu()}
      ${navLanguageControl()}
    `;
  } else {
    nav.innerHTML = `
      <a href="jak-to-funguje.html" class="${isHowActive}">${howItWorksText}</a>
      <a href="vysledky.html" class="${isResultsActive}">${browseText}</a>
      <a href="nabidnout.html" class="${isOfferActive}">${offerText}</a>
      <a href="prihlaseni.html" class="${isLoginActive}">${loginText}</a>
      <a href="registrace.html" class="btn-register ${isRegisterActive}">${registerText}</a>
      ${navLanguageControl()}
    `;
  }

  navSetupSharedMobileNavigation(nav);

  const profileButton = document.getElementById("sharedProfileButton");
  const profileMenu = document.getElementById("sharedProfileMenu");

  if (profileButton && profileMenu) {
    profileButton.addEventListener("click", function (event) {
      event.stopPropagation();
      const willOpen = profileMenu.hidden;
      navCloseLanguageMenu();
      profileMenu.hidden = !willOpen;
      profileButton.setAttribute("aria-expanded", String(willOpen));
    });

    profileMenu.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  }

  const logoutButtons = document.querySelectorAll('#sharedLogoutBtn, [data-nav-logout="true"]');
  logoutButtons.forEach(function (logoutButton) {
    logoutButton.addEventListener("click", function (event) {
      event.preventDefault();
      void navLogoutUser();
    });
  });

  const languageButton = document.getElementById("sharedLanguageButton");
  const languageMenu = document.getElementById("sharedLanguageMenu");

  if (languageButton && languageMenu) {
    languageButton.addEventListener("click", function (event) {
      event.stopPropagation();
      const willOpen = languageMenu.hidden;
      navCloseProfileMenu();
      languageMenu.hidden = !willOpen;
      languageButton.setAttribute("aria-expanded", String(willOpen));
    });

    languageMenu.addEventListener("click", function (event) {
      event.stopPropagation();
      const option = event.target.closest("[data-language]");
      if (!option) {
        return;
      }

      const language = option.dataset.language;
      navCloseLanguageMenu();

      if (typeof window.setRentuloLanguage === "function") {
        window.setRentuloLanguage(language);
      } else {
        localStorage.setItem("rentuloLanguage", language);
        window.location.reload();
      }

      navSavePreferredLanguage(language);
    });
  }
}

function navGetSameOriginReferrerUrl() {
  if (!document.referrer) {
    return null;
  }

  try {
    const referrerUrl = new URL(document.referrer, window.location.href);
    const currentUrl = new URL(window.location.href);

    if (referrerUrl.origin !== currentUrl.origin || referrerUrl.href === currentUrl.href) {
      return null;
    }

    return referrerUrl.href;
  } catch (error) {
    return null;
  }
}

function navRememberContextBackUrl() {
  if (!window.history || typeof window.history.replaceState !== "function") {
    return;
  }

  const referrerUrl = navGetSameOriginReferrerUrl();
  const existingState = window.history.state && typeof window.history.state === "object"
    ? window.history.state
    : {};

  if (existingState.rentuloBackUrl || !referrerUrl) {
    return;
  }

  try {
    window.history.replaceState(
      Object.assign({}, existingState, { rentuloBackUrl: referrerUrl }),
      document.title,
      window.location.href
    );
  } catch (error) {
    // The normal href fallback remains available if History state cannot be updated.
  }
}

function navCanUseContextBack() {
  const stateBackUrl = window.history && window.history.state && typeof window.history.state === "object"
    ? window.history.state.rentuloBackUrl
    : "";
  const backUrl = stateBackUrl || navGetSameOriginReferrerUrl();

  return Boolean(backUrl && window.history && window.history.length > 1);
}

function navSetupContextBackLinks() {
  navRememberContextBackUrl();

  document.querySelectorAll('a[data-rentulo-back="true"]').forEach(function (link) {
    if (link.dataset.rentuloBackReady === "true") {
      return;
    }

    link.dataset.rentuloBackReady = "true";
    link.addEventListener("click", function (event) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      if (!navCanUseContextBack()) {
        return;
      }

      event.preventDefault();
      window.history.back();
    });
  });
}

async function initializeSharedNavigation() {
  const page = document.body.dataset.navigationPage;

  if (!page) {
    return;
  }

  navEnableFocusInputTracking();
  navSetupContextBackLinks();
  await navGetVerifiedUser();
  renderSharedNavigation(page);

  if (navVerifiedUser) {
    void navLoadProfileSummary(navVerifiedUser);
  }

  void navLoadNotificationCountFromSupabase(page);

  const supabaseClient = navGetSupabaseClient();

  if (
    !navAuthListenerRegistered &&
    supabaseClient &&
    supabaseClient.auth &&
    typeof supabaseClient.auth.onAuthStateChange === "function"
  ) {
    navAuthListenerRegistered = true;
    supabaseClient.auth.onAuthStateChange(function (_event, session) {
      navVerifiedUser = session && session.user ? session.user : null;
      navAuthPromise = Promise.resolve(navVerifiedUser);
      window.rentuloAccountNotificationCount = 0;
      navProfileSummary = null;
      renderSharedNavigation(page);

      if (navVerifiedUser) {
        void navLoadProfileSummary(navVerifiedUser);
        void navLoadNotificationCountFromSupabase(page);
      }
    });
  }
}

document.addEventListener("rentuloLanguageChanged", function () {
  const page = document.body.dataset.navigationPage;

  if (page) {
    renderSharedNavigation(page);
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSharedNavigation);
} else {
  initializeSharedNavigation();
}
