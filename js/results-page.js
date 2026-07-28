    let resultsOffers = [];
    let resultsRatingSummaries = {};
    let resultsReservedOfferIds = new Set();

    function resultsTranslate(key, fallback) {
      if (typeof window.rentuloTranslate === "function") {
        const translated = window.rentuloTranslate(key);
        if (translated && translated !== key) {
          return translated;
        }
      }
      return fallback || key;
    }

    function resultsCategoryLabel(category) {
      const normalized = normalizeText(category || "");
      const keys = {
        "dum a zahrada": "category.homeGarden",
        "dilna a naradi": "category.workshopTools",
        "sport a volny cas": "category.sportLeisure",
        "elektronika": "category.electronics",
        "deti a rodina": "category.childrenFamily",
        "auto a doprava": "category.autoTransport",
        "party a akce": "category.partyEvents",
        "cestovani a kempovani": "category.travelCamping",
        "stavebni technika": "category.construction",
        "ostatni": "category.other"
      };
      const key = keys[normalized];
      return key ? resultsTranslate(key, category) : category;
    }







    function parseStoredMoney(value) {
      if (value === undefined || value === null || value === "") {
        return null;
      }

      const cleanedValue = String(value)
        .toLowerCase()
        .replace("kč", "")
        .replace("kc", "")
        .replace(/\s/g, "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "")
        .trim();

      if (cleanedValue === "") {
        return null;
      }

      const numberValue = Number(cleanedValue);

      if (Number.isNaN(numberValue)) {
        return null;
      }

      return Math.max(0, Math.round(numberValue));
    }

    function getResultsParams() {
      return new URLSearchParams(window.location.search);
    }

    function isNearbySearchMode() {
      const params = getResultsParams();
      return params.get("okoli") === "1";
    }

    function getSearchLatitude() {
      const params = getResultsParams();
      const latitudeFromUrl = Number(params.get("lat"));

      if (!Number.isNaN(latitudeFromUrl) && params.get("lat") !== null) {
        return latitudeFromUrl;
      }

      const storedLocation = loadJson("rentuloUserLocation", null);

      if (storedLocation && storedLocation.latitude !== undefined && storedLocation.latitude !== null) {
        return Number(storedLocation.latitude);
      }

      return null;
    }

    function getSearchLongitude() {
      const params = getResultsParams();
      const longitudeFromUrl = Number(params.get("lng"));

      if (!Number.isNaN(longitudeFromUrl) && params.get("lng") !== null) {
        return longitudeFromUrl;
      }

      const storedLocation = loadJson("rentuloUserLocation", null);

      if (storedLocation && storedLocation.longitude !== undefined && storedLocation.longitude !== null) {
        return Number(storedLocation.longitude);
      }

      return null;
    }

    function toRadians(value) {
      return value * Math.PI / 180;
    }

    function calculateDistanceKm(latitude1, longitude1, latitude2, longitude2) {
      if (
        latitude1 === null ||
        longitude1 === null ||
        latitude2 === null ||
        longitude2 === null
      ) {
        return null;
      }

      const earthRadiusKm = 6371;

      const latitudeDifference = toRadians(latitude2 - latitude1);
      const longitudeDifference = toRadians(longitude2 - longitude1);

      const a =
        Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) +
        Math.cos(toRadians(latitude1)) *
        Math.cos(toRadians(latitude2)) *
        Math.sin(longitudeDifference / 2) *
        Math.sin(longitudeDifference / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return earthRadiusKm * c;
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

        createdAt: row.created_at,
        updatedAt: row.updated_at,

        source: "supabase"
      };
    }

    async function loadOffersFromSupabase() {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        renderEmptyResults("load-error");
        return [];
      }

      const { data, error } = await supabaseClient
        .from("public_offers")
        .select(
  "id, owner_id, name, category, description, city, postal_code, price_per_day, status, photo_url, created_at, updated_at"
)
        .order("created_at", {
          ascending: false
        });

      if (error) {
       console.error("Ponuky sa nepodařilo načíst.");
        renderEmptyResults("load-error");
        return [];
      }

      return Array.isArray(data)
        ? data.map(normalizeSupabaseOffer)
        : [];
    }

    function getOfferOwnerId(offer) {
      return String(offer.ownerId || offer.owner_id || offer.userId || offer.user_id || "");
    }

    async function loadRatingSummariesForOffers(offers) {
      resultsRatingSummaries = {};

      const supabaseClient = getSupabaseClient();

      if (!supabaseClient || !Array.isArray(offers) || !offers.length) {
        return;
      }

      const ownerIds = Array.from(new Set(
        offers
          .map(getOfferOwnerId)
          .filter(Boolean)
      ));

      if (!ownerIds.length) {
        return;
      }

      const { data, error } = await supabaseClient
        .from("user_rating_summary")
        .select("user_id, average_rating, rating_count")
        .in("user_id", ownerIds);

      if (error) {
        console.warn("Hodnocení majitelů se nepodařilo načíst.");
        return;
      }

      if (!Array.isArray(data)) {
        return;
      }

      data.forEach(function (ratingRow) {
        if (!ratingRow || !ratingRow.user_id) {
          return;
        }

        resultsRatingSummaries[String(ratingRow.user_id)] = {
          averageRating: ratingRow.average_rating,
          ratingCount: ratingRow.rating_count
        };
      });
    }

    function getSupabaseReservationOfferId(reservation) {
      if (!reservation) {
        return "";
      }

      return String(
        reservation.offer_id ||
        reservation.offerId ||
        reservation.toolId ||
        ""
      );
    }

    async function loadReservedOfferIdsFromSupabase() {
      resultsReservedOfferIds = new Set();

      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        return;
      }

      const blockingStatuses = [
        "pending",
        "approved",
        "paid",
        "picked_up"
      ];

      const { data, error } = await supabaseClient
      .rpc("get_blocked_offer_ids");

      if (error) {
        console.warn("Dostupnost nabídek se nepodařilo načíst ze Supabase.");
        return;
      }

      if (!Array.isArray(data)) {
        return;
      }

      data.forEach(function (reservation) {
        const offerId = getSupabaseReservationOfferId(reservation);

        if (offerId) {
          resultsReservedOfferIds.add(offerId);
        }
      });
    }

    function isOfferReservedInResults(offer) {
      const offerId = String(getOfferId(offer) || "");

      if (offerId && resultsReservedOfferIds.has(offerId)) {
        return true;
      }

      if (typeof isOfferCurrentlyReserved === "function") {
        return isOfferCurrentlyReserved(offer);
      }

      return false;
    }

    function getOwnerRatingSummary(offer) {
      const ownerId = getOfferOwnerId(offer);

      if (!ownerId || !resultsRatingSummaries[ownerId]) {
        return null;
      }

      return resultsRatingSummaries[ownerId];
    }

    function formatOwnerRating(offer) {
      const summary = getOwnerRatingSummary(offer);

      if (!summary || !summary.ratingCount) {
        return resultsTranslate("results.noRatings", "Zatím bez hodnocení");
      }

      return "⭐ " +
        summary.averageRating +
        " / 5 (" +
        summary.ratingCount +
        " " + resultsTranslate("results.ratings", "hodnocení") + ")";
    }

    function getOfferDistanceKm(offer) {
      if (!isNearbySearchMode()) {
        return null;
      }

      const userLatitude = getSearchLatitude();
      const userLongitude = getSearchLongitude();

      const offerLatitude = offer.pickupLatitude !== undefined && offer.pickupLatitude !== null
        ? Number(offer.pickupLatitude)
        : null;

      const offerLongitude = offer.pickupLongitude !== undefined && offer.pickupLongitude !== null
        ? Number(offer.pickupLongitude)
        : null;

      if (
        userLatitude === null ||
        userLongitude === null ||
        offerLatitude === null ||
        offerLongitude === null ||
        Number.isNaN(offerLatitude) ||
        Number.isNaN(offerLongitude)
      ) {
        return null;
      }

      return calculateDistanceKm(userLatitude, userLongitude, offerLatitude, offerLongitude);
    }

    function offerHasGpsLocation(offer) {
      const latitude = offer.pickupLatitude !== undefined && offer.pickupLatitude !== null
        ? Number(offer.pickupLatitude)
        : null;

      const longitude = offer.pickupLongitude !== undefined && offer.pickupLongitude !== null
        ? Number(offer.pickupLongitude)
        : null;

      return (
        latitude !== null &&
        longitude !== null &&
        !Number.isNaN(latitude) &&
        !Number.isNaN(longitude)
      );
    }

    function formatDistance(distanceKm) {
      if (distanceKm === null || Number.isNaN(distanceKm)) {
        return resultsTranslate("results.locationMissing", "Poloha není uložená");
      }

      const distanceMeters = Math.round(distanceKm * 1000);

      if (distanceMeters < 50) {
        return resultsTranslate("results.veryNear", "ve vaší blízkosti");
      }

      if (distanceKm < 1) {
        return "cca " + distanceMeters + " m";
      }

      return "cca " + distanceKm.toFixed(1).replace(".", ",") + " km";
    }

    function getOfferId(offer) {
      return offer.id || offer.offerId;
    }

