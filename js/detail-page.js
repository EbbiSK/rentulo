    const PLATFORM_FEE_PERCENT = 10;
    let currentOffer = null;

    function detailTranslate(key, replacements) {
      let text = typeof window.rentuloTranslate === "function"
        ? window.rentuloTranslate(key)
        : key;

      Object.keys(replacements || {}).forEach(function (name) {
        text = text.replaceAll("{" + name + "}", String(replacements[name]));
      });

      return text;
    }

    function detailCategoryLabel(category) {
      const value = String(category || "").trim();
      const categories = {
        "Dům a zahrada": "detail.category.homeGarden",
        "Dílna a nářadí": "detail.category.workshopTools",
        "Sport a volný čas": "detail.category.sportLeisure",
        "Elektronika": "detail.category.electronics",
        "Děti a rodina": "detail.category.childrenFamily",
        "Auto a doprava": "detail.category.autoTransport",
        "Párty a akce": "detail.category.partyEvents",
        "Cestování a kempování": "detail.category.travelCamping",
        "Stavební technika": "detail.category.construction",
        "Ostatní": "detail.category.other"
      };
      return categories[value] ? detailTranslate(categories[value]) : (value || detailTranslate("detail.category.other"));
    }

    function detailStatusLabel(status) {
      const value = String(status || "").trim().toLowerCase();
      if (value === "active" || value === "aktivní") return detailTranslate("detail.status.active");
      if (value === "draft" || value === "koncept") return detailTranslate("detail.status.draft");
      return status || detailTranslate("detail.status.active");
    }

  

 

    function getOfferIdFromUrl() {
      const params = new URLSearchParams(window.location.search);
      return params.get("id");
    }

    function getDaysBetween(startDate, endDate) {
      if (!startDate || !endDate) {
        return 0;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
      }

      const difference = end - start;
      const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

      return days > 0 ? days : 0;
    }

    function getNextDate(dateString) {
      const date = new Date(dateString);

      if (!dateString || isNaN(date.getTime())) {
        return "";
      }

      date.setDate(date.getDate() + 1);

      return date.toISOString().split("T")[0];
    }

    function normalizeSupabaseOffer(row) {
      return {
        id: row.id,
ownerId: row.owner_id,
owner_id: row.owner_id,
        name: row.name,
        title: row.name,
        nazev: row.name,

        category: row.category,
        kategorie: row.category,

        description: row.description,
        popis: row.description,

        city: row.city,
        mesto: row.city,

        postalCode: row.postal_code,
        psc: row.postal_code,

        price: row.price_per_day,
        pricePerDay: row.price_per_day,
        cena: row.price_per_day,


        status: row.status === "active" ? "Aktivní" : row.status,
        supabaseStatus: row.status,

        photoUrl: row.photo_url,
        photo_url: row.photo_url,
        image: row.photo_url,

        pickupMode: row.pickup_mode || "",
        pickup_mode: row.pickup_mode || "",
        pickupPhone: row.pickup_phone || "",
        pickup_phone: row.pickup_phone || "",
        pickupStreet: row.pickup_street || "",
        pickup_street: row.pickup_street || "",
        pickupCity: row.pickup_city || "",
        pickup_city: row.pickup_city || "",
        pickupPostalCode: row.pickup_postal_code || "",
        pickup_postal_code: row.pickup_postal_code || "",
        pickupNote: row.pickup_note || "",
        pickup_note: row.pickup_note || "",

        createdAt: row.created_at,
        updatedAt: row.updated_at,

        source: "supabase"
      };
    }

    async function loadOfferFromSupabase(offerId) {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient || !offerId) {
        return null;
      }

      const { data, error } = await supabaseClient
        .from("public_offers")
        .select("*")
        .eq("id", offerId)
        .maybeSingle();

      if (error) {
        console.error(error);
        return null;
      }

      return data ? normalizeSupabaseOffer(data) : null;
    }

    async function loadOfferPrivatePickupData(offerId) {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient || !offerId) {
        return null;
      }

      const { data, error } = await supabaseClient
        .from("offers")
        .select("pickup_phone, pickup_street, pickup_city, pickup_postal_code, pickup_note")
        .eq("id", offerId)
        .maybeSingle();

      if (error) {
        console.warn("Kontaktní údaje nabídky se nepodařilo načíst z tabulky offers.", error);
        return null;
      }

      return data || null;
    }

    function getOfferPickupPhone(offer, pickupData) {
      return (
        (pickupData && pickupData.pickup_phone) ||
        offer.pickupPhone ||
        offer.pickup_phone ||
        ""
      );
    }

    function getOfferPickupStreet(offer, pickupData) {
      return (
        (pickupData && pickupData.pickup_street) ||
        offer.pickupStreet ||
        offer.pickup_street ||
        ""
      );
    }

    function getOfferPickupCity(offer, pickupData) {
      return (
        (pickupData && pickupData.pickup_city) ||
        offer.pickupCity ||
        offer.pickup_city ||
        getOfferCity(offer) ||
        ""
      );
    }

    function getOfferPickupPostalCode(offer, pickupData) {
      return (
        (pickupData && pickupData.pickup_postal_code) ||
        offer.pickupPostalCode ||
        offer.pickup_postal_code ||
        offer.postalCode ||
        offer.psc ||
        ""
      );
    }

    function getOfferPickupNote(offer, pickupData) {
      return (
        (pickupData && pickupData.pickup_note) ||
        offer.pickupNote ||
        offer.pickup_note ||
        ""
      );
    }

    function getOfferPickupFullAddress(offer, pickupData) {
      return [
        getOfferPickupStreet(offer, pickupData),
        getOfferPickupCity(offer, pickupData),
        getOfferPickupPostalCode(offer, pickupData)
      ].filter(Boolean).join(", ");
    }

