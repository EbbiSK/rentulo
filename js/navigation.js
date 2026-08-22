function navLoadJson(key, fallback) {
  if (typeof loadJson === "function") {
    return loadJson(key, fallback);
  }

  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

let navVerifiedUser = null;
let navAuthPromise = null;
let navAuthListenerRegistered = false;

function navIsLoggedIn() {
  return Boolean(navVerifiedUser);
}

function navGetCurrentUser() {
  return navVerifiedUser;
}
async function navResolveSupabaseUser() {
  const supabaseClient = navGetSupabaseClient();

  if (!supabaseClient || !supabaseClient.auth) {
    navVerifiedUser = null;
    return null;
  }

  try {
    const { data, error } = await supabaseClient.auth.getUser();
    navVerifiedUser =
      !error && data && data.user
        ? data.user
        : null;
  } catch (error) {
    console.warn(
      "Stav přihlášení pro navigaci se nepodařilo ověřit.",
      error
    );
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

function navGetSupabaseClient() {
  if (window.rentuloSupabase) {
    return window.rentuloSupabase;
  }

  if (typeof rentuloSupabase !== "undefined") {
    return rentuloSupabase;
  }

  return null;
}

function navTranslate(key, fallback) {
  if (typeof window.rentuloTranslate === "function") {
    return window.rentuloTranslate(key);
  }
  return fallback;
}

function navGetLanguage() {
  if (typeof window.getRentuloLanguage === "function") {
    return window.getRentuloLanguage();
  }

  return localStorage.getItem("rentuloLanguage") || "cs";
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
      <button
        type="button"
        id="sharedLanguageButton"
        class="nav-language-button"
        aria-label="${label}"
        aria-haspopup="true"
        aria-expanded="false"
      >
        ${navFlagMarkup(language)}
        <span class="nav-language-chevron" aria-hidden="true">⌄</span>
      </button>
      <div id="sharedLanguageMenu" class="nav-language-menu" role="menu" hidden>
        <button type="button" role="menuitem" data-language="cs" aria-label="Čeština">
          ${navFlagMarkup("cs")}
        </button>
        <button type="button" role="menuitem" data-language="en" aria-label="English">
          ${navFlagMarkup("en")}
        </button>
        <button type="button" role="menuitem" data-language="de" aria-label="Deutsch">
          ${navFlagMarkup("de")}
        </button>
        <button type="button" role="menuitem" data-language="pl" aria-label="Polski">
          ${navFlagMarkup("pl")}
        </button>
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
      z-index: 1200;
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
let navPreferredLanguageSaveRunning = false;
let navPendingPreferredLanguage = null;

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
      data: {
        preferred_language: language
      }
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

  return (
    user.email ||
    user.userEmail ||
    user.mail ||
    ""
  );
}

function navMergeById(primaryItems, secondaryItems) {
  const mergedItems = [];

  if (Array.isArray(primaryItems)) {
    mergedItems.push(...primaryItems);
  }
  if (Array.isArray(secondaryItems)) {
    secondaryItems.forEach(function (secondaryItem) {
      const secondaryId = String(
        secondaryItem.id ||
        secondaryItem.offerId ||
        secondaryItem.reservationId ||
        ""
      );

      const alreadyExists = mergedItems.some(function (item) {
        const itemId = String(
          item.id ||
          item.offerId ||
          item.reservationId ||
          ""
        );
        return itemId && secondaryId && itemId === secondaryId;
      });

      if (!alreadyExists) {
        mergedItems.push(secondaryItem);
      }
    });
  }

  return mergedItems;
}

function navGetTools() {
  return [];
}

function navGetReservations() {
  return [];
}

function navGetToolId(tool) {
  if (!tool) {
    return "";
  }

  return (
    tool.id ||
    tool.offerId ||
    ""
  );
}

function navGetToolOwnerEmail(tool) {
  if (!tool) {
    return "";
  }
  return (
    tool.ownerEmail ||
    tool.userEmail ||
    tool.email ||
    ""
  );
}

function navGetReservationToolId(reservation) {
  if (typeof getReservationOfferId === "function") {
    return getReservationOfferId(reservation);
  }

  if (!reservation) {
    return "";
  }

  return (
    reservation.toolId ||
    reservation.offerId ||
    ""
  );
}
function navGetReservationRenterEmail(reservation) {
  if (typeof getReservationRenterEmail === "function") {
    return getReservationRenterEmail(reservation);
  }

  if (!reservation) {
    return "";
  }

  return (
    reservation.renterEmail ||
    reservation.userEmail ||
    reservation.borrowerEmail ||
    ""
  );
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

  const normalizedStatus = String(status || "pending")
    .trim()
    .toLowerCase();

  if (normalizedStatus === "čeká na potvrzení") {
    return "pending";
  }

  if (normalizedStatus === "čeká na platbu") {
    return "approved";
  }
  if (normalizedStatus === "zaplaceno") {
    return "paid";
  }

  if (normalizedStatus === "vyzvednuto") {
    return "picked_up";
  }

  if (normalizedStatus === "vráceno") {
    return "returned";
  }

  if (normalizedStatus === "odmítnuto") {
    return "rejected";
  }

  if (normalizedStatus === "zrušeno") {
    return "cancelled";
  }

  return normalizedStatus || "pending";
}

function navIsReservationWaitingForPayment(status) {
  const normalizedStatus =
    navNormalizeReservationStatus(status);
  return normalizedStatus === "approved";
}

function navRequiresOwnerAction(status) {
  const normalizedStatus =
    navNormalizeReservationStatus(status);

  return (
    normalizedStatus === "pending" ||
    normalizedStatus === "paid" ||
    normalizedStatus === "picked_up"
  );
}

function navGetNotificationCount() {
  const currentUser = navGetCurrentUser();

  if (!currentUser) {
    return 0;
  }

  const userEmail = navNormalizeEmail(
    navGetUserEmail(currentUser)
  );
  if (!userEmail) {
    return 0;
  }

  const tools = navGetTools();

  const reservations =
    typeof getReservations === "function"
      ? getReservations()
      : [];

  const myToolIds = tools
    .filter(function (tool) {
      return (
        navNormalizeEmail(
          navGetToolOwnerEmail(tool)
        ) === userEmail
      );
    })
    .map(function (tool) {
      return String(navGetToolId(tool));
    });
  const ownerActionRequests =
    reservations.filter(function (reservation) {
      const reservationToolId =
        navGetReservationToolId(reservation);

      const status =
        navGetReservationStatus(reservation);

      return (
        myToolIds.includes(
          String(reservationToolId)
        ) &&
        navRequiresOwnerAction(status)
      );
    }).length;
  const renterWaitingForPayment =
    reservations.filter(function (reservation) {
      const renterEmail =
        navNormalizeEmail(
          navGetReservationRenterEmail(
            reservation
          )
        );

      const status =
        navGetReservationStatus(reservation);

      return (
        renterEmail === userEmail &&
        navIsReservationWaitingForPayment(
          status
        )
      );
    }).length;

  return (
    ownerActionRequests +
    renterWaitingForPayment
  );
}
function navInjectStyles() {
  if (
    document.getElementById(
      "sharedNavigationStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement("style");

  style.id = "sharedNavigationStyles";

  style.textContent = `
    .nav-account-link {
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }
    .nav-notification-badge {
      min-width: 18px;
      height: 18px;
      padding: 0 6px;
      border-radius: 999px;
      background: #FF6A00;
      color: white;
      font-size: 12px;
      line-height: 18px;
      font-weight: 800;
      text-align: center;
    }

    .nav-account-link:hover
    .nav-notification-badge {
      background: #E85F00;
    }

    .logout-link {
      cursor: pointer;
    }
    .logout-link:hover {
      background: #00563a;
    }

    .shared-mobile-menu-button {
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

      .shared-mobile-menu-button:focus-visible {
        outline: 1px solid rgba(20, 82, 62, 0.72) !important;
        outline-offset: 2px !important;
      }

      .shared-mobile-menu-icon {
        display: grid;
        gap: 3px;
        width: 16px;
      }

      .shared-mobile-menu-icon span {
        display: block;
        width: 16px;
        height: 2px;
        border-radius: 999px;
        background: currentColor;
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
        gap: 4px;
        padding: 10px;
        border: 1px solid #dde5df;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 18px 42px rgba(16, 32, 25, 0.13);
      }

      .header #mainNav.is-mobile-open,
      .header-inner #mainNav.is-mobile-open {
        display: flex;
      }

      #mainNav > a {
        width: 100%;
        padding: 11px 12px;
        border-radius: 10px;
      }

      #mainNav > a:not(.btn-register):not(.logout-link) {
        border-bottom: 0;
      }

      #mainNav > a:not(.btn-register):not(.logout-link):hover,
      #mainNav > a.active-link:not(.btn-register):not(.logout-link) {
        border-bottom-color: transparent;
        background: #e9f4ee;
      }

      #mainNav .btn-register,
      #mainNav .logout-link {
        width: 100%;
        min-height: 42px;
        padding: 0 14px;
        border-radius: 10px;
      }

      #mainNav .nav-language-control {
        align-self: flex-start;
        margin-top: 2px;
      }
    }
/* Shared focus states across Rentulo */
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

:where(
  a[href],
  button,
  [role="button"]
):focus-visible {
  outline: 1px solid rgba(20, 82, 62, 0.72) !important;
  outline-offset: 2px !important;
}

/* Main navigation text links: softer, rounded keyboard focus. */
.nav > a[href]:not(.btn-register):focus-visible {
  outline: 1px solid rgba(20, 82, 62, 0.58) !important;
  outline-offset: 3px !important;
  border-radius: 6px;
}

/* Brand logo: match the same soft keyboard-focus language. */
.logo:focus-visible {
  outline: 1px solid rgba(20, 82, 62, 0.58) !important;
  outline-offset: 3px !important;
  border-radius: 8px;
}

/* Back-navigation links: precise rounded keyboard focus without layout shift. */
a.back-link,
a.results-back-link,
a.manual-back {
  position: relative;
}

/* Keep back-navigation links clean on mouse hover across the project. */
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
    @media (max-width: 600px) {
      .nav {
        gap: 8px;
        align-items: flex-start;
      }

      .nav a,
      .nav button {
        font-size: 14px;
      }

      .nav-account-link {
        gap: 5px;
      }

      .logout-link {
        padding: 10px 16px;
      }
    }
  `;
  document.head.appendChild(style);
}

function navGetMobileMenuLabel() {
  const translated = navTranslate(
    "nav.menu",
    ""
  );

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

function navSetMobileMenuOpen(
  nav,
  button,
  isOpen
) {
  nav.classList.toggle(
    "is-mobile-open",
    isOpen
  );
  button.setAttribute(
    "aria-expanded",
    isOpen ? "true" : "false"
  );
}

function navEnsureMobileMenuButton(nav) {
  const headerContainer = nav.closest(
    ".header, .header-inner"
  );

  if (!headerContainer) {
    return null;
  }

  let button = headerContainer.querySelector(
    ".shared-mobile-menu-button"
  );

  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className =
      "shared-mobile-menu-button";
    button.setAttribute(
      "aria-controls",
      nav.id || "mainNav"
    );
    button.setAttribute(
      "aria-expanded",
      "false"
    );
    button.innerHTML = `
      <span class="shared-mobile-menu-icon" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
      <span class="shared-mobile-menu-label"></span>
    `;

    headerContainer.insertBefore(
      button,
      nav
    );
  }

  const label = button.querySelector(
    ".shared-mobile-menu-label"
  );

  if (label) {
    label.textContent =
      navGetMobileMenuLabel();
  }

  return button;
}

function navSetupSharedMobileNavigation(nav) {
  const button = navEnsureMobileMenuButton(nav);

  if (!button) {
    return;
  }

  if (
    button.dataset.mobileNavigationBound ===
    "true"
  ) {
    return;
  }

  const headerContainer = button.closest(
    ".header, .header-inner"
  );
  const mobileQuery = window.matchMedia(
    "(max-width: 1100px)"
  );

  function closeMobileMenu() {
    navSetMobileMenuOpen(
      nav,
      button,
      false
    );
  }

  button.addEventListener(
    "click",
    function (event) {
      event.stopPropagation();

      const isOpen =
        button.getAttribute(
          "aria-expanded"
        ) === "true";

      navSetMobileMenuOpen(
        nav,
        button,
        !isOpen
      );
    }
  );

  nav.addEventListener(
    "click",
    function (event) {
      if (!mobileQuery.matches) {
        return;
      }

      if (event.target.closest("a")) {
        closeMobileMenu();
      }
    }
  );

  document.addEventListener(
    "click",
    function (event) {
      if (
        !mobileQuery.matches ||
        !nav.classList.contains(
          "is-mobile-open"
        )
      ) {
        return;
      }

      if (
        headerContainer &&
        headerContainer.contains(
          event.target
        )
      ) {
        return;
      }

      closeMobileMenu();
    }
  );

  document.addEventListener(
    "keydown",
    function (event) {
      if (
        event.key !== "Escape" ||
        !nav.classList.contains(
          "is-mobile-open"
        )
      ) {
        return;
      }

      closeMobileMenu();
      button.focus();
    }
  );

  const handleViewportChange =
    function (event) {
      if (!event.matches) {
        closeMobileMenu();
      }
    };

  if (
    typeof mobileQuery.addEventListener ===
    "function"
  ) {
    mobileQuery.addEventListener(
      "change",
      handleViewportChange
    );
  } else if (
    typeof mobileQuery.addListener ===
    "function"
  ) {
    mobileQuery.addListener(
      handleViewportChange
    );
  }

  button.dataset.mobileNavigationBound =
    "true";
}

function navEnableFocusInputTracking() {
  const root = document.documentElement;

  document.addEventListener(
    "keydown",
    function (event) {
      if (event.key === "Tab") {
        root.dataset.focusInput = "keyboard";
      }
    },
    true
  );

  document.addEventListener(
    "pointerdown",
    function () {
      root.dataset.focusInput = "pointer";
    },
    true
  );
}

function renderSharedBranding() {
  const logoTextTitle =
    document.querySelector(
      ".logo-text strong"
    );

  if (logoTextTitle) {
    logoTextTitle.textContent = "Rentulo";
  }

  const logoTextSubtitle =
    document.querySelector(
      ".logo-text small"
    );

  if (logoTextSubtitle) {
    logoTextSubtitle.remove();
  }

  const logoTitle =
    document.querySelector(".logo-title");

  if (logoTitle) {
    logoTitle.textContent = "Rentulo";
  }
  const logoSubtitle =
    document.querySelector(
      ".logo-subtitle"
    );

  if (logoSubtitle) {
    logoSubtitle.remove();
  }
}

function navClearLocalLogin() {
  if (
    typeof clearCurrentUser === "function"
  ) {
    clearCurrentUser();
  }

  localStorage.removeItem(
    "rentuloLoggedIn"
  );

  localStorage.removeItem(
    "rentuloUser"
  );

  localStorage.removeItem(
    "rentuloRememberLogin"
  );
}

async function navLogoutUser() {
  const supabaseClient =
    navGetSupabaseClient();
  if (
    supabaseClient &&
    supabaseClient.auth &&
    typeof supabaseClient.auth.signOut ===
      "function"
  ) {
    try {
      await supabaseClient.auth.signOut();
    } catch (error) {
      console.warn(
        "Supabase odhlášení se nepodařilo, pokračuji lokálním odhlášením.",
        error
      );
    }
  }

  navClearLocalLogin();

  window.location.href = "index.html";
}

async function navLoadNotificationCountFromSupabase(
  activePage
) {
  const currentUser = navGetCurrentUser();
  if (
    !currentUser ||
    typeof apiGetReservations !==
      "function"
  ) {
    return;
  }

  const reservations =
    await apiGetReservations();

  if (!Array.isArray(reservations)) {
    return;
  }

  const userId = String(
    currentUser.id || ""
  );

  const userEmail =
    navNormalizeEmail(
      navGetUserEmail(currentUser)
    );
  const notificationCount =
    reservations.filter(function (
      reservation
    ) {
      const ownerId = String(
        reservation.ownerId ||
        reservation.owner_id ||
        ""
      );

      const renterId = String(
        reservation.renterId ||
        reservation.renter_id ||
        ""
      );

      const renterEmail =
        navNormalizeEmail(
          reservation.renterEmail ||
          reservation.renter_email ||
          ""
        );
      const status =
        navGetReservationStatus(
          reservation
        );

      const ownerNeedsAction =
        ownerId === userId &&
        navRequiresOwnerAction(status);

      const renterNeedsPayment =
        (
          renterId === userId ||
          renterEmail === userEmail
        ) &&
        navIsReservationWaitingForPayment(
          status
        );

      return (
        ownerNeedsAction ||
        renterNeedsPayment
      );
    }).length;
  window.rentuloAccountNotificationCount =
    notificationCount;

  renderSharedNavigation(activePage);
}

window.refreshRentuloNotificationBadge = async function () {
  const activePage =
    document.body.dataset.navigationPage || "";

  if (!activePage) {
    return;
  }

  await navLoadNotificationCountFromSupabase(
    activePage
  );
};

function renderSharedNavigation(
  activePage
) {
  renderSharedBranding();
  navEnsureLanguageStyles();
  const nav =
    document.getElementById("mainNav") ||
    document.querySelector(".nav");

  if (!nav) {
    return;
  }

  navInjectStyles();

  const currentUser =
    navGetCurrentUser();

  const storedNotificationCount = Number(
    window.rentuloAccountNotificationCount
  );

  const notificationCount = Number.isFinite(
    storedNotificationCount
  )
    ? storedNotificationCount
    : navGetNotificationCount();
  const accountBadge =
    notificationCount > 0
      ? `
        <span class="nav-notification-badge">
          ${
            notificationCount > 99
              ? "99+"
              : notificationCount
          }
        </span>
      `
      : "";

  const isHowActive =
    activePage === "jak-to-funguje"
      ? "active-link"
      : "";

  const isResultsActive =
    activePage === "vysledky"
      ? "active-link"
      : "";
  const isOfferActive =
    activePage === "nabidnout"
      ? "active-link"
      : "";

  const isAccountActive =
    activePage === "muj-ucet"
      ? "active-link"
      : "";

  const isLoginActive =
    activePage === "prihlaseni"
      ? "active-link"
      : "";

  const isRegisterActive =
    activePage === "registrace"
      ? "active-link"
      : "";

  const howItWorksText =
    navTranslate(
      "nav.howItWorks",
      "Jak to funguje"
    );
  const browseText =
    navTranslate(
      "nav.browse",
      "Prohlédnout nabídky"
    );

  const offerText =
    navTranslate(
      "nav.offer",
      "Nabídnout cokoli"
    );

  const accountText =
    navTranslate(
      "nav.account",
      "Můj účet"
    );

  const loginText =
    navTranslate(
      "nav.login",
      "Přihlásit se"
    );

  const logoutText =
    navTranslate(
      "nav.logout",
      "Odhlásit se"
    );
  const registerText =
    navTranslate(
      "nav.register",
      "Registrovat se"
    );

  if (currentUser) {
    nav.innerHTML = `
      <a
        href="jak-to-funguje.html"
        class="${isHowActive}"
      >
        ${howItWorksText}
      </a>

      <a
        href="vysledky.html"
        class="${isResultsActive}"
      >
        ${browseText}
      </a>

      <a
        href="nabidnout.html"
        class="${isOfferActive}"
      >
        ${offerText}
      </a>
      <a
        href="muj-ucet.html"
        class="nav-account-link ${isAccountActive}"
      >
        ${accountText}
        ${accountBadge}
      </a>

      <a
        href="#"
        class="btn-register logout-link"
        id="sharedLogoutBtn"
      >
        ${logoutText}
      </a>

      ${navLanguageControl()}
    `;
  } else {
    nav.innerHTML = `
      <a
        href="jak-to-funguje.html"
        class="${isHowActive}"
      >
        ${howItWorksText}
      </a>
      <a
        href="vysledky.html"
        class="${isResultsActive}"
      >
        ${browseText}
      </a>

      <a
        href="nabidnout.html"
        class="${isOfferActive}"
      >
        ${offerText}
      </a>

      <a
        href="prihlaseni.html"
        class="${isLoginActive}"
      >
        ${loginText}
      </a>

      <a
        href="registrace.html"
        class="btn-register ${isRegisterActive}"
      >
        ${registerText}
      </a>
      ${navLanguageControl()}
    `;
  }

  navSetupSharedMobileNavigation(nav);

  const logoutButton =
    document.getElementById(
      "sharedLogoutBtn"
    );

  if (logoutButton) {
    logoutButton.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        navLogoutUser();
      }
    );
  }

  const languageButton = document.getElementById("sharedLanguageButton");
  const languageMenu = document.getElementById("sharedLanguageMenu");
  if (languageButton && languageMenu) {
    const closeLanguageMenu = function () {
      languageMenu.hidden = true;
      languageButton.setAttribute("aria-expanded", "false");
    };

    languageButton.addEventListener("click", function (event) {
      event.stopPropagation();
      const willOpen = languageMenu.hidden;
      languageMenu.hidden = !willOpen;
      languageButton.setAttribute("aria-expanded", String(willOpen));
    });
    languageMenu.addEventListener("click", function (event) {
      const option = event.target.closest("[data-language]");
      if (!option) {
        return;
      }

      const language = option.dataset.language;
      closeLanguageMenu();

      if (typeof window.setRentuloLanguage === "function") {
        window.setRentuloLanguage(language);
      } else {
        localStorage.setItem("rentuloLanguage", language);
        window.location.reload();
      }
      navSavePreferredLanguage(language);
    });

    document.addEventListener("click", closeLanguageMenu);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeLanguageMenu();
        languageButton.focus();
      }
    });
  }
}

