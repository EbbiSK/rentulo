document.addEventListener("DOMContentLoaded", function () {
  renderSharedNavigation("");
  setupHomeSearch();
  setupCategorySearch();
  initializeHomeMap();
  centerHomeMapOnVisitor();
  loadHomeMapOffers();
});

document.addEventListener("rentuloLanguageChanged", function () {
  renderHomeOffersMap();
});

let homeMap = null;
let homeMapLayer = null;
let homeMapOffers = [];

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
  window.location.href = queryString ? "vysledky.html?" + queryString : "vysledky.html";
}

function setupHomeSearch() {
  const form = document.getElementById("homeSearchForm");
  const whatInput = document.getElementById("home-search-what");
  const whereInput = document.getElementById("home-search-where");

  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    goToResults(
      whatInput ? whatInput.value.trim() : "",
      whereInput ? whereInput.value.trim() : ""
    );
  });
}

function setupCategorySearch() {
  document.querySelectorAll(".home-point-button").forEach(function (button) {
    button.addEventListener("click", function () {
      goToResults(button.dataset.search || "", "");
    });
  });
}

function setupNearbySearch() {
  const nearbyCard = document.getElementById("nearbyCard");
  const nearbyStatus = document.getElementById("nearbyCardStatus");

  if (!nearbyCard) return;

  nearbyCard.addEventListener("click", function () {
    if (!navigator.geolocation) {
      if (nearbyStatus) {
        nearbyStatus.textContent = homeTranslate("home.locationUnavailable", "Poloha není v tomto prohlížeči dostupná.");
      }
      alert(homeTranslate("home.locationUnavailableHelp", "Zadejte město nebo PSČ ručně."));
      return;
    }

    nearbyCard.disabled = true;
    if (nearbyStatus) nearbyStatus.textContent = homeTranslate("home.locationLoading", "Zjišťuji vaši polohu...");

    navigator.geolocation.getCurrentPosition(
      function (position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        localStorage.setItem("rentuloUserLocation", JSON.stringify({
          latitude: latitude,
          longitude: longitude,
          savedAt: new Date().toISOString()
        }));

        window.location.href = "vysledky.html?okoli=1&lat=" + encodeURIComponent(latitude) + "&lng=" + encodeURIComponent(longitude);
      },
      function () {
        nearbyCard.disabled = false;
        if (nearbyStatus) nearbyStatus.textContent = homeTranslate("home.locationDenied", "Polohu se nepodařilo načíst.");
        alert(homeTranslate("home.locationDeniedHelp", "Povolte přístup k poloze nebo zadejte město ručně."));
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  });
}


function applyVisitorLocation(position) {
  const location = {
    latitude: Number(position && position.coords ? position.coords.latitude : NaN),
    longitude: Number(position && position.coords ? position.coords.longitude : NaN)
  };

  if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) return;

  localStorage.setItem("rentuloUserLocation", JSON.stringify({
    latitude: location.latitude,
    longitude: location.longitude,
    savedAt: new Date().toISOString()
  }));

  if (homeMap) {
    homeMap.setView([location.latitude, location.longitude], 9, { animate: true });
    window.setTimeout(function () {
      if (homeMap) homeMap.invalidateSize();
    }, 0);
  }

  renderHomeOffersMap();
}

function requestVisitorLocation() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    applyVisitorLocation,
    function () {
      // Bez souhlasu zůstane zobrazena neutrální mapa Česka.
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
  );
}

function centerHomeMapOnVisitor() {
  const storedLocation = getStoredUserLocation();

  if (storedLocation && homeMap) {
    homeMap.setView([storedLocation.latitude, storedLocation.longitude], 9);
  }

  requestVisitorLocation();

  if (navigator.permissions && typeof navigator.permissions.query === "function") {
    navigator.permissions.query({ name: "geolocation" }).then(function (permissionStatus) {
      permissionStatus.addEventListener("change", function () {
        if (permissionStatus.state === "granted") {
          requestVisitorLocation();
        }
      });
    }).catch(function () {
      // Permissions API nemusí být v každém prohlížeči dostupné.
    });
  }
}

