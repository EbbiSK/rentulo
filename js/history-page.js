let historyCurrentUser = null;
let historyReservations = [];
let historyReviews = [];

function historyT(key, fallback, values) {
  let text = fallback || key;
  if (typeof window.rentuloTranslate === "function") {
    text = window.rentuloTranslate(key);
  }
  if (values) {
    Object.keys(values).forEach(function (name) {
      text = text.replace(new RegExp("\\{" + name + "\\}", "g"), String(values[name]));
    });
  }
  return text;
}

function historyLocale() {
  const language = typeof window.getRentuloLanguage === "function"
    ? window.getRentuloLanguage()
    : "cs";
  return language === "en" ? "en-GB" : language === "de" ? "de-DE" : "cs-CZ";
}

const HISTORY_FINISHED_STATUSES = new Set([
  "returned",
  "completed",
  "cancelled",
  "canceled",
  "rejected",
  "declined",
  "vráceno",
  "dokončeno",
  "zrušeno",
  "odmítnuto"
]);

function historyNormalizeStatus(status) {
  const rawStatus = String(status || "").trim().toLowerCase();

  if (typeof normalizeReservationStatus === "function") {
    return String(normalizeReservationStatus(status || "")).trim().toLowerCase();
  }

  return rawStatus;
}

function historyIsHistorical(reservation) {
  const rawStatus = String(reservation.status || "").trim().toLowerCase();
  const normalizedStatus = historyNormalizeStatus(reservation.status);
  return HISTORY_FINISHED_STATUSES.has(rawStatus) || HISTORY_FINISHED_STATUSES.has(normalizedStatus);
}

function historyCanReview(reservation) {
  const status = historyNormalizeStatus(reservation.status);
  return status === "returned" || status === "completed";
}

function historyGetReservationId(reservation) {
  return String(reservation.id || reservation.reservationId || "");
}

function historyGetOwnerId(reservation) {
  return String(reservation.owner_id || reservation.ownerId || "");
}

function historyGetRenterId(reservation) {
  return String(reservation.renter_id || reservation.renterId || "");
}

function historyGetOfferId(reservation) {
  return reservation.offer_id || reservation.offerId || null;
}

function historyGetSortTime(reservation) {
  const value = reservation.updated_at || reservation.updatedAt || reservation.created_at || reservation.createdAt || 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function historyFindReview(reservationId, reviewerId) {
  return historyReviews.find(function (review) {
    return String(review.reservation_id || "") === String(reservationId) &&
      String(review.reviewer_id || "") === String(reviewerId);
  }) || null;
}

function historyStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating || 0)));
  return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
}

function historyFormatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(historyLocale());
}

function historyFormatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(historyLocale());
}

function historyStatusText(status) {
  const normalizedStatus = historyNormalizeStatus(status);
  const statusMap = {
    returned: historyT("history.status.returned", "Vráceno"),
    completed: historyT("history.status.completed", "Dokončeno"),
    cancelled: historyT("history.status.cancelled", "Zrušeno"),
    canceled: historyT("history.status.cancelled", "Zrušeno"),
    rejected: historyT("history.status.rejected", "Odmítnuto"),
    declined: historyT("history.status.rejected", "Odmítnuto")
  };

  return statusMap[normalizedStatus] ||
    (typeof getReservationStatusText === "function" ? getReservationStatusText(normalizedStatus) : String(status || ""));
}

function historyRenderSavedReview(review, title) {
  if (!review) return "";

  return `
    <div class="history-review-box history-review-saved">
      <strong>${escapeHtml(title)}</strong>
      <div class="history-review-stars">${escapeHtml(historyStars(review.rating))}</div>
      <div>${escapeHtml(review.text || historyT("history.review.noComment", "Bez komentáře"))}</div>
      <small>${escapeHtml(historyT("history.review.sentAt", "Odesláno"))}: ${escapeHtml(historyFormatDateTime(review.created_at))}</small>
    </div>
  `;
}

