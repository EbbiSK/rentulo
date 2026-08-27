let historyCurrentUser = null;
let historyReservations = [];
let historyReviews = [];
let historyLoadState = "idle";

const HISTORY_LOCALES = {
  cs: "cs-CZ",
  sk: "sk-SK",
  en: "en-GB",
  de: "de-DE",
  pl: "pl-PL"
};

function historyT(key, fallback, values) {
  let text = fallback || key;
  if (typeof window.rentuloTranslate === "function") {
    text = window.rentuloTranslate(key);
  }
  if (text === key) {
    text = fallback || key;
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
  return HISTORY_LOCALES[language] || HISTORY_LOCALES.cs;
}

function historyFormatNumber(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return String(value === undefined || value === null ? "" : value);
  }

  return numberValue.toLocaleString(historyLocale());
}

function historyFormatMoney(value) {
  return historyFormatNumber(value) + " Kč";
}

let historySuccessNoticeTimer = null;

function historyShowSuccessNotice(message) {
  const historySwitch = document.querySelector(".history-switch");
  if (!historySwitch) return;

  let notice = document.getElementById("historySuccessNotice");
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "historySuccessNotice";
    notice.className = "history-success-notice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    notice.hidden = true;
    historySwitch.insertAdjacentElement("afterend", notice);
  }

  notice.textContent = "✓ " + message;
  notice.hidden = false;

  if (historySuccessNoticeTimer) {
    window.clearTimeout(historySuccessNoticeTimer);
  }

  historySuccessNoticeTimer = window.setTimeout(function () {
    notice.hidden = true;
    historySuccessNoticeTimer = null;
  }, 4500);
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
        <select id="history-rating-${escapeHtml(reservationId)}-${escapeHtml(role)}" data-history-rating>
          <option value="" selected disabled>${escapeHtml(historyT("history.review.select", "Vyberte hodnocení"))}</option>
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
      <button type="button" class="history-primary-button" data-history-review="${escapeHtml(reservationId)}" data-history-role="${escapeHtml(role)}" disabled>
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
        <div><span>${escapeHtml(historyT("history.detail.total", "Celková cena"))}</span><strong>${escapeHtml(historyFormatMoney(price))}</strong></div>
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
        <div class="simple-reservation-price">${escapeHtml(historyFormatMoney(price))}</div>
        <div class="simple-reservation-status status-${escapeHtml(normalizedStatus)}">${escapeHtml(status)}</div>
        <button type="button" class="history-detail-button" data-history-toggle="${escapeHtml(reservationId)}" data-history-role="${escapeHtml(role)}">${escapeHtml(historyT("history.detail.show", "Detail rezervace"))}</button>
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

function historyRenderState(title, text, allowRetry) {
  return `
    <div class="section-empty-note history-state-note">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(text)}</span>
      ${allowRetry ? `
        <button type="button" class="history-primary-button" data-history-retry>
          ${escapeHtml(historyT("history.loadError.retry", "Zkusit znovu"))}
        </button>
      ` : ""}
    </div>
  `;
}

function historyRenderLoadingState() {
  historyLoadState = "loading";
  const markup = historyRenderState(
    historyT("history.loading.title", "Načítám historii..."),
    historyT("history.loading.text", "Chvíli strpení, načítáme rezervace a hodnocení."),
    false
  );

  document.getElementById("rentalHistoryList").innerHTML = markup;
  document.getElementById("offerHistoryList").innerHTML = markup;
}

function historyRenderLoadErrorState() {
  historyLoadState = "error";
  const markup = historyRenderState(
    historyT("history.loadError.title", "Historii se nepodařilo načíst."),
    historyT("history.loadError.text", "Obnovte stránku nebo zkuste načtení znovu."),
    true
  );

  document.getElementById("rentalHistoryList").innerHTML = markup;
  document.getElementById("offerHistoryList").innerHTML = markup;
}

function historySyncReviewSubmitButton(ratingElement) {
  if (!ratingElement) return;

  const reviewBox = ratingElement.closest(".history-review-box");
  const submitButton = reviewBox ? reviewBox.querySelector("[data-history-review]") : null;
  if (!submitButton || submitButton.dataset.busy === "true") return;

  const rating = Number(ratingElement.value || 0);
  submitButton.disabled = !(rating >= 1 && rating <= 5);
}

function historyCaptureUiState() {
  const openDetailIds = Array.from(document.querySelectorAll(".history-detail.open"))
    .map(function (detail) { return detail.id; });
  const reviewValues = {};

  document
    .querySelectorAll('[id^="history-rating-"], [id^="history-text-"]')
    .forEach(function (element) {
      reviewValues[element.id] = element.value;
    });

  return {
    openDetailIds: openDetailIds,
    reviewValues: reviewValues
  };
}

function historyRestoreUiState(state) {
  if (!state) return;

  const openDetailIds = new Set(state.openDetailIds || []);

  document.querySelectorAll("[data-history-toggle]").forEach(function (toggle) {
    const detailId = "history-detail-" + toggle.dataset.historyToggle + "-" + toggle.dataset.historyRole;
    const detail = document.getElementById(detailId);
    const shouldOpen = Boolean(detail && openDetailIds.has(detailId));

    if (detail) {
      detail.classList.toggle("open", shouldOpen);
    }

    toggle.textContent = shouldOpen
      ? historyT("history.detail.hide", "Skrýt detail")
      : historyT("history.detail.show", "Detail rezervace");
  });

  Object.keys(state.reviewValues || {}).forEach(function (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.value = state.reviewValues[elementId];
    }
  });

  document.querySelectorAll("[data-history-rating]").forEach(function (ratingElement) {
    historySyncReviewSubmitButton(ratingElement);
  });
}

