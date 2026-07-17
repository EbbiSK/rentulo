document.addEventListener("DOMContentLoaded", function () {
      renderSharedNavigation("");
      setupHomeSearch();
      setupCategorySearch();
      setupNearbySearch();
    });

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
          if (nearbyStatus) {
            nearbyStatus.textContent = "Poloha není v tomto prohlížeči dostupná.";
          }

          alert("Poloha není v tomto prohlížeči dostupná. Zadejte prosím město nebo PSČ.");
          return;
        }

        nearbyCard.disabled = true;

        if (nearbyStatus) {
          nearbyStatus.textContent = "Zjišťuji vaši polohu...";
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
              nearbyStatus.textContent = "Poloha nebyla povolena.";
            }

            alert("Poloha nebyla povolena. Zadejte prosím město nebo PSČ.");
          },
          {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 300000
          }
        );
      });
    }