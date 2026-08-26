(function () {
  const ACCOUNT_LOCALES = {
    cs: "cs-CZ",
    en: "en-GB",
    de: "de-DE",
    pl: "pl-PL"
  };

  let verifiedAccountUser = null;
  let accountLoadState = "idle";
  let supabaseOffers = [];
  let ownerReservations = [];
  let renterReservations = [];
  let accountNotifications = [];

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

  function plural(prefix, count, fallbacks, replacements) {
    const category = new Intl.PluralRules(currentLocale()).select(Number(count));
    const supported = ["one", "few", "many", "other"].includes(category)
      ? category
      : "other";
    const suffix = supported.charAt(0).toUpperCase() + supported.slice(1);

    return t(
      prefix + suffix,
      fallbacks[supported] || fallbacks.other || "",
      Object.assign({}, replacements || {}, { count: formatNumber(count) })
    );
  }

  function normalizeStatus(status) {
    if (typeof normalizeReservationStatus === "function") {
      return normalizeReservationStatus(status);
    }

    return String(status || "").trim();
  }

  function isOpen(status) {
    if (typeof isOpenReservationStatus === "function") {
      return isOpenReservationStatus(status);
    }

    return ["pending", "approved", "paid", "picked_up"].includes(normalizeStatus(status));
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
      t("account.userFallback", "Uživatel")
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
      console.warn("Profil uživatele se nepodařilo načíst:", error);
      return null;
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

  async function renderProfile(user) {
    const profile = await loadProfile(user);
    const rating = await loadRating(user);
    const name = (profile && profile.full_name) || fallbackUserName(user);
    const email = (profile && profile.email) || (user && user.email) || "";

    const nameElement = document.getElementById("profileName");
    const emailElement = document.getElementById("profileEmail");
    const avatarElement = document.getElementById("profileAvatar");
    const ratingElement = document.getElementById("profileRating");

    if (nameElement) nameElement.textContent = name;
    if (emailElement) {
      emailElement.textContent = email || t("account.emailMissing", "E-mail není uložen");
    }
    if (avatarElement) {
      avatarElement.textContent = String(name || "U").trim().charAt(0).toUpperCase() || "U";
    }

    if (!ratingElement) return;

    if (rating && Number(rating.rating_count) > 0) {
      ratingElement.textContent = plural(
        "account.rating",
        Number(rating.rating_count),
        {
          one: "Hodnocení: ⭐ {average} / 5 ({count} hodnocení)",
          few: "Hodnocení: ⭐ {average} / 5 ({count} hodnocení)",
          many: "Hodnocení: ⭐ {average} / 5 ({count} hodnocení)",
          other: "Hodnocení: ⭐ {average} / 5 ({count} hodnocení)"
        },
        {
          average: formatNumber(rating.average_rating, { maximumFractionDigits: 1 })
        }
      );
      return;
    }

    ratingElement.textContent = t("account.ratingNone", "Hodnocení: zatím bez hodnocení");
  }

  function normalizeOffer(row) {
    return {
      id: row.id,
      name: row.name || t("account.itemFallback", "Věc k půjčení"),
      status: row.status || "active"
    };
  }

  function normalizeReservation(row) {
    return {
      id: row.id,
      ownerId: row.owner_id,
      renterId: row.renter_id,
      offerId: row.offer_id,
      offerName: row.offer_name || t("account.itemFallback", "Věc k půjčení"),
      status: normalizeStatus(row.status),
      createdAt: row.created_at || "",
      updatedAt: row.updated_at || row.created_at || ""
    };
  }

  async function loadAccountData() {
    accountLoadState = "loading";
    renderLoadState();

    const client = getSupabaseClient();
    const user = verifiedAccountUser || await getCurrentUser();

    if (!client || !user) {
      accountLoadState = "error";
      renderLoadState();
      return false;
    }

    const [offersResult, reservationsResult] = await Promise.all([
      client
        .from("offers")
        .select("id, name, status")
        .eq("owner_id", user.id)
        .neq("status", "deleted"),
      client.rpc("get_my_reservations")
    ]);

    if (offersResult.error || reservationsResult.error) {
      console.error(offersResult.error || reservationsResult.error);
      accountLoadState = "error";
      renderLoadState();
      return false;
    }

    supabaseOffers = Array.isArray(offersResult.data)
      ? offersResult.data.map(normalizeOffer)
      : [];

    const allReservations = Array.isArray(reservationsResult.data)
      ? reservationsResult.data.map(normalizeReservation)
      : [];

    ownerReservations = allReservations.filter(function (reservation) {
      return reservation.ownerId === user.id;
    });

    renterReservations = allReservations.filter(function (reservation) {
      return reservation.renterId === user.id;
    });

    accountLoadState = "ready";
    renderLoadState();
    return true;
  }

  function setBadge(element, count) {
    if (!element) return;

    if (count > 0) {
      element.hidden = false;
      element.textContent = formatNumber(count);
      return;
    }

    element.hidden = true;
    element.textContent = "0";
  }

  function setCardState(card, badge, description, count, urgent, text) {
    if (card) card.classList.toggle("is-urgent", Boolean(urgent));
    setBadge(badge, count);
    if (description && text) description.textContent = text;
  }

  function renderAccountCards() {
    const reservationsCard = document.getElementById("reservationsCard");
    const offersCard = document.getElementById("offersCard");
    const reservationsBadge = document.getElementById("reservationsBadge");
    const offersBadge = document.getElementById("offersBadge");
    const reservationsText = document.getElementById("reservationsText");
    const offersText = document.getElementById("offersText");

    const activeReservations = renterReservations.filter(function (reservation) {
      return isOpen(reservation.status);
    });

    const waitingPaymentCount = renterReservations.filter(function (reservation) {
      return reservation.status === "approved";
    }).length;

    const pendingRequestsCount = ownerReservations.filter(function (reservation) {
      return reservation.status === "pending";
    }).length;

    const paidRequestsCount = ownerReservations.filter(function (reservation) {
      return reservation.status === "paid";
    }).length;

    const pickedUpRequestsCount = ownerReservations.filter(function (reservation) {
      return reservation.status === "picked_up";
    }).length;

    const ownerActionCount = pendingRequestsCount + paidRequestsCount + pickedUpRequestsCount;

    let reservationsDescription = t("account.reservationsDefault", "Co si chci půjčit");

    if (waitingPaymentCount > 0) {
      reservationsDescription = plural(
        "account.dynamic.waitingPayment",
        waitingPaymentCount,
        {
          one: "1 rezervace čeká na platbu",
          few: "{count} rezervace čekají na platbu",
          many: "{count} rezervací čeká na platbu",
          other: "{count} rezervací čeká na platbu"
        }
      );
    } else if (activeReservations.length > 0) {
      reservationsDescription = plural(
        "account.dynamic.activeReservation",
        activeReservations.length,
        {
          one: "Máte 1 aktivní rezervaci",
          few: "Máte {count} aktivní rezervace",
          many: "Máte {count} aktivních rezervací",
          other: "Máte {count} aktivních rezervací"
        }
      );
    }

    setCardState(
      reservationsCard,
      reservationsBadge,
      reservationsText,
      waitingPaymentCount,
      waitingPaymentCount > 0,
      reservationsDescription
    );

    let offersDescription = t("account.offersDefault", "Co nabízím a žádosti od lidí");

    if (pendingRequestsCount > 0) {
      offersDescription = plural(
        "account.dynamic.pendingRequest",
        pendingRequestsCount,
        {
          one: "Máte 1 novou žádost k potvrzení",
          few: "Máte {count} nové žádosti k potvrzení",
          many: "Máte {count} nových žádostí k potvrzení",
          other: "Máte {count} nových žádostí k potvrzení"
        }
      );
    } else if (paidRequestsCount > 0) {
      offersDescription = plural(
        "account.dynamic.paidRequest",
        paidRequestsCount,
        {
          one: "1 rezervace je zaplacená, označte vyzvednutí",
          few: "{count} rezervace jsou zaplacené, označte vyzvednutí",
          many: "{count} rezervací je zaplacených, označte vyzvednutí",
          other: "{count} rezervací je zaplacených, označte vyzvednutí"
        }
      );
    } else if (pickedUpRequestsCount > 0) {
      offersDescription = plural(
        "account.dynamic.pickedUp",
        pickedUpRequestsCount,
        {
          one: "1 půjčení probíhá, po vrácení ho uzavřete",
          few: "{count} půjčení probíhají, po vrácení je uzavřete",
          many: "{count} půjčení probíhá, po vrácení je uzavřete",
          other: "{count} půjčení probíhá, po vrácení je uzavřete"
        }
      );
    } else if (supabaseOffers.length > 0) {
      offersDescription = plural(
        "account.dynamic.myOffer",
        supabaseOffers.length,
        {
          one: "Máte 1 vlastní nabídku",
          few: "Máte {count} vlastní nabídky",
          many: "Máte {count} vlastních nabídek",
          other: "Máte {count} vlastních nabídek"
        }
      );
    }

    setCardState(
      offersCard,
      offersBadge,
      offersText,
      ownerActionCount,
      ownerActionCount > 0,
      offersDescription
    );

    window.rentuloAccountNotificationCount = waitingPaymentCount + ownerActionCount;

    if (typeof renderSharedNavigation === "function") {
      renderSharedNavigation("muj-ucet");
    }
  }

  function notificationStorageKey() {
    const userId = verifiedAccountUser && verifiedAccountUser.id
      ? verifiedAccountUser.id
      : "anonymous";

    return "rentuloAccountReadNotifications:" + userId;
  }

  function getReadNotificationKeys() {
    try {
      const parsed = JSON.parse(localStorage.getItem(notificationStorageKey()) || "[]");
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      return new Set();
    }
  }

  function saveReadNotificationKeys(keys) {
    try {
      localStorage.setItem(notificationStorageKey(), JSON.stringify(Array.from(keys)));
    } catch (error) {
      console.warn("Stav upozornění se nepodařilo uložit:", error);
    }
  }

  function makeNotificationKey(role, reservation) {
    return [role, reservation.id, reservation.status].join(":");
  }

  function notificationItemName(reservation) {
    return reservation.offerName || homeT("accountHome.notifications.itemFallback", "věci");
  }

  function buildNotifications() {
    const notifications = [];

    ownerReservations.forEach(function (reservation) {
      const item = notificationItemName(reservation);

      if (reservation.status === "pending") {
        notifications.push({
          key: makeNotificationKey("owner", reservation),
          title: homeT("accountHome.notifications.newRequestTitle", "Nová žádost o půjčení"),
          message: homeT(
            "accountHome.notifications.newRequestMessage",
            "Nabídka {item} čeká na vaše potvrzení.",
            { item: item }
          ),
          href: "moje-nabidky.html?open=actions",
          sortDate: reservation.updatedAt || reservation.createdAt || ""
        });
      } else if (reservation.status === "paid") {
        notifications.push({
          key: makeNotificationKey("owner", reservation),
          title: homeT("accountHome.notifications.paidOwnerTitle", "Rezervace byla zaplacena"),
          message: homeT(
            "accountHome.notifications.paidOwnerMessage",
            "U nabídky {item} můžete pokračovat předáním.",
            { item: item }
          ),
          href: "moje-nabidky.html?open=actions",
          sortDate: reservation.updatedAt || reservation.createdAt || ""
        });
      } else if (reservation.status === "picked_up") {
        notifications.push({
          key: makeNotificationKey("owner", reservation),
          title: homeT("accountHome.notifications.pickedUpOwnerTitle", "Věc byla vyzvednuta"),
          message: homeT(
            "accountHome.notifications.pickedUpOwnerMessage",
            "Po vrácení {item} označte rezervaci jako vrácenou.",
            { item: item }
          ),
          href: "moje-nabidky.html?open=actions",
          sortDate: reservation.updatedAt || reservation.createdAt || ""
        });
      } else if (reservation.status === "cancelled") {
        notifications.push({
          key: makeNotificationKey("owner", reservation),
          title: homeT("accountHome.notifications.cancelledTitle", "Rezervace byla zrušena"),
          message: homeT(
            "accountHome.notifications.cancelledMessage",
            "Rezervace {item} byla zrušena.",
            { item: item }
          ),
          href: "historie.html",
          sortDate: reservation.updatedAt || reservation.createdAt || ""
        });
      }
    });

    renterReservations.forEach(function (reservation) {
      const item = notificationItemName(reservation);
      const common = {
        key: makeNotificationKey("renter", reservation),
        href: "moje-rezervace.html",
        sortDate: reservation.updatedAt || reservation.createdAt || ""
      };

      if (reservation.status === "approved") {
        notifications.push(Object.assign({}, common, {
          title: homeT("accountHome.notifications.approvedTitle", "Žádost byla schválena"),
          message: homeT(
            "accountHome.notifications.approvedMessage",
            "Rezervaci {item} můžete nyní zaplatit.",
            { item: item }
          )
        }));
      } else if (reservation.status === "rejected") {
        notifications.push(Object.assign({}, common, {
          title: homeT("accountHome.notifications.rejectedTitle", "Žádost byla odmítnuta"),
          message: homeT(
            "accountHome.notifications.rejectedMessage",
            "Žádost o {item} byla odmítnuta.",
            { item: item }
          )
        }));
      } else if (reservation.status === "picked_up") {
        notifications.push(Object.assign({}, common, {
          title: homeT("accountHome.notifications.pickedUpRenterTitle", "Věc je vyzvednuta"),
          message: homeT(
            "accountHome.notifications.pickedUpRenterMessage",
            "Půjčení {item} právě probíhá.",
            { item: item }
          )
        }));
      } else if (reservation.status === "returned" || reservation.status === "completed") {
        notifications.push(Object.assign({}, common, {
          title: homeT("accountHome.notifications.returnedTitle", "Půjčení bylo dokončeno"),
          message: homeT(
            "accountHome.notifications.returnedMessage",
            "Rezervaci {item} najdete v Historii.",
            { item: item }
          ),
          href: "historie.html"
        }));
      }
    });

    notifications.sort(function (a, b) {
      return String(b.sortDate || "").localeCompare(String(a.sortDate || ""));
    });

    return notifications.slice(0, 20);
  }

  function renderNotifications() {
    const list = document.getElementById("accountNotificationList");
    const empty = document.getElementById("accountNotificationEmpty");
    const badge = document.getElementById("accountNotificationCount");

    if (!list || !empty || !badge) return;

    const readKeys = getReadNotificationKeys();
    const unreadCount = accountNotifications.filter(function (notification) {
      return !readKeys.has(notification.key);
    }).length;

    setBadge(badge, unreadCount);
    list.innerHTML = "";
    empty.hidden = accountNotifications.length > 0;

    accountNotifications.forEach(function (notification) {
      const link = document.createElement("a");
      link.className = "account-notification-item";
      link.href = notification.href;

      if (!readKeys.has(notification.key)) {
        link.classList.add("is-unread");
      }

      const title = document.createElement("strong");
      title.textContent = notification.title;

      const message = document.createElement("span");
      message.textContent = notification.message;

      link.appendChild(title);
      link.appendChild(message);
      list.appendChild(link);
    });
  }

  function markNotificationsRead() {
    if (!accountNotifications.length) return;

    const readKeys = getReadNotificationKeys();
    accountNotifications.forEach(function (notification) {
      readKeys.add(notification.key);
    });
    saveReadNotificationKeys(readKeys);
    renderNotifications();
  }

  function openNotificationPanel(open) {
    const button = document.getElementById("accountNotificationButton");
    const panel = document.getElementById("accountNotificationPanel");

    if (!button || !panel) return;

    const shouldOpen = typeof open === "boolean" ? open : panel.hidden;
    panel.hidden = !shouldOpen;
    button.setAttribute("aria-expanded", shouldOpen ? "true" : "false");

    if (shouldOpen) {
      markNotificationsRead();
    }
  }

  function bindNotificationPanel() {
    const button = document.getElementById("accountNotificationButton");
    const panel = document.getElementById("accountNotificationPanel");

    if (!button || !panel) return;

    button.addEventListener("click", function (event) {
      event.stopPropagation();
      openNotificationPanel();
    });

    panel.addEventListener("click", function (event) {
      event.stopPropagation();
    });

    document.addEventListener("click", function () {
      openNotificationPanel(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        openNotificationPanel(false);
        button.focus();
      }
    });
  }

  function refreshRenderedData() {
    renderAccountCards();
    accountNotifications = buildNotifications();
    renderNotifications();
  }

  async function initializeAccountPage() {
    if (!window.rentuloAuthGuard) {
      window.location.replace("prihlaseni.html");
      return;
    }

    const user = await window.rentuloAuthGuard.requireUser();
    if (!user) return;

    verifiedAccountUser = user;
    await renderProfile(user);

    if (typeof renderSharedNavigation === "function") {
      renderSharedNavigation("muj-ucet");
    }

    const loaded = await loadAccountData();
    if (!loaded) return;

    refreshRenderedData();
  }

  async function retryAccountDataLoad() {
    if (accountLoadState === "loading") return;

    const retry = document.getElementById("accountLoadRetry");
    if (retry) retry.disabled = true;

    const loaded = await loadAccountData();
    if (loaded) refreshRenderedData();
  }

  async function refreshAfterReturnToPage() {
    if (!verifiedAccountUser || document.visibilityState === "hidden") return;

    const loaded = await loadAccountData();
    if (loaded) refreshRenderedData();
  }

  document.addEventListener("rentuloLanguageChanged", async function () {
    renderLoadState();

    if (typeof window.renderAccountHomeTranslations === "function") {
      window.renderAccountHomeTranslations();
    }

    if (verifiedAccountUser) {
      await renderProfile(verifiedAccountUser);
    }

    if (accountLoadState === "ready") {
      refreshRenderedData();
    } else if (typeof renderSharedNavigation === "function") {
      renderSharedNavigation("muj-ucet");
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      refreshAfterReturnToPage();
    }
  });

  window.addEventListener("focus", refreshAfterReturnToPage);

  document.addEventListener("DOMContentLoaded", function () {
    const retry = document.getElementById("accountLoadRetry");
    if (retry) retry.addEventListener("click", retryAccountDataLoad);

    bindNotificationPanel();
    initializeAccountPage();
  });
})();
