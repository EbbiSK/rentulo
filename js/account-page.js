    const ACCOUNT_LOCALES = {
      cs: "cs-CZ",
      en: "en-GB",
      de: "de-DE",
      pl: "pl-PL"
    };

    let supabaseOffers = [];
    let supabaseOwnerReservations = [];
    let supabaseRenterReservations = [];
    let verifiedAccountUser = null;
    let accountLoadState = "idle";

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

    function normalizeAccountEmail(email) {
      return String(email || "").trim().toLowerCase();
    }

    function accountTranslate(key, fallback, replacements) {
      let text = typeof window.rentuloTranslate === "function"
        ? window.rentuloTranslate(key)
        : fallback;

      if (text === key) {
        text = fallback;
      }

      Object.keys(replacements || {}).forEach(function (name) {
        text = text.replaceAll("{" + name + "}", String(replacements[name]));
      });

      return text;
    }

    function getAccountLocale() {
      const language = typeof window.getRentuloLanguage === "function"
        ? window.getRentuloLanguage()
        : "cs";

      return ACCOUNT_LOCALES[language] || ACCOUNT_LOCALES.cs;
    }

    function formatAccountNumber(value, options) {
      const numberValue = Number(value);

      if (!Number.isFinite(numberValue)) {
        return String(value === undefined || value === null ? "" : value);
      }

      return numberValue.toLocaleString(getAccountLocale(), options);
    }

    function getAccountPluralText(prefix, count, fallbacks, replacements) {
      const pluralCategory = new Intl.PluralRules(getAccountLocale()).select(Number(count));
      const supportedCategory = ["one", "few", "many", "other"].includes(pluralCategory)
        ? pluralCategory
        : "other";
      const suffix = supportedCategory.charAt(0).toUpperCase() + supportedCategory.slice(1);
      const fallback = fallbacks[supportedCategory] || fallbacks.other || "";

      return accountTranslate(
        prefix + suffix,
        fallback,
        Object.assign({}, replacements || {}, {
          count: formatAccountNumber(count)
        })
      );
    }

    function renderAccountLoadState() {
      const status = document.getElementById("accountLoadStatus");
      const statusText = document.getElementById("accountLoadStatusText");
      const retryButton = document.getElementById("accountLoadRetry");

      if (!status || !statusText || !retryButton) {
        return;
      }

      status.classList.remove("hidden", "error");
      retryButton.hidden = true;
      retryButton.disabled = false;

      if (accountLoadState === "ready") {
        status.classList.add("hidden");
        return;
      }

      if (accountLoadState === "error") {
        status.classList.add("error");
        statusText.textContent = accountTranslate(
          "account.load.error",
          "Údaje účtu se teď nepodařilo načíst. Zkuste to znovu."
        );
        retryButton.textContent = accountTranslate(
          "account.load.retry",
          "Zkusit znovu"
        );
        retryButton.hidden = false;
        return;
      }

      statusText.textContent = accountTranslate(
        "account.load.loading",
        "Načítám údaje účtu..."
      );
      retryButton.disabled = true;
    }

    function normalizeStatus(status) {
  return normalizeReservationStatus(status);
}

    function isOpenStatus(status) {
  return isOpenReservationStatus(
    normalizeStatus(status)
  );
}

    function isOwnerActionStatus(status) {
  const normalizedStatus = normalizeStatus(status);

  return [
    RESERVATION_STATUS_PENDING,
    RESERVATION_STATUS_PAID,
    RESERVATION_STATUS_PICKED_UP
  ].includes(normalizedStatus);
}

    function isWaitingForPaymentStatus(status) {
      return normalizeStatus(status) === RESERVATION_STATUS_APPROVED;
    }

    function getUserNameSafe(user) {
      if (!user) {
        return accountTranslate("account.userFallback", "Uživatel");
      }

      const metadata = user.user_metadata || {};
      const profileName =
        user.fullName ||
        user.full_name ||
        user.name ||
        user.jmeno ||
        metadata.full_name ||
        metadata.name ||
        "";

      if (profileName) {
        return profileName;
      }

      if (typeof getUserName === "function") {
        const fallbackName = getUserName(user);
        const fallbackEmail = getUserEmailSafe(user);

        if (fallbackName && fallbackName !== fallbackEmail) {
          return fallbackName;
        }
      }

      return accountTranslate("account.userFallback", "Uživatel");
    }

    function getUserEmailSafe(user) {
      if (!user) {
        return "";
      }

      if (typeof getUserEmail === "function") {
        return getUserEmail(user);
      }

      return user.email || user.userEmail || user.mail || "";
    }

    async function loadCurrentUserProfile(user) {
      if (!user || !user.id) {
        return null;
      }

      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        return null;
      }

      const { data, error } = await supabaseClient
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        return null;
      }

      return data || null;
    }