function navGetSameOriginReferrerUrl() {
  if (!document.referrer) {
    return null;
  }

  try {
    const referrerUrl = new URL(
      document.referrer,
      window.location.href
    );
    const currentUrl = new URL(
      window.location.href
    );

    if (
      referrerUrl.origin !== currentUrl.origin ||
      referrerUrl.href === currentUrl.href
    ) {
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
  const existingState =
    window.history.state && typeof window.history.state === "object"
      ? window.history.state
      : {};

  if (existingState.rentuloBackUrl || !referrerUrl) {
    return;
  }

  try {
    window.history.replaceState(
      Object.assign({}, existingState, {
        rentuloBackUrl: referrerUrl
      }),
      document.title,
      window.location.href
    );
  } catch (error) {
    // The normal href fallback remains available if History state cannot be updated.
  }
}

function navCanUseContextBack() {
  const stateBackUrl =
    window.history &&
    window.history.state &&
    typeof window.history.state === "object"
      ? window.history.state.rentuloBackUrl
      : "";
  const backUrl =
    stateBackUrl || navGetSameOriginReferrerUrl();

  return Boolean(
    backUrl &&
      window.history &&
      window.history.length > 1
  );
}

function navSetupContextBackLinks() {
  navRememberContextBackUrl();

  document
    .querySelectorAll('a[data-rentulo-back="true"]')
    .forEach(function (link) {
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
  const page =
    document.body.dataset.navigationPage;

  if (!page) {
    return;
  }

  navEnableFocusInputTracking();
  navSetupContextBackLinks();
  await navGetVerifiedUser();
  renderSharedNavigation(page);
  navLoadNotificationCountFromSupabase(page);

  const supabaseClient = navGetSupabaseClient();

  if (
    !navAuthListenerRegistered &&
    supabaseClient &&
    supabaseClient.auth &&
    typeof supabaseClient.auth.onAuthStateChange ===
      "function"
  ) {
    navAuthListenerRegistered = true;
    supabaseClient.auth.onAuthStateChange(
      function (_event, session) {
        navVerifiedUser =
          session && session.user
            ? session.user
            : null;
        navAuthPromise = Promise.resolve(
          navVerifiedUser
        );
        window.rentuloAccountNotificationCount = 0;
        renderSharedNavigation(page);

        if (navVerifiedUser) {
          navLoadNotificationCountFromSupabase(
            page
          );
        }
      }
    );
  }
}
document.addEventListener(
  "rentuloLanguageChanged",
  function () {
    const page =
      document.body.dataset.navigationPage;

    if (page) {
      renderSharedNavigation(page);
    }
  }
);

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeSharedNavigation
  );
} else {
  initializeSharedNavigation();
}
