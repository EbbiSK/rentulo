    const PLATFORM_FEE_PERCENT = 10;

    const OFFERS_LOCALES = {
      cs: "cs-CZ",
      en: "en-GB",
      de: "de-DE",
      pl: "pl-PL"
    };

    function offersTranslate(key, fallback, values) {
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

    function getOffersLocale() {
      const language = typeof window.getRentuloLanguage === "function"
        ? window.getRentuloLanguage()
        : "cs";

      return OFFERS_LOCALES[language] || OFFERS_LOCALES.cs;
    }

    function formatOffersNumber(value) {
      const numberValue = Number(value);

      if (!Number.isFinite(numberValue)) {
        return String(value === undefined || value === null ? "" : value);
      }

      return numberValue.toLocaleString(getOffersLocale());
    }

    function formatOffersMoney(value) {
      return formatOffersNumber(value) + " Kč";
    }

    function formatOffersMoneyPerDay(value) {
      return formatOffersNumber(value) + " " + offersTranslate("offers.currencyPerDay", "Kč / den");
    }

    function formatOffersDate(value) {
      if (!value) {
        return "-";
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return String(value);
      }

      return date.toLocaleDateString(getOffersLocale());
    }

    function getOffersPluralText(prefix, count, fallbacks) {
      const pluralCategory = new Intl.PluralRules(getOffersLocale()).select(Number(count));
      const supportedCategory = ["one", "few", "many", "other"].includes(pluralCategory)
        ? pluralCategory
        : "other";
      const suffix = supportedCategory.charAt(0).toUpperCase() + supportedCategory.slice(1);
      const fallback = fallbacks[supportedCategory] || fallbacks.other || "";

      return offersTranslate(prefix + suffix, fallback, {
        count: formatOffersNumber(count)
      });
    }

    function getRequestCountText(count) {
      return getOffersPluralText("offers.requestCount", count, {
        one: "1 žádost",
        few: "{count} žádosti",
        many: "{count} žádostí",
        other: "{count} žádostí"
      });
    }

    function getWaitingRequestText(count) {
      const label = getOffersPluralText("offers.waiting", count, {
        one: "žádost čeká",
        few: "žádosti čekají",
        many: "žádostí čeká",
        other: "žádostí čeká"
      });

      return formatOffersNumber(count) + " " + label + " " + offersTranslate("offers.forAction", "na vyřízení");
    }

    function getOpenRequestText(count) {
      const label = getOffersPluralText("offers.open", count, {
        one: "otevřená žádost",
        few: "otevřené žádosti",
        many: "otevřených žádostí",
        other: "otevřených žádostí"
      });

      return formatOffersNumber(count) + " " + label;
    }

    
    

    let ownerOffers = [];
    let ownerReservations = [];
    let ownerReviews = [];
    let ownerOffersLoadState = "idle";
    let accountMessageState = null;

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

    function isOwnerActionStatus(status) {
      const normalizedStatus = normalizeReservationStatus(status);

      return [
        RESERVATION_STATUS_PENDING,
        RESERVATION_STATUS_PAID,
        RESERVATION_STATUS_PICKED_UP
      ].includes(normalizedStatus);
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

    function setAccountMessage(titleKey, titleFallback, textKey, textFallback) {
      accountMessageState = {
        titleKey: titleKey,
        titleFallback: titleFallback,
        textKey: textKey,
        textFallback: textFallback
      };

      renderAccountMessage();
    }

    function renderAccountMessage() {
      if (!accountMessageState) {
        return;
      }

      showAccountMessage(
        offersTranslate(accountMessageState.titleKey, accountMessageState.titleFallback),
        offersTranslate(accountMessageState.textKey, accountMessageState.textFallback)
      );
    }

    function showAccountMessageFromStorage() {
      const savedState = sessionStorage.getItem("rentuloOfferSaved");

      if (savedState === "draft") {
        setAccountMessage(
          "offers.message.draftTitle",
          "Koncept byl uložen.",
          "offers.message.draftText",
          "Až budete připraveni, klikněte u nabídky na Zveřejnit."
        );

        sessionStorage.removeItem("rentuloOfferSaved");
        return;
      }

      if (savedState === "active") {
        setAccountMessage(
          "offers.message.publishedTitle",
          "Nabídka byla zveřejněna.",
          "offers.message.publishedText",
          "Vaše nabídka je teď viditelná ve výsledcích vyhledávání."
        );

        sessionStorage.removeItem("rentuloOfferSaved");
      }
    }

    function renderLoadingState() {
      document.getElementById("offersList").innerHTML = `
        <section class="account-empty-state">
          <h2>${offersTranslate("offers.loadingTitle", "Načítám nabídky...")}</h2>
          <p>${offersTranslate("offers.loadingText", "Chvíli strpení, načítáme vaše nabídky a žádosti ze Supabase.")}</p>
        </section>
      `;
    }

    function renderEmptyState() {
      document.getElementById("offersList").innerHTML = `
        <section class="account-empty-state">
          <h2>${offersTranslate("offers.emptyTitle", "Zatím nemáte žádné vlastní nabídky.")}</h2>
          <p>${offersTranslate("offers.emptyText", "Přidejte první věc, kterou chcete půjčovat lidem ve svém okolí.")}</p>
        </section>
      `;
    }

    function renderLoadErrorState() {
      document.getElementById("offersList").innerHTML = `
        <section class="account-empty-state">
          <h2>${offersTranslate("offers.loadErrorTitle", "Nabídky se nepodařilo načíst.")}</h2>
          <p>${offersTranslate("offers.loadErrorText", "Obnovte stránku a zkuste to prosím znovu.")}</p>
        </section>
      `;
    }

    function normalizeOffer(row) {
      return {
        id: row.id,
        ownerId: row.owner_id,
        name: row.name || "",
        category: row.category || "",
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

        offerName: row.offer_name || "",
        category: row.category || "",
        city: row.city || "",

        pricePerDay: Number(row.price_per_day || 0),

        startDate: row.start_date || row.date_from || "",
        endDate: row.end_date || row.date_to || "",
        days: Number(row.total_days || row.days || 0),
        totalPrice: Number(row.total_price || 0),

        platformFeePercent: Number(row.platform_fee_percent || PLATFORM_FEE_PERCENT),
        platformFeeAmount: Number(row.platform_fee_amount || 0),
        ownerPayout: Number(row.owner_payout || 0),

        renterName: row.renter_name || "",
        renterEmail: row.renter_email || "",
        renterPhone: row.renter_phone || "",

        ownerName: row.owner_name || "",

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
      ownerOffersLoadState = "loading";
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        ownerOffersLoadState = "error";
        alert(offersTranslate("offers.error.supabaseConfig", "Služba je dočasně nedostupná. Obnovte stránku a zkuste to znovu."));
        return false;
      }

      const supabaseUser = await getCurrentSupabaseUser();

      if (!supabaseUser) {
        window.location.href = "prihlaseni.html";
        return false;
      }

      const offersResult = await supabaseClient
        .from("offers")
        .select("*")
        .eq("owner_id", supabaseUser.id)
        .neq("status", "deleted")
        .order("created_at", {
          ascending: false
        });

      if (offersResult.error) {
        ownerOffersLoadState = "error";
        console.error(offersResult.error);
        alert(offersTranslate("offers.error.loadListings", "Nabídky se nepodařilo načíst. Obnovte stránku a zkuste to znovu."));
        return false;
      }

      const reservationsResult = await supabaseClient
  .rpc("get_my_reservations");

if (!reservationsResult.error) {
  reservationsResult.data = Array.isArray(reservationsResult.data)
    ? reservationsResult.data.filter(function (reservation) {
        return reservation.owner_id === supabaseUser.id;
      })
    : [];
}

      if (reservationsResult.error) {
        ownerOffersLoadState = "error";
        console.error(reservationsResult.error);
        alert(offersTranslate("offers.error.loadRequests", "Žádosti se nepodařilo načíst. Obnovte stránku a zkuste to znovu."));
        return false;
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

      ownerOffersLoadState = "ready";
      return true;
    }

function getOfferCategory(offer) {
      const category = String(offer.category || "").trim();
      const normalized = typeof normalizeText === "function"
        ? normalizeText(category)
        : category.toLowerCase();
      const categories = {
        "domacnost": "home.category.household",
        "zahrada": "home.category.garden",
        "stavba": "home.category.construction",
        "hobby": "home.category.hobby",
        "party": "home.category.party",
        "ostatni": "home.category.other",
        "dum a zahrada": "category.homeGarden",
        "dilna a naradi": "category.workshopTools",
        "sport a volny cas": "category.sportLeisure",
        "elektronika": "category.electronics",
        "deti a rodina": "category.childrenFamily",
        "auto a doprava": "category.autoTransport",
        "party a akce": "category.partyEvents",
        "cestovani a kempovani": "category.travelCamping",
        "stavebni technika": "category.construction"
      };
      const translationKey = categories[normalized];

      if (translationKey) {
        return offersTranslate(translationKey, category);
      }

      return category || offersTranslate("offers.categoryFallback", "Ostatní");
    }

    function getOfferDisplayName(offer) {
      return getOfferName(offer, offersTranslate("offers.itemFallback", "Věc k půjčení"));
    }

    function getOfferCity(offer) {
      return offer.city || "-";
    }

function getOfferStatus(offer) {
      if (offer.status === "draft") {
        return offersTranslate("offers.status.draft", "Koncept");
      }

      if (offer.status === "active") {
        return offersTranslate("offers.status.active", "Aktivní");
      }

      if (offer.status === "hidden") {
        return offersTranslate("offers.status.hidden", "Skryté");
      }

      if (offer.status === "deleted") {
        return offersTranslate("offers.status.deleted", "Smazané");
      }

      return offer.status || offersTranslate("offers.status.active", "Aktivní");
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
      const offerName = getOfferDisplayName(offer);

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
        alert(offersTranslate("offers.error.supabaseMissing", "Služba je dočasně nedostupná. Obnovte stránku."));
        return null;
      }

      const { data: updatedReservations, error } = await supabaseClient
  .rpc("change_my_reservation_status", {
    p_reservation_id: reservationId,
    p_new_status: newStatus
  });

const data = Array.isArray(updatedReservations)
  ? updatedReservations[0] || null
  : null;

      if (error) {
        console.error(error);
        alert(offersTranslate("offers.error.saveStatus", "Stav rezervace se nepodařilo uložit. Zkuste to prosím znovu."));
        return null;
      }

      

      return data ? normalizeReservation(data) : null;
    }

    async function approveReservation(reservationId) {
      const updated = await updateReservationStatus(
  reservationId,
  RESERVATION_STATUS_APPROVED
);
      if (updated && typeof window.apiSendReservationEmail === "function") {
        await window.apiSendReservationEmail(reservationId, "approved");
      }
      await reloadAndReopen(reservationId, "open");
    }

    async function rejectReservation(reservationId) {
     const updated = await updateReservationStatus(
  reservationId,
  RESERVATION_STATUS_REJECTED
);
      if (updated && typeof window.apiSendReservationEmail === "function") {
        await window.apiSendReservationEmail(reservationId, "rejected");
      }
      await reloadAndReopen(reservationId, "history");
    }

    async function markReservationPickedUp(reservationId) {
      const updated = await updateReservationStatus(
  reservationId,
  RESERVATION_STATUS_PICKED_UP
);
      if (updated && typeof window.apiSendReservationEmail === "function") {
        await window.apiSendReservationEmail(reservationId, "picked_up");
      }
      await reloadAndReopen(reservationId, "open");
    }

    async function markReservationReturned(reservationId) {
      const updated = await updateReservationStatus(
  reservationId,
  RESERVATION_STATUS_RETURNED
);
      if (updated && typeof window.apiSendReservationEmail === "function") {
        await window.apiSendReservationEmail(reservationId, "returned");
      }
      await reloadAndReopen(reservationId, "history");
    }

    async function publishOffer(offerId) {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        alert(offersTranslate("offers.error.supabaseMissing", "Služba je dočasně nedostupná. Obnovte stránku."));
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
        alert(offersTranslate("offers.error.publish", "Nabídku se nepodařilo zveřejnit."));
        return;
      }

      setAccountMessage(
        "offers.message.draftPublishedTitle",
        "Koncept byl zveřejněn.",
        "offers.message.draftPublishedText",
        "Nabídka je teď aktivní a viditelná ve výsledcích."
      );
      await initializeOwnerOffersPage();
    }

    async function deleteOffer(offerId) {
      const blockingReservations = ownerReservations.filter(function (reservation) {
        return String(reservation.offerId) === String(offerId) && isOpenStatus(reservation.status);
      });

      if (blockingReservations.length > 0) {
        alert(offersTranslate("offers.error.deleteBlocked", "Tuto nabídku nelze smazat, protože k ní existuje otevřená rezervace."));
        return;
      }

      const reallyDelete = confirm(offersTranslate("offers.confirmDelete", "Opravdu chcete tuto nabídku smazat?"));

      if (!reallyDelete) {
        return;
      }

      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        alert(offersTranslate("offers.error.supabaseMissing", "Služba je dočasně nedostupná. Obnovte stránku."));
        return;
      }

      const { error } = await supabaseClient
        .from("offers")
        .update({
          status: "deleted"
        })
        .eq("id", offerId);

      if (error) {
        console.error(error);
        alert(offersTranslate("offers.error.delete", "Nabídku se nepodařilo smazat."));
        return;
      }

      await initializeOwnerOffersPage();
    }

    async function reloadAndReopen(reservationId, panelType) {
      const loaded = await loadOwnerData();

      if (!loaded) {
        renderLoadErrorState();
        return;
      }

      renderOffers();

      if (typeof window.refreshRentuloNotificationBadge === "function") {
        await window.refreshRentuloNotificationBadge();
      }

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
        offerManageButton.textContent = offersTranslate("offers.hide", "Skrýt");
      }

      if (panelType === "history") {
        const historyPanel = document.getElementById("history-panel-" + offerId);
        const historyButton = document.getElementById("history-toggle-" + offerId);

        if (historyPanel) {
          historyPanel.classList.add("open");
        }

        if (historyButton) {
          historyButton.textContent = offersTranslate("offers.hideHistory", "Skrýt historii");
        }

        return;
      }

      const openPanel = document.getElementById("open-panel-" + offerId);
      const openButton = document.getElementById("open-toggle-" + offerId);

      if (openPanel) {
        openPanel.classList.add("open");
      }

      if (openButton) {
        openButton.textContent = offersTranslate("offers.hideRequests", "Skrýt žádosti");
        openButton.classList.remove("important");
      }
    }

    function renderRequestNote(status) {
      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PENDING) {
        return `<p class="request-note">${offersTranslate("offers.note.pending", "Nová žádost čeká na vaše potvrzení nebo odmítnutí.")}</p>`;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_APPROVED) {
        return `<p class="request-note">${offersTranslate("offers.note.approved", "Žádost byla potvrzena. Čeká se na platbu zákazníka.")}</p>`;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PAID) {
        return `<p class="request-note success">${offersTranslate("offers.note.paid", "Rezervace je zaplacena. Po předání věci ji označte jako vyzvednutou.")}</p>`;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PICKED_UP) {
return `<p class="request-note success">${offersTranslate("offers.note.pickedUp", "Věc byla označena jako vyzvednutá. Po vrácení dokončete půjčení.")}</p>`;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_RETURNED) {
        return `<p class="request-note success">${offersTranslate("offers.note.returned", "Vráceno – půjčení je dokončeno. Už není potřeba žádná další akce.")}</p>`;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_REJECTED) {
        return `<p class="request-note">${offersTranslate("offers.note.rejected", "Žádost byla odmítnuta. Nabídka už touto žádostí není blokovaná.")}</p>`;
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_CANCELLED) {
        return `<p class="request-note">${offersTranslate("offers.note.cancelled", "Rezervace byla zrušena. Nabídka už touto žádostí není blokovaná.")}</p>`;
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
          <button class="small-button" type="button" data-offers-action="approve-reservation" data-reservation-id="${escapeHtml(reservationId)}">${offersTranslate("offers.action.approve", "Potvrdit")}</button>
        `);

        actions.push(`
          <button class="small-button light" type="button" data-offers-action="reject-reservation" data-reservation-id="${escapeHtml(reservationId)}">${offersTranslate("offers.action.reject", "Odmítnout")}</button>
        `);
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PAID) {
        actions.push(`
          <button class="small-button orange" type="button" data-offers-action="mark-picked-up" data-reservation-id="${escapeHtml(reservationId)}">
            ${offersTranslate("offers.action.pickedUp", "Označit jako vyzvednuto")}
          </button>
        `);
      }

      if (normalizeReservationStatus(status) === RESERVATION_STATUS_PICKED_UP) {
        actions.push(`
          <button class="small-button" type="button" data-offers-action="mark-returned" data-reservation-id="${escapeHtml(reservationId)}">
            ${offersTranslate("offers.action.returned", "Označit jako vráceno")}
          </button>
        `);
      }

      return actions.join("");
    }

    function renderReservationContactBlock(reservation) {
      if (!canShowContact(reservation.status)) {
        return `
          <div class="request-contact-box locked">
            <strong>${offersTranslate("offers.contact.hiddenTitle", "Kontakt zatím skrytý")}</strong>
            ${offersTranslate("offers.contact.hiddenText", "Kontakt na zájemce se zobrazí až po zaplacení rezervace.")}
          </div>
        `;
      }

      const renterName = reservation.renterName || offersTranslate("offers.renterFallback", "Zájemce");
      const renterEmail = reservation.renterEmail || offersTranslate("offers.emailMissing", "E-mail není uložen");
      const renterPhone = reservation.renterPhone || offersTranslate("offers.phoneMissing", "Telefon není uložen");

      const contactTitle =
  normalizeReservationStatus(reservation.status) === RESERVATION_STATUS_RETURNED
        ? offersTranslate("offers.contact.completedTitle", "Kontakt na zákazníka k dokončené rezervaci")
        : offersTranslate("offers.contact.renterTitle", "Kontakt na zájemce");

      const returnedNote =
  normalizeReservationStatus(reservation.status) === RESERVATION_STATUS_RETURNED
        ? offersTranslate("offers.contact.completedNote", "Rezervace je dokončená, kontakt zůstává dostupný pro případné zpětné dohledání. ")
        : "";

      return `
        <div class="request-contact-box">
          <strong>${contactTitle}</strong>
          ${escapeHtml(returnedNote)}
          ${offersTranslate("offers.contact.name", "Jméno")}: ${escapeHtml(renterName)}<br>
          ${offersTranslate("offers.contact.email", "E-mail")}: ${escapeHtml(renterEmail)}<br>
          ${offersTranslate("offers.contact.phone", "Telefon")}: ${escapeHtml(renterPhone)}
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
            <strong>${offersTranslate("offers.review.sentTitle", "Hodnocení zákazníka bylo odesláno")}</strong>
            <div style="margin-top: 6px; color: #006b45; font-size: 15px;">
              ${escapeHtml(getStars(existingReview.rating))}
            </div>
            <div style="margin-top: 6px;">
              ${escapeHtml(existingReview.text || offersTranslate("offers.review.noComment", "Bez komentáře"))}
            </div>
            <div style="margin-top: 6px; color: #5b6862; font-size: 12px;">
              ${offersTranslate("offers.review.sentAt", "Odesláno")}: ${escapeHtml(formatOffersDate(existingReview.createdAt))}
            </div>
          </div>
        `;
      }

      return `
        <div class="request-contact-box">
          <strong>${offersTranslate("offers.review.title", "Ohodnotit zákazníka")}</strong>
          <div style="margin-top: 10px;">
            <label>
              ${offersTranslate("offers.review.rating", "Počet hvězdiček")}
              <select
  id="owner-review-rating-${escapeHtml(reservationId)}"
  class="owner-review-select"
>
                <option value="5">★★★★★ - ${offersTranslate("offers.review.excellent", "výborné")}</option>
                <option value="4">★★★★☆ - ${offersTranslate("offers.review.good", "dobré")}</option>
                <option value="3">★★★☆☆ - ${offersTranslate("offers.review.average", "průměrné")}</option>
                <option value="2">★★☆☆☆ - ${offersTranslate("offers.review.weak", "slabé")}</option>
                <option value="1">★☆☆☆☆ - ${offersTranslate("offers.review.bad", "špatné")}</option>
              </select>
            </label>
          </div>

          <div style="margin-top: 10px;">
            <label>
              ${offersTranslate("offers.review.comment", "Komentář")}
              <textarea
  id="owner-review-text-${escapeHtml(reservationId)}"
  class="owner-review-textarea"
  rows="3"
  placeholder="${offersTranslate("offers.review.placeholder", "Jak proběhlo půjčení?")}"
></textarea>
          </div>

          <button class="small-button" type="button" data-offers-action="save-owner-review" data-reservation-id="${escapeHtml(reservationId)}">
            ${offersTranslate("offers.review.submit", "Odeslat hodnocení")}
          </button>
        </div>
      `;
    }

    async function saveOwnerReviewForRenter(reservationId) {
      const reservation = ownerReservations.find(function (item) {
        return String(item.id) === String(reservationId);
      });

      if (!reservation) {
        alert(offersTranslate("offers.error.reservationNotFound", "Rezervace nebyla nalezena."));
        return;
      }

      if (
  normalizeReservationStatus(reservation.status) !==
  RESERVATION_STATUS_RETURNED
) {
        alert(offersTranslate("offers.error.reviewTooEarly", "Zákazníka můžete ohodnotit až po dokončení půjčení."));
        return;
      }

      const existingReview = findOwnerReviewForRenter(reservation);

      if (existingReview) {
        alert(offersTranslate("offers.error.alreadyReviewed", "Tuto rezervaci jste už hodnotili."));
        return;
      }

      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        alert(offersTranslate("offers.error.supabaseMissing", "Služba je dočasně nedostupná. Obnovte stránku."));
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
        alert(offersTranslate("offers.error.renterIdMissing", "Chybí ID zákazníka pro hodnocení."));
        return;
      }

      const reviewToInsert = {
  reservation_id: reservation.id,
  rating: rating,
  text: text
};

      const { error } = await supabaseClient
        .from("reviews")
        .insert(reviewToInsert);

      if (error) {
        console.error("Chyba při ukládání hodnocení:", error);

        if (String(error.message || "").toLowerCase().includes("duplicate")) {
          alert(offersTranslate("offers.error.alreadyReviewed", "Tuto rezervaci jste už hodnotili."));
        } else {
          alert(offersTranslate("offers.error.reviewSave", "Hodnocení se nepodařilo uložit."));
        }

        return;
      }

      alert(offersTranslate("offers.review.saved", "Hodnocení bylo uloženo."));
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
              ${offersTranslate("offers.detail.customerPrice", "Cena pro zákazníka")}
              <strong>${escapeHtml(formatOffersMoney(price))}</strong>
            </div>

            <div class="money-cell">
              ${offersTranslate("offers.detail.fee", "Provize Rentulo")}
              <strong>${escapeHtml(formatOffersMoney(platformFee))}</strong>
            </div>

            <div class="money-cell">
              ${offersTranslate("offers.detail.ownerReceives", "Vy dostanete")}
              <strong>${escapeHtml(formatOffersMoney(ownerPayout))}</strong>
            </div>
          </div>

          <div class="request-actions">
            <a class="small-button light" href="moje-nabidky.html?open=actions">${offersTranslate("offers.detail.backToRequests", "Zpět na žádosti")}</a>
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

      const renterName = reservation.renterName || offersTranslate("offers.renterFallback", "Zájemce");
      const renterEmail = canShowContact(status)
        ? reservation.renterEmail || offersTranslate("offers.emailMissing", "E-mail není uložen")
        : offersTranslate("offers.contact.afterPayment", "Kontakt se zobrazí po zaplacení");

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
              ${escapeHtml(formatOffersDate(startDate))} – ${escapeHtml(formatOffersDate(endDate))}
            </div>

            <div class="table-value hide-tablet">
              ${escapeHtml(formatOffersMoney(price))}
            </div>

            <span class="request-status ${getRequestStatusClass(status)}">${escapeHtml(statusText)}</span>

            <div class="row-actions">
              ${actionButtons}
              <button class="history-toggle-button" type="button" data-offers-action="toggle-request-detail" data-reservation-id="${escapeHtml(reservationId)}">
                ${offersTranslate("offers.detail.show", "Detail")}
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

      const renterName = reservation.renterName || offersTranslate("offers.renterFallback", "Zájemce");
      const renterEmail = canShowContact(status)
        ? reservation.renterEmail || offersTranslate("offers.emailMissing", "E-mail není uložen")
        : offersTranslate("offers.contact.afterPayment", "Kontakt se zobrazí po zaplacení");

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
              ${escapeHtml(formatOffersDate(startDate))} – ${escapeHtml(formatOffersDate(endDate))}
            </div>

            <div class="history-status">
              ${escapeHtml(statusText)}
            </div>

            <div class="history-price hide-tablet">
              ${escapeHtml(formatOffersMoney(price))}
            </div>

            <div class="row-actions">
              <button class="history-toggle-button" type="button" data-offers-action="toggle-history-request" data-reservation-id="${escapeHtml(reservationId)}">
                ${offersTranslate("offers.detail.show", "Detail")}
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
        button.textContent = offersTranslate("offers.detail.show", "Detail");
        return;
      }

      detail.classList.add("open");
      button.textContent = offersTranslate("offers.hide", "Skrýt");
    }

    function toggleHistoryRequest(reservationId, button) {
      const detail = document.getElementById("history-request-detail-" + reservationId);

      if (!detail) {
        return;
      }

      const isOpen = detail.classList.contains("open");

      if (isOpen) {
        detail.classList.remove("open");
        button.textContent = offersTranslate("offers.detail.show", "Detail");
        return;
      }

      detail.classList.add("open");
      button.textContent = offersTranslate("offers.hide", "Skrýt");
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
        button.textContent = offersTranslate("offers.manage", "Spravovat");
        return;
      }

      detail.classList.add("open");
      button.textContent = offersTranslate("offers.hide", "Skrýt");
    }

    function renderRequestPanel(panelId, title, count, content) {
      const countText = getRequestCountText(count);

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

    function toggleOfferRequests(offerId) {
      const offerDetail = document.getElementById("offer-detail-" + offerId);
      const openPanel = document.getElementById("open-panel-" + offerId);
      const openButton = document.getElementById("open-toggle-" + offerId);
      const isOpen = openPanel && openPanel.classList.contains("open");

      if (isOpen) {
        openPanel.classList.remove("open");

        if (openButton) {
          openButton.textContent = openButton.getAttribute("data-closed-text");

          if (openButton.getAttribute("data-important") === "true") {
            openButton.classList.add("important");
          }
        }

        return;
      }

      if (offerDetail) {
        offerDetail.classList.add("open");
      }

      if (openPanel) {
        openPanel.classList.add("open");
      }

      if (openButton) {
        openButton.textContent = offersTranslate("offers.hideRequests", "Skrýt žádosti");
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
      const offerName = getOfferDisplayName(offer);
      const offerCity = getOfferCity(offer);
      const offerCategory = getOfferCategory(offer);
      const offerPrice = getOfferPrice(offer);
      const isDraft = isOfferDraft(offer);

      const openRequests = requests.filter(function (reservation) {
        return isOpenStatus(reservation.status);
      });

      const ownerActionRequests = openRequests.filter(function (reservation) {
        return isOwnerActionStatus(reservation.status);
      });

      const openPanelId = "open-panel-" + offerId;
      const offerDetailId = "offer-detail-" + offerId;

      const openRequestsButtonText = openRequests.length
        ? offersTranslate("offers.showRequestsCount", "Zobrazit žádosti ({count})", { count: openRequests.length })
        : offersTranslate("offers.openRequestsZero", "Otevřené žádosti (0)");

      const openContent = openRequests.length
        ? openRequests.map(renderRequest).join("")
        : `<p class="request-empty-note">${offersTranslate("offers.noOpenRequests", "U této nabídky teď není žádná otevřená žádost.")}</p>`;

      let requestStateHtml = `<span class="offer-request-state quiet">${offersTranslate("offers.noOpenRequestsShort", "Bez otevřených žádostí")}</span>`;

      if (isDraft) {
        requestStateHtml = `<span class="offer-request-state draft">${offersTranslate("offers.draftNotPublished", "Koncept není zveřejněný")}</span>`;
      } else if (ownerActionRequests.length) {
        requestStateHtml = `
          <span class="offer-request-state urgent">
            ${escapeHtml(getWaitingRequestText(ownerActionRequests.length))}
          </span>
        `;
      } else if (openRequests.length) {
        requestStateHtml = `
          <span class="offer-request-state active">
            ${escapeHtml(getOpenRequestText(openRequests.length))}
          </span>
        `;
      }

      const primaryActionHtml = isDraft
        ? `<button class="offer-primary-button orange" type="button" data-offers-action="publish-offer" data-offer-id="${escapeHtml(offerId)}">${offersTranslate("offers.publish", "Zveřejnit nabídku")}</button>`
        : openRequests.length
          ? `<button class="offer-primary-button ${ownerActionRequests.length ? "urgent" : ""}" type="button" data-offers-action="open-offer-requests" data-offer-id="${escapeHtml(offerId)}">${ownerActionRequests.length ? offersTranslate("offers.handleRequests", "Vyřídit žádosti") : offersTranslate("offers.showRequests", "Zobrazit žádosti")}</button>`
          : `<button class="offer-primary-button secondary" type="button" data-offers-action="toggle-offer-detail" data-detail-id="${escapeHtml(offerDetailId)}">${offersTranslate("offers.overview", "Přehled nabídky")}</button>`;

      const detailHtml = isDraft
        ? ""
        : `
          <div class="offer-detail" id="${escapeHtml(offerDetailId)}">
            <div class="offer-detail-grid">
              <div class="mini-stat">
                <span>${offersTranslate("offers.place", "Místo")}</span>
                <strong>${escapeHtml(offerCity)}</strong>
              </div>
              <div class="mini-stat">
                <span>${offersTranslate("offers.category", "Kategorie")}</span>
                <strong>${escapeHtml(offerCategory)}</strong>
              </div>
              <div class="mini-stat">
                <span>${offersTranslate("offers.openRequests", "Otevřené žádosti")}</span>
                <strong>${escapeHtml(openRequests.length)}</strong>
              </div>
            </div>

            <div class="offer-detail-actions">
              <button
                class="request-toggle-button ${ownerActionRequests.length ? "important" : ""}"
                type="button"
                id="open-toggle-${escapeHtml(offerId)}"
                data-offers-action="toggle-request-panel"
                data-panel-id="${escapeHtml(openPanelId)}"
                data-closed-text="${escapeHtml(openRequestsButtonText)}"
                data-open-text="${escapeHtml(offersTranslate("offers.hideRequests", "Skrýt žádosti"))}"
                data-important="${ownerActionRequests.length ? "true" : "false"}"
              >${escapeHtml(openRequestsButtonText)}</button>
            </div>

            ${renderRequestPanel(openPanelId, offersTranslate("offers.openRequests", "Otevřené žádosti"), openRequests.length, openContent)}
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
                  <strong>${escapeHtml(formatOffersMoneyPerDay(offerPrice))}</strong>
                  ${requestStateHtml}
                </div>
              </div>
            </div>

            <div class="offer-card-controls">
              ${primaryActionHtml}

              <details class="offer-more-menu">
                <summary aria-label="${escapeHtml(offersTranslate("offers.moreActions", "Další akce nabídky"))}">•••</summary>
                <div class="offer-more-menu-panel">
                  <a href="edit-nabidka.html?id=${encodeURIComponent(offerId)}">${offersTranslate("offers.edit", "Upravit nabídku")}</a>
                  ${isDraft ? "" : `<a href="detail.html?id=${encodeURIComponent(offerId)}">${offersTranslate("offers.publicDetail", "Veřejný detail")}</a>`}
                  ${isDraft ? "" : `<button type="button" data-offers-action="toggle-offer-overview" data-offer-id="${escapeHtml(offerId)}">${offersTranslate("offers.overviewHistory", "Přehled a historie")}</button>`}
                  <button class="danger" type="button" data-offers-action="delete-offer" data-offer-id="${escapeHtml(offerId)}">${offersTranslate("offers.delete", "Smazat nabídku")}</button>
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
  const offerName = getOfferDisplayName(offer);
  const offerCity = getOfferCity(offer);
  const offerPrice = getOfferPrice(offer);
  const openPanelId = "open-panel-" + offerId;
  const isDraft = isOfferDraft(offer);

  const openRequests = requests.filter(function (reservation) {
    return isOpenStatus(reservation.status);
  });

  const ownerActionRequests = openRequests.filter(function (reservation) {
    return isOwnerActionStatus(reservation.status);
  });

  const requestText = getRequestCountText(openRequests.length);

  const openContent = openRequests.length
    ? openRequests.map(renderRequest).join("")
    : `<p class="request-empty-note">${offersTranslate("offers.noOpenRequests", "U této nabídky teď není žádná otevřená žádost.")}</p>`;

  return `
    <div class="simple-offer-record">
      <article class="simple-offer-row">
        <div class="simple-offer-main">
          ${renderToolImage(offer)}

          <div class="simple-offer-info">
            <strong class="simple-offer-name">${escapeHtml(offerName)}</strong>
            <span class="simple-offer-meta">${escapeHtml(offerCity)}</span>
          </div>
        </div>

        <div class="simple-offer-value">
          ${escapeHtml(formatOffersMoneyPerDay(offerPrice))}
        </div>

        <div class="simple-offer-value">
          ${escapeHtml(requestText)}
        </div>

        <div class="simple-offer-value simple-offer-status status-${escapeHtml(String(offer.status || "active").toLowerCase())}">
          ${escapeHtml(getOfferStatus(offer))}
        </div>

        <div class="simple-offer-actions">
          ${
            isDraft
              ? `<button
                  type="button"
                  class="offer-primary-button orange"
                  data-offers-action="publish-offer"
                  data-offer-id="${escapeHtml(offerId)}"
                >
                  ${offersTranslate("offers.publish", "Zveřejnit nabídku")}
                </button>`
              : openRequests.length
              ? `<button
                  type="button"
                  class="offer-primary-button ${ownerActionRequests.length ? "urgent" : ""}"
                  data-offers-action="open-offer-requests"
                  data-offer-id="${escapeHtml(offerId)}"
                >
                  ${ownerActionRequests.length
                    ? offersTranslate("offers.handleRequests", "Vyřídit žádosti")
                    : offersTranslate("offers.showRequests", "Zobrazit žádosti")}
                </button>`
              : `<a href="detail.html?id=${encodeURIComponent(offerId)}">
                  ${offersTranslate("offers.detail.show", "Detail")}
                </a>`
          }

          <details class="offer-more-menu simple-offer-more-menu">
            <summary aria-label="${escapeHtml(offersTranslate("offers.moreActions", "Další akce nabídky"))}">•••</summary>
            <div class="offer-more-menu-panel">
              <a href="edit-nabidka.html?id=${encodeURIComponent(offerId)}">
                ${offersTranslate("offers.edit", "Upravit nabídku")}
              </a>
              <button
                class="danger"
                type="button"
                data-offers-action="delete-offer"
                data-offer-id="${escapeHtml(offerId)}"
              >${offersTranslate("offers.delete", "Smazat nabídku")}</button>
            </div>
          </details>
        </div>
      </article>

      ${renderRequestPanel(openPanelId, offersTranslate("offers.openRequests", "Otevřené žádosti"), openRequests.length, openContent)}
    </div>
  `;
}
    function renderOffers(options) {
      if (ownerOffersLoadState === "error") {
        renderLoadErrorState();
        return;
      }

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

      if (!options || options.autoOpenFromUrl !== false) {
        autoOpenActionOfferFromUrl();
      }
    }

    function captureOffersUiState() {
      const openElementIds = Array.from(
        document.querySelectorAll("#offersList .open[id]")
      ).map(function (element) {
        return element.id;
      });
      const reviewValues = {};

      document.querySelectorAll("#offersList .owner-review-select, #offersList .owner-review-textarea")
        .forEach(function (element) {
          if (element.id) {
            reviewValues[element.id] = element.value;
          }
        });

      return {
        openElementIds: openElementIds,
        reviewValues: reviewValues
      };
    }

    function restoreOffersUiState(state) {
      if (!state) {
        return;
      }

      state.openElementIds.forEach(function (elementId) {
        const element = document.getElementById(elementId);

        if (!element) {
          return;
        }

        element.classList.add("open");

        if (elementId.startsWith("open-panel-")) {
          const panelButton = Array.from(
            document.querySelectorAll('[data-offers-action="toggle-request-panel"]')
          ).find(function (button) {
            return button.dataset.panelId === elementId;
          });

          if (panelButton) {
            panelButton.textContent = panelButton.dataset.openText || offersTranslate("offers.hideRequests", "Skrýt žádosti");
            panelButton.classList.remove("important");
          }
        }

        if (elementId.startsWith("request-detail-")) {
          const reservationId = elementId.replace("request-detail-", "");
          const detailButton = Array.from(
            document.querySelectorAll('[data-offers-action="toggle-request-detail"]')
          ).find(function (button) {
            return button.dataset.reservationId === reservationId;
          });

          if (detailButton) {
            detailButton.textContent = offersTranslate("offers.hide", "Skrýt");
          }
        }
      });

      Object.keys(state.reviewValues).forEach(function (elementId) {
        const element = document.getElementById(elementId);

        if (element) {
          element.value = state.reviewValues[elementId];
        }
      });
    }

    function rerenderOffersForLanguageChange() {
      const uiState = captureOffersUiState();
      renderOffers({ autoOpenFromUrl: false });
      restoreOffersUiState(uiState);
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
          offerManageButton.textContent = offersTranslate("offers.hide", "Skrýt");
        }

        const openPanel = document.getElementById("open-panel-" + offerId);
        const openButton = document.getElementById("open-toggle-" + offerId);

        if (openPanel) {
          openPanel.classList.add("open");
        }

        if (openButton) {
          openButton.textContent = offersTranslate("offers.hideRequests", "Skrýt žádosti");
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

    async function handleOffersActionClick(event) {
      const actionButton = event.target.closest("[data-offers-action]");

      if (!actionButton) {
        return;
      }

      event.preventDefault();

      const action = actionButton.dataset.offersAction;
      const reservationId = actionButton.dataset.reservationId || "";
      const offerId = actionButton.dataset.offerId || "";

      const mutationActions = new Set([
        "approve-reservation",
        "reject-reservation",
        "mark-picked-up",
        "mark-returned",
        "save-owner-review",
        "publish-offer",
        "delete-offer"
      ]);
      const isMutationAction = mutationActions.has(action);

      if (isMutationAction && actionButton.dataset.busy === "true") {
        return;
      }

      if (isMutationAction) {
        actionButton.dataset.busy = "true";
        actionButton.disabled = true;
      }

      try {
        switch (action) {
          case "approve-reservation":
            await approveReservation(reservationId);
            break;
          case "reject-reservation":
            await rejectReservation(reservationId);
            break;
          case "mark-picked-up":
            await markReservationPickedUp(reservationId);
            break;
          case "mark-returned":
            await markReservationReturned(reservationId);
            break;
          case "save-owner-review":
            await saveOwnerReviewForRenter(reservationId);
            break;
          case "toggle-request-detail":
            toggleRequestDetail(reservationId, actionButton);
            break;
          case "toggle-history-request":
            toggleHistoryRequest(reservationId, actionButton);
            break;
          case "publish-offer":
            await publishOffer(offerId);
            break;
          case "open-offer-requests":
            toggleOfferRequests(offerId);
            break;
          case "toggle-offer-detail":
            toggleOfferDetail(actionButton.dataset.detailId || "", actionButton);
            break;
          case "toggle-request-panel":
            toggleRequestPanel(actionButton.dataset.panelId || "", actionButton);
            break;
          case "toggle-offer-overview":
            toggleOfferOverviewFromMenu(offerId, actionButton.closest("details"));
            break;
          case "delete-offer":
            await deleteOffer(offerId);
            break;
          default:
            break;
        }
      } finally {
        if (isMutationAction && actionButton.isConnected) {
          delete actionButton.dataset.busy;
          actionButton.disabled = false;
        }
      }
    }

    async function initializeOwnerOffersPage() {
      const verifiedUser = await window.rentuloAuthGuard.requireUser();

      if (!verifiedUser) {
        return;
      }

      renderSharedNavigation("muj-ucet");
      renderLoadingState();

      const loaded = await loadOwnerData();

      renderSharedNavigation("muj-ucet");

      if (loaded) {
        renderOffers();
      } else {
        renderLoadErrorState();
      }

      showAccountMessageFromStorage();
    }

    document.addEventListener("click", handleOffersActionClick);

    document.addEventListener("DOMContentLoaded", function () {
      initializeOwnerOffersPage();
    });

    document.addEventListener("rentuloLanguageChanged", function () {
      renderSharedNavigation("muj-ucet");

      if (ownerOffersLoadState === "loading") {
        renderLoadingState();
      } else if (ownerOffersLoadState === "error") {
        renderLoadErrorState();
      } else if (ownerOffersLoadState === "ready") {
        rerenderOffersForLanguageChange();
      }

      renderAccountMessage();
    });
