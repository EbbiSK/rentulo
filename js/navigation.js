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

function navIsLoggedIn() {
  return localStorage.getItem("rentuloLoggedIn") === "true";
}

function navGetCurrentUser() {
  const rentuloUser = navLoadJson("rentuloUser", null);

  if (!navIsLoggedIn()) {
    return null;
  }

  return rentuloUser || null;
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
        secondaryItem.naradiId ||
        secondaryItem.reservationId ||
        ""
      );

      const alreadyExists = mergedItems.some(function (item) {
        const itemId = String(
          item.id ||
          item.offerId ||
          item.naradiId ||
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
  if (typeof getOffers === "function") {
    return getOffers();
  }

  const rentuloOffers = navLoadJson("rentuloOffers", []);
  const oldNaradiOffers = navLoadJson("naradiNabidky", []);

  return navMergeById(rentuloOffers, oldNaradiOffers);
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
    tool.naradiId ||
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
    reservation.naradiId ||
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

  const normalizedStatus = String(status || "pending").trim().toLowerCase();

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
  const normalizedStatus = navNormalizeReservationStatus(status);

  return normalizedStatus === "approved";
}

function navRequiresOwnerAction(status) {
  const normalizedStatus = navNormalizeReservationStatus(status);

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

  const userEmail = navNormalizeEmail(navGetUserEmail(currentUser));

  if (!userEmail) {
    return 0;
  }

  const tools = navGetTools();
  const reservations = [];

  const myToolIds = tools
    .filter(function (tool) {
      return navNormalizeEmail(navGetToolOwnerEmail(tool)) === userEmail;
    })
    .map(function (tool) {
      return String(navGetToolId(tool));
    });

  const ownerActionRequests = reservations.filter(function (reservation) {
    const reservationToolId = navGetReservationToolId(reservation);
    const status = navGetReservationStatus(reservation);

    return (
      myToolIds.includes(String(reservationToolId)) &&
      navRequiresOwnerAction(status)
    );
  }).length;

  const renterWaitingForPayment = reservations.filter(function (reservation) {
    const renterEmail = navNormalizeEmail(navGetReservationRenterEmail(reservation));
    const status = navGetReservationStatus(reservation);

    return (
      renterEmail === userEmail &&
      navIsReservationWaitingForPayment(status)
    );
  }).length;

  return ownerActionRequests + renterWaitingForPayment;
}

function navInjectStyles() {
  if (document.getElementById("sharedNavigationStyles")) {
    return;
  }

  const style = document.createElement("style");
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

    .nav-account-link:hover .nav-notification-badge {
      background: #df5b00;
    }

    .logout-link {
      cursor: pointer;
    }

    .logout-link:hover {
      background: #00563a;
    }
  `;

  document.head.appendChild(style);
}

function renderSharedBranding() {
  const logoTextTitle = document.querySelector(".logo-text strong");

  if (logoTextTitle) {
    logoTextTitle.textContent = "Rentulo";
  }

  const logoTextSubtitle = document.querySelector(".logo-text small");

  if (logoTextSubtitle) {
    logoTextSubtitle.textContent = "Sousedská půjčovna nářadí";
  }

  const logoTitle = document.querySelector(".logo-title");

  if (logoTitle) {
    logoTitle.textContent = "Rentulo";
  }

  const logoSubtitle = document.querySelector(".logo-subtitle");

  if (logoSubtitle) {
    logoSubtitle.textContent = "Sousedská půjčovna nářadí";
  }

  if (document.title) {
    document.title = document.title.replaceAll("Nářadí od sousedů", "Rentulo");
  }
}

function navClearLocalLogin() {
  if (typeof clearCurrentUser === "function") {
    clearCurrentUser();
  }

  localStorage.removeItem("rentuloLoggedIn");
  localStorage.removeItem("rentuloUser");
  localStorage.removeItem("rentuloRememberLogin");

  localStorage.removeItem("naradiLoggedIn");
  localStorage.removeItem("naradiUser");
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

function renderSharedNavigation(activePage) {
  renderSharedBranding();

  const nav =
    document.getElementById("mainNav") ||
    document.querySelector(".nav");

  if (!nav) {
    return;
  }

  navInjectStyles();

  const currentUser = navGetCurrentUser();
  const notificationCount = navGetNotificationCount();

  const accountBadge = notificationCount > 0
    ? `<span class="nav-notification-badge">${notificationCount > 99 ? "99+" : notificationCount}</span>`
    : "";

  const isHowActive = activePage === "jak-to-funguje" ? "active-link" : "";
  const isResultsActive = activePage === "vysledky" ? "active-link" : "";
  const isOfferActive = activePage === "nabidnout" ? "active-link" : "";
  const isAccountActive = activePage === "muj-ucet" ? "active-link" : "";
  const isLoginActive = activePage === "prihlaseni" ? "active-link" : "";
  const isRegisterActive = activePage === "registrace" ? "active-link" : "";

  if (currentUser) {
    nav.innerHTML = `
      <a href="jak-to-funguje.html" class="${isHowActive}">Jak to funguje</a>
      <a href="vysledky.html" class="${isResultsActive}">Prohlédnout nabídky</a>
      <a href="nabidnout.html" class="${isOfferActive}">Nabídnout nářadí</a>
      <a href="muj-ucet.html" class="nav-account-link ${isAccountActive}">
        Můj účet
        ${accountBadge}
      </a>
      <a href="#" class="btn-register logout-link" id="sharedLogoutBtn">Odhlásit se</a>
    `;
  } else {
    nav.innerHTML = `
      <a href="jak-to-funguje.html" class="${isHowActive}">Jak to funguje</a>
      <a href="vysledky.html" class="${isResultsActive}">Prohlédnout nabídky</a>
      <a href="nabidnout.html" class="${isOfferActive}">Nabídnout nářadí</a>
      <a href="prihlaseni.html" class="${isLoginActive}">Přihlásit se</a>
      <a href="registrace.html" class="btn-register ${isRegisterActive}">Registrovat se</a>
    `;
  }

  const logoutButton = document.getElementById("sharedLogoutBtn");

  if (logoutButton) {
    logoutButton.addEventListener("click", function (event) {
      event.preventDefault();
      navLogoutUser();
    });
  }
}