function getOfferCategory(offer) {
      return offer.category || offer.kategorie || detailTranslate("detail.category.other");
    }

    function getOfferCity(offer) {
      return offer.city || offer.mesto || offer.location || "-";
    }

    function getOfferStatus(offer) {
      return offer.status || "active";
    }

    function getOfferPhoto(offer) {
      return (
        offer.photoUrl ||
        offer.photo_url ||
        offer.photoDataUrl ||
        offer.imageDataUrl ||
        offer.image ||
        offer.photo ||
        ""
      );
    }

function renderDetailImage(offer) {
      const offerName = getOfferName(offer);
      const photo = getOfferPhoto(offer);

      if (photo) {
        return `
          <div class="image-box has-photo">
            <img src="${escapeHtml(photo)}" alt="${escapeHtml(offerName)}">
            <div class="image-label">${escapeHtml(offerName)}</div>
          </div>
        `;
      }

      return `
        <div class="image-box">
          <div class="image-icon">⌁</div>
          <div class="image-label">${escapeHtml(offerName)}</div>
        </div>
      `;
    }

    function isOfferDraft(offer) {
      const status = String(getOfferStatus(offer)).trim().toLowerCase();
      return status === "koncept" || status === "draft";
    }

    function isOfferActive(offer) {
      return !isOfferDraft(offer);
    }

    function offerHasGpsLocation() {
      return false;
    }

    function getPickupGpsText() {
      return detailTranslate("detail.gps.private");
    }

    function setupBackLink() {
      const backLink = document.getElementById("detailBackLink");

      if (!backLink) {
        return;
      }

      try {
        const referrer = document.referrer;

        if (referrer && referrer.includes("vysledky.html")) {
          backLink.href = referrer;
          return;
        }

        const storedResultsUrl = sessionStorage.getItem("rentuloLastResultsUrl");

        if (storedResultsUrl) {
          backLink.href = storedResultsUrl;
        }
      } catch (error) {
        backLink.href = "vysledky.html";
      }
    }

    function renderLoading() {
      document.getElementById("detailContent").innerHTML = `
        <div class="message-card">
          <strong>${detailTranslate("detail.loadingTitle")}</strong><br>
          ${detailTranslate("detail.loadingText")}
        </div>
      `;
    }

    function renderNotFound() {
      document.getElementById("detailContent").innerHTML = `
        <div class="message-card warning">
          <strong>${detailTranslate("detail.notFoundTitle")}</strong><br>
          ${detailTranslate("detail.notFoundText")}
          <br>
          <a href="vysledky.html" class="primary-button">${detailTranslate("detail.backToListings")}</a>
        </div>
      `;
    }

    function renderSidebarMessage(type, title, text, buttonHref, buttonText) {
      return `
        <div class="message-card ${type === "warning" ? "warning" : ""}">
          <strong>${escapeHtml(title)}</strong><br>
          ${escapeHtml(text)}
          <br>
          <a href="${escapeHtml(buttonHref)}" class="primary-button">${escapeHtml(buttonText)}</a>
        </div>
      `;
    }

    function renderUnavailableSidebar(price, ownerPublicName, ownerPublicCity, messageTitle, messageText) {
      return `
        <aside class="sidebar">
          <div class="price">${escapeHtml(price)}</div>
          <div class="price-small">${detailTranslate("detail.currencyPerDay")}</div>

          <div class="info-list">
            <div class="info-row">
              <span>${detailTranslate("detail.owner")}</span>
              <span>${escapeHtml(ownerPublicName)}</span>
            </div>

            <div class="info-row">
              <span>${detailTranslate("detail.location")}</span>
              <span>${escapeHtml(ownerPublicCity || "-")}</span>
            </div>

            <div class="info-row">
              <span>${detailTranslate("detail.availability")}</span>
              <span>${detailTranslate("detail.unavailable")}</span>
            </div>
          </div>

          <div class="availability-box unavailable">
            <strong>${escapeHtml(messageTitle)}</strong>
            ${escapeHtml(messageText)}
          </div>

          <button class="primary-button disabled" type="button" disabled>
            ${detailTranslate("detail.cannotReserve")}
          </button>

          <div class="note">
            ${detailTranslate("detail.cannotReserveNote")}
          </div>
        </aside>
      `;
    }

    function renderBookingSidebar(offer, price, ownerPublicName, ownerPublicCity, ownerGetsPerDay, platformFeePerDay) {
      return `
        <aside class="sidebar">
          <div class="price">${escapeHtml(price)}</div>
          <div class="price-small">${detailTranslate("detail.currencyPerDay")}</div>

          <div class="info-list">
            <div class="info-row">
              <span>${detailTranslate("detail.owner")}</span>
              <span>${escapeHtml(ownerPublicName)}</span>
            </div>

            <div class="info-row">
              <span>${detailTranslate("detail.location")}</span>
              <span>${escapeHtml(ownerPublicCity || getOfferCity(offer) || "-")}</span>
            </div>

            <div class="info-row">
              <span>${detailTranslate("detail.ownerReceives")}</span>
              <span>${escapeHtml(ownerGetsPerDay)} Kč / den</span>
            </div>

            <div class="info-row">
              <span>${detailTranslate("detail.platformFee")}</span>
              <span>${escapeHtml(platformFeePerDay)} Kč / den</span>
            </div>
          </div>

          <div class="availability-box available">
            <strong>${detailTranslate("detail.availableTitle")}</strong>
            ${detailTranslate("detail.availableText")}
          </div>

          <div class="privacy-box">
            <strong>${detailTranslate("detail.contactsHiddenTitle")}</strong>
            ${detailTranslate("detail.contactsHiddenText")}
          </div>

          <div class="booking-box">
            <h2>${detailTranslate("detail.chooseDates")}</h2>

            <div class="form-group">
              <label for="startDate">${detailTranslate("detail.startDate")}</label>
              <input type="date" id="startDate">
            </div>

            <div class="form-group">
              <label for="endDate">${detailTranslate("detail.endDate")}</label>
              <input type="date" id="endDate">
            </div>

            <div class="date-help" id="bookingDateHelp">
              ${detailTranslate("detail.dateHelp")}
            </div>

            <div class="calculation">
              <div class="calc-row">
                <span>${detailTranslate("detail.days")}</span>
                <strong id="calcDays">-</strong>
              </div>

              <div class="calc-row">
                <span>${detailTranslate("detail.pricePerDay")}</span>
                <strong>${escapeHtml(price)} Kč</strong>
              </div>

              <div class="calc-row">
                <span>${detailTranslate("detail.platformFee")}</span>
                <strong>${PLATFORM_FEE_PERCENT} %</strong>
              </div>

              <div class="calc-row calc-total">
                <span>${detailTranslate("detail.total")}</span>
                <strong id="calcTotal">-</strong>
              </div>
            </div>

            <button class="primary-button disabled" id="rentButton" type="button" disabled>
              ${detailTranslate("detail.selectDates")}
            </button>
          </div>

          <div class="note">
            ${detailTranslate("detail.requestNote")}
          </div>
        </aside>
      `;
    }

    async function hasReservationDateConflict(offerId, startDate, endDate) {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient || !offerId || !startDate || !endDate) {
        return false;
      }

      const blockingStatuses = [
        "pending",
        "approved",
        "paid",
        "picked_up"
      ];

      const { data: blockingReservations, error } = await supabaseClient
  .rpc("get_blocking_reservations", {
    p_offer_id: offerId
  });

