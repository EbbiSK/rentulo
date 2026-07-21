    const PLATFORM_FEE_PERCENT = 10;

    
    

    let ownerOffers = [];
    let ownerReservations = [];
    let ownerReviews = [];

    function getStatusText(status) {
  return getReservationStatusText(status);
}

    function isOpenStatus(status) {
  return isOpenReservationStatus(
    normalizeReservationStatus(status)
  );
}

    function isClosedStatus(status) {
  return isClosedReservationStatus(
    normalizeReservationStatus(status)
  );
}

    function canShowContact(status) {
  return getReservationContactVisible(status);
}

    function showAccountMessage(title, text) {
      const messageBox = document.getElementById("accountMessage");

      if (!messageBox) {
        return;
      }

      messageBox.innerHTML = `
        <strong>${escapeHtml(title)}</strong>
        ${escapeHtml(text)}
      `;

      messageBox.classList.add("active");
    }

    function showAccountMessageFromStorage() {
      const savedState = sessionStorage.getItem("rentuloOfferSaved");

      if (savedState === "draft") {
        showAccountMessage(
          "Koncept byl uložen.",
          "Až budete připraveni, klikněte u nabídky na Zveřejnit."
        );

        sessionStorage.removeItem("rentuloOfferSaved");
        return;
      }

      if (savedState === "active") {
        showAccountMessage(
          "Nabídka byla zveřejněna.",
          "Vaše nabídka je teď viditelná ve výsledcích vyhledávání."
        );

        sessionStorage.removeItem("rentuloOfferSaved");
      }
    }

    function renderLoadingState() {
      document.getElementById("offersList").innerHTML = `
        <section class="account-empty-state">
          <h2>Načítám nabídky...</h2>
          <p>Chvíli strpení, načítáme vaše nabídky a žádosti ze Supabase.</p>
        </section>
      `;
    }

    function renderEmptyState() {
      document.getElementById("offersList").innerHTML = `
        <section class="account-empty-state">
          <h2>Zatím nemáte žádné vlastní nabídky.</h2>
          <p>Přidejte první věc, kterou chcete půjčovat lidem ve svém okolí.</p>
<a href="nabidnout.html">Přidat nabídku</a>
        </section>
      `;
    }

    function normalizeOffer(row) {
      return {
        id: row.id,
        ownerId: row.owner_id,
        name: row.name || "Věc k půjčení",
category: row.category || "Ostatní",
        description: row.description || "",
        city: row.city || row.pickup_city || "-",
        postalCode: row.postal_code || "",
        price: Number(row.price_per_day || 0),
        status: row.status || "active",
        photoUrl: row.photo_url || "",
        createdAt: row.created_at || "",
        updatedAt: row.updated_at || ""
      };
    }

    function normalizeReservation(row) {
      return {
        id: row.id,
        offerId: row.offer_id,
        ownerId: row.owner_id,
        renterId: row.renter_id,

        offerName: row.offer_name || "Věc k půjčení",
category: row.category || "Ostatní",
        city: row.city || "",

        pricePerDay: Number(row.price_per_day || 0),

        startDate: row.start_date || row.date_from || "",
        endDate: row.end_date || row.date_to || "",
        days: Number(row.total_days || row.days || 0),
        totalPrice: Number(row.total_price || 0),

        platformFeePercent: Number(row.platform_fee_percent || PLATFORM_FEE_PERCENT),
        platformFeeAmount: Number(row.platform_fee_amount || 0),
        ownerPayout: Number(row.owner_payout || 0),

        renterName: row.renter_name || "Zájemce",
        renterEmail: row.renter_email || "",
        renterPhone: row.renter_phone || "",

        ownerName: row.owner_name || "Majitel",

        status: normalizeReservationStatus(
  row.status || RESERVATION_STATUS_PENDING
),
        contactVisibleAfterPayment: Boolean(row.contact_visible_after_payment),

        createdAt: row.created_at || "",
        updatedAt: row.updated_at || ""
      };
    }

    function normalizeReview(row) {
      return {
        id: row.id,
        reservationId: row.reservation_id,
        reviewerId: row.reviewer_id,
        reviewedUserId: row.reviewed_user_id,
        offerId: row.offer_id,
        rating: Number(row.rating || 0),
        text: row.text || "",
        createdAt: row.created_at || ""
      };
    }

    function findOwnerReviewForRenter(reservation) {
      if (!reservation) {
        return null;
      }

      return ownerReviews.find(function (review) {
        const sameReservation = String(review.reservationId || "") === String(reservation.id || "");
        const sameReviewer = String(review.reviewerId || "") === String(reservation.ownerId || "");
        const sameReviewedUser = !reservation.renterId ||
          String(review.reviewedUserId || "") === String(reservation.renterId || "");

        return sameReservation && sameReviewer && sameReviewedUser;
      }) || null;
    }

    async function loadOwnerData() {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        alert("Supabase klient není načtený. Zkontrolujte js/supabase-config.js.");
        return;
      }

      const supabaseUser = await getCurrentSupabaseUser();

      if (!supabaseUser) {
        window.location.href = "prihlaseni.html";
        return;
      }

      const offersResult = await supabaseClient
        .from("offers")
        .select("*")
        .eq("owner_id", supabaseUser.id)
        .order("created_at", {
          ascending: false
        });

      if (offersResult.error) {
        console.error(offersResult.error);
        alert("Nabídky se nepodařilo načíst ze Supabase. Podívejte se prosím do konzole.");
        return;
      }

      const reservationsResult = await supabaseClient
        .from("reservations")
        .select("*")
        .eq("owner_id", supabaseUser.id)
        .order("created_at", {
          ascending: false
        });

      if (reservationsResult.error) {
        console.error(reservationsResult.error);
        alert("Žádosti se nepodařilo načíst ze Supabase. Podívejte se prosím do konzole.");
        return;
      }

      const reviewsResult = await supabaseClient
        .from("reviews")
        .select("*")
        .or("reviewer_id.eq." + supabaseUser.id + ",reviewed_user_id.eq." + supabaseUser.id)
        .order("created_at", {
          ascending: false
        });

      if (reviewsResult.error) {
        console.warn("Hodnocení se nepodařilo načíst ze Supabase.", reviewsResult.error);
      }

      ownerOffers = Array.isArray(offersResult.data)
        ? offersResult.data.map(normalizeOffer)
        : [];

      ownerReservations = Array.isArray(reservationsResult.data)
        ? reservationsResult.data.map(normalizeReservation)
        : [];

      ownerReviews = reviewsResult && Array.isArray(reviewsResult.data)
        ? reviewsResult.data.map(normalizeReview)
        : [];
    }