function getStoredUserLocation() {
  try {
    const stored = JSON.parse(localStorage.getItem("rentuloUserLocation") || "null");
    if (!stored || !Number.isFinite(Number(stored.latitude)) || !Number.isFinite(Number(stored.longitude))) return null;
    return { latitude: Number(stored.latitude), longitude: Number(stored.longitude) };
  } catch (error) {
    return null;
  }
}

function distanceInKm(firstLat, firstLng, secondLat, secondLng) {
  const toRadians = function (value) { return value * Math.PI / 180; };
  const earthRadius = 6371;
  const latitudeDistance = toRadians(secondLat - firstLat);
  const longitudeDistance = toRadians(secondLng - firstLng);
  const calculation = Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(toRadians(firstLat)) * Math.cos(toRadians(secondLat)) *
    Math.sin(longitudeDistance / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(calculation), Math.sqrt(1 - calculation));
}

function compareMapOffers(first, second, userLocation) {
  const ratingDifference = Number(second.averageRating || 0) - Number(first.averageRating || 0);
  if (ratingDifference !== 0) return ratingDifference;

  const countDifference = Number(second.ratingCount || 0) - Number(first.ratingCount || 0);
  if (countDifference !== 0) return countDifference;

  if (userLocation) {
    const firstDistance = distanceInKm(userLocation.latitude, userLocation.longitude, first.map_latitude, first.map_longitude);
    const secondDistance = distanceInKm(userLocation.latitude, userLocation.longitude, second.map_latitude, second.map_longitude);
    if (firstDistance !== secondDistance) return firstDistance - secondDistance;
  }

  return Date.parse(second.created_at || "") - Date.parse(first.created_at || "");
}

async function loadHomeMapOffers() {
  const status = document.getElementById("homeMapStatus");
  const supabaseClient = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;

  if (!supabaseClient || typeof window.L === "undefined") {
    showHomeMapError();
    return;
  }

  const { data: offers, error: offersError } = await supabaseClient.rpc("get_public_map_offers");

  if (offersError || !Array.isArray(offers)) {
    console.error("Mapa nabídek se nepodařila načíst.", offersError || "");
    showHomeMapError();
    return;
  }

  const ownerIds = Array.from(new Set(offers.map(function (offer) {
    return String(offer.owner_id || "");
  }).filter(Boolean)));

  const ratingsByOwner = {};
  if (ownerIds.length) {
    const { data: ratings } = await supabaseClient
      .from("user_rating_summary")
      .select("user_id, average_rating, rating_count")
      .in("user_id", ownerIds);

    if (Array.isArray(ratings)) {
      ratings.forEach(function (rating) {
        ratingsByOwner[String(rating.user_id)] = {
          averageRating: Number(rating.average_rating || 0),
          ratingCount: Number(rating.rating_count || 0)
        };
      });
    }
  }

  homeMapOffers = offers.map(function (offer) {
    const rating = ratingsByOwner[String(offer.owner_id || "")] || {};
    return {
      ...offer,
      map_latitude: Number(offer.map_latitude),
      map_longitude: Number(offer.map_longitude),
      averageRating: Number(rating.averageRating || 0),
      ratingCount: Number(rating.ratingCount || 0)
    };
  }).filter(function (offer) {
    return Number.isFinite(offer.map_latitude) && Number.isFinite(offer.map_longitude);
  });

  if (status) status.hidden = true;
  renderHomeOffersMap();
}

function initializeHomeMap() {
  if (homeMap || typeof window.L === "undefined") return;

  homeMap = window.L.map("homeOffersMap", {
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: true
  }).setView([49.8, 15.5], 6);

  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap"
  }).addTo(homeMap);

  homeMapLayer = window.L.layerGroup().addTo(homeMap);
}

function createMapMarkerIcon(count) {
  return window.L.divIcon({
    className: "",
    html: '<div class="home-map-marker"><span>' + String(count) + '</span></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 32],
    popupAnchor: [0, -30]
  });
}

