document.addEventListener("DOMContentLoaded", function () {
  renderSharedNavigation("");
  setupHomeSearch();
  setupCategorySearch();
  setupNearbySearch();
  loadFeaturedOffers();
});

document.addEventListener("rentuloLanguageChanged", function () {
  renderFeaturedOffers();
});

let homeFeaturedOffers = [];

function homeTranslate(key, fallback) {
  if (typeof window.rentuloTranslate === "function") {
    const translated = window.rentuloTranslate(key);

    if (translated && translated !== key) {
      return translated;
    }
  }

  return fallback || key;
}

function goToResults(what, where) {
  const searchParams = new URLSearchParams();

  if (what) {
    searchParams.set("co", what);
  }

  if (where) {
    searchParams.set("kde", where);
  }

  const queryString = searchParams.toString();

  window.location.href = queryString
    ? "vysledky.html?" + queryString
    : "vysledky.html";
}

function setupHomeSearch() {
  const form = document.getElementById("homeSearchForm");
  const whatInput = document.getElementById("home-search-what");
  const whereInput = document.getElementById("home-search-where");

  if (!form) {
    return;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const what = whatInput ? whatInput.value.trim() : "";
    const where = whereInput ? whereInput.value.trim() : "";

    goToResults(what, where);
  });
}

function setupCategorySearch() {
  const categoryButtons = document.querySelectorAll(".home-point-button");

  categoryButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const searchValue = button.dataset.search || "";
      goToResults(searchValue, "");
    });
  });
}

function setupNearbySearch() {
  const nearbyCard = document.getElementById("nearbyCard");
  const nearbyStatus = document.getElementById("nearbyCardStatus");

  if (!nearbyCard) {
    return;
  }

  nearbyCard.addEventListener("click", function () {
    if (!navigator.geolocation) {
      const unavailable = homeTranslate(
        "home.locationUnavailable",
        "Poloha není v tomto prohlížeči dostupná."
      );

      if (nearbyStatus) {
        nearbyStatus.textContent = unavailable;
      }

      alert(homeTranslate(
        "home.locationUnavailableHelp",
        "Zadejte město nebo PSČ ručně."
      ));
      return;
    }

    nearbyCard.disabled = true;

    if (nearbyStatus) {
      nearbyStatus.textContent = homeTranslate(
        "home.locationLoading",
        "Zjišťuji vaši polohu..."
      );
    }

    navigator.geolocation.getCurrentPosition(
      function (position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        localStorage.setItem(
          "rentuloUserLocation",
          JSON.stringify({
            latitude: latitude,
            longitude: longitude,
            savedAt: new Date().toISOString()
          })
        );

        window.location.href =
          "vysledky.html?okoli=1&lat=" +
          encodeURIComponent(latitude) +
          "&lng=" +
          encodeURIComponent(longitude);
      },
      function () {
        nearbyCard.disabled = false;

        if (nearbyStatus) {
          nearbyStatus.textContent = homeTranslate(
            "home.locationDenied",
            "Polohu se nepodařilo načíst."
          );
        }

        alert(homeTranslate(
          "home.locationDeniedHelp",
          "Povolte přístup k poloze nebo zadejte město ručně."
        ));
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000
      }
    );
  });
}

function getFeaturedOwnerId(offer) {
  return String(offer.owner_id || offer.ownerId || "");
}

