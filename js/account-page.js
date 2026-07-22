    let supabaseOffers = [];
    let supabaseOwnerReservations = [];
    let supabaseRenterReservations = [];

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

    function getCurrentUserSafe() {
      if (typeof getCurrentUser === "function") {
        return getCurrentUser();
      }

      try {
        const value = localStorage.getItem("rentuloUser");
        return value ? JSON.parse(value) : null;
      } catch (error) {
        return null;
      }
    }

    function getUserNameSafe(user) {
      if (typeof getUserName === "function") {
        return getUserName(user);
      }

      return user && (user.fullName || user.name || user.email) ? (user.fullName || user.name || user.email) : "Uživatel";
    }

    function getUserEmailSafe(user) {
      if (typeof getUserEmail === "function") {
        return getUserEmail(user);
      }

      return user && user.email ? user.email : "";
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
      const name = getUserNameSafe(user);
      const email = getUserEmailSafe(user);

      const greeting = document.getElementById("accountGreeting");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileRating = document.getElementById("profileRating");
const profileAvatar = document.getElementById("profileAvatar");

      if (greeting) {
        greeting.textContent = "Dobrý den";
      }

      if (profileName) {
        profileName.textContent = name;
      }

      if (profileEmail) {
        profileEmail.textContent = email || "E-mail není uložen";
      }
if (profileRating) {
  profileRating.textContent = "Hodnocení: zatím bez hodnocení";

  const ratingSummary = await loadCurrentUserRating(user);

  if (ratingSummary && ratingSummary.rating_count) {
    profileRating.textContent =
      "Hodnocení: ⭐ " +
      ratingSummary.average_rating +
      " / 5 (" +
      ratingSummary.rating_count +
      " hodnocení)";
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
       name: row.name || "Věc k půjčení",
category: row.category || "Ostatní",
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

        offerName: row.offer_name || "Věc k půjčení",
        toolName: row.offer_name || "Věc k půjčení",

category: row.category || "Ostatní",
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

        ownerName: row.owner_name || "Majitel",

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
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        return false;
      }

      const supabaseUser = await getCurrentSupabaseUser();

      if (!supabaseUser) {
        return false;
      }

      const offersResult = await supabaseClient
        .from("offers")
        .select("*")
        .eq("owner_id", supabaseUser.id);

      if (offersResult.error) {
        console.error(offersResult.error);
        return false;
      }

      const reservationsResult = await supabaseClient
  .rpc("get_my_reservations");

if (reservationsResult.error) {
  console.error(reservationsResult.error);
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

      

      return true;
    }

    function updateAccountActionBadgesFromSupabase() {
      const user = getCurrentUserSafe();

      if (!user) {
        window.location.href = "prihlaseni.html";
        return;
      }

      updateProfileBox(user);

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
        reservationsText.textContent = waitingPaymentCount === 1
          ? "1 rezervace čeká na platbu"
          : waitingPaymentCount + " rezervace čekají na platbu";
      } else {
        reservationsCard.classList.remove("account-action-alert");

        if (activeReservations.length > 0) {
          reservationsText.textContent = activeReservations.length === 1
            ? "Máte 1 aktivní rezervaci"
            : "Máte " + activeReservations.length + " aktivních rezervací";
        } else {
          reservationsText.textContent = "Co si chci půjčit";
        }
      }

      if (ownerActionRequiredCount > 0) {
        offersCard.classList.add("account-action-alert");

        if (pendingRequestsCount > 0) {
          offersText.textContent = pendingRequestsCount === 1
            ? "Máte 1 novou žádost k potvrzení"
            : "Máte " + pendingRequestsCount + " nové žádosti k potvrzení";
        } else if (paidRequestsCount > 0) {
          offersText.textContent = paidRequestsCount === 1
            ? "1 rezervace je zaplacená, označte vyzvednutí"
            : paidRequestsCount + " rezervace jsou zaplacené, označte vyzvednutí";
        } else if (pickedUpRequestsCount > 0) {
          offersText.textContent = pickedUpRequestsCount === 1
            ? "1 půjčení probíhá, po vrácení ho uzavřete"
            : pickedUpRequestsCount + " půjčení probíhají, po vrácení je uzavřete";
        } else {
          offersText.textContent = "Máte otevřené žádosti k vyřízení";
        }
      } else {
        offersCard.classList.remove("account-action-alert");

        if (incomingOpenRequests.length > 0) {
          offersText.textContent = incomingOpenRequests.length === 1
            ? "Máte 1 otevřenou žádost u svých nabídek"
            : "Máte " + incomingOpenRequests.length + " otevřených žádostí u svých nabídek";
        } else if (myOffers.length > 0) {
          offersText.textContent = myOffers.length === 1
            ? "Máte 1 vlastní nabídku"
            : "Máte " + myOffers.length + " vlastní nabídky";
        } else {
          offersText.textContent = "Co nabízím a žádosti od lidí";
        }
      }

      const totalAlerts = waitingPaymentCount + ownerActionRequiredCount;

      if (totalAlerts > 0) {
        const messageParts = [];

        if (waitingPaymentCount > 0) {
          messageParts.push(
            "<strong>" +
            waitingPaymentCount +
            "</strong> " +
            (waitingPaymentCount === 1 ? "rezervace čeká" : "rezervace čekají") +
            " na platbu"
          );
        }

        if (pendingRequestsCount > 0) {
          messageParts.push(
            "<strong>" +
            pendingRequestsCount +
            "</strong> " +
            (pendingRequestsCount === 1 ? "nová žádost čeká" : "nové žádosti čekají") +
            " na potvrzení"
          );
        }

        if (paidRequestsCount > 0) {
          messageParts.push(
            "<strong>" +
            paidRequestsCount +
            "</strong> " +
            (paidRequestsCount === 1 ? "zaplacená rezervace čeká" : "zaplacené rezervace čekají") +
            " na označení vyzvednutí"
          );
        }

        if (pickedUpRequestsCount > 0) {
          messageParts.push(
            "<strong>" +
            pickedUpRequestsCount +
            "</strong> " +
            (pickedUpRequestsCount === 1 ? "půjčení čeká" : "půjčení čekají") +
            " na označení vrácení"
          );
        }

        alertSummary.style.display = "block";
        alertSummary.innerHTML = "Máte nové věci k vyřízení: " + messageParts.join(" a ") + ".";
      } else {
        alertSummary.style.display = "none";
        alertSummary.innerHTML = "";
      }

      renderSharedNavigation("muj-ucet");
    }

    async function initializeAccountPage() {
      const user = getCurrentUserSafe();

      if (!user) {
        window.location.href = "prihlaseni.html";
        return;
      }

      updateProfileBox(user);
      renderSharedNavigation("muj-ucet");

      const loaded = await loadSupabaseAccountData();

      if (!loaded) {
        updateAccountActionBadgesFromSupabase();
        return;
      }

      updateAccountActionBadgesFromSupabase();
    }

    document.addEventListener("DOMContentLoaded", function () {
      initializeAccountPage();
    });