function getOfferCategory(offer) {
      return offer.category || "Ostatní";
    }

    function getOfferCity(offer) {
      return offer.city || "-";
    }

function getOfferStatus(offer) {
      if (offer.status === "draft") {
        return "Koncept";
      }

      if (offer.status === "active") {
        return "Aktivní";
      }

      if (offer.status === "hidden") {
        return "Skryté";
      }

      if (offer.status === "deleted") {
        return "Smazané";
      }

      return offer.status || "Aktivní";
    }

    function isOfferDraft(offer) {
      return offer.status === "draft";
    }

    function getOfferStatusClass(offer) {
      return isOfferDraft(offer) ? "draft" : "";
    }

    function getOfferPhoto(offer) {
      return offer.photoUrl || "";
    }

    function renderToolImage(offer) {
      const photo = getOfferPhoto(offer);
      const offerName = getOfferName(offer);

      if (photo) {
        return `
          <div class="tool-image">
            <img src="${escapeHtml(photo)}" alt="${escapeHtml(offerName)}">
          </div>
        `;
      }

      return `
        <div class="tool-image">
          <div class="tool-image-icon"></div>
        </div>
      `;
    }

    
    

    async function updateReservationStatus(reservationId, newStatus) {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        alert("Supabase klient není načtený.");
        return null;
      }

      const { data, error } = await supabaseClient
        .from("reservations")
        .update({
          status: newStatus
        })
        .eq("id", reservationId)
        .select()
        .single();

      if (error) {
        console.error(error);
        alert("Stav rezervace se nepodařilo uložit do Supabase. Podívejte se prosím do konzole.");
        return null;
      }

      

      return data ? normalizeReservation(data) : null;
    }

    async function approveReservation(reservationId) {
      await updateReservationStatus(
  reservationId,
  RESERVATION_STATUS_APPROVED
);
      await reloadAndReopen(reservationId, "open");
    }

    async function rejectReservation(reservationId) {
     await updateReservationStatus(
  reservationId,
  RESERVATION_STATUS_REJECTED
);
      await reloadAndReopen(reservationId, "history");
    }

    async function markReservationPickedUp(reservationId) {
      await updateReservationStatus(
  reservationId,
  RESERVATION_STATUS_PICKED_UP
);
      await reloadAndReopen(reservationId, "open");
    }

    async function markReservationReturned(reservationId) {
      await updateReservationStatus(
  reservationId,
  RESERVATION_STATUS_RETURNED
);
      await reloadAndReopen(reservationId, "history");
    }

    async function publishOffer(offerId) {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        alert("Supabase klient není načtený.");
        return;
      }

      const { error } = await supabaseClient
        .from("offers")
        .update({
          status: "active"
        })
        .eq("id", offerId);

      if (error) {
        console.error(error);
        alert("Nabídku se nepodařilo zveřejnit.");
        return;
      }

      showAccountMessage("Koncept byl zveřejněn.", "Nabídka je teď aktivní a viditelná ve výsledcích.");
      await initializeOwnerOffersPage();
    }

    async function deleteOffer(offerId) {
      const blockingReservations = ownerReservations.filter(function (reservation) {
        return String(reservation.offerId) === String(offerId) && isOpenStatus(reservation.status);
      });

      if (blockingReservations.length > 0) {
        alert("Tuto nabídku nelze smazat, protože k ní existuje otevřená rezervace.");
        return;
      }

      const reallyDelete = confirm("Opravdu chcete tuto nabídku smazat?");

      if (!reallyDelete) {
        return;
      }

      const supabaseClient = getSupabaseClient();

      const { error } = await supabaseClient
        .from("offers")
        .delete()
        .eq("id", offerId);

      if (error) {
        console.error(error);
        alert("Nabídku se nepodařilo smazat.");
        return;
      }

      await initializeOwnerOffersPage();
    }

    async function reloadAndReopen(reservationId, panelType) {
      await loadOwnerData();
      renderOffers();

      setTimeout(function () {
        reopenReservationAfterRender(reservationId, panelType);
      }, 0);
    }

    function getOfferIdByReservationId(reservationId) {
      const reservation = ownerReservations.find(function (item) {
        return String(item.id) === String(reservationId);
      });

      return reservation ? reservation.offerId : "";
    }

    function reopenReservationAfterRender(reservationId, panelType) {
      const offerId = getOfferIdByReservationId(reservationId);

      if (!offerId) {
        return;
      }

      const offerDetail = document.getElementById("offer-detail-" + offerId);
      const offerManageButton = document.getElementById("offer-manage-toggle-" + offerId);

      if (offerDetail) {
        offerDetail.classList.add("open");
      }

      if (offerManageButton) {
        offerManageButton.textContent = "Skrýt";
      }

      if (panelType === "history") {
        const historyPanel = document.getElementById("history-panel-" + offerId);
        const historyButton = document.getElementById("history-toggle-" + offerId);

        if (historyPanel) {
          historyPanel.classList.add("open");
        }

        if (historyButton) {
          historyButton.textContent = "Skrýt historii";
        }

        return;
      }

      const openPanel = document.getElementById("open-panel-" + offerId);
      const openButton = document.getElementById("open-toggle-" + offerId);

      if (openPanel) {
        openPanel.classList.add("open");
      }

      if (openButton) {
        openButton.textContent = "Skrýt žádosti";
        openButton.classList.remove("important");
      }
    }

    function renderRequestNote(status) {
      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PENDING) {
        return `<p class="request-note">Nová žádost čeká na vaše potvrzení nebo odmítnutí.</p>`;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_APPROVED) {
        return `<p class="request-note">Žádost byla potvrzena. Čeká se na platbu zákazníka.</p>`;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PAID) {
        return `<p class="request-note success">Rezervace je zaplacena. Po předání věci ji označte jako vyzvednutou.</p>`;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PICKED_UP) {
return `<p class="request-note success">Věc byla označena jako vyzvednutá. Po vrácení dokončete půjčení.</p>`;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_RETURNED) {
        return `<p class="request-note success">Vráceno – půjčení je dokončeno. Už není potřeba žádná další akce.</p>`;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_REJECTED) {
        return `<p class="request-note">Žádost byla odmítnuta. Nabídka už touto žádostí není blokovaná.</p>`;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_CANCELLED) {
        return `<p class="request-note">Rezervace byla zrušena. Nabídka už touto žádostí není blokovaná.</p>`;
      }

      return "";
    }

    function getRequestStatusClass(status) {
  const normalizedStatus = normalizeReservationStatus(status);

  if (
    normalizedStatus === RESERVATION_STATUS_PAID ||
    normalizedStatus === RESERVATION_STATUS_PICKED_UP
  ) {
    return "paid";
  }

  if (isClosedReservationStatus(normalizedStatus)) {
    return "finished";
  }

  if (normalizedStatus === RESERVATION_STATUS_APPROVED) {
    return "active";
  }

  return "";
}

    function renderRequestActions(reservation, status) {
      const reservationId = reservation.id;
      const actions = [];

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PENDING) {
        actions.push(`
          <button class="small-button" type="button" onclick="approveReservation('${escapeHtml(reservationId)}')">Potvrdit</button>
        `);

        actions.push(`
          <button class="small-button light" type="button" onclick="rejectReservation('${escapeHtml(reservationId)}')">Odmítnout</button>
        `);
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PAID) {
        actions.push(`
          <button class="small-button orange" type="button" onclick="markReservationPickedUp('${escapeHtml(reservationId)}')">
            Označit jako vyzvednuto
          </button>
        `);
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PICKED_UP) {
        actions.push(`
          <button class="small-button" type="button" onclick="markReservationReturned('${escapeHtml(reservationId)}')">
            Označit jako vráceno
          </button>
        `);
      }

      return actions.join("");
    }

    function renderReservationContactBlock(reservation) {
      if (!canShowContact(reservation.status)) {
        return `
          <div class="request-contact-box locked">
            <strong>Kontakt zatím skrytý</strong>
            Kontakt na zájemce se zobrazí až po zaplacení rezervace.
          </div>
        `;
      }

      const renterName = reservation.renterName || "Zájemce";
      const renterEmail = reservation.renterEmail || "E-mail není uložen";
      const renterPhone = reservation.renterPhone || "Telefon není uložen";

      const contactTitle =
  normalizeReservationStatus(reservation.status) === RESERVATION_STATUS_RETURNED
        ? "Kontakt na zákazníka k dokončené rezervaci"
        : "Kontakt na zájemce";

      const returnedNote =
  normalizeReservationStatus(reservation.status) === RESERVATION_STATUS_RETURNED
        ? "Rezervace je dokončená, kontakt zůstává dostupný pro případné zpětné dohledání. "
        : "";

      return `
        <div class="request-contact-box">
          <strong>${contactTitle}</strong>
          ${escapeHtml(returnedNote)}
          Jméno: ${escapeHtml(renterName)}<br>
          E-mail: ${escapeHtml(renterEmail)}<br>
          Telefon: ${escapeHtml(renterPhone)}
        </div>
      `;
    }
    function renderOwnerReviewForRenterBox(reservation, status) {
      if (
  normalizeReservationStatus(status) !==
  RESERVATION_STATUS_RETURNED
) {
        return "";
      }

      const reservationId = reservation.id;
      const existingReview = findOwnerReviewForRenter(reservation);

      if (existingReview) {
        return `
          <div class="request-contact-box">
            <strong>Hodnocení zákazníka bylo odesláno</strong>
            <div style="margin-top: 6px; color: #006b45; font-size: 15px;">
              ${escapeHtml(getStars(existingReview.rating))}
            </div>
            <div style="margin-top: 6px;">
              ${escapeHtml(existingReview.text || "Bez komentáře")}
            </div>
            <div style="margin-top: 6px; color: #5b6862; font-size: 12px;">
              Odesláno: ${escapeHtml(formatDate(existingReview.createdAt))}
            </div>
          </div>
        `;
      }

      return `
        <div class="request-contact-box">
          <strong>Ohodnotit zákazníka</strong>
          <div style="margin-top: 10px;">
            <label>
              Počet hvězdiček
              <select
  id="owner-review-rating-${escapeHtml(reservationId)}"
  class="owner-review-select"
>
                <option value="5">★★★★★ - výborné</option>
                <option value="4">★★★★☆ - dobré</option>
                <option value="3">★★★☆☆ - průměrné</option>
                <option value="2">★★☆☆☆ - slabé</option>
                <option value="1">★☆☆☆☆ - špatné</option>
              </select>
            </label>
          </div>

          <div style="margin-top: 10px;">
            <label>
              Komentář
              <textarea
  id="owner-review-text-${escapeHtml(reservationId)}"
  class="owner-review-textarea"
  rows="3"
  placeholder="Jak proběhlo půjčení?"
></textarea>
          </div>

          <button class="small-button" type="button" onclick="saveOwnerReviewForRenter('${escapeHtml(reservationId)}')">
            Odeslat hodnocení
          </button>
        </div>
      `;
    }

    async function saveOwnerReviewForRenter(reservationId) {
      const reservation = ownerReservations.find(function (item) {
        return String(item.id) === String(reservationId);
      });

      if (!reservation) {
        alert("Rezervace nebyla nalezena.");
        return;
      }

      if (
  normalizeReservationStatus(reservation.status) !==
  RESERVATION_STATUS_RETURNED
) {
        alert("Zákazníka můžete ohodnotit až po dokončení půjčení.");
        return;
      }

      const existingReview = findOwnerReviewForRenter(reservation);

      if (existingReview) {
        alert("Tuto rezervaci jste už hodnotili.");
        return;
      }

      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        alert("Supabase klient není načtený.");
        return;
      }

      const supabaseUser = await getCurrentSupabaseUser();

      if (!supabaseUser) {
        window.location.href = "prihlaseni.html";
        return;
      }

      const ratingElement = document.getElementById("owner-review-rating-" + reservationId);
      const textElement = document.getElementById("owner-review-text-" + reservationId);

      const rating = Number(ratingElement ? ratingElement.value : 5);
      const text = textElement ? textElement.value.trim() : "";

      if (!reservation.renterId) {
        alert("Chybí ID zákazníka pro hodnocení.");
        return;
      }

      const reviewToInsert = {
        reservation_id: reservation.id,
        reviewer_id: supabaseUser.id,
        reviewed_user_id: reservation.renterId,
        offer_id: reservation.offerId,
        rating: rating,
        text: text
      };

      const { error } = await supabaseClient
        .from("reviews")
        .insert(reviewToInsert);

      if (error) {
        console.error("Chyba při ukládání hodnocení:", error);

        if (String(error.message || "").toLowerCase().includes("duplicate")) {
          alert("Tuto rezervaci jste už hodnotili.");
        } else {
          alert("Hodnocení se nepodařilo uložit.");
        }

        return;
      }

      alert("Hodnocení bylo uloženo.");
      await loadOwnerData();
      renderOffers();

      setTimeout(function () {
        reopenReservationAfterRender(reservationId, "history");

        const historyDetail = document.getElementById("history-request-detail-" + reservationId);
        const openDetail = document.getElementById("request-detail-" + reservationId);

        if (historyDetail) {
          historyDetail.classList.add("open");
        }

        if (openDetail) {
          openDetail.classList.add("open");
        }
      }, 0);
    }

    function renderRequestDetailContent(reservation, status) {
      const price = reservation.totalPrice;
      const platformFee = reservation.platformFeeAmount || Math.round(price * PLATFORM_FEE_PERCENT / 100);
      const ownerPayout = reservation.ownerPayout || price - platformFee;
      const reservationId = reservation.id;

      return `
        <div class="request-detail-inner">
          <div class="request-money">
            <div class="money-cell">
              Cena pro zákazníka
              <strong>${escapeHtml(price)} Kč</strong>
            </div>

            <div class="money-cell">
              Provize Rentulo
              <strong>${escapeHtml(platformFee)} Kč</strong>
            </div>

            <div class="money-cell">
              Vy dostanete
              <strong>${escapeHtml(ownerPayout)} Kč</strong>
            </div>
          </div>

          <div class="request-actions">
            <a class="small-button light" href="moje-nabidky.html?open=actions">Zpět na žádosti</a>
          </div>

          ${renderReservationContactBlock(reservation)}

          ${renderOwnerReviewForRenterBox(reservation, status)}

          ${renderRequestNote(status)}
        </div>
      `;
    }

    function renderRequest(reservation) {
      const status = reservation.status;
      const statusText = getStatusText(status);

      const renterName = reservation.renterName || "Zájemce";
      const renterEmail = canShowContact(status)
        ? reservation.renterEmail || "E-mail není uložen"
        : "Kontakt se zobrazí po zaplacení";

      const startDate = reservation.startDate;
      const endDate = reservation.endDate;
      const price = reservation.totalPrice;
      const reservationId = reservation.id;

      const actionButtons = renderRequestActions(reservation, status);

      return `
        <article class="request-card" id="request-card-${escapeHtml(reservationId)}">
          <div class="request-row">
            <div class="request-main">
              <span class="request-name">${escapeHtml(renterName)}</span>
              <span class="request-email">${escapeHtml(renterEmail)}</span>
            </div>

            <div class="request-date">
              ${escapeHtml(formatDate(startDate))} – ${escapeHtml(formatDate(endDate))}
            </div>

            <div class="table-value hide-tablet">
              ${escapeHtml(price)} Kč
            </div>

            <span class="request-status ${getRequestStatusClass(status)}">${escapeHtml(statusText)}</span>

            <div class="row-actions">
              ${actionButtons}
              <button class="history-toggle-button" type="button" onclick="toggleRequestDetail('${escapeHtml(reservationId)}', this)">
                Detail
              </button>
            </div>
          </div>

          <div class="request-detail" id="request-detail-${escapeHtml(reservationId)}">
            ${renderRequestDetailContent(reservation, status)}
          </div>
        </article>
      `;
    }

    function renderHistoryRequestRow(reservation) {
      const status = reservation.status;
      const statusText = getStatusText(status);

      const renterName = reservation.renterName || "Zájemce";
      const renterEmail = canShowContact(status)
        ? reservation.renterEmail || "E-mail není uložen"
        : "Kontakt se zobrazí po zaplacení";

      const startDate = reservation.startDate;
      const endDate = reservation.endDate;
      const price = reservation.totalPrice;
      const reservationId = reservation.id;

      return `
        <div class="history-row-wrapper">
          <div class="history-row">
            <div class="history-main">
              <span class="history-title">${escapeHtml(renterName)}</span>
              <span class="history-subtitle">${escapeHtml(renterEmail)}</span>
            </div>

            <div class="history-info">
              ${escapeHtml(formatDate(startDate))} – ${escapeHtml(formatDate(endDate))}
            </div>

            <div class="history-status">
              ${escapeHtml(statusText)}
            </div>

            <div class="history-price hide-tablet">
              ${escapeHtml(price)} Kč
            </div>

            <div class="row-actions">
              <button class="history-toggle-button" type="button" onclick="toggleHistoryRequest('${escapeHtml(reservationId)}', this)">
                Detail
              </button>
            </div>
          </div>

          <div class="history-detail" id="history-request-detail-${escapeHtml(reservationId)}">
            ${renderRequestDetailContent(reservation, status)}
          </div>
        </div>
      `;
    }

    function toggleRequestDetail(reservationId, button) {
      const detail = document.getElementById("request-detail-" + reservationId);

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
      button.textContent = "Skrýt";
    }

    function toggleHistoryRequest(reservationId, button) {
      const detail = document.getElementById("history-request-detail-" + reservationId);

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
      button.textContent = "Skrýt";
    }

    function toggleRequestPanel(panelId, button) {
      const panel = document.getElementById(panelId);

      if (!panel) {
        return;
      }

      const isOpen = panel.classList.contains("open");
      const isImportant = button.getAttribute("data-important") === "true";

      if (isOpen) {
        panel.classList.remove("open");
        button.textContent = button.getAttribute("data-closed-text");

        if (isImportant) {
          button.classList.add("important");
        }

        return;
      }

      panel.classList.add("open");
      button.textContent = button.getAttribute("data-open-text");
      button.classList.remove("important");
    }

    function toggleOfferDetail(detailId, button) {
      const detail = document.getElementById(detailId);

      if (!detail) {
        return;
      }

      const isOpen = detail.classList.contains("open");

      if (isOpen) {
        detail.classList.remove("open");
        button.textContent = "Spravovat";
        return;
      }

      detail.classList.add("open");
      button.textContent = "Skrýt";
    }

    function renderRequestPanel(panelId, title, count, content) {
      const countText = count === 1 ? "1 žádost" : count + " žádostí";

      return `
        <section class="request-panel" id="${escapeHtml(panelId)}">
          <div class="request-panel-header">
            <h3>${escapeHtml(title)}</h3>
            <span>${escapeHtml(countText)}</span>
          </div>

          <div class="request-list">
            ${content}
          </div>
        </section>
      `;
    }

    function toggleOfferOverviewFromMenu(offerId, menuElement) {
      const detail = document.getElementById("offer-detail-" + offerId);

      if (!detail) {
        return;
      }

      detail.classList.toggle("open");

      if (menuElement && typeof menuElement.removeAttribute === "function") {
        menuElement.removeAttribute("open");
      }
    }

    function openOfferRequests(offerId) {
      const offerDetail = document.getElementById("offer-detail-" + offerId);
      const openPanel = document.getElementById("open-panel-" + offerId);
      const openButton = document.getElementById("open-toggle-" + offerId);

      if (offerDetail) {
        offerDetail.classList.add("open");
      }

      if (openPanel) {
        openPanel.classList.add("open");
      }

      if (openButton) {
        openButton.textContent = "Skrýt žádosti";
        openButton.classList.remove("important");
      }

      setTimeout(function () {
        if (openPanel) {
          openPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 0);
    }

    function renderOffer(offer, requests) {
      const offerId = String(offer.id);
      const offerName = getOfferName(offer);
      const offerCity = getOfferCity(offer);
      const offerCategory = getOfferCategory(offer);
      const offerPrice = getOfferPrice(offer);
      const isDraft = isOfferDraft(offer);

      const openRequests = requests.filter(function (reservation) {
        return isOpenStatus(reservation.status);
      });

      const ownerActionRequests = openRequests.filter(function (reservation) {
        return isOpenStatus(reservation.status);
      });

      const openPanelId = "open-panel-" + offerId;
      const offerDetailId = "offer-detail-" + offerId;

      const openRequestsButtonText = openRequests.length
        ? "Zobrazit žádosti (" + openRequests.length + ")"
        : "Otevřené žádosti (0)";

      const openContent = openRequests.length
        ? openRequests.map(renderRequest).join("")
        : `<p class="request-empty-note">U této nabídky teď není žádná otevřená žádost.</p>`;

      let requestStateHtml = `<span class="offer-request-state quiet">Bez otevřených žádostí</span>`;

      if (isDraft) {
        requestStateHtml = `<span class="offer-request-state draft">Koncept není zveřejněný</span>`;
      } else if (ownerActionRequests.length) {
        requestStateHtml = `
          <span class="offer-request-state urgent">
            ${escapeHtml(ownerActionRequests.length)} ${ownerActionRequests.length === 1 ? "žádost čeká" : "žádosti čekají"} na vyřízení
          </span>
        `;
      } else if (openRequests.length) {
        requestStateHtml = `
          <span class="offer-request-state active">
            ${escapeHtml(openRequests.length)} ${openRequests.length === 1 ? "otevřená žádost" : "otevřené žádosti"}
          </span>
        `;
      }

      const primaryActionHtml = isDraft
        ? `<button class="offer-primary-button orange" type="button" onclick="publishOffer('${escapeHtml(offerId)}')">Zveřejnit nabídku</button>`
        : openRequests.length
          ? `<button class="offer-primary-button ${ownerActionRequests.length ? "urgent" : ""}" type="button" onclick="openOfferRequests('${escapeHtml(offerId)}')">${ownerActionRequests.length ? "Vyřídit žádosti" : "Zobrazit žádosti"}</button>`
          : `<button class="offer-primary-button secondary" type="button" onclick="toggleOfferDetail('${escapeHtml(offerDetailId)}', this)">Přehled nabídky</button>`;

      const detailHtml = isDraft
        ? ""
        : `
          <div class="offer-detail" id="${escapeHtml(offerDetailId)}">
            <div class="offer-detail-grid">
              <div class="mini-stat">
                <span>Místo</span>
                <strong>${escapeHtml(offerCity)}</strong>
              </div>
              <div class="mini-stat">
                <span>Kategorie</span>
                <strong>${escapeHtml(offerCategory)}</strong>
              </div>
              <div class="mini-stat">
                <span>Otevřené žádosti</span>
                <strong>${escapeHtml(openRequests.length)}</strong>
              </div>
            </div>

            <div class="offer-detail-actions">
              <button
                class="request-toggle-button ${ownerActionRequests.length ? "important" : ""}"
                type="button"
                id="open-toggle-${escapeHtml(offerId)}"
                onclick="toggleRequestPanel('${escapeHtml(openPanelId)}', this)"
                data-closed-text="${escapeHtml(openRequestsButtonText)}"
                data-open-text="Skrýt žádosti"
                data-important="${ownerActionRequests.length ? "true" : "false"}"
              >${escapeHtml(openRequestsButtonText)}</button>
            </div>

            ${renderRequestPanel(openPanelId, "Otevřené žádosti", openRequests.length, openContent)}
          </div>
        `;

      return `
        <article class="offer-card ${ownerActionRequests.length ? "has-urgent-request" : ""}">
          <div class="offer-card-main">
            <div class="offer-tool">
              ${renderToolImage(offer)}
              <div class="offer-card-copy">
                <div class="offer-title-line">
                  <h2 class="offer-card-title">${escapeHtml(offerName)}</h2>
                  <span class="status-pill ${getOfferStatusClass(offer)}">${escapeHtml(getOfferStatus(offer))}</span>
                </div>
                <p class="offer-card-meta">${escapeHtml(offerCity)} · ${escapeHtml(offerCategory)}</p>
                <div class="offer-card-summary">
                  <strong>${escapeHtml(offerPrice)} Kč / den</strong>
                  ${requestStateHtml}
                </div>
              </div>
            </div>

            <div class="offer-card-controls">
              ${primaryActionHtml}

              <details class="offer-more-menu">
                <summary aria-label="Další akce nabídky">•••</summary>
                <div class="offer-more-menu-panel">
                  <a href="edit-nabidka.html?id=${encodeURIComponent(offerId)}">Upravit nabídku</a>
                  ${isDraft ? "" : `<a href="detail.html?id=${encodeURIComponent(offerId)}">Veřejný detail</a>`}
                  ${isDraft ? "" : `<button type="button" onclick="toggleOfferOverviewFromMenu('${escapeHtml(offerId)}', this.closest('details'))">Přehled a historie</button>`}
                  <button class="danger" type="button" onclick="deleteOffer('${escapeHtml(offerId)}')">Smazat nabídku</button>
                </div>
              </details>
            </div>
          </div>
          ${detailHtml}
        </article>
      `;
    }
function renderSimpleOffer(offer, requests) {
  const offerId = String(offer.id);
  const offerName = getOfferName(offer);
  const offerCity = getOfferCity(offer);
  const offerPrice = getOfferPrice(offer);

  const openRequests = requests.filter(function (reservation) {
    return isOpenStatus(reservation.status);
  });

  const requestText =
    openRequests.length === 1
      ? "1 žádost"
      : openRequests.length + " žádostí";

  return `
    <article class="simple-offer-row">
      <div class="simple-offer-main">
        ${renderToolImage(offer)}

        <div class="simple-offer-info">
          <strong class="simple-offer-name">${escapeHtml(offerName)}</strong>
          <span class="simple-offer-meta">${escapeHtml(offerCity)}</span>
        </div>
      </div>

      <div class="simple-offer-value">
        ${escapeHtml(offerPrice)} Kč / den
      </div>

      <div class="simple-offer-value">
        ${escapeHtml(requestText)}
      </div>

      <div class="simple-offer-value simple-offer-status status-${escapeHtml(String(offer.status || "active").toLowerCase())}">
        ${escapeHtml(getOfferStatus(offer))}
      </div>

      <div class="simple-offer-actions">
        ${
          openRequests.length
            ? `<button
                type="button"
                class="offer-primary-button urgent"
                onclick="openOfferRequests('${escapeHtml(offerId)}')"
              >
                Vyřídit žádosti
              </button>`
            : `<a href="detail.html?id=${encodeURIComponent(offerId)}">
                Detail
              </a>`
        }

        <a href="edit-nabidka.html?id=${encodeURIComponent(offerId)}">
          Upravit
        </a>
      </div>
    </article>
  `;
}
    function renderOffers() {
      if (!ownerOffers.length) {
        renderEmptyState();
        return;
      }

      const offersRowsHtml = ownerOffers.map(function (offer, index) {
        const offerId = String(offer.id);

        const offerRequests = ownerReservations.filter(function (reservation) {
          return String(reservation.offerId) === String(offerId);
        });

        return renderSimpleOffer(offer, offerRequests);
      }).join("");

      document.getElementById("offersList").innerHTML = `
        <section class="offers-card-list">
          ${offersRowsHtml}
        </section>
      `;

      autoOpenActionOfferFromUrl();
    }

    function autoOpenActionOfferFromUrl() {
      const params = new URLSearchParams(window.location.search);

      if (params.get("open") !== "actions") {
        return;
      }

      const firstActionReservation = ownerReservations.find(function (reservation) {
        const normalizedStatus = normalizeReservationStatus(reservation.status);

return [
  RESERVATION_STATUS_PENDING,
  RESERVATION_STATUS_PAID,
  RESERVATION_STATUS_PICKED_UP
].includes(normalizedStatus);
      });

      const firstOpenReservation = firstActionReservation || ownerReservations.find(function (reservation) {
        return isOpenStatus(reservation.status);
      });

      if (!firstOpenReservation) {
        return;
      }

      const offerId = String(firstOpenReservation.offerId || "");
      const reservationId = String(firstOpenReservation.id || "");

      if (!offerId || !reservationId) {
        return;
      }

      setTimeout(function () {
        const offerDetail = document.getElementById("offer-detail-" + offerId);
        const offerManageButton = document.getElementById("offer-manage-toggle-" + offerId);

        if (offerDetail) {
          offerDetail.classList.add("open");
        }

        if (offerManageButton) {
          offerManageButton.textContent = "Skrýt";
        }

        const openPanel = document.getElementById("open-panel-" + offerId);
        const openButton = document.getElementById("open-toggle-" + offerId);

        if (openPanel) {
          openPanel.classList.add("open");
        }

        if (openButton) {
          openButton.textContent = "Skrýt žádosti";
          openButton.classList.remove("important");
        }

        const requestCard = document.getElementById("request-card-" + reservationId);

        if (requestCard) {
          requestCard.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }
      }, 0);
    }

    async function initializeOwnerOffersPage() {
      renderSharedNavigation("muj-ucet");
      renderLoadingState();

      await loadOwnerData();

      renderSharedNavigation("muj-ucet");
      renderOffers();
      showAccountMessageFromStorage();
    }

    document.addEventListener("DOMContentLoaded", function () {
      initializeOwnerOffersPage();
    });