async function loadCurrentUserRating(user) {
  if (!user || !user.id) {
    return null;
  }

  const supabaseClient = getSupabaseClient();

  if (!supabaseClient) {
    return null;
  }

  const { data, error } = await supabaseClient
    .from("user_rating_summary")
    .select("average_rating, rating_count")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("Hodnocení uživatele se nepodařilo načíst:", error);
    return null;
  }

  return data;
}
    async function updateProfileBox(user) {
      const profile = await loadCurrentUserProfile(user);
      const name =
        (profile && profile.full_name) ||
        getUserNameSafe(user);
      const email =
        (profile && profile.email) ||
        getUserEmailSafe(user);

      const greeting = document.getElementById("accountGreeting");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileRating = document.getElementById("profileRating");
const profileAvatar = document.getElementById("profileAvatar");

      if (greeting) {
        greeting.textContent =
  typeof window.rentuloTranslate === "function"
    ? window.rentuloTranslate("account.greeting")
    : "Dobrý den";
      }

      if (profileName) {
        profileName.textContent = name;
      }

      if (profileEmail) {
        profileEmail.textContent = email || accountTranslate(
          "account.emailMissing",
          "E-mail není uložen"
        );
      }
if (profileRating) {
        profileRating.textContent = accountTranslate(
          "account.ratingNone",
          "Hodnocení: zatím bez hodnocení"
        );

        const ratingSummary = await loadCurrentUserRating(user);

        if (ratingSummary && ratingSummary.rating_count) {
          profileRating.textContent = getAccountPluralText(
            "account.rating",
            Number(ratingSummary.rating_count),
            {
              one: "Hodnocení: ⭐ {average} / 5 ({count} hodnocení)",
              few: "Hodnocení: ⭐ {average} / 5 ({count} hodnocení)",
              many: "Hodnocení: ⭐ {average} / 5 ({count} hodnocení)",
              other: "Hodnocení: ⭐ {average} / 5 ({count} hodnocení)"
            },
            {
              average: formatAccountNumber(ratingSummary.average_rating, {
                maximumFractionDigits: 1
              })
            }
          );
        }
      }
      if (profileAvatar) {
        profileAvatar.textContent = name.charAt(0).toUpperCase();
      }
    }

    function setBadge(badge, count, isAlert) {
      if (!badge) {
        return;
      }

      if (count > 0) {
        badge.classList.remove("hidden");
        badge.textContent = count;

        if (isAlert) {
          badge.classList.add("alert");
        } else {
          badge.classList.remove("alert");
        }

        return;
      }

      badge.classList.add("hidden");
      badge.textContent = "0";
      badge.classList.remove("alert");
    }

    function normalizeSupabaseOffer(row) {
      return {
        id: row.id,
        ownerId: row.owner_id,
        ownerEmail: "",
       name: row.name || accountTranslate("account.itemFallback", "Věc k půjčení"),
category: row.category || accountTranslate("account.categoryFallback", "Ostatní"),
        city: row.city || "",
        price: Number(row.price_per_day || 0),
        status: row.status || "active",
        createdAt: row.created_at || "",
        source: "supabase"
      };
    }

    function normalizeSupabaseReservation(row) {
      return {
        id: row.id,
        reservationId: row.id,

        offerId: row.offer_id,
        toolId: row.offer_id,

        ownerId: row.owner_id,
        renterId: row.renter_id,

        offerName: row.offer_name || accountTranslate("account.itemFallback", "Věc k půjčení"),
        toolName: row.offer_name || accountTranslate("account.itemFallback", "Věc k půjčení"),

category: row.category || accountTranslate("account.categoryFallback", "Ostatní"),
        city: row.city || "",

        pricePerDay: Number(row.price_per_day || 0),
        price: Number(row.price_per_day || 0),

        startDate: row.start_date || row.date_from || "",
        endDate: row.end_date || row.date_to || "",
        dateFrom: row.start_date || row.date_from || "",
        dateTo: row.end_date || row.date_to || "",

        totalDays: Number(row.total_days || row.days || 0),
        days: Number(row.total_days || row.days || 0),
        totalPrice: Number(row.total_price || 0),

        platformFeePercent: Number(row.platform_fee_percent || 10),
        platformFeeAmount: Number(row.platform_fee_amount || 0),
        ownerPayout: Number(row.owner_payout || 0),

        renterName: row.renter_name || "",
        renterEmail: row.renter_email || "",
        renterPhone: row.renter_phone || "",

        ownerName: row.owner_name || accountTranslate("account.ownerFallback", "Majitel"),

        status: normalizeStatus(row.status || STATUS_PENDING),
        statusText: getStatusText(row.status || STATUS_PENDING),

        contactVisibleAfterPayment: Boolean(row.contact_visible_after_payment),

        createdAt: row.created_at || "",
        updatedAt: row.updated_at || "",

        source: "supabase"
      };
    }

    function getStatusText(status) {
  return getReservationStatusText(status);
}

    function mergeById(localItems, supabaseItems) {
      const merged = [];
      const usedIds = new Set();

      if (Array.isArray(supabaseItems)) {
        supabaseItems.forEach(function (item) {
          const id = String(item.id || item.reservationId || item.offerId || "");

          if (id) {
            usedIds.add(id);
          }

          merged.push(item);
        });
      }

      if (Array.isArray(localItems)) {
        localItems.forEach(function (item) {
          const id = String(item.id || item.reservationId || item.offerId || "");

          if (id && usedIds.has(id)) {
            return;
          }

          merged.push(item);
        });
      }

      return merged;
    }

    

    async function loadSupabaseAccountData() {
      accountLoadState = "loading";
      renderAccountLoadState();

      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        accountLoadState = "error";
        renderAccountLoadState();
        return false;
      }

      const supabaseUser = await getCurrentSupabaseUser();

      if (!supabaseUser) {
        accountLoadState = "error";
        renderAccountLoadState();
        return false;
      }

      const offersResult = await supabaseClient
        .from("offers")
        .select("id, owner_id, name, category, city, price_per_day, status, created_at")
        .eq("owner_id", supabaseUser.id)
        .neq("status", "deleted");

      if (offersResult.error) {
        console.error(offersResult.error);
        accountLoadState = "error";
        renderAccountLoadState();
        return false;
      }

      const reservationsResult = await supabaseClient
  .rpc("get_my_reservations");

