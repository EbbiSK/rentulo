const RESERVATIONS_LOCALES = {
  cs: "cs-CZ",
  en: "en-GB",
  de: "de-DE",
  pl: "pl-PL"
};

function reservationsTranslate(key, fallback, values) {
  let text = typeof window.rentuloTranslate === "function"
    ? window.rentuloTranslate(key)
    : fallback;

  if (text === key) {
    text = fallback;
  }

  if (values && typeof values === "object") {
    Object.keys(values).forEach(function (name) {
      text = String(text).replaceAll("{" + name + "}", String(values[name]));
    });
  }

  return text;
}

function getReservationsLocale() {
  const language = typeof window.getRentuloLanguage === "function"
    ? window.getRentuloLanguage()
    : "cs";

  return RESERVATIONS_LOCALES[language] || RESERVATIONS_LOCALES.cs;
}

function formatReservationsNumber(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return String(value === undefined || value === null ? "" : value);
  }

  return numberValue.toLocaleString(getReservationsLocale());
}

function formatReservationsMoney(value) {
  return formatReservationsNumber(value) + " Kč";
}

function formatReservationsDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(getReservationsLocale());
}

function formatReservationsDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(getReservationsLocale());
}

function getReservationsCountText(count) {
  const pluralCategory = new Intl.PluralRules(getReservationsLocale()).select(Number(count));
  const supportedCategory = ["one", "few", "many", "other"].includes(pluralCategory)
    ? pluralCategory
    : "other";
  const suffix = supportedCategory.charAt(0).toUpperCase() + supportedCategory.slice(1);

  return reservationsTranslate(
    "reservations.count" + suffix,
    "{count} rezervací",
    { count: formatReservationsNumber(count) }
  );
}

  const PLATFORM_FEE_PERCENT = 10;
    let supabaseReservations = [];
    let supabaseReviews = [];
    let reservationsLoadState = "idle";

    async function sendReservationEmailSafely(reservationId, eventType) {
      if (!reservationId || !eventType) {
        return;
      }

      if (typeof window.apiSendReservationEmail === "function") {
        await window.apiSendReservationEmail(reservationId, eventType);
        return;
      }

      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        console.warn("E-mailové upozornění nebylo odesláno: Supabase není dostupný.");
        return;
      }

      try {
        const { error } = await supabaseClient.functions.invoke(
          "send-reservation-email",
          {
            body: {
              reservation_id: reservationId,
              event: eventType
            }
          }
        );

        if (error) {
          console.warn("E-mailové upozornění se nepodařilo odeslat:", error);
        }
      } catch (error) {
        console.warn("E-mailové upozornění se nepodařilo odeslat:", error);
      }
    }

    function findRenterReviewForReservation(reservation) {
      if (!reservation) {
        return null;
      }

      const reservationId = reservation.id || reservation.reservationId;
      const renterId = reservation.renterId;

      return supabaseReviews.find(function (review) {
        return (
          String(review.reservation_id) === String(reservationId) &&
          String(review.reviewer_id) === String(renterId)
        );
      }) || null;
    }

    function findOwnerReviewForReservation(reservation) {
      if (!reservation) {
        return null;
      }

      const reservationId = reservation.id || reservation.reservationId;
      const ownerId = reservation.ownerId;

      return supabaseReviews.find(function (review) {
        return (
          String(review.reservation_id) === String(reservationId) &&
          String(review.reviewer_id) === String(ownerId)
        );
      }) || null;
    }

    function renderSavedReview(review) {
      if (!review) {
        return "";
      }

      return `
        <div class="review-lines">
          <span>${escapeHtml(getStars(review.rating))}</span>
          ${review.text ? `<span>${escapeHtml(review.text)}</span>` : ""}
          <span>${escapeHtml(reservationsTranslate("reservations.review.sent", "Odesláno"))}: ${escapeHtml(formatReservationsDateTime(review.created_at))}</span>
        </div>
      `;
    }

    function getSafeReservationStatusText(status) {
      if (typeof getReservationStatusText === "function") {
        return getReservationStatusText(status);
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PENDING) {
        return "Čeká na potvrzení";
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_APPROVED) {
        return "Čeká na platbu";
      }

      if (
  normalizeReservationStatus(status) ===
  RESERVATION_STATUS_PAID
) {
  return "Zaplaceno";
}

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PICKED_UP) {
        return "Vyzvednuto";
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_RETURNED) {
        return "Vráceno";
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_REJECTED) {
        return "Odmítnuto";
      }

      if (
  normalizeReservationStatus(status) ===
  RESERVATION_STATUS_CANCELLED
) {
  return "Zrušeno";
}

      return status || "Čeká na potvrzení";
    }

    function normalizeSupabaseReservation(row) {
      return {
        id: row.id,
        reservationId: row.id,

        offerId: row.offer_id,
        toolId: row.offer_id,

        ownerId: row.owner_id,
        renterId: row.renter_id,

        toolName: row.offer_name || "",
offerName: row.offer_name || "",

category: row.category || reservationsTranslate("reservations.fallback.other", "Ostatní"),
        city: row.city || "",

        pricePerDay: Number(row.price_per_day || 0),
        price: Number(row.price_per_day || 0),

        startDate: row.start_date || row.date_from,
        endDate: row.end_date || row.date_to,
        dateFrom: row.start_date || row.date_from,
        dateTo: row.end_date || row.date_to,

        totalDays: Number(row.total_days || row.days || 0),
        days: Number(row.total_days || row.days || 0),
        totalPrice: Number(row.total_price || 0),

        platformFeePercent: Number(row.platform_fee_percent || PLATFORM_FEE_PERCENT),
        platformFeeAmount: Number(row.platform_fee_amount || 0),
        ownerPayout: Number(row.owner_payout || 0),

        renterName: row.renter_name || "",
        renterEmail: row.renter_email || "",
        renterPhone: row.renter_phone || "",

        ownerName: row.owner_name || "",
        ownerEmail: row.owner_email || "",
        ownerPhone: row.owner_phone || "",

        pickupPhone: row.pickup_phone || row.owner_phone || "",
        pickupStreet: row.pickup_street || "",
        pickupCity: row.pickup_city || row.city || "",
        pickupPostalCode: row.pickup_postal_code || "",
        pickupFullAddress: row.pickup_full_address || "",
        pickupNote: row.pickup_note || "",

        status: row.status || "pending",
        statusText: getSafeReservationStatusText(row.status || "pending"),

        contactVisibleAfterPayment: Boolean(row.contact_visible_after_payment),

        paidAt: row.paid_at || "",
        paymentProviderStatus: row.payment_provider_status || "",

        createdAt: row.created_at || "",
        updatedAt: row.updated_at || "",

        photoUrl: row.photo_url || "",
        photo_url: row.photo_url || "",

        source: "supabase"
      };
    }

    async function loadMyReservationsFromSupabase() {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        reservationsLoadState = "error";
        return [];
      }

      const supabaseUser = await getCurrentSupabaseUser();

      if (!supabaseUser) {
        reservationsLoadState = "redirecting";
        window.location.href = "prihlaseni.html";
        return [];
      }

      const { data: reservationsData, error } = await supabaseClient
  .rpc("get_my_reservations");

      if (error) {
        console.error(error);
        reservationsLoadState = "error";
        return [];
      }