function getFeaturedTimestamp(offer) {
  const timestamp = Date.parse(offer.created_at || offer.createdAt || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getFeaturedScore(offer) {
  const averageRating = Number(offer.averageRating || 0);
  const ratingCount = Number(offer.ratingCount || 0);

  if (!ratingCount || !averageRating) {
    return 0;
  }

  const confidence = Math.min(ratingCount, 10) / 10;
  return averageRating * (0.75 + confidence * 0.25);
}

async function loadFeaturedOffers() {
  const list = document.getElementById("featuredOffersList");
  const supabaseClient = typeof getSupabaseClient === "function"
    ? getSupabaseClient()
    : null;

  if (!list || !supabaseClient) {
    renderFeaturedOffersError();
    return;
  }

  const { data: offers, error: offersError } = await supabaseClient
    .from("public_offers")
    .select("id, owner_id, name, city, price_per_day, photo_url, status, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(40);

  if (offersError || !Array.isArray(offers)) {
    console.error("Doporučené nabídky se nepodařilo načíst.");
    renderFeaturedOffersError();
    return;
  }

  const ownerIds = Array.from(new Set(
    offers.map(getFeaturedOwnerId).filter(Boolean)
  ));

  let ratingsByOwner = {};

  if (ownerIds.length) {
    const { data: ratings, error: ratingsError } = await supabaseClient
      .from("user_rating_summary")
      .select("user_id, average_rating, rating_count")
      .in("user_id", ownerIds);

    if (!ratingsError && Array.isArray(ratings)) {
      ratings.forEach(function (rating) {
        ratingsByOwner[String(rating.user_id)] = {
          averageRating: Number(rating.average_rating || 0),
          ratingCount: Number(rating.rating_count || 0)
        };
      });
    }
  }

  homeFeaturedOffers = offers
    .map(function (offer) {
      const rating = ratingsByOwner[getFeaturedOwnerId(offer)] || {};

      return {
        ...offer,
        averageRating: Number(rating.averageRating || 0),
        ratingCount: Number(rating.ratingCount || 0)
      };
    })
    .sort(function (first, second) {
      const scoreDifference = getFeaturedScore(second) - getFeaturedScore(first);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      const ratingDifference = second.averageRating - first.averageRating;

      if (ratingDifference !== 0) {
        return ratingDifference;
      }

      const countDifference = second.ratingCount - first.ratingCount;

      if (countDifference !== 0) {
        return countDifference;
      }

      return getFeaturedTimestamp(second) - getFeaturedTimestamp(first);
    })
    .slice(0, 3);

  renderFeaturedOffers();
}

function renderFeaturedOffersError() {
  const list = document.getElementById("featuredOffersList");

  if (!list) {
    return;
  }

  list.textContent = "";

  const message = document.createElement("div");
  message.className = "featured-empty";
  message.textContent = homeTranslate(
    "home.featuredUnavailable",
    "Doporučené nabídky teď nelze načíst."
  );

  list.appendChild(message);
}

function renderFeaturedOffers() {
  const list = document.getElementById("featuredOffersList");

  if (!list) {
    return;
  }

  list.textContent = "";

  if (!homeFeaturedOffers.length) {
    const message = document.createElement("div");
    message.className = "featured-empty";
    message.textContent = homeTranslate(
      "home.featuredEmpty",
      "Zatím nejsou k dispozici žádné doporučené nabídky."
    );
    list.appendChild(message);
    return;
  }

  homeFeaturedOffers.forEach(function (offer) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "featured-offer";
    card.setAttribute(
      "aria-label",
      homeTranslate("home.featuredOpen", "Otevřít nabídku") + ": " + (offer.name || "")
    );

    if (offer.photo_url) {
      const image = document.createElement("img");
      image.className = "featured-photo";
      image.src = offer.photo_url;
      image.alt = "";
      image.loading = "lazy";
      card.appendChild(image);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "featured-photo-placeholder";
      placeholder.textContent = "📦";
      card.appendChild(placeholder);
    }

    const details = document.createElement("div");
    details.className = "featured-details";

    const name = document.createElement("strong");
    name.className = "featured-name";
    name.textContent = offer.name || homeTranslate("home.featuredUnnamed", "Nabídka");
    details.appendChild(name);

    const meta = document.createElement("span");
    meta.className = "featured-meta";
    const city = offer.city || homeTranslate("home.featuredUnknownCity", "Město neuvedeno");
    const currentLanguage = typeof window.getRentuloLanguage === "function"
      ? window.getRentuloLanguage()
      : "cs";
    const localeByLanguage = {
      cs: "cs-CZ",
      en: "en-GB",
      de: "de-DE"
    };
    const price = Number(offer.price_per_day || 0).toLocaleString(
      localeByLanguage[currentLanguage] || "cs-CZ"
    );
    meta.textContent = city + " · " + price + " Kč / " + homeTranslate("home.featuredDay", "den");
    details.appendChild(meta);

    const rating = document.createElement("span");
    rating.className = "featured-rating";

    if (offer.ratingCount > 0) {
      const ratingValue = offer.averageRating.toLocaleString(
        localeByLanguage[currentLanguage] || "cs-CZ",
        { minimumFractionDigits: 1, maximumFractionDigits: 1 }
      );
      rating.textContent =
        "★ " + ratingValue +
        " (" + offer.ratingCount + ")";
    } else {
      rating.textContent = homeTranslate("home.featuredNoRating", "Zatím bez hodnocení");
    }

    details.appendChild(rating);
    card.appendChild(details);

    card.addEventListener("click", function () {
      window.location.href = "detail.html?id=" + encodeURIComponent(offer.id);
    });

    list.appendChild(card);
  });
}
