document.addEventListener("DOMContentLoaded", function () {
  setupSearchFromHome();
  setupResultsFromUrl();
  setupResultsSearchButton();
  setupOfferForm();
});

/* POMOCNÉ FUNKCE */

function showMessage(message, type = "error") {
  let messageBox = document.querySelector(".site-message");

  if (!messageBox) {
    messageBox = document.createElement("div");
    messageBox.className = "site-message";
    document.body.appendChild(messageBox);
  }

  messageBox.textContent = message;
  messageBox.className = "site-message " + type;

  setTimeout(function () {
    messageBox.className = "site-message";
  }, 3500);
}

function markError(input) {
  if (input) {
    input.classList.add("input-error");
  }
}

function clearErrors(container) {
  const fields = container.querySelectorAll("input, textarea, select");

  fields.forEach(function (field) {
    field.classList.remove("input-error");
  });
}

function isEmpty(value) {
  return String(value || "").trim() === "";
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeHTML(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function moneyToNumber(value) {
  const cleanedValue = String(value || "")
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  const numberValue = Number(cleanedValue);

  if (!numberValue || numberValue < 0) {
    return 0;
  }

  return numberValue;
}

function getToolIconClass(category) {
  const normalizedCategory = normalizeText(category);

  if (normalizedCategory.includes("brus")) {
    return "grinder";
  }

  if (normalizedCategory.includes("zebrik")) {
    return "ladder";
  }

  if (normalizedCategory.includes("zahrad")) {
    return "washer";
  }

  if (normalizedCategory.includes("pila")) {
    return "grinder";
  }

  return "drill";
}

/* VYHLEDÁVÁNÍ Z ÚVODNÍ STRÁNKY */

function setupSearchFromHome() {
  const searchButton = document.querySelector(".search-button");

  if (!searchButton) {
    return;
  }

  searchButton.addEventListener("click", function (event) {
    const whatInput = document.querySelector("#home-search-what");
    const whereInput = document.querySelector("#home-search-where");

    if (!whatInput || !whereInput) {
      return;
    }

    whatInput.classList.remove("input-error");
    whereInput.classList.remove("input-error");

    if (isEmpty(whatInput.value) || isEmpty(whereInput.value)) {
      event.preventDefault();

      if (isEmpty(whatInput.value)) {
        markError(whatInput);
      }

      if (isEmpty(whereInput.value)) {
        markError(whereInput);
      }

      showMessage("Vyplňte, co hledáte a kde chcete nářadí najít.");
      return;
    }

    event.preventDefault();

    const what = encodeURIComponent(whatInput.value.trim());
    const where = encodeURIComponent(whereInput.value.trim());

    window.location.href = "vysledky.html?co=" + what + "&kde=" + where;
  });
}

/* VÝSLEDKY VYHLEDÁVÁNÍ */

function setupResultsFromUrl() {
  const whatInput = document.querySelector("#results-search-what");
  const whereInput = document.querySelector("#results-search-where");

  if (!whatInput || !whereInput) {
    return;
  }

  const params = new URLSearchParams(window.location.search);

  const what = params.get("co");
  const where = params.get("kde");

  if (what) {
    whatInput.value = what;
  }

  if (where) {
    whereInput.value = where;
  }
}

function setupResultsSearchButton() {
  const button =
    document.querySelector("#results-search-button") ||
    document.querySelector(".results-search button");

  if (!button) {
    return;
  }

  button.addEventListener("click", function () {
    const whatInput = document.querySelector("#results-search-what");
    const whereInput = document.querySelector("#results-search-where");

    if (!whatInput || !whereInput) {
      return;
    }

    whatInput.classList.remove("input-error");
    whereInput.classList.remove("input-error");

    if (isEmpty(whatInput.value) || isEmpty(whereInput.value)) {
      if (isEmpty(whatInput.value)) {
        markError(whatInput);
      }

      if (isEmpty(whereInput.value)) {
        markError(whereInput);
      }

      showMessage("Vyplňte, co hledáte a kde chcete nářadí najít.");
      return;
    }

    const what = encodeURIComponent(whatInput.value.trim());
    const where = encodeURIComponent(whereInput.value.trim());

    window.location.href = "vysledky.html?co=" + what + "&kde=" + where;
  });
}

/* FORMULÁŘ NABÍDNOUT NÁŘADÍ */

function setupOfferForm() {
  const toolForm = document.querySelector(".tool-form");

  if (!toolForm) {
    return;
  }

  const publishButton = toolForm.querySelector(".btn-primary");
  const draftButton = toolForm.querySelector(".btn-secondary");

  if (publishButton) {
    publishButton.addEventListener("click", async function () {
      clearErrors(toolForm);

      const currentUser = getCurrentUser();

      if (!isLoggedIn() || !currentUser) {
        showMessage("Pro přidání nářadí se nejdříve přihlaste.");
        return;
      }

      const nameInput = document.getElementById("toolName");
      const categorySelect = document.getElementById("toolCategory");
      const cityInput = document.getElementById("toolCity");
      const postalInput = document.getElementById("toolPostalCode");
      const priceInput = document.getElementById("toolPrice");
      const depositInput = document.getElementById("toolDeposit");
      const descriptionInput = document.getElementById("toolDescription");

      const pickupUseCustom = document.getElementById("pickupUseCustom");
      const pickupStreetInput = document.getElementById("pickupStreet");
      const pickupCityInput = document.getElementById("pickupCity");
      const pickupPostalInput = document.getElementById("pickupPostalCode");
      const pickupNoteInput = document.getElementById("pickupNote");
      const pickupLatitudeInput = document.getElementById("pickupLatitude");
      const pickupLongitudeInput = document.getElementById("pickupLongitude");

      let hasError = false;

      const requiredFields = [
        nameInput,
        cityInput,
        postalInput,
        priceInput,
        depositInput,
        descriptionInput
      ];

      requiredFields.forEach(function (field) {
        if (!field || isEmpty(field.value)) {
          markError(field);
          hasError = true;
        }
      });

      if (!categorySelect || categorySelect.selectedIndex === 0) {
        markError(categorySelect);
        hasError = true;
      }

      const priceValue = moneyToNumber(priceInput ? priceInput.value : "");
      const depositValue = moneyToNumber(depositInput ? depositInput.value : "");

      if (priceValue <= 0) {
        markError(priceInput);
        hasError = true;
      }

      if (depositValue < 0) {
        markError(depositInput);
        hasError = true;
      }

      const useCustomPickupAddress = pickupUseCustom && pickupUseCustom.checked;

      if (useCustomPickupAddress) {
        const requiredPickupFields = [
          pickupStreetInput,
          pickupCityInput,
          pickupPostalInput
        ];

        requiredPickupFields.forEach(function (field) {
          if (!field || isEmpty(field.value)) {
            markError(field);
            hasError = true;
          }
        });
      }

      if (hasError) {
        showMessage("Vyplňte prosím všechny údaje o nářadí. Cena musí být číslo větší než 0.");
        return;
      }

      const profileStreet = currentUser.street || "";
      const profileCity = currentUser.city || cityInput.value.trim();
      const profilePostalCode = currentUser.postalCode || postalInput.value.trim();
      const profilePhone = getUserPhone(currentUser);

      const pickupStreet = useCustomPickupAddress
        ? pickupStreetInput.value.trim()
        : profileStreet;

      const pickupCity = useCustomPickupAddress
        ? pickupCityInput.value.trim()
        : profileCity;

      const pickupPostalCode = useCustomPickupAddress
        ? pickupPostalInput.value.trim()
        : profilePostalCode;

      const pickupNote = useCustomPickupAddress && pickupNoteInput
        ? pickupNoteInput.value.trim()
        : "";

      const pickupFullAddress = [pickupStreet, pickupCity, pickupPostalCode]
        .filter(Boolean)
        .join(", ");

      const pickupLatitude = pickupLatitudeInput && pickupLatitudeInput.value
        ? Number(pickupLatitudeInput.value)
        : null;

      const pickupLongitude = pickupLongitudeInput && pickupLongitudeInput.value
        ? Number(pickupLongitudeInput.value)
        : null;

      const newTool = {
        id: Date.now(),

        name: nameInput.value.trim(),
        category: categorySelect.value.trim(),
        city: cityInput.value.trim(),
        postalCode: postalInput.value.trim(),
        price: priceValue,
        deposit: depositValue,
        description: descriptionInput.value.trim(),
        status: "Aktivní",

        ownerName: getUserName(currentUser),
        ownerEmail: getUserEmail(currentUser),
        ownerPhone: profilePhone,
        ownerStreet: profileStreet,
        ownerCity: profileCity,
        ownerPostalCode: profilePostalCode,
        ownerFullAddress: [profileStreet, profileCity, profilePostalCode].filter(Boolean).join(", "),

        pickupAddressMode: useCustomPickupAddress ? "custom" : "profile",
        pickupStreet: pickupStreet,
        pickupCity: pickupCity,
        pickupPostalCode: pickupPostalCode,
        pickupFullAddress: pickupFullAddress,
        pickupNote: pickupNote,
        pickupPhone: profilePhone,

        pickupLatitude: pickupLatitude,
        pickupLongitude: pickupLongitude,
        pickupLocationSource: pickupLatitude && pickupLongitude ? "browser_geolocation" : ""
      };

      if (typeof apiCreateOffer === "function") {
  await apiCreateOffer(newTool);
} else {
  throw new Error("API pro uložení nabídky není dostupné.");
}

      showMessage("Nabídka byla uložena.", "success");

      setTimeout(function () {
        window.location.href = "moje-nabidky.html";
      }, 800);
    });
  }

  if (draftButton) {
    draftButton.addEventListener("click", function () {
      showMessage("Koncept zatím neukládáme. Tuto funkci doplníme později.", "error");
    });
  }
}

/* MAZÁNÍ PONUKY */

async function deleteStoredTool(id) {
  const confirmed = confirm("Opravdu chcete tuto nabídku smazat?");

  if (!confirmed) {
    return;
  }

  if (typeof apiDeleteOffer === "function") {
  await apiDeleteOffer(id);
} else {
  throw new Error("API pro smazání nabídky není dostupné.");
}

window.location.reload();
}