const data = Array.isArray(reservationsData)
  ? reservationsData.filter(function (reservation) {
      return reservation.renter_id === supabaseUser.id;
    })
  : [];

      reservationsLoadState = "ready";

      return Array.isArray(data)
        ? data.map(normalizeSupabaseReservation)
        : [];
    }

    async function loadMyReviewsFromSupabase() {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        return [];
      }

      const supabaseUser = await getCurrentSupabaseUser();

      if (!supabaseUser) {
        return [];
      }

      const { data, error } = await supabaseClient
        .from("reviews")
        .select("*")
        .or("reviewer_id.eq." + supabaseUser.id + ",reviewed_user_id.eq." + supabaseUser.id)
        .order("created_at", {
          ascending: false
        });

      if (error) {
        console.error("Hodnocení se nepodařilo načíst:", error);
        return [];
      }

      return Array.isArray(data) ? data : [];
    }

    function getSafeReservationStatus(reservation) {
      if (typeof getReservationStatus === "function") {
        return getReservationStatus(reservation);
      }

      return reservation.status || "pending";
    }

    function getSafeReservationToolName(reservation) {
      return (
        reservation.offer_name ||
        reservation.toolName ||
        reservation.offerName ||
        reservationsTranslate("reservations.fallback.item", "Věc")
      );
    }

    function getSafeReservationDateFrom(reservation) {
      if (typeof getReservationDateFrom === "function") {
        return getReservationDateFrom(reservation);
      }

      return reservation.startDate || reservation.dateFrom || "";
    }

    function getSafeReservationDateTo(reservation) {
      if (typeof getReservationDateTo === "function") {
        return getReservationDateTo(reservation);
      }

      return reservation.endDate || reservation.dateTo || "";
    }

    function getSafeReservationOfferId(reservation) {
      if (typeof getReservationOfferId === "function") {
        return getReservationOfferId(reservation);
      }

      return reservation.offerId || reservation.toolId || "";
    }

    function getSafeReservationTotalPrice(reservation) {
      if (typeof getReservationTotalPrice === "function") {
        return getReservationTotalPrice(reservation);
      }

      const totalPrice = Number(reservation.totalPrice || 0);

      if (totalPrice > 0) {
        return totalPrice;
      }

      const days = Number(reservation.totalDays || reservation.days || 0);
      const pricePerDay = Number(reservation.pricePerDay || reservation.price || 0);

      return days * pricePerDay;
    }

    function getSafeReservationPlatformFee(reservation, percent) {
      if (typeof getReservationPlatformFee === "function") {
        return getReservationPlatformFee(reservation, percent);
      }

      if (reservation.platformFeeAmount !== undefined && reservation.platformFeeAmount !== null) {
        return Number(reservation.platformFeeAmount) || 0;
      }

      return Math.round(getSafeReservationTotalPrice(reservation) * percent / 100);
    }

    function getSafeReservationOwnerPayout(reservation, percent) {
      if (typeof getReservationOwnerPayout === "function") {
        return getReservationOwnerPayout(reservation, percent);
      }

      if (reservation.ownerPayout !== undefined && reservation.ownerPayout !== null) {
        return Number(reservation.ownerPayout) || 0;
      }

      return getSafeReservationTotalPrice(reservation) - getSafeReservationPlatformFee(reservation, percent);
    }

    function safeIsOpenReservationStatus(status) {
  return isOpenReservationStatus(
    normalizeReservationStatus(status)
  );
}

    function safeIsClosedReservationStatus(status) {
  return isClosedReservationStatus(
    normalizeReservationStatus(status)
  );
}

    function getSafeReservationContactVisible(status) {
  return getReservationContactVisible(
    normalizeReservationStatus(status)
  );
}

    function isMapUsefulForStatus(status) {
      const normalizedStatus = normalizeReservationStatus(status);

return (
  normalizedStatus === RESERVATION_STATUS_PAID ||
  normalizedStatus === RESERVATION_STATUS_PICKED_UP
);
    }

    function getReservationOwnerName(reservation) {
      return (
        reservation.owner_name ||
        reservation.ownerName ||
        reservation.owner ||
        reservationsTranslate("reservations.fallback.owner", "Majitel")
      );
    }

    function getPickupAddress(reservation) {
      return (
        reservation.pickupFullAddress ||
        [reservation.pickupStreet, reservation.pickupCity, reservation.pickupPostalCode].filter(Boolean).join(", ") ||
        [reservation.ownerStreet, reservation.ownerCity, reservation.ownerPostalCode].filter(Boolean).join(", ")
      );
    }

    function getPickupPhone(reservation) {
      return reservation.pickupPhone || reservation.ownerPhone || "";
    }

    function getPickupCity(reservation) {
      return reservation.pickupCity || reservation.ownerCity || reservation.city || "-";
    }

    function getMapUrl(address) {
      return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);
    }

    function getReservationPhoto(reservation) {
      if (!reservation) {
        return "";
      }

      return (
        reservation.photoUrl ||
        reservation.photo_url ||
        reservation.image ||
        ""
      );
    }

    function renderToolThumb(reservation) {
      const toolName = getSafeReservationToolName(reservation);
      const photo = getReservationPhoto(reservation);

      if (photo) {
        return `
          <div class="tool-thumb tool-image">
            <img src="${escapeHtml(photo)}" alt="${escapeHtml(toolName)}" loading="lazy" decoding="async">
          </div>
        `;
      }

      return `
        <div class="tool-thumb tool-image">⌁</div>
      `;
    }

    function renderEmptyState() {
      document.getElementById("reservationsList").innerHTML = `
        <section class="account-empty-state">
          <h2>${escapeHtml(reservationsTranslate("reservations.empty.title", "Zatím nemáte žádné rezervace."))}</h2>
          <p>${escapeHtml(reservationsTranslate("reservations.empty.description", "Najděte věc ve svém okolí a pošlete první žádost o půjčení."))}</p>
        </section>
      `;
    }

    function renderLoadingState() {
      document.getElementById("reservationsList").innerHTML = `
        <section class="account-empty-state">
          <h2>${escapeHtml(reservationsTranslate("reservations.loading.title", "Načítám rezervace..."))}</h2>
          <p>${escapeHtml(reservationsTranslate("reservations.loading.description", "Chvíli strpení, načítáme vaše rezervace ze Supabase."))}</p>
        </section>
      `;
    }

    function renderLoadErrorState() {
      document.getElementById("reservationsList").innerHTML = `
        <section class="account-empty-state">
          <h2>${escapeHtml(reservationsTranslate("reservations.loadError.title", "Rezervace se nepodařilo načíst."))}</h2>
          <p>${escapeHtml(reservationsTranslate("reservations.loadError.description", "Obnovte stránku nebo zkuste načtení znovu."))}</p>
          <button class="reservation-primary-action" type="button" data-reservations-action="retry-load">
            ${escapeHtml(reservationsTranslate("reservations.loadError.retry", "Zkusit znovu"))}
          </button>
        </section>
      `;
    }

    async function retryLoadReservations() {
      reservationsLoadState = "loading";
      renderLoadingState();

      supabaseReservations = await loadMyReservationsFromSupabase();
      supabaseReviews = reservationsLoadState === "ready"
        ? await loadMyReviewsFromSupabase()
        : [];

      renderSharedNavigation("muj-ucet");

      if (reservationsLoadState === "ready") {
        renderReservations();
      } else if (reservationsLoadState === "error") {
        renderLoadErrorState();
      }
    }

    async function cancelReservation(reservationId) {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        alert(reservationsTranslate("reservations.error.supabase", "Služba je dočasně nedostupná. Obnovte stránku."));
        return;
      }

      const supabaseUser = await getCurrentSupabaseUser();

      if (!supabaseUser) {
        alert(reservationsTranslate("reservations.error.loginCancel", "Pro zrušení rezervace se musíte znovu přihlásit."));
        window.location.href = "prihlaseni.html";
        return;
      }

      const reservation = supabaseReservations.find(function (item) {
        return String(item.id || item.reservationId) === String(reservationId);
      });

      if (!reservation) {
        alert(reservationsTranslate("reservations.error.notFound", "Rezervace nebyla nalezena."));
        return;
      }

      const normalizedStatus = normalizeReservationStatus(
        getSafeReservationStatus(reservation)
      );

      if (
        normalizedStatus !== RESERVATION_STATUS_PENDING &&
        normalizedStatus !== RESERVATION_STATUS_APPROVED
      ) {
        alert(reservationsTranslate("reservations.error.cannotCancel", "Tuto rezervaci už nelze běžně zrušit."));
        return;
      }

      const confirmed = confirm(
        reservationsTranslate("reservations.confirm.cancel", "Opravdu chcete tuto rezervaci zrušit? Termín se znovu uvolní.")
      );

      if (!confirmed) {
        return;
      }

      const { error } = await supabaseClient
  .rpc("change_my_reservation_status", {
    p_reservation_id: reservationId,
    p_new_status: "cancelled"
  });

      if (error) {
        console.error("Rezervaci se nepodařilo zrušit:", error);
        alert(reservationsTranslate("reservations.error.cancel", "Rezervaci se nepodařilo zrušit. Zkuste to prosím znovu."));
        return;
      }

      await sendReservationEmailSafely(reservationId, "cancelled");

      alert(reservationsTranslate("reservations.success.cancelled", "Rezervace byla zrušena a přesunuta do Historie."));

      await retryLoadReservations();
    }

    async function payReservation(reservationId) {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        alert(reservationsTranslate("reservations.error.supabase", "Služba je dočasně nedostupná. Obnovte stránku."));
        return;
      }

      const supabaseUser = await getCurrentSupabaseUser();

      if (!supabaseUser) {
        alert(reservationsTranslate("reservations.error.loginPay", "Pro zaplacení se musíte znovu přihlásit."));
        window.location.href = "prihlaseni.html";
        return;
      }

      const confirmPayment = confirm(
        reservationsTranslate("reservations.confirm.testPayment", "Toto je testovací platba. Opravdu chcete označit rezervaci jako zaplacenou?")
      );

      if (!confirmPayment) {
        return;
      }

      const { data: paidReservations, error } = await supabaseClient
  .rpc("mark_my_reservation_paid_test", {
    p_reservation_id: reservationId
  });

