    const PLATFORM_FEE_PERCENT = 10;
    let currentOffer = null;

  

 

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

    function getOfferName(offer) {
      return offer.name || offer.title || offer.nazev || "Věc";
    }

    function getOfferCategory(offer) {
      return offer.category || offer.kategorie || "Ostatní";
    }

    function getOfferCity(offer) {
      return offer.city || offer.mesto || offer.location || "-";
    }

    function getOfferStatus(offer) {
      return offer.status || "Aktivní";
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

    function getOfferPrice(offer) {
      return Number(offer.price || offer.pricePerDay || offer.cena || 0) || 0;
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
      return "GPS poloha se z bezpečnostních důvodů veřejně nezobrazuje. Slouží jen pro řazení ve výsledcích.";
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
          <strong>Načítám detail nabídky...</strong><br>
          Chvíli strpení, načítáme nabídku ze Supabase.
        </div>
      `;
    }

    function renderNotFound() {
      document.getElementById("detailContent").innerHTML = `
        <div class="message-card warning">
          <strong>Věc nebyla nalezena.</strong><br>
          Tato nabídka neexistuje, není aktivní nebo už byla odstraněna.
          <br>
          <a href="vysledky.html" class="primary-button">Zpět na nabídky</a>
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
          <div class="price-small">Kč / den</div>

          <div class="info-list">
            <div class="info-row">
              <span>Majitel</span>
              <span>${escapeHtml(ownerPublicName)}</span>
            </div>

            <div class="info-row">
              <span>Lokalita</span>
              <span>${escapeHtml(ownerPublicCity || "-")}</span>
            </div>

            <div class="info-row">
              <span>Dostupnost</span>
              <span>Není dostupné</span>
            </div>
          </div>

          <div class="availability-box unavailable">
            <strong>${escapeHtml(messageTitle)}</strong>
            ${escapeHtml(messageText)}
          </div>

          <button class="primary-button disabled" type="button" disabled>
            Momentálně nelze rezervovat
          </button>

          <div class="note">
            Rezervaci půjde odeslat až ve chvíli, kdy bude nabídka aktivní a nebude mít otevřenou rezervaci.
          </div>
        </aside>
      `;
    }

    function renderBookingSidebar(offer, price, ownerPublicName, ownerPublicCity, ownerGetsPerDay, platformFeePerDay) {
      return `
        <aside class="sidebar">
          <div class="price">${escapeHtml(price)}</div>
          <div class="price-small">Kč / den</div>

          <div class="info-list">
            <div class="info-row">
              <span>Majitel</span>
              <span>${escapeHtml(ownerPublicName)}</span>
            </div>

            <div class="info-row">
              <span>Lokalita</span>
              <span>${escapeHtml(ownerPublicCity || getOfferCity(offer) || "-")}</span>
            </div>

            <div class="info-row">
              <span>Majitel dostane</span>
              <span>${escapeHtml(ownerGetsPerDay)} Kč / den</span>
            </div>

            <div class="info-row">
              <span>Provize platformy</span>
              <span>${escapeHtml(platformFeePerDay)} Kč / den</span>
            </div>
          </div>

          <div class="availability-box available">
            <strong>Věc je dostupná</strong>
            Můžete vybrat termín a odeslat žádost o půjčení. Žádost se uloží do Supabase a bude čekat na potvrzení majitelem.
          </div>

          <div class="privacy-box">
            <strong>Kontaktní údaje jsou zatím skryté</strong>
            Telefon a přesná adresa vyzvednutí se zobrazí až po zaplacení rezervace.
          </div>

          <div class="booking-box">
            <h2>Vyberte termín půjčení</h2>

            <div class="form-group">
              <label for="startDate">Datum půjčení</label>
              <input type="date" id="startDate">
            </div>

            <div class="form-group">
              <label for="endDate">Datum vrácení</label>
              <input type="date" id="endDate">
            </div>

            <div class="date-help" id="bookingDateHelp">
              Vyberte datum půjčení a potom datum vrácení. Datum vrácení musí být později než datum půjčení.
            </div>

            <div class="calculation">
              <div class="calc-row">
                <span>Počet dní</span>
                <strong id="calcDays">-</strong>
              </div>

              <div class="calc-row">
                <span>Cena za den</span>
                <strong>${escapeHtml(price)} Kč</strong>
              </div>

              <div class="calc-row">
                <span>Provize platformy</span>
                <strong>${PLATFORM_FEE_PERCENT} %</strong>
              </div>

              <div class="calc-row calc-total">
                <span>Celkem</span>
                <strong id="calcTotal">-</strong>
              </div>
            </div>

            <button class="primary-button disabled" id="rentButton" type="button" disabled>
              Vyberte termín
            </button>
          </div>

          <div class="note">
            Po odeslání bude žádost čekat na potvrzení majitelem.
Přesná adresa a telefon zůstanou skryté až do zaplacení.
          </div>
        </aside>
      `;
    }

    function getOfferReservedFlag(offer) {
      if (!offer) {
        return false;
      }

      return Boolean(
        offer.isReserved === true ||
        offer.is_reserved === true ||
        offer.reserved === true
      );
    }

    async function isOfferReservedInSupabase(offerId) {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient || !offerId) {
        return false;
      }

      const blockingStatuses = [
        "pending",
        "approved",
        "paid",
        "picked_up"
      ];

      const { data, error } = await supabaseClient
        .from("reservations")
        .select("id, status")
        .eq("offer_id", offerId)
        .in("status", blockingStatuses)
        .limit(1);

      if (error) {
        console.warn("Dostupnost nabídky se nepodařilo načíst ze Supabase.", error);
        return false;
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

      const ownerPublicName = "Majitel";
      const ownerPublicCity = getOfferCity(offer);

      const offerName = getOfferName(offer);
      const offerCategory = getOfferCategory(offer);
      const offerCity = getOfferCity(offer);
      const offerStatus = getOfferStatus(offer);

      const price = getOfferPrice(offer);
      const platformFeePerDay = Math.round(price * PLATFORM_FEE_PERCENT / 100);
      const ownerGetsPerDay = price - platformFeePerDay;

      const currentUserId = currentUser ? String(currentUser.id || "") : "";
const ownerId = String(offer.ownerId || offer.owner_id || "");
const isOwner = currentUserId && ownerId && currentUserId === ownerId;

const isReserved = getOfferReservedFlag(offer);
const isActive = isOfferActive(offer);
const hasGps = offerHasGpsLocation(offer);

      const availabilityBadgeClass = isActive && !isReserved ? "available" : "unavailable";
      const statusBadgeClass = isActive ? "" : "draft";

      let availabilityText = "Dostupné";
      let availabilityPanelText = "Tato věc je momentálně dostupná. Rezervaci uložíme do systému a majitel ji následně potvrdí.";

      if (!isActive) {
        availabilityText = "Není aktivní";
        availabilityPanelText = "Tato nabídka zatím není aktivní. Rezervaci nelze odeslat.";
      } else if (isReserved) {
        availabilityText = "Momentálně rezervováno";
availabilityPanelText = "Tato věc má právě otevřenou rezervaci v Supabase. Novou žádost zatím nelze odeslat.";
      }

      let sidebarContent = "";

      if (!currentUser) {
  sidebarContent = renderSidebarMessage(
    "",
    "Pro odeslání žádosti se musíte přihlásit.",
    "Po přihlášení si budete moci vybrat datum půjčení a odeslat žádost majiteli.",
    "prihlaseni.html",
    "Přihlásit se"
  );
} else if (isOwner) {
  sidebarContent = renderSidebarMessage(
    "",
    "Tato věc patří vám.",
    "Vlastní věc si nemůžete rezervovat. Svoji nabídku můžete spravovat v části Moje nabídky.",
    "moje-nabidky.html",
    "Moje nabídky"
  );
} else if (!isActive) {
        sidebarContent = renderUnavailableSidebar(
          price,
          ownerPublicName,
          ownerPublicCity,
          "Nabídka není aktivní",
          "Tato nabídka je uložená jako koncept nebo není zveřejněná."
        );
      } else if (isReserved) {
        sidebarContent = renderUnavailableSidebar(
          price,
          ownerPublicName,
          ownerPublicCity,
          "Věc teď není dostupná",
          "Tato nabídka má otevřenou rezervaci v Supabase."
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
                ${escapeHtml(offerCategory)} · <strong>${escapeHtml(ownerPublicCity || offerCity || "Bez města")}</strong>
              </div>

              <h1>${escapeHtml(offerName)}</h1>

              <div class="badges">
                <span class="badge">Ověřený majitel</span>
                <span class="badge" id="ownerRatingBadge">Hodnocení majitele: načítám...</span>
                <span class="badge ${statusBadgeClass}">${escapeHtml(offerStatus)}</span>
                <span class="badge ${availabilityBadgeClass}">${escapeHtml(availabilityText)}</span>
                <span class="badge">Provize platformy ${PLATFORM_FEE_PERCENT} %</span>
              </div>

              <div class="availability-panel ${availabilityBadgeClass}">
                <strong>${escapeHtml(availabilityText)}</strong>
                ${escapeHtml(availabilityPanelText)}
              </div>

              <div class="description">
                ${escapeHtml(offer.description || "Bez popisu.")}
              </div>

              <div class="info-grid">
                <div class="section">
                  <h2>Co je součástí půjčení</h2>

                  <ul>
                    <li>✓ ${escapeHtml(offerName)}</li>
                    <li>✓ Domluva s majitelem</li>
                    <li>✓ Předání dle dohody</li>
                    <li>✓ Vrácení ve stejném stavu</li>
                  </ul>
                </div>

                <div class="section">
                  <h2>Podmínky půjčení</h2>

                  <p>
                    Věc vraťte čistou a ve stejném stavu.

                    Přesné místo vyzvednutí se zobrazí až po zaplacení.
                  </p>
                </div>

                <div class="section">
                  <h2>Místo vyzvednutí</h2>

                  <p>
                    Z bezpečnostních důvodů se přesná adresa a telefon zobrazí až po zaplacení rezervace.
                  </p>

                  <div class="pickup-preview">
                    <div class="pickup-preview-row">
                      <span>Město</span>
                      <span>${escapeHtml(ownerPublicCity || offerCity || "-")}</span>
                    </div>

                    <div class="pickup-preview-row">
                      <span>Adresa</span>
                      <span>Skrytá do zaplacení</span>
                    </div>

                    <div class="pickup-preview-row">
                      <span>Telefon</span>
                      <span>Skrytý do zaplacení</span>
                    </div>
                  </div>
                </div>

                <div class="section">
                  <h2>Poloha v okolí</h2>

                  <p>
                    GPS poloha slouží pouze k řazení nabídek podle vzdálenosti ve výsledcích hledání.
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

      if (currentUser && !isOwner && isActive && !isReserved) {
  setupBookingForm(offer);
}
    }

    async function loadOwnerRating(ownerId) {
      const ratingBadge = document.getElementById("ownerRatingBadge");

      if (!ratingBadge) {
        return;
      }

      if (!ownerId) {
        ratingBadge.textContent = "Hodnocení majitele: zatím bez hodnocení";
        return;
      }

      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        ratingBadge.textContent = "Hodnocení majitele: nedostupné";
        return;
      }

      const { data, error } = await supabaseClient
        .from("user_rating_summary")
        .select("average_rating, rating_count")
        .eq("user_id", ownerId)
        .maybeSingle();

      if (error) {
        console.warn("Hodnocení majitele se nepodařilo načíst.", error);
        ratingBadge.textContent = "Hodnocení majitele: nedostupné";
        return;
      }

      if (!data || !data.rating_count) {
        ratingBadge.textContent = "Hodnocení majitele: zatím bez hodnocení";
        return;
      }

      ratingBadge.textContent =
        "Hodnocení majitele: ⭐ " +
        data.average_rating +
        " / 5 (" +
        data.rating_count +
        " hodnocení)";
    }



    async function createSupabaseReservation(offer, startDate, endDate, days, totalPrice) {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        alert("Supabase klient není načtený. Zkontrolujte js/supabase-config.js.");
        return;
      }

      const supabaseUser = await getCurrentSupabaseUser();

      if (!supabaseUser) {
        alert("Pro odeslání žádosti se musíte znovu přihlásit.");
        window.location.href = "prihlaseni.html";
        return;
      }

      const currentUser = await apiGetCurrentUser();

      if (!currentUser) {
        alert("Pro odeslání žádosti se musíte přihlásit.");
        window.location.href = "prihlaseni.html";
        return;
      }

      const ownerId = String(offer.ownerId || offer.owner_id || "");

      if (!ownerId) {
        alert("Rezervaci se nepodařilo odeslat. U nabídky chybí majitel.");
        return;
      }

      if (String(supabaseUser.id) === ownerId) {
        alert("Vlastní věc si nemůžete rezervovat.");
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
        deposit: 0,

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

        owner_name: "Majitel",


        contact_visible_after_payment: false
      };

      const { data, error } = await supabaseClient
        .from("reservations")
        .insert(reservationToInsert)
        .select()
        .single();

      if (error) {
        console.error(error);

        if (String(error.message || "").includes("row-level security")) {
          alert("Rezervaci se nepodařilo uložit kvůli bezpečnostním pravidlům. Zkuste se odhlásit a znovu přihlásit.");
          return;
        }

        alert("Rezervaci se nepodařilo uložit do Supabase. Podívejte se prosím do konzole.");
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

      startDateInput.min = today;
      endDateInput.min = getNextDate(today);

      function setRentButtonState(isValid) {
        if (isValid) {
          rentButton.disabled = false;
          rentButton.classList.remove("disabled");
          rentButton.textContent = "Požádat o půjčení";
          return;
        }

        rentButton.disabled = true;
        rentButton.classList.add("disabled");
        rentButton.textContent = "Vyberte termín";
      }

      function updateCalculation() {
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

        calcDays.textContent = days > 0 ? days + " dní" : "-";
        calcTotal.textContent = days > 0 ? total + " Kč" : "-";

        if (bookingDateHelp) {
          if (!activeStartDate || !activeEndDate) {
            bookingDateHelp.textContent =
              "Vyberte datum půjčení a potom datum vrácení. Datum vrácení musí být později než datum půjčení.";
          } else if (days <= 0) {
            bookingDateHelp.textContent =
              "Datum vrácení musí být později než datum půjčení.";
          } else {
            bookingDateHelp.textContent =
              "Termín je vybraný. Po kliknutí odešlete žádost majiteli.";
          }
        }

        setRentButtonState(days > 0);
      }

      startDateInput.addEventListener("change", updateCalculation);
      endDateInput.addEventListener("change", updateCalculation);

      updateCalculation();

      rentButton.addEventListener("click", function () {
        if (rentButton.disabled) {
          return;
        }

        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const days = getDaysBetween(startDate, endDate);
        const total = days * getOfferPrice(offer);

        if (!startDate || !endDate || days <= 0) {
          alert("Prosím vyberte platný termín půjčení.");
          updateCalculation();
          return;
        }

        rentButton.disabled = true;
        rentButton.classList.add("disabled");
        rentButton.textContent = "Odesílám žádost...";

        createSupabaseReservation(offer, startDate, endDate, days, total);
      });
    }

    async function initializeDetailPage() {
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

      offer.isReserved = await isOfferReservedInSupabase(offer.id);

      renderDetail(offer);
    }

    document.addEventListener("DOMContentLoaded", function () {
      initializeDetailPage();
    });