function historyRenderReviewForm(reservation, role) {
  if (!historyCanReview(reservation)) return "";

  const reservationId = historyGetReservationId(reservation);
  const currentUserId = String(historyCurrentUser.id);
  const existingReview = historyFindReview(reservationId, currentUserId);
  const isRenter = role === "renter";
  const title = isRenter ? historyT("history.review.rateOwner", "Ohodnotit majitele") : historyT("history.review.rateRenter", "Ohodnotit zákazníka");

  if (existingReview) {
    return historyRenderSavedReview(existingReview, historyT("history.review.sentTitle", "Hodnocení bylo odesláno"));
  }

  return `
    <div class="history-review-box">
      <strong>${escapeHtml(title)}</strong>
      <label>
        ${escapeHtml(historyT("history.review.stars", "Počet hvězdiček"))}
        <select id="history-rating-${escapeHtml(reservationId)}-${escapeHtml(role)}">
          <option value="5">${escapeHtml(historyT("history.review.excellent", "★★★★★ - výborné"))}</option>
          <option value="4">${escapeHtml(historyT("history.review.good", "★★★★☆ - dobré"))}</option>
          <option value="3">${escapeHtml(historyT("history.review.average", "★★★☆☆ - průměrné"))}</option>
          <option value="2">${escapeHtml(historyT("history.review.weak", "★★☆☆☆ - slabé"))}</option>
          <option value="1">${escapeHtml(historyT("history.review.bad", "★☆☆☆☆ - špatné"))}</option>
        </select>
      </label>
      <label>
        ${escapeHtml(historyT("history.review.comment", "Komentář"))}
        <textarea id="history-text-${escapeHtml(reservationId)}-${escapeHtml(role)}" rows="3" placeholder="${escapeHtml(historyT("history.review.placeholder", "Jak proběhlo půjčení?"))}"></textarea>
      </label>
      <button type="button" class="history-primary-button" data-history-review="${escapeHtml(reservationId)}" data-history-role="${escapeHtml(role)}">
        ${escapeHtml(historyT("history.review.submit", "Odeslat hodnocení"))}
      </button>
    </div>
  `;
}

function historyRenderReceivedReview(reservation, role) {
  if (!historyCanReview(reservation)) return "";

  const reservationId = historyGetReservationId(reservation);
  const otherReviewerId = role === "renter" ? historyGetOwnerId(reservation) : historyGetRenterId(reservation);
  const review = historyFindReview(reservationId, otherReviewerId);
  const title = role === "renter" ? historyT("history.review.fromOwner", "Hodnocení od majitele") : historyT("history.review.fromRenter", "Hodnocení od zákazníka");

  if (!review) {
    return `
      <div class="history-review-box history-review-waiting">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(historyT("history.review.waiting", "Druhá strana vás zatím neohodnotila."))}</span>
      </div>
    `;
  }

  return historyRenderSavedReview(review, title);
}

function historyRenderDetail(reservation, role) {
  const reservationId = historyGetReservationId(reservation);
  const startDate = reservation.date_from || reservation.start_date || reservation.startDate || "";
  const endDate = reservation.date_to || reservation.end_date || reservation.endDate || "";
  const price = Number(reservation.total_price || reservation.totalPrice || 0);
  const ownerName = reservation.owner_name || reservation.ownerName || historyT("history.fallback.owner", "Majitel");
  const renterName = reservation.renter_name || reservation.renterName || historyT("history.fallback.renter", "Zákazník");
  const counterpartLabel = role === "renter" ? historyT("history.detail.owner", "Majitel") : historyT("history.detail.renter", "Zákazník");
  const counterpartName = role === "renter" ? ownerName : renterName;

  return `
    <div class="history-detail" id="history-detail-${escapeHtml(reservationId)}-${escapeHtml(role)}">
      <div class="history-detail-grid">
        <div><span>${escapeHtml(historyT("history.detail.term", "Termín"))}</span><strong>${escapeHtml(historyFormatDate(startDate))} – ${escapeHtml(historyFormatDate(endDate))}</strong></div>
        <div><span>${escapeHtml(historyT("history.detail.total", "Celková cena"))}</span><strong>${escapeHtml(price)} Kč</strong></div>
        <div><span>${escapeHtml(historyT("history.detail.status", "Stav"))}</span><strong>${escapeHtml(historyStatusText(reservation.status))}</strong></div>
        <div><span>${escapeHtml(counterpartLabel)}</span><strong>${escapeHtml(counterpartName)}</strong></div>
      </div>
      <div class="history-review-grid">
        ${historyRenderReviewForm(reservation, role)}
        ${historyRenderReceivedReview(reservation, role)}
      </div>
    </div>
  `;
}