function getOfferCity(offer) {
      return offer.city || offer.mesto || offer.location || "-";
    }

    function normalizeOfferCategory(category) {
      const value = String(category || "").trim();
      const legacyMap = {
        "Dům a zahrada": "Domácnost",
        "Dílna a nářadí": "Stavba",
        "Stavební technika": "Stavba",
        "Sport a volný čas": "Hobby",
        "Elektronika": "Hobby",
        "Děti a rodina": "Hobby",
        "Cestování a kempování": "Hobby",
        "Párty a akce": "Párty",
        "Auto a doprava": "Ostatní"
      };

      return legacyMap[value] || value || resultsTranslate("home.category.other", "Ostatní");
    }

    function getOfferCategory(offer) {
      return normalizeOfferCategory(offer.category || offer.kategorie);
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

    function renderResultImage(offer) {
      const photo = getOfferPhoto(offer);
      const name = getOfferName(offer);

      if (photo) {
        return `
          <div class="result-image">
            <img src="${escapeHtml(photo)}" alt="${escapeHtml(name)}">
          </div>
        `;
      }

      return `
        <div class="result-image">
          <div class="result-image-icon"></div>
          <span>${escapeHtml(name)}</span>
        </div>
      `;
    }

    function getEmptyResultsContent(type) {
      const content = {
        "load-error": ["results.empty.loadErrorTitle", "Nabídky se nepodařilo načíst.", "results.empty.loadErrorMessage", "Zkontrolujte připojení k internetu a zkuste stránku obnovit.", "vysledky.html", "results.tryAgain", "Zkusit znovu", "index.html", "results.backHome", "Zpět na úvod"],
        "loading": ["results.empty.loadingTitle", "Načítám nabídky...", "results.empty.loadingMessage", "Chvíli strpení, načítáme nabídky.", "vysledky.html", "results.refresh", "Obnovit", "index.html", "results.backHome", "Zpět na úvod"],
        "no-offers": ["results.empty.noOffersTitle", "Zatím zde nejsou žádné nabídky.", "results.empty.noOffersMessage", "Na Rentulu zatím nikdo nepřidal žádnou věc k půjčení. Můžete přidat první nabídku a vyzkoušet, jak bude fungovat.", "nabidnout.html", "results.addItem", "Přidat věc", "index.html", "results.backHome", "Zpět na úvod"],
        "nearby-no-gps": ["results.empty.noGpsTitle", "Žádná nabídka zatím nemá uloženou GPS polohu.", "results.empty.noGpsMessage", "Hledání podle okolí funguje jen u nabídek, které mají uloženou polohu. Nabídky můžete stále procházet běžným hledáním podle názvu, kategorie nebo města.", "vysledky.html", "results.showAll", "Zobrazit všechny nabídky", "nabidnout.html", "results.addGpsListing", "Přidat nabídku s GPS"],
        "nearby-no-location": ["results.empty.noLocationTitle", "Polohu se nepodařilo načíst.", "results.empty.noLocationMessage", "Bez vaší polohy neumíme nabídky seřadit podle vzdálenosti. Zkuste hledání znovu z úvodní stránky nebo použijte běžné hledání podle města.", "index.html", "results.backHome", "Zpět na úvod", "vysledky.html", "results.showAll", "Zobrazit všechny nabídky"],
        "no-match": ["results.empty.noMatchTitle", "Nenašli jsme žádnou nabídku.", "results.empty.noMatchMessage", "Pro zadané hledání nebo zvolené filtry nebyla nalezena žádná nabídka. Zkuste změnit název, kategorii, město, cenu nebo dostupnost.", "vysledky.html", "results.clearSearch", "Zrušit hledání", "nabidnout.html", "results.addItem", "Přidat věc"]
      }[type] || null;

      const row = content || ["results.empty.noMatchTitle", "Nenašli jsme žádnou nabídku.", "results.empty.noMatchMessage", "Pro zadané hledání nebo zvolené filtry nebyla nalezena žádná nabídka. Zkuste změnit název, kategorii, město, cenu nebo dostupnost.", "vysledky.html", "results.clearSearch", "Zrušit hledání", "nabidnout.html", "results.addItem", "Přidat věc"];
      return {
        title: resultsTranslate(row[0], row[1]),
        message: resultsTranslate(row[2], row[3]),
        primaryLink: row[4],
        primaryText: resultsTranslate(row[5], row[6]),
        secondaryLink: row[7],
        secondaryText: resultsTranslate(row[8], row[9])
      };
    }

    function renderEmptyResults(type) {
      const content = getEmptyResultsContent(type);

      document.getElementById("resultsList").innerHTML = `
        <div class="empty-results">
          <h2>${escapeHtml(content.title)}</h2>

          <p>${escapeHtml(content.message)}</p>

          <div class="empty-results-actions">
            <a href="${escapeHtml(content.primaryLink)}" class="empty-results-button">
              ${escapeHtml(content.primaryText)}
            </a>

            <a href="${escapeHtml(content.secondaryLink)}" class="empty-results-button light">
              ${escapeHtml(content.secondaryText)}
            </a>
          </div>
        </div>
      `;
    }

    function renderDistanceBox(offer) {
      if (!isNearbySearchMode()) {
        return "";
      }

      const distanceKm = getOfferDistanceKm(offer);
      const missingClass = distanceKm === null ? "missing" : "";

      return `
        <div class="result-info-box distance ${missingClass}">
          <span>${escapeHtml(resultsTranslate("results.distance", "Vzdálenost"))}</span>
          <strong>${escapeHtml(formatDistance(distanceKm))}</strong>
        </div>
      `;
    }

    function renderOfferCard(offer) {
      const offerId = getOfferId(offer);
      const name = getOfferName(offer);
      const city = getOfferCity(offer);
      const category = resultsCategoryLabel(getOfferCategory(offer));
      const price = getOfferPrice(offer);
      const availabilityClass = "available";
      const availabilityText = resultsTranslate("results.dateVerified", "Termín ověříme");
      const availabilityNote = resultsTranslate("results.availabilityNote", "Nabídku lze rezervovat ve volném termínu. Dostupnost konkrétních dat ověříte v detailu.");

      return `
        <article class="result-card">
          ${renderResultImage(offer)}

          <div class="result-main">
            <div class="result-heading">
              <div>
                <h2 class="result-title">${escapeHtml(name)}</h2>
                <p class="result-meta">${escapeHtml(city)} · ${escapeHtml(category)}</p>
              </div>
            </div>

            <div class="result-info">
              <div class="result-info-box">
                <span>${escapeHtml(resultsTranslate("results.pricePerDay", "Cena za den"))}</span>
                <strong>${escapeHtml(price)} Kč</strong>
              </div>

              <div class="result-info-box ${availabilityClass}">
                <span>${escapeHtml(resultsTranslate("results.availability", "Dostupnost"))}</span>
                <strong>${escapeHtml(availabilityText)}</strong>
              </div>

              <div class="result-info-box">
                <span>${escapeHtml(resultsTranslate("results.ownerRating", "Hodnocení majitele"))}</span>
                <strong>${escapeHtml(formatOwnerRating(offer))}</strong>
              </div>

              ${renderDistanceBox(offer)}
            </div>

            <p class="availability-note ${availabilityClass}">
              ${escapeHtml(availabilityNote)}
            </p>

            <div class="result-actions">
              <a class="result-button" href="detail.html?id=${encodeURIComponent(offerId)}">
                ${escapeHtml(resultsTranslate("results.viewDetail", "Zobrazit detail"))}
              </a>
            </div>
          </div>
        </article>
      `;
    }
const HOME_CATEGORY_GROUPS = {
  domacnost: ["domacnost", "dum a zahrada"],
  zahrada: ["zahrada", "zahradni technika", "dum a zahrada"],
  stavba: [
    "stavba",
    "vrtacky",
    "brusky",
    "pily",
    "zebriky",
    "stavebni technika",
    "dilna a naradi"
  ],
  hobby: [
    "hobby",
    "sport a volny cas",
    "elektronika",
    "deti a rodina",
    "cestovani a kempovani"
  ],
  party: ["party", "party a akce"],
  ostatni: ["ostatni", "auto a doprava"]
};
    function offerMatchesSearch(offer, whatQuery, whereQuery, categoryFilter, priceFilter, availabilityFilter) {
      const name = normalizeText(getOfferName(offer));
      const category = normalizeText(getOfferCategory(offer));
      const city = normalizeText(getOfferCity(offer));
      const postalCode = normalizeText(offer.postalCode || offer.psc || "");
      const price = getOfferPrice(offer);

      const what = normalizeText(whatQuery);
      const where = normalizeText(whereQuery);
      const nearbyMode = isNearbySearchMode();

      if (what) {
  const groupedCategories = HOME_CATEGORY_GROUPS[what];

  if (groupedCategories) {
    const matchesGroupedCategory = groupedCategories.some(function (value) {
      return category.includes(value);
    });

    if (!matchesGroupedCategory) {
      return false;
    }
  } else if (!name.includes(what) && !category.includes(what)) {
    return false;
  }
}

      if (!nearbyMode && where && !city.includes(where) && !postalCode.includes(where)) {
        return false;
      }

      if (categoryFilter && category !== normalizeText(categoryFilter)) {
        return false;
      }

      if (priceFilter && price > Number(priceFilter)) {
        return false;
      }

      if (availabilityFilter === "unavailable") {
        return false;
      }

      return true;
    }

    function sortOffersForNearbySearch(offers) {
      if (!isNearbySearchMode()) {
        return offers;
      }

      return offers.slice().sort(function (offerA, offerB) {
        const distanceA = getOfferDistanceKm(offerA);
        const distanceB = getOfferDistanceKm(offerB);

        if (distanceA !== null && distanceB !== null) {
          return distanceA - distanceB;
        }

        if (distanceA !== null && distanceB === null) {
          return -1;
        }

        if (distanceA === null && distanceB !== null) {
          return 1;
        }

        return 0;
      });
    }

    function updateNearbyBanner(offers) {
      const banner = document.getElementById("nearbyResultsBanner");
      const nearbyText = document.getElementById("nearbyResultsText");

      if (!banner || !nearbyText) {
        return;
      }

      banner.classList.remove("active");
      banner.classList.remove("warning");

      if (!isNearbySearchMode()) {
        return;
      }

      const userLatitude = getSearchLatitude();
      const userLongitude = getSearchLongitude();
      const offersWithGps = offers.filter(offerHasGpsLocation).length;
      const offersWithoutGps = offers.length - offersWithGps;

      banner.classList.add("active");

      if (userLatitude === null || userLongitude === null) {
        banner.classList.add("warning");
        nearbyText.textContent =
          resultsTranslate("results.nearbyNoLocation", "Polohu se nepodařilo načíst. Zobrazujeme všechny nabídky bez řazení podle vzdálenosti.");
        return;
      }

      if (offersWithGps === 0 && offers.length > 0) {
        banner.classList.add("warning");
        nearbyText.textContent =
          resultsTranslate("results.nearbyNoGps", "Žádná nabídka zatím nemá uloženou GPS polohu. Nabídky proto neumíme seřadit podle vzdálenosti.");
        return;
      }

      if (offersWithoutGps > 0) {
        nearbyText.textContent =
          resultsTranslate("results.nearbyDefault", "Nabídky s uloženou polohou řadíme podle vzdálenosti od vás. Nabídky bez GPS polohy zobrazujeme pod nimi.");
        return;
      }

      nearbyText.textContent =
        resultsTranslate("results.nearbyAllGps", "Všechny zobrazené nabídky mají uloženou GPS polohu a jsou seřazené podle vzdálenosti od vás.");
    }

    function setupResultsFromUrl() {
      const params = getResultsParams();

      const whatInput = document.getElementById("results-search-what");
      const whereInput = document.getElementById("results-search-where");
      const categoryFilter = document.getElementById("categoryFilter");
      const priceFilter = document.getElementById("priceFilter");
      const availabilityFilter = document.getElementById("availabilityFilter");

      const what = params.get("co") || "";
      const where = params.get("kde") || "";
      const category = params.get("kategorie") || "";
      const price = params.get("cena") || "";
      const availability = params.get("dostupnost") || "";

      if (whatInput) {
        whatInput.value = what;
      }

      if (whereInput) {
        whereInput.value = where;
      }

      if (categoryFilter) {
        categoryFilter.value = category;
      }

      if (priceFilter) {
        priceFilter.value = price;
      }

      if (availabilityFilter) {
        availabilityFilter.value = availability;
      }

      if (isNearbySearchMode()) {
        if (whereInput && !whereInput.value) {
          whereInput.value = resultsTranslate("results.myLocation", "Moje poloha");
        }

        const eyebrow = document.getElementById("resultsEyebrow");
        const title = document.getElementById("resultsTitle");
        const description = document.getElementById("resultsDescription");

        if (eyebrow) {
          eyebrow.textContent = resultsTranslate("results.nearbyEyebrow", "Výsledky podle polohy");
        }

        if (title) {
        title.textContent = resultsTranslate("results.nearbyPageTitle", "Věci ve vašem okolí");
        }

        if (description) {
          description.textContent = resultsTranslate("results.nearbyDescription", "Nejbližší nabídky s uloženou polohou se zobrazují nahoře.");
        }
      }
    }

    function updateUrlFromCurrentControls() {
      const params = getResultsParams();

      const whatInput = document.getElementById("results-search-what");
      const whereInput = document.getElementById("results-search-where");
      const categoryFilter = document.getElementById("categoryFilter");
      const priceFilter = document.getElementById("priceFilter");
      const availabilityFilter = document.getElementById("availabilityFilter");

      const what = whatInput ? whatInput.value.trim() : "";
      const where = whereInput ? whereInput.value.trim() : "";
      const category = categoryFilter ? categoryFilter.value : "";
      const price = priceFilter ? priceFilter.value : "";
      const availability = availabilityFilter ? availabilityFilter.value : "";

      if (what) {
        params.set("co", what);
      } else {
        params.delete("co");
      }

      if (where && normalizeText(where) !== "moje poloha") {
        params.set("kde", where);
        params.delete("okoli");
        params.delete("lat");
        params.delete("lng");
      } else {
        params.delete("kde");
      }

      if (category) {
        params.set("kategorie", category);
      } else {
        params.delete("kategorie");
      }

      if (price) {
        params.set("cena", price);
      } else {
        params.delete("cena");
      }

      if (availability) {
        params.set("dostupnost", availability);
      } else {
        params.delete("dostupnost");
      }

      const queryString = params.toString();
      const newUrl = queryString
        ? window.location.pathname + "?" + queryString
        : window.location.pathname;

      window.history.replaceState(null, "", newUrl);
    }

    function applySearchAndUpdateUrl() {
      updateUrlFromCurrentControls();
      renderResults();
    }

    function getEmptyResultType(offers, filteredOffers) {
      const userLatitude = getSearchLatitude();
      const userLongitude = getSearchLongitude();

      if (!offers.length) {
        return "no-offers";
      }

      if (isNearbySearchMode() && (userLatitude === null || userLongitude === null)) {
        return "nearby-no-location";
      }

      if (
        isNearbySearchMode() &&
        offers.length > 0 &&
        offers.filter(offerHasGpsLocation).length === 0
      ) {
        return "nearby-no-gps";
      }

      if (!filteredOffers.length) {
        return "no-match";
      }

      return "no-match";
    }

    function renderResults() {
      const offers = resultsOffers;

      updateNearbyBanner(offers);

      if (!offers.length) {
        renderEmptyResults("no-offers");
        return;
      }

      const whatQuery = document.getElementById("results-search-what").value;
      const whereQuery = document.getElementById("results-search-where").value;
      const categoryFilter = document.getElementById("categoryFilter").value;
      const priceFilter = document.getElementById("priceFilter").value;
      const availabilityFilter = document.getElementById("availabilityFilter").value;

      const filteredOffers = offers.filter(function (offer) {
        return offerMatchesSearch(
          offer,
          whatQuery,
          whereQuery,
          categoryFilter,
          priceFilter,
          availabilityFilter
        );
      });

      const sortedOffers = sortOffersForNearbySearch(filteredOffers);

      if (!sortedOffers.length) {
        renderEmptyResults(getEmptyResultType(offers, filteredOffers));
        return;
      }

      document.getElementById("resultsList").innerHTML =
        sortedOffers.map(renderOfferCard).join("");
    }

    function setupResultsEvents() {
      document.getElementById("results-search-button").addEventListener("click", function () {
        applySearchAndUpdateUrl();
      });

      document.getElementById("results-search-what").addEventListener("input", function () {
        renderResults();
      });

      document.getElementById("results-search-what").addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          applySearchAndUpdateUrl();
        }
      });

      document.getElementById("results-search-where").addEventListener("input", function () {
        renderResults();
      });

      document.getElementById("results-search-where").addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          applySearchAndUpdateUrl();
        }
      });

      document.getElementById("categoryFilter").addEventListener("change", function () {
        applySearchAndUpdateUrl();
      });

      document.getElementById("priceFilter").addEventListener("change", function () {
        applySearchAndUpdateUrl();
      });

      document.getElementById("availabilityFilter").addEventListener("change", function () {
        applySearchAndUpdateUrl();
      });
    }

    async function initializeResultsPage() {
      document.title = resultsTranslate("results.documentTitle", "Výsledky vyhledávání - Rentulo");
      renderSharedNavigation("vysledky");
      setupResultsFromUrl();
      setupResultsEvents();

      renderEmptyResults("loading");

      resultsOffers = await loadOffersFromSupabase();
      await loadRatingSummariesForOffers(resultsOffers);

      renderResults();
    }

    document.addEventListener("DOMContentLoaded", function () {
      initializeResultsPage();
    });

    document.addEventListener("rentuloLanguageChanged", function () {
      document.title = resultsTranslate("results.documentTitle", "Výsledky vyhledávání - Rentulo");
      setupResultsFromUrl();
      renderResults();
    });