const data = Array.isArray(paidReservations)
  ? paidReservations[0] || null
  : paidReservations || null;

      if (error) {
        console.error(error);
        alert(reservationsTranslate("reservations.error.payment", "Platbu se nepodařilo dokončit. Zkuste to prosím znovu."));
        return;
      }

      

        

      if (data) {
        await sendReservationEmailSafely(reservationId, "paid");
      }

      await retryLoadReservations();

      if (reservationsLoadState === "ready") {
        openReservationDetail(reservationId);
      }
    }

    async function saveRenterReview(reservationId) {
      const reservation = supabaseReservations.find(function (item) {
        const itemId = item.id || item.reservationId;
        return String(itemId) === String(reservationId);
      });

      if (!reservation) {
        alert(reservationsTranslate("reservations.error.notFound", "Rezervace nebyla nalezena."));
        return;
      }

      const supabaseUser = await getCurrentSupabaseUser();

      if (!supabaseUser || !supabaseUser.id) {
        alert(reservationsTranslate("reservations.error.loginReview", "Pro odeslání hodnocení se musíte přihlásit."));
        return;
      }

      const existingReview = findRenterReviewForReservation(reservation);

      if (existingReview) {
        alert(reservationsTranslate("reservations.error.alreadyReviewed", "Tuto rezervaci jste už hodnotili."));
        return;
      }

      const ratingElement = document.getElementById("renter-review-rating-" + reservationId);
      const textElement = document.getElementById("renter-review-text-" + reservationId);

      const rating = Number(ratingElement ? ratingElement.value : 0);
      const text = textElement ? textElement.value.trim() : "";

      if (!rating || rating < 1 || rating > 5) {
        alert(reservationsTranslate("reservations.error.selectStars", "Vyberte počet hvězdiček."));
        return;
      }

      if (!text) {
        alert(reservationsTranslate("reservations.error.writeComment", "Napište krátký komentář k půjčení."));
        return;
      }

      const reviewToInsert = {
  reservation_id: reservation.id,
  rating: rating,
  text: text
};

      

      const reviewSupabaseClient = getSupabaseClient();

      if (!reviewSupabaseClient) {
        alert(reservationsTranslate("reservations.error.supabaseUnavailable", "Služba je dočasně nedostupná. Obnovte stránku a zkuste to znovu."));
        return;
      }

      const { error } = await reviewSupabaseClient
        .from("reviews")
        .insert(reviewToInsert);

      if (error) {
        console.error("Chyba při ukládání hodnocení:", error);

        if (String(error.message || "").includes("duplicate")) {
          alert(reservationsTranslate("reservations.error.alreadyReviewed", "Tuto rezervaci jste už hodnotili."));
        } else {
          alert(reservationsTranslate("reservations.error.reviewSave", "Hodnocení se nepodařilo uložit."));
        }

        return;
      }

      alert(reservationsTranslate("reservations.success.reviewSaved", "Hodnocení bylo uloženo."));
      await retryLoadReservations();

      if (reservationsLoadState === "ready") {
        openReservationDetail(reservationId);
      }
    }

    function openReservationDetail(reservationId) {
      setTimeout(function () {
        const detail = document.getElementById("reservation-detail-" + reservationId);

        if (detail) {
          detail.classList.add("open");
        }

        const button = document.getElementById("detail-toggle-" + reservationId);

        if (button) {
          button.textContent = reservationsTranslate("reservations.hideDetail", "Skrýt detail");
        }
      }, 0);
    }

    function toggleReservationDetail(reservationId, button) {
      const detail = document.getElementById("reservation-detail-" + reservationId);

      if (!detail) {
        return;
      }

      const isOpen = detail.classList.contains("open");

      if (isOpen) {
        detail.classList.remove("open");
        button.textContent = reservationsTranslate("reservations.detail", "Detail");
        return;
      }

      detail.classList.add("open");
      button.textContent = reservationsTranslate("reservations.hideDetail", "Skrýt detail");
    }

    function renderOwnerReviewForRenterBox(reservation, status) {
      if (status !== "returned") {
        return "";
      }

      const ownerReview = findOwnerReviewForReservation(reservation);

      if (ownerReview) {
        return `
          <div class="review-box">
            <strong>${escapeHtml(reservationsTranslate("reservations.review.fromOwner", "Hodnocení od majitele"))}</strong>
            ${renderSavedReview(ownerReview)}
          </div>
        `;
      }

      return `
        <div class="review-box">
          <strong>${escapeHtml(reservationsTranslate("reservations.review.fromOwner", "Hodnocení od majitele"))}</strong>
          ${escapeHtml(reservationsTranslate("reservations.review.notRatedByOwner", "Majitel vás zatím neohodnotil."))}
        </div>
      `;
    }

    function renderRenterReviewBox(reservation, status) {
      if (status !== "returned") {
        return "";
      }

      const reservationId = reservation.id || reservation.reservationId;
      const renterReview = findRenterReviewForReservation(reservation);

      if (renterReview) {
        return `
          <div class="review-box">
            <strong>${escapeHtml(reservationsTranslate("reservations.review.sentTitle", "Hodnocení bylo odesláno"))}</strong>
            ${renderSavedReview(renterReview)}
          </div>
        `;
      }

      return `
        <div class="review-box">
          <strong>${escapeHtml(reservationsTranslate("reservations.review.rateOwner", "Ohodnotit majitele"))}</strong>
          <div class="review-lines">
            <label>
              ${escapeHtml(reservationsTranslate("reservations.review.stars", "Počet hvězdiček"))}
              <select id="renter-review-rating-${reservationId}">
                <option value="5">★★★★★ - ${escapeHtml(reservationsTranslate("reservations.review.excellent", "výborné"))}</option>
                <option value="4">★★★★☆ - ${escapeHtml(reservationsTranslate("reservations.review.good", "dobré"))}</option>
                <option value="3">★★★☆☆ - ${escapeHtml(reservationsTranslate("reservations.review.average", "průměrné"))}</option>
                <option value="2">★★☆☆☆ - ${escapeHtml(reservationsTranslate("reservations.review.weak", "slabé"))}</option>
                <option value="1">★☆☆☆☆ - ${escapeHtml(reservationsTranslate("reservations.review.bad", "špatné"))}</option>
              </select>
            </label>

            <label>
              ${escapeHtml(reservationsTranslate("reservations.review.comment", "Komentář"))}
              <textarea id="renter-review-text-${reservationId}" rows="3" placeholder="${escapeHtml(reservationsTranslate("reservations.review.placeholder", "Jak proběhlo půjčení?"))}"></textarea>
            </label>

            <button type="button" class="btn-primary small-button" data-reservations-action="save-review" data-reservation-id="${escapeHtml(reservationId)}">
              ${escapeHtml(reservationsTranslate("reservations.review.submit", "Odeslat hodnocení"))}
            </button>
          </div>
        </div>
      `;
    }

    function renderPaymentBox(reservation, status) {
      const normalizedStatus = normalizeReservationStatus(status);

      if (normalizedStatus === RESERVATION_STATUS_APPROVED) {
        return `
          <div class="payment-box waiting">
            <strong>${escapeHtml(reservationsTranslate("reservations.payment.platformTitle", "Platba přes provozovatele platformy"))}</strong>
            ${escapeHtml(reservationsTranslate("reservations.payment.testInfo", "Kliknutím na tlačítko Zaplatit provedete testovací platbu."))}
            <div class="payment-lines">
              <span>${escapeHtml(reservationsTranslate("reservations.payment.statusLabel", "Stav platby"))}: ${escapeHtml(reservationsTranslate("reservations.payment.waitingLower", "čeká na platbu"))}</span>
            </div>
          </div>
        `;
      }

      if (getSafeReservationContactVisible(status)) {
        const paymentTitle = normalizedStatus === RESERVATION_STATUS_RETURNED
          ? reservationsTranslate("reservations.payment.completed", "Platba byla přijata a půjčení je dokončeno")
          : reservationsTranslate("reservations.payment.accepted", "Platba přijata přes provozovatele platformy");

        return `
          <div class="payment-box paid">
            <strong>${escapeHtml(paymentTitle)}</strong>
            <div class="payment-lines">
              <span>${escapeHtml(reservationsTranslate("reservations.payment.statusLabel", "Stav platby"))}: ${escapeHtml(
                reservation.paymentProviderStatus === "paid_test"
                  ? reservationsTranslate("reservations.payment.statusPaidTest", "Testovací platba")
                  : reservationsTranslate("reservations.payment.statusPaid", "Zaplaceno")
              )}</span>
              <span>${escapeHtml(reservationsTranslate("reservations.payment.paidAt", "Zaplaceno"))}: ${escapeHtml(formatReservationsDateTime(reservation.paidAt))}</span>
            </div>
          </div>
        `;
      }

      return "";
    }

    function renderReservationStateBox(reservation, status) {
      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PENDING) {
        return `
          <div class="reservation-state-box rejected">
            <strong>${escapeHtml(reservationsTranslate("reservations.state.pendingTitle", "Žádost čeká na potvrzení"))}</strong>
            ${escapeHtml(reservationsTranslate("reservations.state.pendingText", "Majitel zatím vaši žádost nepotvrdil."))}
          </div>
        `;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_APPROVED) {
        return `
          <div class="reservation-state-box active">
            <strong>${escapeHtml(reservationsTranslate("reservations.state.approvedTitle", "Žádost je potvrzená"))}</strong>
            ${escapeHtml(reservationsTranslate("reservations.state.approvedText", "Teď můžete dokončit platbu. Po zaplacení se zobrazí telefon a přesná adresa."))}
          </div>
        `;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PAID) {
        return `
          <div class="reservation-state-box active">
            <strong>${escapeHtml(reservationsTranslate("reservations.state.paidTitle", "Zaplaceno – domluvte se s majitelem na předání"))}</strong>
            ${escapeHtml(reservationsTranslate("reservations.state.paidText", "Kontaktujte majitele a domluvte si přesný čas vyzvednutí."))}
          </div>
        `;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PICKED_UP) {
        return `
          <div class="reservation-state-box active">
            <strong>${escapeHtml(reservationsTranslate("reservations.state.pickedTitle", "Věc byla označena jako vyzvednutá"))}</strong>
            ${escapeHtml(reservationsTranslate("reservations.state.pickedText", "Půjčení právě probíhá."))}
          </div>
        `;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_RETURNED) {
        return `
          <div class="reservation-state-box finished">
            <strong>${escapeHtml(reservationsTranslate("reservations.state.returnedTitle", "Vráceno – půjčení je dokončeno"))}</strong>
            ${escapeHtml(reservationsTranslate("reservations.state.returnedText", "Rezervace byla úspěšně ukončena. Už není potřeba žádná další akce."))}
          </div>
        `;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_REJECTED) {
        return `
          <div class="reservation-state-box rejected">
            <strong>${escapeHtml(reservationsTranslate("reservations.state.rejectedTitle", "Žádost byla odmítnuta"))}</strong>
            ${escapeHtml(reservationsTranslate("reservations.state.rejectedText", "Majitel vaši žádost odmítl."))}
          </div>
        `;
      }

      if (
  normalizeReservationStatus(status) ===
  RESERVATION_STATUS_CANCELLED
) {
        return `
          <div class="reservation-state-box rejected">
            <strong>${escapeHtml(reservationsTranslate("reservations.state.cancelledTitle", "Rezervace byla zrušena"))}</strong>
            ${escapeHtml(reservationsTranslate("reservations.state.cancelledText", "Tato rezervace už nepokračuje."))}
          </div>
        `;
      }

      return "";
    }

    function renderContactBox(reservation, status) {
      const address = getPickupAddress(reservation);
      const phone = getPickupPhone(reservation);
      const city = getPickupCity(reservation);

      if (!getSafeReservationContactVisible(status)) {
        return `
          <div class="contact-box hidden">
            <strong>${escapeHtml(reservationsTranslate("reservations.contact.hiddenTitle", "Kontaktní údaje jsou skryté"))}</strong>
            ${escapeHtml(reservationsTranslate("reservations.contact.hiddenText", "Telefon a přesná adresa se zobrazí až po zaplacení."))}
            <div class="contact-lines">
              <span>${escapeHtml(reservationsTranslate("reservations.contact.city", "Město"))}: ${escapeHtml(city)}</span>
            </div>
          </div>
        `;
      }

      const contactTitle =
  normalizeReservationStatus(status) === RESERVATION_STATUS_RETURNED
        ? reservationsTranslate("reservations.contact.completedTitle", "Kontaktní údaje k dokončené rezervaci")
        : reservationsTranslate("reservations.contact.pickupTitle", "Údaje pro vyzvednutí");

      const returnedNote =
  normalizeReservationStatus(status) === RESERVATION_STATUS_RETURNED
        ? `<span>${escapeHtml(reservationsTranslate("reservations.contact.completedNote", "Rezervace je dokončená. Kontaktní údaje zůstávají dostupné, protože půjčení bylo zaplaceno."))}</span>`
        : "";

      return `
        <div class="contact-box visible">
          <strong>${contactTitle}</strong>
          <div class="contact-lines">
            ${returnedNote}
            <span>${escapeHtml(reservationsTranslate("reservations.contact.phone", "Telefon"))}: ${escapeHtml(phone || reservationsTranslate("reservations.contact.phoneMissing", "Telefon není uložen"))}</span>
            <span>${escapeHtml(reservationsTranslate("reservations.contact.address", "Adresa"))}: ${escapeHtml(address || reservationsTranslate("reservations.contact.addressMissing", "Adresa není uložená"))}</span>
            ${reservation.pickupNote ? `<span>${escapeHtml(reservationsTranslate("reservations.contact.note", "Poznámka"))}: ${escapeHtml(reservation.pickupNote)}</span>` : ""}
          </div>
        </div>
      `;
    }

    function renderReservationDetailPanel(reservation) {
      const status = getSafeReservationStatus(reservation);

      const startDate = getSafeReservationDateFrom(reservation);
      const endDate = getSafeReservationDateTo(reservation);

      const totalPrice = getSafeReservationTotalPrice(reservation);
      const platformFee = getSafeReservationPlatformFee(reservation, PLATFORM_FEE_PERCENT);
      const ownerPayout = getSafeReservationOwnerPayout(reservation, PLATFORM_FEE_PERCENT);
      const normalizedStatus = normalizeReservationStatus(status);
      const paymentStatusText = getSafeReservationContactVisible(status)
        ? reservationsTranslate("reservations.payment.paidLower", "zaplaceno")
        : normalizedStatus === RESERVATION_STATUS_APPROVED
          ? reservationsTranslate("reservations.payment.waitingLower", "čeká na platbu")
          : reservationsTranslate("reservations.payment.pendingLower", "dostupná po schválení");

      return `
        <div class="reservation-detail-panel">
          <div class="detail-grid">
            <div class="info-box">
              <span>${escapeHtml(reservationsTranslate("reservations.detail.term", "Termín"))}</span>
              <strong>${escapeHtml(formatReservationsDate(startDate))} – ${escapeHtml(formatReservationsDate(endDate))}</strong>
            </div>

            <div class="info-box">
              <span>${escapeHtml(reservationsTranslate("reservations.detail.total", "Celkem k platbě"))}</span>
              <strong>${escapeHtml(formatReservationsMoney(totalPrice))}</strong>
            </div>

            <div class="info-box">
              <span>${escapeHtml(reservationsTranslate("reservations.detail.payment", "Platba"))}</span>
              <strong>${escapeHtml(paymentStatusText)}</strong>
            </div>

            <div class="info-box">
              <span>${escapeHtml(reservationsTranslate("reservations.detail.fee", "Provize 10 %"))}</span>
              <strong>${escapeHtml(formatReservationsMoney(platformFee))}</strong>
            </div>

            <div class="info-box">
              <span>${escapeHtml(reservationsTranslate("reservations.detail.ownerGets", "Majitel dostane"))}</span>
              <strong>${escapeHtml(formatReservationsMoney(ownerPayout))}</strong>
            </div>
          </div>

          ${renderReservationStateBox(reservation, status)}

          ${renderPaymentBox(reservation, status)}

          ${renderContactBox(reservation, status)}

          ${renderOwnerReviewForRenterBox(reservation, status)}

          ${renderRenterReviewBox(reservation, status)}
        </div>
      `;
    }

    function getStatusClass(status) {
  const normalizedStatus = normalizeReservationStatus(status);

  if (
    normalizedStatus === RESERVATION_STATUS_PAID ||
    normalizedStatus === RESERVATION_STATUS_PICKED_UP
  ) {
    return "status-paid";
  }

      if (normalizedStatus === RESERVATION_STATUS_RETURNED) {
        return "status-finished";
      }

      if (
  normalizedStatus === RESERVATION_STATUS_REJECTED ||
 normalizedStatus === RESERVATION_STATUS_CANCELLED
) {
        return "status-rejected";
      }

      return "";
    }

    function renderReservationCard(reservation, isHistorySection) {
      const status = getSafeReservationStatus(reservation);
      const normalizedStatus = normalizeReservationStatus(status);
      const statusText = getSafeReservationStatusText(status);

      const toolName = getSafeReservationToolName(reservation);
      const city = getPickupCity(reservation);
      const ownerName = getReservationOwnerName(reservation);

      const startDate = getSafeReservationDateFrom(reservation);
      const endDate = getSafeReservationDateTo(reservation);
      const totalPrice = getSafeReservationTotalPrice(reservation);
      const reservationId = reservation.id || reservation.reservationId;
      const offerId = getSafeReservationOfferId(reservation);
      const pickupAddress = getPickupAddress(reservation);

      const isPaymentRequired = normalizedStatus === RESERVATION_STATUS_APPROVED;
      const isPriority = !isHistorySection && (
        isPaymentRequired ||
        normalizedStatus === RESERVATION_STATUS_PAID ||
        normalizedStatus === RESERVATION_STATUS_PICKED_UP
      );

      const primaryAction = isPaymentRequired
        ? `
          <button class="reservation-primary-action orange" type="button" data-reservations-action="pay" data-reservation-id="${escapeHtml(reservationId)}">
            ${escapeHtml(reservationsTranslate("reservations.pay", "Zaplatit"))}
          </button>
        `
        : `
          <button class="reservation-primary-action" id="detail-toggle-${escapeHtml(reservationId)}" type="button" data-reservations-action="toggle-detail" data-reservation-id="${escapeHtml(reservationId)}">
            ${escapeHtml(reservationsTranslate("reservations.detail", "Detail"))}
          </button>
        `;

      let menuItems = "";

      if (isPaymentRequired) {
        menuItems += `
          <button id="detail-toggle-${escapeHtml(reservationId)}" type="button" data-reservations-action="toggle-detail" data-reservation-id="${escapeHtml(reservationId)}" data-use-primary-toggle="true">
            ${escapeHtml(reservationsTranslate("reservations.detailReservation", "Detail rezervace"))}
          </button>
        `;
      }

      if (
        !isHistorySection &&
        (
          normalizedStatus === RESERVATION_STATUS_PENDING ||
          normalizedStatus === RESERVATION_STATUS_APPROVED
        )
      ) {
        menuItems += `
          <button type="button" class="danger-action" data-reservations-action="cancel" data-reservation-id="${escapeHtml(reservationId)}">
            ${escapeHtml(reservationsTranslate("reservations.cancel", "Zrušit rezervaci"))}
          </button>
        `;
      }

      if (isMapUsefulForStatus(status) && pickupAddress) {
        menuItems += `
          <a href="${escapeHtml(getMapUrl(pickupAddress))}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(reservationsTranslate("reservations.pickupMap", "Mapa vyzvednutí"))}
          </a>
        `;
      }

      if (offerId && !isHistorySection) {
        menuItems += `
          <a href="detail.html?id=${encodeURIComponent(offerId)}">
            ${escapeHtml(reservationsTranslate("reservations.itemDetail", "Detail věci"))}
          </a>
        `;
      }

      const secondaryMenu = menuItems
        ? `
          <details class="reservation-more-menu">
            <summary aria-label="${escapeHtml(reservationsTranslate("reservations.moreActions", "Další akce"))}">•••</summary>
            <div class="reservation-more-menu-panel">
              ${menuItems}
            </div>
          </details>
        `
        : "";

      return `
  <article class="simple-reservation-row ${isPriority ? "priority" : ""}">
    <div class="simple-reservation-main">
      ${renderToolThumb(reservation)}

      <div class="simple-reservation-info">
        <strong>${escapeHtml(toolName)}</strong>
        <span>${escapeHtml(city)} · ${escapeHtml(reservationsTranslate("reservations.ownerLabel", "Majitel"))}: ${escapeHtml(ownerName)}</span>
      </div>
    </div>

    <div class="simple-reservation-date">
      ${escapeHtml(formatReservationsDate(startDate))} – ${escapeHtml(formatReservationsDate(endDate))}
    </div>

    <div class="simple-reservation-price">
      ${escapeHtml(formatReservationsMoney(totalPrice))}
    </div>

    <div class="simple-reservation-status status-${escapeHtml(String(normalizedStatus).toLowerCase())}">
      ${escapeHtml(statusText)}
    </div>

    <div class="simple-reservation-actions">
      ${primaryAction}
      ${secondaryMenu}
    </div>

    <div
      class="detail-row"
      id="reservation-detail-${escapeHtml(reservationId)}"
    >
      ${renderReservationDetailPanel(reservation)}
    </div>
  </article>
`;
    }

    function renderReservationList(reservations, isHistorySection) {
      return `
        <div class="reservation-card-list ${isHistorySection ? "history-list" : "active-list"}">
          ${reservations.map(function (reservation) {
            return renderReservationCard(reservation, isHistorySection);
          }).join("")}
        </div>
      `;
    }

    function renderReservationSection(title, reservations, emptyText, sectionClass, isHistorySection) {
      const countText = getReservationsCountText(reservations.length);

      const content = reservations.length
        ? renderReservationList(reservations, isHistorySection)
        : `<p class="section-empty-note">${escapeHtml(emptyText)}</p>`;

      return `
        <section class="reservation-section ${escapeHtml(sectionClass)}">
          <div class="reservation-section-header">
            <h2>${escapeHtml(title)}</h2>
            <span>${escapeHtml(countText)}</span>
          </div>

          ${content}
        </section>
      `;
    }

    function renderReservations() {
      const reservations = supabaseReservations;

      if (!reservations.length) {
        renderEmptyState();
        return;
      }

      const sortedReservations = reservations.slice().sort(function (a, b) {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });

      const activeReservations = sortedReservations.filter(function (reservation) {
        return safeIsOpenReservationStatus(getSafeReservationStatus(reservation));
      });

      document.getElementById("reservationsList").innerHTML =
        renderReservationSection(
          reservationsTranslate("reservations.activeTitle", "Aktivní rezervace"),
          activeReservations,
          reservationsTranslate("reservations.activeEmpty", "Nemáte žádné aktivní rezervace. Dokončené, zrušené a odmítnuté záznamy najdete v Historii."),
          "active",
          false
        );
    }

    async function initializeReservationsPage() {
      const verifiedUser = await window.rentuloAuthGuard.requireUser();

      if (!verifiedUser) {
        return;
      }

      renderSharedNavigation("muj-ucet");
      renderLoadingState();
      reservationsLoadState = "loading";

      const currentUser = await apiGetCurrentUser();

      if (!currentUser) {
        window.location.href = "prihlaseni.html";
        return;
      }

      supabaseReservations = await loadMyReservationsFromSupabase();
      supabaseReviews = reservationsLoadState === "ready"
        ? await loadMyReviewsFromSupabase()
        : [];

      renderSharedNavigation("muj-ucet");

      if (reservationsLoadState === "ready") {
        renderReservations();
      } else if (reservationsLoadState === "error") {
        renderLoadErrorState();
      }
    }

    function captureReservationsUiState() {
      const openDetailIds = Array.from(
        document.querySelectorAll("#reservationsList .detail-row.open[id]")
      ).map(function (element) {
        return element.id;
      });
      const reviewValues = {};

      document.querySelectorAll("#reservationsList select[id], #reservationsList textarea[id]")
        .forEach(function (element) {
          reviewValues[element.id] = element.value;
        });

      return {
        openDetailIds: openDetailIds,
        reviewValues: reviewValues
      };
    }

    function restoreReservationsUiState(state) {
      if (!state) {
        return;
      }

      state.openDetailIds.forEach(function (detailId) {
        const detail = document.getElementById(detailId);

        if (!detail) {
          return;
        }

        detail.classList.add("open");

        const reservationId = detailId.replace("reservation-detail-", "");
        const button = document.getElementById("detail-toggle-" + reservationId);

        if (button) {
          button.textContent = reservationsTranslate("reservations.hideDetail", "Skrýt detail");
        }
      });

      Object.keys(state.reviewValues).forEach(function (elementId) {
        const element = document.getElementById(elementId);

        if (element) {
          element.value = state.reviewValues[elementId];
        }
      });
    }

    function rerenderReservationsForLanguageChange() {
      const uiState = captureReservationsUiState();
      renderReservations();
      restoreReservationsUiState(uiState);
    }