function historyRenderRow(reservation, role) {
  const reservationId = historyGetReservationId(reservation);
  const name = reservation.offer_name || reservation.offerName || historyT("history.fallback.offer", "Nabídka");
  const startDate = reservation.date_from || reservation.start_date || reservation.startDate || "";
  const endDate = reservation.date_to || reservation.end_date || reservation.endDate || "";
  const price = Number(reservation.total_price || reservation.totalPrice || 0);
  const normalizedStatus = historyNormalizeStatus(reservation.status);
  const status = historyStatusText(reservation.status);

  return `
    <article class="history-record">
      <div class="simple-reservation-row">
        <div class="simple-reservation-main">
          <div class="simple-reservation-info"><strong>${escapeHtml(name)}</strong></div>
        </div>
        <div class="simple-reservation-date">${escapeHtml(historyFormatDate(startDate))} – ${escapeHtml(historyFormatDate(endDate))}</div>
        <div class="simple-reservation-price">${escapeHtml(price)} Kč</div>
        <div class="simple-reservation-status status-${escapeHtml(normalizedStatus)}">${escapeHtml(status)}</div>
        <button type="button" class="history-detail-button" data-history-toggle="${escapeHtml(reservationId)}" data-history-role="${escapeHtml(role)}">${escapeHtml(historyT("history.detail.show", "Detail"))}</button>
      </div>
      ${historyRenderDetail(reservation, role)}
    </article>
  `;
}

function historyRenderList(reservations, emptyText, role) {
  if (!reservations.length) {
    return `<p class="section-empty-note">${escapeHtml(emptyText)}</p>`;
  }

  return `<div class="reservation-card-list history-list">${reservations.map(function (reservation) {
    return historyRenderRow(reservation, role);
  }).join("")}</div>`;
}

function historyRenderAll() {
  const currentUserId = String(historyCurrentUser.id);
  const rentalHistory = historyReservations
    .filter(function (reservation) {
      return historyGetRenterId(reservation) === currentUserId && historyIsHistorical(reservation);
    })
    .sort(function (a, b) { return historyGetSortTime(b) - historyGetSortTime(a); });

  const offerHistory = historyReservations
    .filter(function (reservation) {
      return historyGetOwnerId(reservation) === currentUserId && historyIsHistorical(reservation);
    })
    .sort(function (a, b) { return historyGetSortTime(b) - historyGetSortTime(a); });

  document.getElementById("rentalHistoryList").innerHTML = historyRenderList(
    rentalHistory,
    historyT("history.empty.rentals", "Zatím nemáte žádné dokončené, zrušené ani odmítnuté rezervace."),
    "renter"
  );

  document.getElementById("offerHistoryList").innerHTML = historyRenderList(
    offerHistory,
    historyT("history.empty.offers", "Zatím nemáte žádné dokončené, zrušené ani odmítnuté žádosti k vašim nabídkám."),
    "owner"
  );
}

async function historyLoadReviews() {
  const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;
  if (!client || !historyCurrentUser) return [];

  const result = await client
    .from("reviews")
    .select("*")
    .or("reviewer_id.eq." + historyCurrentUser.id + ",reviewed_user_id.eq." + historyCurrentUser.id)
    .order("created_at", { ascending: false });

  if (result.error) {
    console.warn("Hodnocení se nepodařilo načíst.", result.error);
    return [];
  }

  return Array.isArray(result.data) ? result.data : [];
}