function formatMapPrice(value) {
  const language = typeof window.getRentuloLanguage === "function" ? window.getRentuloLanguage() : "cs";
  const locale = language === "de" ? "de-DE" : language === "en" ? "en-GB" : "cs-CZ";
  return Number(value || 0).toLocaleString(locale) + " Kč / " + homeTranslate("home.featuredDay", "den");
}

function buildMapPopup(group) {
  const best = group[0];
  const wrapper = document.createElement("div");
  wrapper.className = "home-map-popup";

  const name = document.createElement("strong");
  name.className = "home-map-popup-name";
  name.textContent = best.name || homeTranslate("home.featuredUnnamed", "Nabídka");
  wrapper.appendChild(name);

  const meta = document.createElement("span");
  meta.className = "home-map-popup-meta";
  meta.textContent = (best.city || homeTranslate("home.featuredUnknownCity", "Město neuvedeno")) + " · " + formatMapPrice(best.price_per_day);
  wrapper.appendChild(meta);

  const rating = document.createElement("span");
  rating.className = "home-map-popup-rating";
  rating.textContent = best.ratingCount > 0
    ? "★ " + best.averageRating.toFixed(1) + " · " + best.ratingCount + " " + homeTranslate("home.featuredRatingMany", "hodnocení")
    : homeTranslate("home.featuredNoRating", "Zatím bez hodnocení");
  wrapper.appendChild(rating);

  if (group.length > 1) {
    const more = document.createElement("span");
    more.className = "home-map-popup-more";
    more.textContent = homeTranslate("home.mapMoreOffers", "Další nabídky v tomto okolí") + ": " + (group.length - 1);
    wrapper.appendChild(more);
  }

  const link = document.createElement("a");
  link.className = "home-map-popup-link";
  link.href = "detail.html?id=" + encodeURIComponent(best.id);
  link.textContent = homeTranslate("home.mapOpenDetail", "Zobrazit detail");
  wrapper.appendChild(link);

  return wrapper;
}

function renderHomeOffersMap() {
  const status = document.getElementById("homeMapStatus");
  initializeHomeMap();

  if (!homeMap || !homeMapLayer) return;
  homeMapLayer.clearLayers();

  if (!homeMapOffers.length) {
    if (status) {
      status.hidden = false;
      status.textContent = homeTranslate("home.mapEmpty", "V tomto okolí zatím nejsou žádné nabídky.");
    }
    return;
  }

  if (status) status.hidden = true;

  const userLocation = getStoredUserLocation();
  const groups = new Map();

  homeMapOffers.forEach(function (offer) {
    const key = offer.map_latitude.toFixed(2) + ":" + offer.map_longitude.toFixed(2);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(offer);
  });

  const bounds = [];
  groups.forEach(function (group) {
    group.sort(function (first, second) {
      return compareMapOffers(first, second, userLocation);
    });

    const best = group[0];
    const marker = window.L.marker(
      [best.map_latitude, best.map_longitude],
      { icon: createMapMarkerIcon(group.length) }
    ).addTo(homeMapLayer);

    marker.bindPopup(buildMapPopup(group));
    marker.on("mouseover", function () { marker.openPopup(); });
    bounds.push([best.map_latitude, best.map_longitude]);
  });

  if (userLocation) {
    homeMap.setView([userLocation.latitude, userLocation.longitude], 9);
  } else if (bounds.length === 1) {
    homeMap.setView(bounds[0], 11);
  } else if (bounds.length > 1) {
    homeMap.fitBounds(bounds, { padding: [24, 24], maxZoom: 11 });
  }

  window.setTimeout(function () { homeMap.invalidateSize(); }, 50);
}

function showHomeMapError() {
  const status = document.getElementById("homeMapStatus");
  if (!status) return;
  status.hidden = false;
  status.textContent = homeTranslate("home.mapUnavailable", "Mapu se teď nepodařilo načíst. Nabídky zůstávají dostupné ve výsledcích hledání.");
}