function historyRerenderForLanguageChange() {
  const uiState = historyCaptureUiState();
  historyRenderAll();
  historyRestoreUiState(uiState);
}

function historyRenderAll() {
  historyLoadState = "ready";
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

async function historyLoadReservations() {
  const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;
  if (!client) {
    return { data: [], error: new Error("Supabase client is unavailable.") };
  }

  try {
    const result = await client.rpc("get_my_reservations");

    if (result.error) {
      console.warn("Historii rezervací se nepodařilo načíst.", result.error);
      return { data: [], error: result.error };
    }

    const rows = Array.isArray(result.data) ? result.data : [];
    const reservations = rows.map(function (row) {
      return typeof apiNormalizeReservation === "function"
        ? apiNormalizeReservation(row)
        : row;
    });

    return { data: reservations, error: null };
  } catch (error) {
    console.warn("Historii rezervací se nepodařilo načíst.", error);
    return { data: [], error: error };
  }
}

async function historyLoadReviews() {
  const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;
  if (!client || !historyCurrentUser) {
    return { data: [], error: new Error("Review data is unavailable.") };
  }

  try {
    const result = await client
      .from("reviews")
      .select("*")
      .or("reviewer_id.eq." + historyCurrentUser.id + ",reviewed_user_id.eq." + historyCurrentUser.id)
      .order("created_at", { ascending: false });

    if (result.error) {
      console.warn("Hodnocení se nepodařilo načíst.", result.error);
      return { data: [], error: result.error };
    }

    return {
      data: Array.isArray(result.data) ? result.data : [],
      error: null
    };
  } catch (error) {
    console.warn("Hodnocení se nepodařilo načíst.", error);
    return { data: [], error: error };
  }
}

async function historyLoadData() {
  historyRenderLoadingState();

  const results = await Promise.all([
    historyLoadReservations(),
    historyLoadReviews()
  ]);
  const reservationResult = results[0];
  const reviewResult = results[1];

  if (reservationResult.error || reviewResult.error) {
    historyRenderLoadErrorState();
    return false;
  }

  historyReservations = reservationResult.data;
  historyReviews = reviewResult.data;
  historyRenderAll();
  return true;
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
    alert(historyT("history.error.supabase", "Služba je dočasně nedostupná. Obnovte stránku."));
    return;
  }

  const result = await client
    .from("reviews")
    .insert({
      reservation_id: reservationId,
      rating: rating,
      text: text
    })
    .select("reservation_id, reviewer_id, reviewed_user_id, rating, text, created_at")
    .single();

  if (result.error) {
    console.error("Chyba při ukládání hodnocení:", result.error);
    if (String(result.error.message || "").toLowerCase().includes("duplicate")) {
      alert(historyT("history.error.alreadyReviewed", "Tuto rezervaci jste už hodnotili."));
    } else {
      alert(historyT("history.error.save", "Hodnocení se nepodařilo uložit."));
    }
    return;
  }

  const uiState = historyCaptureUiState();
  historyReviews.unshift(result.data);

  historyRenderAll();
  historyRestoreUiState(uiState);

  const detail = document.getElementById("history-detail-" + reservationId + "-" + role);
  if (detail) detail.classList.add("open");

  historyShowSuccessNotice(historyT("history.success.saved", "Hodnocení bylo uloženo."));
}

document.addEventListener("change", function (event) {
  const ratingElement = event.target.closest("[data-history-rating]");
  if (!ratingElement) return;

  historySyncReviewSubmitButton(ratingElement);
});

document.addEventListener("click", async function (event) {
  const toggle = event.target.closest("[data-history-toggle]");
  if (toggle) {
    const reservationId = toggle.dataset.historyToggle;
    const role = toggle.dataset.historyRole;
    const detail = document.getElementById("history-detail-" + reservationId + "-" + role);
    if (!detail) return;

    const willOpen = !detail.classList.contains("open");
    detail.classList.toggle("open", willOpen);
    toggle.textContent = willOpen ? historyT("history.detail.hide", "Skrýt detail") : historyT("history.detail.show", "Detail rezervace");
    return;
  }

  const retryButton = event.target.closest("[data-history-retry]");
  if (retryButton) {
    if (retryButton.dataset.busy === "true") return;

    retryButton.dataset.busy = "true";
    retryButton.disabled = true;

    try {
      await historyLoadData();
    } finally {
      if (retryButton.isConnected) {
        delete retryButton.dataset.busy;
        retryButton.disabled = false;
      }
    }

    return;
  }

  const reviewButton = event.target.closest("[data-history-review]");
  if (reviewButton) {
    if (reviewButton.dataset.busy === "true") return;

    reviewButton.dataset.busy = "true";
    reviewButton.disabled = true;

    try {
      await historySaveReview(reviewButton.dataset.historyReview, reviewButton.dataset.historyRole);
    } finally {
      if (reviewButton.isConnected) {
        delete reviewButton.dataset.busy;
        reviewButton.disabled = false;
      }
    }
  }
});

document.addEventListener("rentuloLanguageChanged", function () {
  if (typeof renderSharedNavigation === "function") {
    renderSharedNavigation("historie");
  }

  if (!historyCurrentUser) return;

  if (historyLoadState === "loading") {
    historyRenderLoadingState();
  } else if (historyLoadState === "error") {
    historyRenderLoadErrorState();
  } else if (historyLoadState === "ready") {
    historyRerenderForLanguageChange();
  }
});

document.addEventListener("DOMContentLoaded", async function () {
  if (!window.rentuloAuthGuard) {
    window.location.replace("prihlaseni.html?returnTo=historie.html");
    return;
  }

  historyCurrentUser = await window.rentuloAuthGuard.requireUser();
  if (!historyCurrentUser) return;

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

  await historyLoadData();
});