async function historySaveReview(reservationId, role) {
  const reservation = historyReservations.find(function (item) {
    return historyGetReservationId(item) === String(reservationId);
  });

  if (!reservation || !historyCanReview(reservation)) {
    alert(historyT("history.error.afterReturn", "Hodnocení lze odeslat až po vrácení věci."));
    return;
  }

  const currentUserId = String(historyCurrentUser.id);
  if (historyFindReview(reservationId, currentUserId)) {
    alert(historyT("history.error.alreadyReviewed", "Tuto rezervaci jste už hodnotili."));
    return;
  }

  const ratingElement = document.getElementById("history-rating-" + reservationId + "-" + role);
  const textElement = document.getElementById("history-text-" + reservationId + "-" + role);
  const rating = Number(ratingElement ? ratingElement.value : 0);
  const text = textElement ? textElement.value.trim() : "";

  if (!rating || rating < 1 || rating > 5) {
    alert(historyT("history.error.selectStars", "Vyberte počet hvězdiček."));
    return;
  }

  if (!text) {
    alert(historyT("history.error.comment", "Napište krátký komentář k půjčení."));
    return;
  }

  const reviewedUserId = role === "renter" ? historyGetOwnerId(reservation) : historyGetRenterId(reservation);
  if (!reviewedUserId) {
    alert(historyT("history.error.userId", "Chybí ID hodnoceného uživatele."));
    return;
  }

  const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;
  if (!client) {
    alert(historyT("history.error.supabase", "Supabase klient není dostupný."));
    return;
  }

  const result = await client.from("reviews").insert({
    reservation_id: reservationId,
    reviewer_id: historyCurrentUser.id,
    reviewed_user_id: reviewedUserId,
    offer_id: historyGetOfferId(reservation),
    rating: rating,
    text: text
  });

  if (result.error) {
    console.error("Chyba při ukládání hodnocení:", result.error);
    if (String(result.error.message || "").toLowerCase().includes("duplicate")) {
      alert(historyT("history.error.alreadyReviewed", "Tuto rezervaci jste už hodnotili."));
    } else {
      alert(historyT("history.error.save", "Hodnocení se nepodařilo uložit."));
    }
    return;
  }

  alert(historyT("history.success.saved", "Hodnocení bylo uloženo."));
  historyReviews = await historyLoadReviews();
  historyRenderAll();

  const detail = document.getElementById("history-detail-" + reservationId + "-" + role);
  if (detail) detail.classList.add("open");
}

document.addEventListener("click", function (event) {
  const toggle = event.target.closest("[data-history-toggle]");
  if (toggle) {
    const reservationId = toggle.dataset.historyToggle;
    const role = toggle.dataset.historyRole;
    const detail = document.getElementById("history-detail-" + reservationId + "-" + role);
    if (!detail) return;

    const willOpen = !detail.classList.contains("open");
    detail.classList.toggle("open", willOpen);
    toggle.textContent = willOpen ? historyT("history.detail.hide", "Skrýt detail") : historyT("history.detail.show", "Detail");
    return;
  }

  const reviewButton = event.target.closest("[data-history-review]");
  if (reviewButton) {
    historySaveReview(reviewButton.dataset.historyReview, reviewButton.dataset.historyRole);
  }
});

document.addEventListener("rentuloLanguageChanged", function () {
  if (historyCurrentUser) {
    historyRenderAll();
  }
});

document.addEventListener("DOMContentLoaded", async function () {
  historyCurrentUser = await apiGetCurrentUser();
  if (!historyCurrentUser) {
    window.location.href = "prihlaseni.html";
    return;
  }

  historyReservations = await apiGetReservations();
  historyReviews = await historyLoadReviews();
  historyRenderAll();

  const historyButtons = document.querySelectorAll(".history-switch-button");
  const rentalHistorySection = document.getElementById("rentalHistorySection");
  const offerHistorySection = document.getElementById("offerHistorySection");

  historyButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const selectedView = button.dataset.historyView;
      historyButtons.forEach(function (item) { item.classList.remove("active"); });
      button.classList.add("active");
      rentalHistorySection.hidden = selectedView !== "rentals";
      offerHistorySection.hidden = selectedView !== "offers";
    });
  });
});