const data = Array.isArray(blockingReservations)
  ? blockingReservations.filter(function (reservation) {
      return (
        reservation.start_date < endDate &&
        reservation.end_date > startDate
      );
    }).slice(0, 1)
  : [];

      if (error) {
        console.warn("Dostupnost termínu se nepodařilo ověřit.", error);
        throw error;
      }

      return Array.isArray(data) && data.length > 0;
    }

    async function renderDetail(offer) {
      if (!offer) {
        renderNotFound();
        return;
      }

      currentOffer = offer;

      const currentUser = await apiGetCurrentUser();

      const ownerPublicName = detailTranslate("detail.ownerDefault");
      const ownerPublicCity = getOfferCity(offer);

      const offerName = getOfferName(offer);
      const offerCategory = detailCategoryLabel(getOfferCategory(offer));
      const offerCity = getOfferCity(offer);
      const offerStatus = detailStatusLabel(getOfferStatus(offer));

      const price = getOfferPrice(offer);
      const platformFeePerDay = Math.round(price * PLATFORM_FEE_PERCENT / 100);
      const ownerGetsPerDay = price - platformFeePerDay;

      const currentUserId = currentUser ? String(currentUser.id || "") : "";
const ownerId = String(offer.ownerId || offer.owner_id || "");
const isOwner = currentUserId && ownerId && currentUserId === ownerId;

const isActive = isOfferActive(offer);
const hasGps = offerHasGpsLocation(offer);

      const availabilityBadgeClass = isActive ? "available" : "unavailable";
      const statusBadgeClass = isActive ? "" : "draft";

      let availabilityText = detailTranslate("detail.available");
      let availabilityPanelText = detailTranslate("detail.availabilityPanelActive");

      if (isOwner && isActive) {
        availabilityText = detailTranslate("detail.ownerOfferActiveTitle");
        availabilityPanelText = detailTranslate("detail.ownerOfferActiveText");
      } else if (!isActive) {
        availabilityText = detailTranslate("detail.inactive");
        availabilityPanelText = detailTranslate("detail.availabilityPanelInactive");
      }

      let sidebarContent = "";

      if (!currentUser) {
  sidebarContent = renderSidebarMessage(
    "",
    detailTranslate("detail.loginRequiredTitle"),
    detailTranslate("detail.loginRequiredText"),
    `prihlaseni.html?returnTo=${encodeURIComponent(
  window.location.pathname.split("/").pop() + window.location.search
)}`,
    detailTranslate("nav.login")
  );
} else if (isOwner) {
  sidebarContent = renderSidebarMessage(
    "",
    detailTranslate("detail.ownItemTitle"),
    detailTranslate("detail.ownItemText"),
    "moje-nabidky.html",
    detailTranslate("account.myListingsTitle")
  );
} else if (!isActive) {
        sidebarContent = renderUnavailableSidebar(
          price,
          ownerPublicName,
          ownerPublicCity,
          detailTranslate("detail.inactiveTitle"),
          detailTranslate("detail.inactiveText")
        );
      } else {
        sidebarContent = renderBookingSidebar(
          offer,
          price,
          ownerPublicName,
          ownerPublicCity,
          ownerGetsPerDay,
          platformFeePerDay
        );
      }

      document.getElementById("detailContent").innerHTML = `
        <div class="detail-layout">
          <section class="detail-main-card">
            ${renderDetailImage(offer)}

            <div class="detail-content">
              <div class="category-line">
                ${escapeHtml(offerCategory)} · <strong>${escapeHtml(ownerPublicCity || offerCity || detailTranslate("detail.noCity"))}</strong>
              </div>

              <h1>${escapeHtml(offerName)}</h1>

              <div class="badges">
                <span class="badge">${detailTranslate("detail.verifiedOwner")}</span>
                <span class="badge" id="ownerRatingBadge">${detailTranslate("detail.ratingLoading")}</span>
              </div>

              <div class="availability-panel ${availabilityBadgeClass}">
                <strong>${escapeHtml(availabilityText)}</strong>
                ${escapeHtml(availabilityPanelText)}
              </div>

              ${offer.description && offer.description.trim() ? `
                <div class="description">${escapeHtml(offer.description)}</div>
              ` : ""}

              <div class="info-grid">
                <div class="section">
                  <h2>${detailTranslate("detail.includedTitle")}</h2>

                  <ul>
                    <li>✓ ${escapeHtml(offerName)}</li>
                    <li>✓ ${detailTranslate("detail.includedAgreement")}</li>
                    <li>✓ ${detailTranslate("detail.includedHandover")}</li>
                    <li>✓ ${detailTranslate("detail.includedReturn")}</li>
                  </ul>
                </div>

                <div class="section">
                  <h2>${detailTranslate("detail.termsTitle")}</h2>

                  <p>
                    ${detailTranslate("detail.termsText")}
                  </p>
                </div>

                <div class="section">
                  <h2>${detailTranslate("detail.pickupTitle")}</h2>

                  <p>
                    ${detailTranslate("detail.pickupPrivacy")}
                  </p>

                  <div class="pickup-preview">
                    <div class="pickup-preview-row">
                      <span>${detailTranslate("detail.city")}</span>
                      <span>${escapeHtml(ownerPublicCity || offerCity || "-")}</span>
                    </div>

                    <div class="pickup-preview-row">
                      <span>${detailTranslate("detail.address")}</span>
                      <span>${detailTranslate("detail.hiddenUntilPaidAddress")}</span>
                    </div>

                    <div class="pickup-preview-row">
                      <span>${detailTranslate("detail.phone")}</span>
                      <span>${detailTranslate("detail.hiddenUntilPaidPhone")}</span>
                    </div>
                  </div>
                </div>

                <div class="section">
                  <h2>${detailTranslate("detail.nearbyTitle")}</h2>

                  <p>
                    ${detailTranslate("detail.nearbyText")}
                  </p>

                  <div class="gps-note ${hasGps ? "" : "missing"}">
                    ${escapeHtml(getPickupGpsText(offer))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div>
            ${sidebarContent}
          </div>
        </div>
      `;

      loadOwnerRating(ownerId);

      if (currentUser && !isOwner && isActive) {
  setupBookingForm(offer);
}
    }

    async function loadOwnerRating(ownerId) {
      const ratingBadge = document.getElementById("ownerRatingBadge");

      if (!ratingBadge) {
        return;
      }

      if (!ownerId) {
        ratingBadge.textContent = detailTranslate("detail.ratingNone");
        return;
      }

      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        ratingBadge.textContent = detailTranslate("detail.ratingUnavailable");
        return;
      }

      const { data, error } = await supabaseClient
        .from("user_rating_summary")
        .select("average_rating, rating_count")
        .eq("user_id", ownerId)
        .maybeSingle();

      if (error) {
        console.warn("Hodnocení majitele se nepodařilo načíst.", error);
        ratingBadge.textContent = detailTranslate("detail.ratingUnavailable");
        return;
      }

      if (!data || !data.rating_count) {
        ratingBadge.textContent = detailTranslate("detail.ratingNone");
        return;
      }

      ratingBadge.textContent =
        detailTranslate("detail.ratingPrefix") + " ⭐ " +
        data.average_rating +
        " / 5 (" +
        data.rating_count +
        " " + detailTranslate("detail.ratingsCount") + ")";
    }



    async function createSupabaseReservation(offer, startDate, endDate, days, totalPrice) {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        alert(detailTranslate("detail.error.supabase"));
        return;
      }

      const supabaseUser = await getCurrentSupabaseUser();

      if (!supabaseUser) {
        alert(detailTranslate("detail.error.loginAgain"));
        window.location.href =
  `prihlaseni.html?returnTo=${encodeURIComponent(
    window.location.pathname.split("/").pop() + window.location.search
  )}`;
        return;
      }

      const currentUser = await apiGetCurrentUser();

      if (!currentUser) {
        alert(detailTranslate("detail.error.login"));
       window.location.href =
  `prihlaseni.html?returnTo=${encodeURIComponent(
    window.location.pathname.split("/").pop() + window.location.search
  )}`;
        return;
      }

      const ownerId = String(offer.ownerId || offer.owner_id || "");

      if (!ownerId) {
        alert(detailTranslate("detail.error.ownerMissing"));
        return;
      }

      if (String(supabaseUser.id) === ownerId) {
        alert(detailTranslate("detail.error.ownItem"));
        renderDetail(offer);
        return;
      }

      const pricePerDay = getOfferPrice(offer);
      const platformFeeAmount = Math.round(totalPrice * PLATFORM_FEE_PERCENT / 100);
      const ownerPayout = totalPrice - platformFeeAmount;



      const reservationToInsert = {
        offer_id: offer.id,
        owner_id: ownerId,
        renter_id: supabaseUser.id,

        status: "pending",

        offer_name: getOfferName(offer),
        category: getOfferCategory(offer),
        city: getOfferCity(offer),

        price_per_day: pricePerDay,


        start_date: startDate,
end_date: endDate,
date_from: startDate,
date_to: endDate,
days: days,
total_days: days,
total_price: totalPrice,

        platform_fee_percent: PLATFORM_FEE_PERCENT,
        platform_fee_amount: platformFeeAmount,
        owner_payout: ownerPayout,

        renter_name: getUserName(currentUser),
        renter_email: getUserEmail(currentUser),
        renter_phone: getUserPhone(currentUser),

        contact_visible_after_payment: false
      };

      const { data, error } = await supabaseClient
        .from("reservations")
        .insert(reservationToInsert)
        .select()
        .single();

      if (error) {
        console.error(error);

        const errorMessage = String(error.message || "");

        if (errorMessage.includes("Reservation dates overlap")) {
          alert(detailTranslate("detail.error.overlap"));
          return;
        }

        if (errorMessage.includes("row-level security")) {
          alert(detailTranslate("detail.error.rls"));
          return;
        }

        alert(detailTranslate("detail.error.save"));
        return;
      }

      if (data && data.id) {
        try {
          sessionStorage.setItem("rentuloLastCreatedReservationId", data.id);
        } catch (storageError) {
          console.warn("ID nové rezervace se nepodařilo uložit do sessionStorage.", storageError);
        }
      }

      window.location.href = "moje-rezervace.html";
    }
    function setupBookingForm(offer) {
      const startDateInput = document.getElementById("startDate");
      const endDateInput = document.getElementById("endDate");
      const calcDays = document.getElementById("calcDays");
      const calcTotal = document.getElementById("calcTotal");
      const rentButton = document.getElementById("rentButton");
      const bookingDateHelp = document.getElementById("bookingDateHelp");

      if (!startDateInput || !endDateInput || !calcDays || !calcTotal || !rentButton) {
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      let availabilityCheckVersion = 0;

      startDateInput.min = today;
      endDateInput.min = getNextDate(today);

      function setRentButtonState(state) {
        if (state === "available") {
          rentButton.disabled = false;
          rentButton.classList.remove("disabled");
          rentButton.textContent = detailTranslate("detail.requestRental");
          return;
        }

        rentButton.disabled = true;
        rentButton.classList.add("disabled");

        if (state === "checking") {
          rentButton.textContent = detailTranslate("detail.checkingDates");
        } else if (state === "conflict") {
          rentButton.textContent = detailTranslate("detail.dateConflictButton");
        } else {
          rentButton.textContent = detailTranslate("detail.selectDates");
        }
      }

      async function updateCalculation() {
        const checkVersion = ++availabilityCheckVersion;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (startDate) {
          const nextDate = getNextDate(startDate);
          endDateInput.min = nextDate;

          if (endDate && endDate <= startDate) {
            endDateInput.value = "";
          }
        } else {
          endDateInput.min = getNextDate(today);
        }

        const activeStartDate = startDateInput.value;
        const activeEndDate = endDateInput.value;
        const days = getDaysBetween(activeStartDate, activeEndDate);
        const total = days * getOfferPrice(offer);

        calcDays.textContent = days > 0 ? detailTranslate(days === 1 ? "detail.oneDay" : "detail.manyDays", { days: days }) : "-";
        calcTotal.textContent = days > 0 ? total + " Kč" : "-";

        if (!activeStartDate || !activeEndDate || days <= 0) {
          if (bookingDateHelp) {
            bookingDateHelp.textContent = !activeStartDate || !activeEndDate
              ? detailTranslate("detail.dateHelp")
              : detailTranslate("detail.endAfterStart");
          }
          setRentButtonState("invalid");
          return;
        }

        setRentButtonState("checking");
        if (bookingDateHelp) {
          bookingDateHelp.textContent = detailTranslate("detail.checkingAvailability");
        }

        try {
          const hasConflict = await hasReservationDateConflict(
            offer.id,
            activeStartDate,
            activeEndDate
          );

          if (checkVersion !== availabilityCheckVersion) {
            return;
          }

          if (hasConflict) {
            setRentButtonState("conflict");
            if (bookingDateHelp) {
              bookingDateHelp.textContent = detailTranslate("detail.dateConflictText");
            }
            return;
          }

          setRentButtonState("available");
          if (bookingDateHelp) {
            bookingDateHelp.textContent = detailTranslate("detail.dateAvailableText");
          }
        } catch (error) {
          if (checkVersion !== availabilityCheckVersion) {
            return;
          }

          setRentButtonState("invalid");
          if (bookingDateHelp) {
            bookingDateHelp.textContent = detailTranslate("detail.error.availabilityReload");
          }
        }
      }

      startDateInput.addEventListener("change", updateCalculation);
      endDateInput.addEventListener("change", updateCalculation);

      updateCalculation();

      rentButton.addEventListener("click", async function () {
        if (rentButton.disabled) {
          return;
        }

        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const days = getDaysBetween(startDate, endDate);
        const total = days * getOfferPrice(offer);

        if (!startDate || !endDate || days <= 0) {
          alert(detailTranslate("detail.error.validDates"));
          updateCalculation();
          return;
        }

        rentButton.disabled = true;
        rentButton.classList.add("disabled");
        rentButton.textContent = detailTranslate("detail.checkingDates");

        try {
          const hasConflict = await hasReservationDateConflict(offer.id, startDate, endDate);

          if (hasConflict) {
            alert(detailTranslate("detail.error.dateConflict"));
            updateCalculation();
            return;
          }
        } catch (error) {
          alert(detailTranslate("detail.error.availability"));
          updateCalculation();
          return;
        }

        rentButton.textContent = detailTranslate("detail.sendingRequest");
        createSupabaseReservation(offer, startDate, endDate, days, total);
      });
    }

    async function initializeDetailPage() {
      document.title = detailTranslate("detail.documentTitle");
      renderSharedNavigation("");
      setupBackLink();
      renderLoading();

      const offerId = getOfferIdFromUrl();

      if (!offerId) {
        renderNotFound();
        return;
      }

      const offer = await loadOfferFromSupabase(offerId);

      if (!offer) {
        renderNotFound();
        return;
      }

      renderDetail(offer);
    }

    document.addEventListener("DOMContentLoaded", function () {
      initializeDetailPage();
    });
