  const PLATFORM_FEE_PERCENT = 10;
    let supabaseReservations = [];
    let supabaseReviews = [];

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

    function escapeHtml(text) {
      return String(text === undefined || text === null ? "" : text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function getStars(rating) {
      const count = Number(rating) || 0;
      let stars = "";

      for (let i = 1; i <= 5; i++) {
        stars += i <= count ? "★" : "☆";
      }

      return stars;
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
          <span>Odesláno: ${escapeHtml(formatDateTime(review.created_at))}</span>
        </div>
      `;
    }

    function formatDate(dateString) {
      if (!dateString) {
        return "-";
      }

      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return dateString;
      }

      return date.toLocaleDateString("cs-CZ");
    }

    function formatDateTime(dateString) {
      if (!dateString) {
        return "-";
      }

      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return dateString;
      }

      return date.toLocaleString("cs-CZ");
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
        naradiId: row.offer_id,

        ownerId: row.owner_id,
        renterId: row.renter_id,

        toolName: row.offer_name || "Nářadí",
        offerName: row.offer_name || "Nářadí",
        naradiName: row.offer_name || "Nářadí",

        category: row.category || "Nářadí",
        city: row.city || "",

        pricePerDay: Number(row.price_per_day || 0),
        price: Number(row.price_per_day || 0),
        deposit: Number(row.deposit || 0),

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

        ownerName: row.owner_name || "Majitel",
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

        source: "supabase"
      };
    }

    async function loadMyReservationsFromSupabase() {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        return [];
      }

      const supabaseUser = await getCurrentSupabaseUser();

      if (!supabaseUser) {
        window.location.href = "prihlaseni.html";
        return [];
      }

      const { data, error } = await supabaseClient
        .from("reservations")
        .select("*")
        .eq("renter_id", supabaseUser.id)
        .order("created_at", {
          ascending: false
        });

      if (error) {
        console.error(error);
        alert("Rezervace se nepodařilo načíst ze Supabase. Podívejte se prosím do konzole.");
        return [];
      }

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
      if (typeof getReservationToolName === "function") {
        return getReservationToolName(reservation);
      }

      return reservation.toolName || reservation.offerName || reservation.naradiName || "Nářadí";
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

      return reservation.offerId || reservation.toolId || reservation.naradiId || "";
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
      return reservation.ownerName || reservation.owner || "Majitel";
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

    function getReservationPhoto() {
      return "";
    }

    function renderToolThumb(reservation) {
      const toolName = getSafeReservationToolName(reservation);
      const photo = getReservationPhoto(reservation);

      if (photo) {
        return `
          <div class="tool-thumb">
            <img src="${escapeHtml(photo)}" alt="${escapeHtml(toolName)}">
          </div>
        `;
      }

      return `
        <div class="tool-thumb">⌁</div>
      `;
    }

    function renderEmptyState() {
      document.getElementById("reservationsList").innerHTML = `
        <section class="account-empty-state">
          <h2>Zatím nemáte žádné rezervace.</h2>
          <p>Najděte nářadí ve svém okolí a pošlete první žádost o půjčení.</p>
          <a href="vysledky.html">Najít nářadí</a>
        </section>
      `;
    }

    function renderLoadingState() {
      document.getElementById("reservationsList").innerHTML = `
        <section class="account-empty-state">
          <h2>Načítám rezervace...</h2>
          <p>Chvíli strpení, načítáme vaše rezervace ze Supabase.</p>
        </section>
      `;
    }

    async function payReservation(reservationId) {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        alert("Supabase klient není načtený.");
        return;
      }

      const supabaseUser = await getCurrentSupabaseUser();

      if (!supabaseUser) {
        alert("Pro zaplacení se musíte znovu přihlásit.");
        window.location.href = "prihlaseni.html";
        return;
      }

      const confirmPayment = confirm(
        "Toto je testovací platba. Opravdu chcete označit rezervaci jako zaplacenou?"
      );

      if (!confirmPayment) {
        return;
      }

      const { data, error } = await supabaseClient
        .from("reservations")
        .update({
          status: "paid",
          contact_visible_after_payment: true,
          paid_at: new Date().toISOString(),
          payment_provider_status: "paid_test"
        })
        .eq("id", reservationId)
        .eq("renter_id", supabaseUser.id)
        .select()
        .single();

      if (error) {
        console.error(error);
        alert("Platbu se nepodařilo uložit do Supabase. Podívejte se prosím do konzole.");
        return;
      }

      

        

      supabaseReservations = await loadMyReservationsFromSupabase();
      supabaseReviews = await loadMyReviewsFromSupabase();

      renderSharedNavigation("muj-ucet");
      renderReservations();

      openReservationDetail(reservationId);
    }

    async function saveRenterReview(reservationId) {
      const reservation = supabaseReservations.find(function (item) {
        const itemId = item.id || item.reservationId;
        return String(itemId) === String(reservationId);
      });

      if (!reservation) {
        alert("Rezervace nebyla nalezena.");
        return;
      }

      const supabaseUser = await getCurrentSupabaseUser();

      if (!supabaseUser || !supabaseUser.id) {
        alert("Pro odeslání hodnocení se musíte přihlásit.");
        return;
      }

      const existingReview = findRenterReviewForReservation(reservation);

      if (existingReview) {
        alert("Tuto rezervaci jste už hodnotili.");
        return;
      }

      const ratingElement = document.getElementById("renter-review-rating-" + reservationId);
      const textElement = document.getElementById("renter-review-text-" + reservationId);

      const rating = Number(ratingElement ? ratingElement.value : 0);
      const text = textElement ? textElement.value.trim() : "";

      if (!rating || rating < 1 || rating > 5) {
        alert("Vyberte počet hvězdiček.");
        return;
      }

      if (!text) {
        alert("Napište krátký komentář k půjčení.");
        return;
      }

      const reviewToInsert = {
        reservation_id: reservation.id || reservation.reservationId,
        reviewer_id: supabaseUser.id,
        reviewed_user_id: reservation.ownerId,
        offer_id: reservation.offerId,
        rating: rating,
        text: text
      };

      if (!reviewToInsert.reviewed_user_id) {
        alert("Chybí ID majitele pro hodnocení.");
        return;
      }

      const reviewSupabaseClient = getSupabaseClient();

      if (!reviewSupabaseClient) {
        alert("Supabase klient není dostupný. Obnovte stránku a zkuste to znovu.");
        return;
      }

      const { error } = await reviewSupabaseClient
        .from("reviews")
        .insert(reviewToInsert);

      if (error) {
        console.error("Chyba při ukládání hodnocení:", error);

        if (String(error.message || "").includes("duplicate")) {
          alert("Tuto rezervaci jste už hodnotili.");
        } else {
          alert("Hodnocení se nepodařilo uložit.");
        }

        return;
      }

      alert("Hodnocení bylo uloženo.");
      supabaseReservations = await loadMyReservationsFromSupabase();
      supabaseReviews = await loadMyReviewsFromSupabase();
      renderReservations();
      openReservationDetail(reservationId);
    }

    function openReservationDetail(reservationId) {
      setTimeout(function () {
        const detail = document.getElementById("reservation-detail-" + reservationId);

        if (detail) {
          detail.classList.add("open");
        }

        const button = document.getElementById("detail-toggle-" + reservationId);

        if (button) {
          button.textContent = "Skrýt detail";
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
        button.textContent = "Detail";
        return;
      }

      detail.classList.add("open");
      button.textContent = "Skrýt detail";
    }

    function renderOwnerReviewForRenterBox(reservation, status) {
      if (status !== "returned") {
        return "";
      }

      const ownerReview = findOwnerReviewForReservation(reservation);

      if (ownerReview) {
        return `
          <div class="review-box">
            <strong>Hodnocení od majitele</strong>
            ${renderSavedReview(ownerReview)}
          </div>
        `;
      }

      return `
        <div class="review-box">
          <strong>Hodnocení od majitele</strong>
          Majitel vás zatím neohodnotil.
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
            <strong>Hodnocení bylo odesláno</strong>
            ${renderSavedReview(renterReview)}
          </div>
        `;
      }

      return `
        <div class="review-box">
          <strong>Ohodnotit majitele</strong>
          <div class="review-lines">
            <label>
              Počet hvězdiček
              <select id="renter-review-rating-${reservationId}">
                <option value="5">★★★★★ - výborné</option>
                <option value="4">★★★★☆ - dobré</option>
                <option value="3">★★★☆☆ - průměrné</option>
                <option value="2">★★☆☆☆ - slabé</option>
                <option value="1">★☆☆☆☆ - špatné</option>
              </select>
            </label>

            <label>
              Komentář
              <textarea id="renter-review-text-${reservationId}" rows="3" placeholder="Jak proběhlo půjčení?"></textarea>
            </label>

            <button type="button" class="btn-primary small-button" onclick="saveRenterReview('${reservationId}')">
              Odeslat hodnocení
            </button>
          </div>
        </div>
      `;
    }

    function renderPaymentBox(reservation, status, totalPrice, platformFee, ownerPayout) {
      if (normalizeReservationStatus(status) === RESERVATION_STATUS_APPROVED) {
        return `
          <div class="payment-box waiting">
            <strong>Platba přes provozovatele platformy</strong>
            Kliknutím na tlačítko Zaplatit provedete testovací platbu.
            <div class="payment-lines">
              <span>Celkem zaplatíte: ${escapeHtml(totalPrice)} Kč</span>
              <span>Provize Rentulo 10 %: ${escapeHtml(platformFee)} Kč</span>
              <span>Majitel dostane: ${escapeHtml(ownerPayout)} Kč</span>
            </div>
          </div>
        `;
      }

      if (getSafeReservationContactVisible(status)) {
        const paymentTitle =
  normalizeReservationStatus(status) === RESERVATION_STATUS_RETURNED
          ? "Platba byla přijata a půjčení je dokončeno"
          : "Platba přijata přes provozovatele platformy";

        return `
          <div class="payment-box paid">
            <strong>${paymentTitle}</strong>
            Rentulo si ponechá provizi 10 % a majiteli bude vyplaceno 90 % z půjčovného.
            <div class="payment-lines">
              <span>Celkem zaplaceno: ${escapeHtml(totalPrice)} Kč</span>
              <span>Provize Rentulo: ${escapeHtml(platformFee)} Kč</span>
              <span>Částka pro majitele: ${escapeHtml(ownerPayout)} Kč</span>
              <span>Stav platby: ${escapeHtml(reservation.paymentProviderStatus || "paid")}</span>
              <span>Zaplaceno: ${escapeHtml(formatDateTime(reservation.paidAt))}</span>
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
            <strong>Žádost čeká na potvrzení</strong>
            Majitel zatím vaši žádost nepotvrdil.
          </div>
        `;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_APPROVED) {
        return `
          <div class="reservation-state-box active">
            <strong>Žádost je potvrzená</strong>
            Teď můžete dokončit platbu. Po zaplacení se zobrazí telefon a přesná adresa.
          </div>
        `;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PAID) {
        return `
          <div class="reservation-state-box active">
            <strong>Zaplaceno – domluvte se s majitelem na předání</strong>
            Kontaktujte majitele a domluvte si přesný čas vyzvednutí.
          </div>
        `;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PICKED_UP) {
        return `
          <div class="reservation-state-box active">
            <strong>Nářadí bylo označeno jako vyzvednuté</strong>
            Půjčení právě probíhá.
          </div>
        `;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_RETURNED) {
        return `
          <div class="reservation-state-box finished">
            <strong>Vráceno – půjčení je dokončeno</strong>
            Rezervace byla úspěšně ukončena. Už není potřeba žádná další akce.
          </div>
        `;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_REJECTED) {
        return `
          <div class="reservation-state-box rejected">
            <strong>Žádost byla odmítnuta</strong>
            Majitel vaši žádost odmítl.
          </div>
        `;
      }

      if (
  normalizeReservationStatus(status) ===
  RESERVATION_STATUS_CANCELLED
) {
        return `
          <div class="reservation-state-box rejected">
            <strong>Rezervace byla zrušena</strong>
            Tato rezervace už nepokračuje.
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
            <strong>Kontaktní údaje jsou skryté</strong>
            Telefon a přesná adresa se zobrazí až po zaplacení.
            <div class="contact-lines">
              <span>Město: ${escapeHtml(city)}</span>
            </div>
          </div>
        `;
      }

      const contactTitle =
  normalizeReservationStatus(status) === RESERVATION_STATUS_RETURNED
        ? "Kontaktní údaje k dokončené rezervaci"
        : "Údaje pro vyzvednutí";

      const returnedNote =
  normalizeReservationStatus(status) === RESERVATION_STATUS_RETURNED
        ? "<span>Rezervace je dokončená. Kontaktní údaje zůstávají dostupné, protože půjčení bylo zaplaceno.</span>"
        : "";

      return `
        <div class="contact-box visible">
          <strong>${contactTitle}</strong>
          <div class="contact-lines">
            ${returnedNote}
            <span>Telefon: ${escapeHtml(phone || "Telefon není uložen")}</span>
            <span>Adresa: ${escapeHtml(address || "Adresa není uložená")}</span>
            ${reservation.pickupNote ? `<span>Poznámka: ${escapeHtml(reservation.pickupNote)}</span>` : ""}
          </div>
        </div>
      `;
    }

    function renderReservationDetailPanel(reservation) {
      const status = getSafeReservationStatus(reservation);

      const startDate = getSafeReservationDateFrom(reservation);
      const endDate = getSafeReservationDateTo(reservation);

      const totalPrice = getSafeReservationTotalPrice(reservation);
      const deposit = Number(reservation.deposit || 0);
      const platformFee = getSafeReservationPlatformFee(reservation, PLATFORM_FEE_PERCENT);
      const ownerPayout = getSafeReservationOwnerPayout(reservation, PLATFORM_FEE_PERCENT);

      return `
        <div class="reservation-detail-panel">
          <div class="detail-grid">
            <div class="info-box">
              <span>Termín</span>
              <strong>${escapeHtml(formatDate(startDate))} – ${escapeHtml(formatDate(endDate))}</strong>
            </div>

            <div class="info-box">
              <span>Celkem k platbě</span>
              <strong>${escapeHtml(totalPrice)} Kč</strong>
            </div>

            <div class="info-box">
              <span>Kauce</span>
              <strong>${escapeHtml(deposit)} Kč</strong>
            </div>

            <div class="info-box">
              <span>Platba</span>
              <strong>${getSafeReservationContactVisible(status) ? "zaplaceno" : "čeká na platbu"}</strong>
            </div>

            <div class="info-box">
              <span>Provize 10 %</span>
              <strong>${escapeHtml(platformFee)} Kč</strong>
            </div>

            <div class="info-box">
              <span>Majitel dostane</span>
              <strong>${escapeHtml(ownerPayout)} Kč</strong>
            </div>
          </div>

          ${renderReservationStateBox(reservation, status)}

          ${renderPaymentBox(reservation, status, totalPrice, platformFee, ownerPayout)}

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
          <button class="reservation-primary-action orange" type="button" onclick="payReservation('${escapeHtml(reservationId)}')">
            Zaplatit
          </button>
        `
        : `
          <button class="reservation-primary-action" id="detail-toggle-${escapeHtml(reservationId)}" type="button" onclick="toggleReservationDetail('${escapeHtml(reservationId)}', this)">
            Detail
          </button>
        `;

      let menuItems = "";

      if (isPaymentRequired) {
        menuItems += `
          <button type="button" onclick="toggleReservationDetail('${escapeHtml(reservationId)}', document.getElementById('detail-toggle-${escapeHtml(reservationId)}'))">
            Detail rezervace
          </button>
        `;
      }

      if (isMapUsefulForStatus(status) && pickupAddress) {
        menuItems += `
          <a href="${escapeHtml(getMapUrl(pickupAddress))}" target="_blank" rel="noopener noreferrer">
            Mapa vyzvednutí
          </a>
        `;
      }

      if (offerId && !isHistorySection) {
        menuItems += `
          <a href="detail.html?id=${encodeURIComponent(offerId)}">
            Detail nářadí
          </a>
        `;
      }

      const secondaryMenu = menuItems
        ? `
          <details class="reservation-more-menu">
            <summary aria-label="Další akce">•••</summary>
            <div class="reservation-more-menu-panel">
              ${menuItems}
            </div>
          </details>
        `
        : "";

      return `
        <article class="reservation-card ${isHistorySection ? "history-card" : "active-card"} ${isPriority ? "priority" : ""}" id="reservation-row-${escapeHtml(reservationId)}">
          <div class="reservation-card-main">
            <div class="reservation-card-tool">
              ${renderToolThumb(reservation)}
              <div>
                <div class="reservation-title-line">
                  <h3>${escapeHtml(toolName)}</h3>
                  <span class="status-pill ${getStatusClass(status)}">${escapeHtml(statusText)}</span>
                </div>
                <p>${escapeHtml(city)} · Majitel: ${escapeHtml(ownerName)}</p>
              </div>
            </div>

            <div class="reservation-card-actions">
              ${primaryAction}
              ${secondaryMenu}
            </div>
          </div>

          <div class="reservation-card-meta">
            <div>
              <span>Termín</span>
              <strong>${escapeHtml(formatDate(startDate))} – ${escapeHtml(formatDate(endDate))}</strong>
            </div>
            <div>
              <span>Cena</span>
              <strong>${escapeHtml(totalPrice)} Kč</strong>
            </div>
            <div>
              <span>Stav</span>
              <strong>${escapeHtml(statusText)}</strong>
            </div>
          </div>

          <div class="detail-row" id="reservation-detail-${escapeHtml(reservationId)}">
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
      const countText = reservations.length === 1
        ? "1 rezervace"
        : reservations.length + " rezervací";

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

    async function renderReservations() {
      const currentUser = await apiGetCurrentUser();
      if (!currentUser) {
        window.location.href = "prihlaseni.html";
        return;
      }

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

      const historyReservations = sortedReservations.filter(function (reservation) {
        return safeIsClosedReservationStatus(getSafeReservationStatus(reservation));
      });

      document.getElementById("reservationsList").innerHTML =
        renderReservationSection(
          "Aktivní rezervace",
          activeReservations,
          "Nemáte žádné aktivní rezervace.",
          "active",
          false
        ) +
        renderReservationSection(
          "Historie rezervací",
          historyReservations,
          "V historii zatím nejsou žádné dokončené ani odmítnuté rezervace.",
          "history",
          true
        );
    }

    async function initializeReservationsPage() {
      renderSharedNavigation("muj-ucet");
      renderLoadingState();

      const currentUser = await apiGetCurrentUser();

      if (!currentUser) {
        window.location.href = "prihlaseni.html";
        return;
      }

      supabaseReservations = await loadMyReservationsFromSupabase();
      supabaseReviews = await loadMyReviewsFromSupabase();

      renderSharedNavigation("muj-ucet");
      renderReservations();
    }

    document.addEventListener("DOMContentLoaded", function () {
      initializeReservationsPage();
    });