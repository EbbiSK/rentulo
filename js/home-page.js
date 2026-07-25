document.addEventListener("DOMContentLoaded", function () {
  renderSharedNavigation("");
  setupHomeSearch();
  setupCategorySearch();
  setupNearbySearch();
});

function homeTranslate(key) {
  if (typeof window.rentuloTranslate === "function") {
    return window.rentuloTranslate(key);
  }

  return key;
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
      const unavailable = homeTranslate("home.locationUnavailable");

      if (nearbyStatus) {
        nearbyStatus.textContent = unavailable;
      }

      alert(homeTranslate("home.locationUnavailableHelp"));
      return;
    }

    nearbyCard.disabled = true;

    if (nearbyStatus) {
      nearbyStatus.textContent = homeTranslate("home.locationLoading");
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
          nearbyStatus.textContent = homeTranslate("home.locationDenied");
        }

        alert(homeTranslate("home.locationDeniedHelp"));
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000
      }
    );
  });
}