function closeReservationMoreMenus(exceptMenu = null) {
  document
    .querySelectorAll(".reservation-more-menu[open]")
    .forEach(function (menu) {
      if (menu !== exceptMenu) {
        menu.removeAttribute("open");
      }
    });
}

function handleReservationMenuOutsideClick(event) {
  const clickedMenu = event.target.closest(".reservation-more-menu");

  closeReservationMoreMenus(clickedMenu);
}
    async function handleReservationsActionClick(event) {
      const actionButton = event.target.closest("[data-reservations-action]");

      if (!actionButton) {
        return;
      }
const actionMenu = actionButton.closest(".reservation-more-menu");

if (actionMenu) {
  actionMenu.removeAttribute("open");
}
      const action = actionButton.dataset.reservationsAction;
      const reservationId = actionButton.dataset.reservationId;

      if (action === "retry-load") {
        if (actionButton.dataset.busy === "true") {
          return;
        }

        actionButton.dataset.busy = "true";
        actionButton.disabled = true;

        try {
          await retryLoadReservations();
        } finally {
          if (actionButton.isConnected) {
            delete actionButton.dataset.busy;
            actionButton.disabled = false;
          }
        }

        return;
      }

      if (!reservationId) {
        return;
      }

      const mutationActions = new Set(["save-review", "pay", "cancel"]);
      const isMutationAction = mutationActions.has(action);

      if (isMutationAction && actionButton.dataset.busy === "true") {
        return;
      }

      if (isMutationAction) {
        actionButton.dataset.busy = "true";
        actionButton.disabled = true;
      }

      try {
        if (action === "save-review") {
          await saveRenterReview(reservationId);
          return;
        }

        if (action === "pay") {
          await payReservation(reservationId);
          return;
        }

        if (action === "cancel") {
          await cancelReservation(reservationId);
          return;
        }

        if (action === "toggle-detail") {
          const toggleButton = actionButton.dataset.usePrimaryToggle === "true"
            ? document.getElementById("detail-toggle-" + reservationId) || actionButton
            : actionButton;

          toggleReservationDetail(reservationId, toggleButton);
        }
      } finally {
        if (isMutationAction && actionButton.isConnected) {
          delete actionButton.dataset.busy;
          actionButton.disabled = false;
        }
      }
    }

    document.addEventListener("click", handleReservationsActionClick);
document.addEventListener("click", handleReservationMenuOutsideClick);
    document.addEventListener("DOMContentLoaded", function () {
      initializeReservationsPage();
    });

    document.addEventListener("rentuloLanguageChanged", function () {
      renderSharedNavigation("muj-ucet");

      if (reservationsLoadState === "loading") {
        renderLoadingState();
      } else if (reservationsLoadState === "error") {
        renderLoadErrorState();
      } else if (reservationsLoadState === "ready") {
        rerenderReservationsForLanguageChange();
      }
    });
