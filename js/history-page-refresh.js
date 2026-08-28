(function () {
  function historyRefreshExtraT(key, fallback) {
    return typeof window.historyExtraT === "function"
      ? window.historyExtraT(key, fallback)
      : fallback;
  }

  function historyRefreshCounterpart(reservation, role) {
    const ownerName = reservation.owner_name || reservation.ownerName || historyT("history.fallback.owner", "Majitel");
    const renterName = reservation.renter_name || reservation.renterName || historyT("history.fallback.renter", "Zákazník");

    return role === "renter"
      ? {
          label: historyT("history.detail.owner", "Majitel"),
          name: ownerName
        }
      : {
          label: historyT("history.detail.renter", "Zájemce"),
          name: renterName
        };
  }

  function historyRefreshPhotoMarkup(reservation, name) {
    const photoUrl = reservation.photo_url || reservation.photoUrl || "";

    if (!photoUrl) {
      return '<div class="history-row-photo history-row-photo-empty" aria-hidden="true"></div>';
    }

    return `
      <div class="history-row-photo">
        <img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(name)}" loading="lazy" />
      </div>
    `;
  }

  historyRenderReviewForm = function (reservation, role) {
    if (!historyCanReview(reservation)) return "";

    const reservationId = historyGetReservationId(reservation);
    const currentUserId = String(historyCurrentUser.id);
    const existingReview = historyFindReview(reservationId, currentUserId);
    const isRenter = role === "renter";
    const title = isRenter
      ? historyT("history.review.rateOwner", "Ohodnotit majitele")
      : historyT("history.review.rateRenter", "Ohodnotit zákazníka");
    const ratingInputId = "history-rating-" + reservationId + "-" + role;

    if (existingReview) {
      return historyRenderSavedReview(
        existingReview,
        historyT("history.review.sentTitle", "Hodnocení bylo odesláno")
      );
    }

    const stars = [1, 2, 3, 4, 5].map(function (rating) {
      return `
        <button
          type="button"
          class="history-star-button"
          data-history-star="${rating}"
          data-history-rating-target="${escapeHtml(ratingInputId)}"
          aria-label="${rating} / 5"
          aria-pressed="false"
        >★</button>
      `;
    }).join("");

    return `
      <div class="history-review-box">
        <strong>${escapeHtml(title)}</strong>
        <div class="history-rating-control">
          <span>${escapeHtml(historyT("history.review.stars", "Počet hvězdiček"))}</span>
          <div class="history-star-picker" role="group" aria-label="${escapeHtml(historyT("history.review.stars", "Počet hvězdiček"))}">
            ${stars}
          </div>
          <input id="${escapeHtml(ratingInputId)}" type="hidden" value="" data-history-rating />
        </div>
        <label>
          ${escapeHtml(historyRefreshExtraT("history.review.commentOptional", "Komentář (nepovinný)"))}
          <textarea id="history-text-${escapeHtml(reservationId)}-${escapeHtml(role)}" rows="3" placeholder="${escapeHtml(historyT("history.review.placeholder", "Jak proběhlo půjčení?"))}"></textarea>
        </label>
        <button type="button" class="history-primary-button" data-history-review="${escapeHtml(reservationId)}" data-history-role="${escapeHtml(role)}" disabled>
          ${escapeHtml(historyT("history.review.submit", "Odeslat hodnocení"))}
        </button>
      </div>
    `;
  };

  historyRenderDetail = function (reservation, role) {
    const reservationId = historyGetReservationId(reservation);
    const startDate = reservation.date_from || reservation.start_date || reservation.startDate || "";
    const endDate = reservation.date_to || reservation.end_date || reservation.endDate || "";
    const price = Number(reservation.total_price || reservation.totalPrice || 0);
    const counterpart = historyRefreshCounterpart(reservation, role);

    return `
      <div class="history-detail" id="history-detail-${escapeHtml(reservationId)}-${escapeHtml(role)}">
        <div class="history-detail-grid">
          <div><span>${escapeHtml(historyT("history.detail.term", "Termín"))}</span><strong>${escapeHtml(historyFormatDate(startDate))} – ${escapeHtml(historyFormatDate(endDate))}</strong></div>
          <div><span>${escapeHtml(historyT("history.detail.total", "Celková cena"))}</span><strong>${escapeHtml(historyFormatMoney(price))}</strong></div>
          <div><span>${escapeHtml(counterpart.label)}</span><strong>${escapeHtml(counterpart.name)}</strong></div>
        </div>
        <div class="history-review-grid">
          ${historyRenderReviewForm(reservation, role)}
          ${historyRenderReceivedReview(reservation, role)}
        </div>
      </div>
    `;
  };

  historyRenderRow = function (reservation, role) {
    const reservationId = historyGetReservationId(reservation);
    const name = reservation.offer_name || reservation.offerName || historyT("history.fallback.offer", "Nabídka");
    const startDate = reservation.date_from || reservation.start_date || reservation.startDate || "";
    const endDate = reservation.date_to || reservation.end_date || reservation.endDate || "";
    const price = Number(reservation.total_price || reservation.totalPrice || 0);
    const normalizedStatus = historyNormalizeStatus(reservation.status);
    const status = historyStatusText(reservation.status);
    const counterpart = historyRefreshCounterpart(reservation, role);

    return `
      <article class="history-record">
        <div class="simple-reservation-row">
          <div class="simple-reservation-main">
            ${historyRefreshPhotoMarkup(reservation, name)}
            <div class="simple-reservation-info">
              <strong>${escapeHtml(name)}</strong>
              <span>${escapeHtml(counterpart.label)}: ${escapeHtml(counterpart.name)}</span>
            </div>
          </div>
          <div class="simple-reservation-date">${escapeHtml(historyFormatDate(startDate))} – ${escapeHtml(historyFormatDate(endDate))}</div>
          <div class="simple-reservation-price">${escapeHtml(historyFormatMoney(price))}</div>
          <div class="simple-reservation-status status-${escapeHtml(normalizedStatus)}">${escapeHtml(status)}</div>
          <button type="button" class="history-detail-button" data-history-toggle="${escapeHtml(reservationId)}" data-history-role="${escapeHtml(role)}">${escapeHtml(historyT("history.detail.show", "Detail rezervace"))}</button>
        </div>
        ${historyRenderDetail(reservation, role)}
      </article>
    `;
  };

  historySyncReviewSubmitButton = function (ratingElement) {
    if (!ratingElement) return;

    const reviewBox = ratingElement.closest(".history-review-box");
    const submitButton = reviewBox ? reviewBox.querySelector("[data-history-review]") : null;
    if (!submitButton || submitButton.dataset.busy === "true") return;

    const rating = Number(ratingElement.value || 0);
    submitButton.disabled = !(rating >= 1 && rating <= 5);

    if (reviewBox) {
      reviewBox.querySelectorAll("[data-history-star]").forEach(function (starButton) {
        const starRating = Number(starButton.dataset.historyStar || 0);
        const selected = rating >= starRating;
        starButton.classList.toggle("selected", selected);
        starButton.setAttribute("aria-pressed", selected ? "true" : "false");
      });
    }
  };

  historySaveReview = async function (reservationId, role) {
    const reservation = historyReservations.find(function (item) {
      return historyGetReservationId(item) === String(reservationId);
    });

    if (!reservation || !historyCanReview(reservation)) {
      historyShowErrorNotice(historyT("history.error.afterReturn", "Hodnocení lze odeslat až po vrácení věci."));
      return;
    }

    const currentUserId = String(historyCurrentUser.id);
    if (historyFindReview(reservationId, currentUserId)) {
      historyShowErrorNotice(historyT("history.error.alreadyReviewed", "Tuto rezervaci jste už hodnotili."));
      return;
    }

    const ratingElement = document.getElementById("history-rating-" + reservationId + "-" + role);
    const textElement = document.getElementById("history-text-" + reservationId + "-" + role);
    const rating = Number(ratingElement ? ratingElement.value : 0);
    const text = textElement ? textElement.value.trim() : "";

    if (!rating || rating < 1 || rating > 5) {
      historyShowErrorNotice(historyT("history.error.selectStars", "Vyberte počet hvězdiček."));
      return;
    }

    const reviewedUserId = role === "renter"
      ? historyGetOwnerId(reservation)
      : historyGetRenterId(reservation);

    if (!reviewedUserId) {
      historyShowErrorNotice(historyT("history.error.userId", "Chybí ID hodnoceného uživatele."));
      return;
    }

    const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;
    if (!client) {
      historyShowErrorNotice(historyT("history.error.supabase", "Služba je dočasně nedostupná. Obnovte stránku."));
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
        historyShowErrorNotice(historyT("history.error.alreadyReviewed", "Tuto rezervaci jste už hodnotili."));
      } else {
        historyShowErrorNotice(historyT("history.error.save", "Hodnocení se nepodařilo uložit."));
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
  };

  document.addEventListener("click", function (event) {
    const starButton = event.target.closest("[data-history-star]");
    if (!starButton) return;

    const targetId = starButton.dataset.historyRatingTarget;
    const ratingElement = targetId ? document.getElementById(targetId) : null;
    if (!ratingElement) return;

    ratingElement.value = String(starButton.dataset.historyStar || "");
    historySyncReviewSubmitButton(ratingElement);
  });
})();