if (reservationsResult.error) {
  console.error(reservationsResult.error);
  accountLoadState = "error";
  renderAccountLoadState();
  return false;
}

const allReservations = Array.isArray(reservationsResult.data)
  ? reservationsResult.data
  : [];

const ownerReservationsResult = {
  data: allReservations.filter(function (reservation) {
    return reservation.owner_id === supabaseUser.id;
  })
};

const renterReservationsResult = {
  data: allReservations.filter(function (reservation) {
    return reservation.renter_id === supabaseUser.id;
  })
};

      supabaseOffers = Array.isArray(offersResult.data)
        ? offersResult.data.map(normalizeSupabaseOffer)
        : [];

      supabaseOwnerReservations = Array.isArray(ownerReservationsResult.data)
        ? ownerReservationsResult.data.map(normalizeSupabaseReservation)
        : [];

      supabaseRenterReservations = Array.isArray(renterReservationsResult.data)
        ? renterReservationsResult.data.map(normalizeSupabaseReservation)
        : [];

      accountLoadState = "ready";
      renderAccountLoadState();

      return true;
    }

    function updateAccountActionBadgesFromSupabase() {
      const user = verifiedAccountUser;

      if (!user) {
        window.location.href = "prihlaseni.html";
        return;
      }

      const myOffers = supabaseOffers;
      const myReservations = supabaseRenterReservations;
      const incomingOpenRequests = supabaseOwnerReservations.filter(function (reservation) {
        return isOpenStatus(reservation.status);
      });

      const activeReservations = myReservations.filter(function (reservation) {
        return isOpenStatus(reservation.status);
      });

      const waitingPaymentCount = myReservations.filter(function (reservation) {
        return isWaitingForPaymentStatus(reservation.status);
      }).length;

      const pendingRequestsCount = supabaseOwnerReservations.filter(function (reservation) {
        return normalizeStatus(reservation.status) === RESERVATION_STATUS_PENDING;
      }).length;

      const paidRequestsCount = supabaseOwnerReservations.filter(function (reservation) {
        return normalizeStatus(reservation.status) === RESERVATION_STATUS_PAID;
      }).length;

      const pickedUpRequestsCount = supabaseOwnerReservations.filter(function (reservation) {
        return normalizeStatus(reservation.status) === RESERVATION_STATUS_PICKED_UP;
      }).length;

      const ownerActionRequiredCount =
        pendingRequestsCount +
        paidRequestsCount +
        pickedUpRequestsCount;

window.rentuloAccountNotificationCount =
  ownerActionRequiredCount + waitingPaymentCount;
const currentNavigationPage = document.body.dataset.navigationPage || "";

if (typeof renderSharedNavigation === "function" && currentNavigationPage) {
  renderSharedNavigation(currentNavigationPage);
}
      const reservationsCard = document.getElementById("reservationsCard");
      const offersCard = document.getElementById("offersCard");

      const reservationsBadge = document.getElementById("reservationsBadge");
      const offersBadge = document.getElementById("offersBadge");

      const reservationsText = document.getElementById("reservationsText");
      const offersText = document.getElementById("offersText");

      const alertSummary = document.getElementById("accountAlertSummary");

      setBadge(reservationsBadge, waitingPaymentCount, waitingPaymentCount > 0);
      setBadge(offersBadge, ownerActionRequiredCount, ownerActionRequiredCount > 0);

      if (waitingPaymentCount > 0) {
        reservationsCard.classList.add("account-action-alert");
        reservationsText.textContent = getAccountPluralText(
          "account.dynamic.waitingPayment",
          waitingPaymentCount,
          {
            one: "1 rezervace čeká na platbu",
            few: "{count} rezervace čekají na platbu",
            many: "{count} rezervací čeká na platbu",
            other: "{count} rezervací čeká na platbu"
          }
        );
      } else {
        reservationsCard.classList.remove("account-action-alert");

        if (activeReservations.length > 0) {
          reservationsText.textContent = getAccountPluralText(
            "account.dynamic.activeReservation",
            activeReservations.length,
            {
              one: "Máte 1 aktivní rezervaci",
              few: "Máte {count} aktivní rezervace",
              many: "Máte {count} aktivních rezervací",
              other: "Máte {count} aktivních rezervací"
            }
          );
        } else {
          reservationsText.textContent = accountTranslate(
            "account.reservationsDefault",
            "Co si chci půjčit"
          );
        }
      }

      if (ownerActionRequiredCount > 0) {
        offersCard.classList.add("account-action-alert");

        if (pendingRequestsCount > 0) {
          offersText.textContent = getAccountPluralText(
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
          offersText.textContent = getAccountPluralText(
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
          offersText.textContent = getAccountPluralText(
            "account.dynamic.pickedUp",
            pickedUpRequestsCount,
            {
              one: "1 půjčení probíhá, po vrácení ho uzavřete",
              few: "{count} půjčení probíhají, po vrácení je uzavřete",
              many: "{count} půjčení probíhá, po vrácení je uzavřete",
              other: "{count} půjčení probíhá, po vrácení je uzavřete"
            }
          );
        } else {
          offersText.textContent = accountTranslate(
            "account.dynamic.openRequests",
            "Máte otevřené žádosti k vyřízení"
          );
        }
      } else {
        offersCard.classList.remove("account-action-alert");

        if (incomingOpenRequests.length > 0) {
          offersText.textContent = getAccountPluralText(
            "account.dynamic.incomingRequest",
            incomingOpenRequests.length,
            {
              one: "Máte 1 otevřenou žádost u svých nabídek",
              few: "Máte {count} otevřené žádosti u svých nabídek",
              many: "Máte {count} otevřených žádostí u svých nabídek",
              other: "Máte {count} otevřených žádostí u svých nabídek"
            }
          );
        } else if (myOffers.length > 0) {
          offersText.textContent = getAccountPluralText(
            "account.dynamic.myOffer",
            myOffers.length,
            {
              one: "Máte 1 vlastní nabídku",
              few: "Máte {count} vlastní nabídky",
              many: "Máte {count} vlastních nabídek",
              other: "Máte {count} vlastních nabídek"
            }
          );
        } else {
          offersText.textContent = accountTranslate(
            "account.offersDefault",
            "Co nabízím a žádosti od lidí"
          );
        }
      }

      const totalAlerts = waitingPaymentCount + ownerActionRequiredCount;

      if (totalAlerts > 0) {
        const messageParts = [];

        if (waitingPaymentCount > 0) {
          messageParts.push(
            "<strong>" + formatAccountNumber(waitingPaymentCount) + "</strong> " +
            getAccountPluralText(
              "account.alert.waitingPayment",
              waitingPaymentCount,
              {
                one: "rezervace čeká na platbu",
                few: "rezervace čekají na platbu",
                many: "rezervací čeká na platbu",
                other: "rezervací čeká na platbu"
              }
            )
          );
        }

        if (pendingRequestsCount > 0) {
          messageParts.push(
            "<strong>" + formatAccountNumber(pendingRequestsCount) + "</strong> " +
            getAccountPluralText(
              "account.alert.pending",
              pendingRequestsCount,
              {
                one: "nová žádost čeká na potvrzení",
                few: "nové žádosti čekají na potvrzení",
                many: "nových žádostí čeká na potvrzení",
                other: "nových žádostí čeká na potvrzení"
              }
            )
          );
        }

        if (paidRequestsCount > 0) {
          messageParts.push(
            "<strong>" + formatAccountNumber(paidRequestsCount) + "</strong> " +
            getAccountPluralText(
              "account.alert.paid",
              paidRequestsCount,
              {
                one: "zaplacená rezervace čeká na označení vyzvednutí",
                few: "zaplacené rezervace čekají na označení vyzvednutí",
                many: "zaplacených rezervací čeká na označení vyzvednutí",
                other: "zaplacených rezervací čeká na označení vyzvednutí"
              }
            )
          );
        }

        if (pickedUpRequestsCount > 0) {
          messageParts.push(
            "<strong>" + formatAccountNumber(pickedUpRequestsCount) + "</strong> " +
            getAccountPluralText(
              "account.alert.pickedUp",
              pickedUpRequestsCount,
              {
                one: "půjčení čeká na označení vrácení",
                few: "půjčení čekají na označení vrácení",
                many: "půjčení čeká na označení vrácení",
                other: "půjčení čeká na označení vrácení"
              }
            )
          );
        }

        alertSummary.style.display = "block";
        alertSummary.innerHTML = accountTranslate(
          "account.alert.summary",
          "Máte nové věci k vyřízení: {items}.",
          {
            items: messageParts.join(
              accountTranslate("account.alert.join", " a ")
            )
          }
        );
      } else {
        alertSummary.style.display = "none";
        alertSummary.innerHTML = "";
      }

      renderSharedNavigation("muj-ucet");
    }

    async function initializeAccountPage() {
      if (!window.rentuloAuthGuard) {
        window.location.replace("prihlaseni.html");
        return;
      }

      const user = await window.rentuloAuthGuard.requireUser();

      if (!user) {
        return;
      }

      verifiedAccountUser = user;
      await updateProfileBox(user);
      renderSharedNavigation("muj-ucet");

      const loaded = await loadSupabaseAccountData();

      if (!loaded) {
        return;
      }

      updateAccountActionBadgesFromSupabase();
    }

    async function retryAccountDataLoad() {
      if (accountLoadState === "loading") {
        return;
      }

      const retryButton = document.getElementById("accountLoadRetry");

      if (retryButton) {
        retryButton.disabled = true;
      }

      const loaded = await loadSupabaseAccountData();

      if (loaded) {
        updateAccountActionBadgesFromSupabase();
      }
    }

    document.addEventListener("rentuloLanguageChanged", async function () {
      renderAccountLoadState();

      if (verifiedAccountUser) {
        await updateProfileBox(verifiedAccountUser);
      }

      if (accountLoadState === "ready") {
        updateAccountActionBadgesFromSupabase();
      } else {
        renderSharedNavigation("muj-ucet");
      }
    });

    document.addEventListener("DOMContentLoaded", function () {
      const retryButton = document.getElementById("accountLoadRetry");

      if (retryButton) {
        retryButton.addEventListener("click", retryAccountDataLoad);
      }

      initializeAccountPage();
    });
