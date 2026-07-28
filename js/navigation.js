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

function navLanguageControl() {
  const language = navGetLanguage();
  const label = navTranslate("nav.language", "Jazyk");

  return `
    <label class="nav-language-control" title="${label}">
      <span class="nav-language-label">${label}</span>
      <select id="sharedLanguageSelect" aria-label="${label}">
        <option value="cs"${language === "cs" ? " selected" : ""}>CZ</option>
        <option value="en"${language === "en" ? " selected" : ""}>EN</option>
        <option value="de"${language === "de" ? " selected" : ""}>DE</option>
      </select>
    </label>
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
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .nav-language-label {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    .nav-language-control select {
      min-width: 58px;
      height: 36px;
      padding: 0 24px 0 10px;
      border: 1px solid rgba(7, 63, 46, 0.22);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.78);
      color: #073f2e;
      font: inherit;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
    }
    .nav-language-control select:focus {
      outline: 2px solid rgba(0, 107, 69, 0.2);
      outline-offset: 2px;
    }
    @media (max-width: 760px) {
      .nav-language-control select {
        height: 34px;
      }
    }
  `;
  document.head.appendChild(style);
}

async function navSavePreferredLanguage(language) {
  const client = navGetSupabaseClient();
  const user = navGetCurrentUser();

  if (!client || !user || !user.id) {
    return;
  }

  const { error } = await client
    .from("profiles")
    .update({
      preferred_language: language,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (error) {
    console.warn("Jazyk se nepodařilo uložit do profilu.", error);
  }
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
      background: #ff6500;
      color: white;
      font-size: 12px;
      line-height: 18px;
      font-weight: 800;
      text-align: center;
    }

    .nav-account-link:hover
    .nav-notification-badge {
      background: #df5b00;
    }

    .logout-link {
      cursor: pointer;
    }

    .logout-link:hover {
      background: #00563a;
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

  const languageSelect = document.getElementById("sharedLanguageSelect");

  if (languageSelect) {
    languageSelect.addEventListener("change", function () {
      const language = languageSelect.value;

      if (typeof window.setRentuloLanguage === "function") {
        window.setRentuloLanguage(language);
      } else {
        localStorage.setItem("rentuloLanguage", language);
      }

      navSavePreferredLanguage(language);
    });
  }
}

async function initializeSharedNavigation() {
  const page =
    document.body.dataset.navigationPage;

  if (!page) {
    return;
  }

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