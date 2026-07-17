let offerSaveInProgress = false;
    let offerPhotoDataUrl = "";
    let offerPhotoFile = null;

    const cityPostalCodes = {
      "praha": "110 00",
      "brno": "602 00",
      "ostrava": "702 00",
      "plzeň": "301 00",
      "plzen": "301 00",
      "liberec": "460 01",
      "olomouc": "779 00",
      "české budějovice": "370 01",
      "ceske budejovice": "370 01",
      "hradec králové": "500 03",
      "hradec kralove": "500 03",
      "pardubice": "530 02",
      "zlín": "760 01",
      "zlin": "760 01",
      "havířov": "736 01",
      "havirov": "736 01",
      "kladno": "272 01",
      "most": "434 01",
      "opava": "746 01",
      "frýdek-místek": "738 01",
      "frydek-mistek": "738 01",
      "karviná": "733 01",
      "karvina": "733 01",
      "jihlava": "586 01",
      "teplice": "415 01",
      "děčín": "405 02",
      "decin": "405 02",
      "chomutov": "430 01",
      "karlovy vary": "360 01",
      "jablonec nad nisou": "466 01",
      "mladá boleslav": "293 01",
      "mlada boleslav": "293 01",
      "prostějov": "796 01",
      "prostejov": "796 01",
      "přerov": "750 02",
      "prerov": "750 02",
      "třinec": "739 61",
      "trinec": "739 61",
      "tábor": "390 01",
      "tabor": "390 01",
      "znojmo": "669 02",
      "kolín": "280 02",
      "kolin": "280 02",
      "písek": "397 01",
      "pisek": "397 01",
      "cheb": "350 02",
      "příbram": "261 01",
      "pribram": "261 01",
      "orlová": "735 14",
      "orlova": "735 14",
      "kroměříž": "767 01",
      "kromeriz": "767 01",
      "vsetín": "755 01",
      "vsetin": "755 01",
      "šumperk": "787 01",
      "sumperk": "787 01",
      "uherské hradiště": "686 01",
      "uherske hradiste": "686 01",
      "břeclav": "690 02",
      "breclav": "690 02",
      "hodonín": "695 01",
      "hodonin": "695 01",
      "česká lípa": "470 01",
      "ceska lipa": "470 01",
      "litoměřice": "412 01",
      "litomerice": "412 01",
      "krnov": "794 01",
      "sokolov": "356 01"
    };





    function showOfferLoginRequired() {
      const offerPage = document.querySelector(".offer-page");

      if (!offerPage) {
        return;
      }

      offerPage.innerHTML = `
        <section class="login-required-box">
          <p class="eyebrow">Přihlášení je potřeba</p>

          <h1>Pro přidání nabídky se nejdříve přihlaste.</h1>

          <p>
            Nářadí mohou nabízet pouze přihlášení uživatelé. Po přihlášení
            se můžete vrátit a přidat vlastní nabídku.
          </p>

          <div class="login-required-actions">
            <a href="prihlaseni.html">Přihlásit se</a>
            <a href="registrace.html" class="secondary-action">Vytvořit účet</a>
          </div>
        </section>
      `;
    }

    function getInputValue(id) {
      const input = document.getElementById(id);
      return input ? input.value.trim() : "";
    }

    function setInputValue(id, value) {
      const input = document.getElementById(id);

      if (input) {
        input.value = value === undefined || value === null ? "" : value;
      }
    }

    function normalizeCityName(value) {
      return String(value || "")
        .trim()
        .toLowerCase();
    }

    function setupCitySuggestions() {
      const datalist = document.getElementById("citySuggestions");

      if (!datalist) {
        return;
      }

      const uniqueCities = [];
      const seen = {};

      Object.keys(cityPostalCodes).forEach(function (city) {
        const displayCity = city
          .split(" ")
          .map(function (part) {
            return part.charAt(0).toUpperCase() + part.slice(1);
          })
          .join(" ");

        const normalized = normalizeCityName(displayCity);

        if (!seen[normalized]) {
          seen[normalized] = true;
          uniqueCities.push(displayCity);
        }
      });

      datalist.innerHTML = uniqueCities
        .sort()
        .map(function (city) {
          return `<option value="${city}"></option>`;
        })
        .join("");
    }

    function fillPostalCodeFromCity(cityInputId, postalInputId) {
      const cityInput = document.getElementById(cityInputId);
      const postalInput = document.getElementById(postalInputId);

      if (!cityInput || !postalInput) {
        return;
      }

      const city = normalizeCityName(cityInput.value);
      const postalCode = cityPostalCodes[city];

      if (!postalCode) {
        return;
      }

      if (!postalInput.value.trim() || postalInput.dataset.autoFilled === "true") {
        postalInput.value = postalCode;
        postalInput.dataset.autoFilled = "true";
      }
    }

    function setupPostalCodeAutocomplete() {
      const toolCityInput = document.getElementById("toolCity");
      const toolPostalInput = document.getElementById("toolPostalCode");
      const pickupCityInput = document.getElementById("pickupCity");
      const pickupPostalInput = document.getElementById("pickupPostalCode");

      if (toolCityInput && toolPostalInput) {
        toolCityInput.addEventListener("input", function () {
          fillPostalCodeFromCity("toolCity", "toolPostalCode");
        });

        toolCityInput.addEventListener("change", function () {
          fillPostalCodeFromCity("toolCity", "toolPostalCode");
        });

        toolPostalInput.addEventListener("input", function () {
          toolPostalInput.dataset.autoFilled = "false";
        });
      }

      if (pickupCityInput && pickupPostalInput) {
        pickupCityInput.addEventListener("input", function () {
          fillPostalCodeFromCity("pickupCity", "pickupPostalCode");
        });

        pickupCityInput.addEventListener("change", function () {
          fillPostalCodeFromCity("pickupCity", "pickupPostalCode");
        });

        pickupPostalInput.addEventListener("input", function () {
          pickupPostalInput.dataset.autoFilled = "false";
        });
      }
    }
function getOfferCurrentUserSafe() {
  if (typeof getCurrentUser === "function") {
    return getCurrentUser();
  }

  try {
    const value = localStorage.getItem("rentuloUser");
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
}
    function fillProfileAddressAsDefault() {
      const currentUser =
  typeof getCurrentUserSafe === "function"
    ? getOfferCurrentUserSafe()
    : null;
      const toolCityInput = document.getElementById("toolCity");
      const toolPostalInput = document.getElementById("toolPostalCode");

      if (!currentUser) {
        return;
      }

      const userCity = currentUser.city || currentUser.mesto || "";
      const userPostalCode = currentUser.postalCode || currentUser.psc || "";

      if (toolCityInput && !toolCityInput.value.trim() && userCity) {
        toolCityInput.value = userCity;
      }

      if (toolPostalInput && !toolPostalInput.value.trim() && userPostalCode) {
        toolPostalInput.value = userPostalCode;
        toolPostalInput.dataset.autoFilled = "true";
      }
    }

    function parseMoneyValue(value) {
      const rawValue = String(value === undefined || value === null ? "" : value).trim();

      if (!rawValue) {
        return 0;
      }

      const cleanedValue = rawValue
        .toLowerCase()
        .replace("kč", "")
        .replace("kc", "")
        .replace(/\s/g, "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "")
        .trim();

      if (!cleanedValue) {
        return NaN;
      }

      const number = Number(cleanedValue);

      if (Number.isNaN(number)) {
        return NaN;
      }

      return Math.max(0, Math.round(number));
    }

    function clearOfferFormErrors() {
      const fields = document.querySelectorAll("#offerForm input, #offerForm select, #offerForm textarea");

      fields.forEach(function (field) {
        field.classList.remove("input-error");
      });
    }

    function markOfferFormError(id) {
      const field = document.getElementById(id);

      if (field) {
        field.classList.add("input-error");
      }
    }

    function showOfferFormMessage(message, type) {
      const messageBox = document.getElementById("offerFormMessage");

      if (!messageBox) {
        return;
      }

      messageBox.textContent = message;
      messageBox.className = "form-message active " + type;

      messageBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }

    function hideOfferFormMessage() {
      const messageBox = document.getElementById("offerFormMessage");

      if (!messageBox) {
        return;
      }

      messageBox.textContent = "";
      messageBox.className = "form-message";
    }

    function updatePhotoStatus(message, type) {
      const status = document.getElementById("toolPhotoStatus");

      if (!status) {
        return;
      }

      status.textContent = message;
      status.className = "photo-upload-status " + (type || "");
    }

    function renderPhotoPreview(dataUrl) {
      const preview = document.getElementById("toolPhotoPreview");

      if (!preview) {
        return;
      }

      if (!dataUrl) {
        preview.innerHTML = "Bez fotky";
        return;
      }

      preview.innerHTML = `<img src="${dataUrl}" alt="Fotka nářadí">`;
    }

    function resizeImageToDataUrl(file, callback) {
      const reader = new FileReader();

      reader.onload = function (event) {
        const image = new Image();

        image.onload = function () {
          const maxSize = 900;
          let width = image.width;
          let height = image.height;

          if (width > height && width > maxSize) {
            height = Math.round(height * maxSize / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round(width * maxSize / height);
            height = maxSize;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, width, height);

          callback(canvas.toDataURL("image/jpeg", 0.78));
        };

        image.onerror = function () {
          callback("");
        };

        image.src = event.target.result;
      };

      reader.onerror = function () {
        callback("");
      };

      reader.readAsDataURL(file);
    }

    function setupOfferPhotoUpload() {
      const photoInput = document.getElementById("toolPhoto");
      const removePhotoButton = document.getElementById("removeToolPhotoButton");

      if (!photoInput) {
        return;
      }

      photoInput.addEventListener("change", function () {
        const file = photoInput.files && photoInput.files[0];

        if (!file) {
          offerPhotoDataUrl = "";
          offerPhotoFile = null;
          renderPhotoPreview("");
          updatePhotoStatus("Fotka nebyla vybraná.", "");
          return;
        }

        if (!file.type || !file.type.startsWith("image/")) {
          offerPhotoDataUrl = "";
          offerPhotoFile = null;
          photoInput.value = "";
          renderPhotoPreview("");
          updatePhotoStatus("Vyberte prosím obrázek ve formátu JPG, PNG nebo WEBP.", "error");
          return;
        }

        offerPhotoFile = file;
        updatePhotoStatus("Zpracovávám fotku...", "");

        resizeImageToDataUrl(file, function (dataUrl) {
          if (!dataUrl) {
            offerPhotoDataUrl = "";
            offerPhotoFile = null;
            photoInput.value = "";
            renderPhotoPreview("");
            updatePhotoStatus("Fotku se nepodařilo načíst. Zkuste jiný obrázek.", "error");
            return;
          }

          offerPhotoDataUrl = dataUrl;
          renderPhotoPreview(offerPhotoDataUrl);
          updatePhotoStatus("Fotka byla připravená k uložení.", "success");
        });
      });

      if (removePhotoButton) {
        removePhotoButton.addEventListener("click", function () {
          offerPhotoDataUrl = "";
          offerPhotoFile = null;
          photoInput.value = "";
          renderPhotoPreview("");
          updatePhotoStatus("Fotka byla odebraná.", "");
        });
      }
    }

    function getPickupAddress(currentUser) {
      const pickupUseCustom = document.getElementById("pickupUseCustom");
      const useCustomPickup = pickupUseCustom ? pickupUseCustom.checked : false;

      if (useCustomPickup) {
        return {
          mode: "custom",
          street: getInputValue("pickupStreet"),
          city: getInputValue("pickupCity"),
          postalCode: getInputValue("pickupPostalCode"),
          note: getInputValue("pickupNote")
        };
      }

     const safeUser = currentUser || {};

return {
  mode: "profile",
  street: safeUser.street || safeUser.ulice || "",
  city:
    safeUser.city ||
    safeUser.mesto ||
    getInputValue("toolCity"),
  postalCode:
    safeUser.postalCode ||
    safeUser.psc ||
    getInputValue("toolPostalCode"),
  note: ""
};
    }

    function getFullPickupAddress(pickupAddress) {
      return [
        pickupAddress.street,
        pickupAddress.city,
        pickupAddress.postalCode
      ].filter(Boolean).join(", ");
    }

    function validateOfferForm(status) {
      clearOfferFormErrors();
      hideOfferFormMessage();

      const requiredFields = [
        "toolName",
        "toolCategory",
        "toolCity",
        "toolPostalCode",
        "toolPrice",
        "toolDeposit",
        "toolDescription"
      ];

      let hasError = false;

      requiredFields.forEach(function (fieldId) {
        if (!getInputValue(fieldId)) {
          markOfferFormError(fieldId);
          hasError = true;
        }
      });

      const parsedPrice = parseMoneyValue(getInputValue("toolPrice"));
      const parsedDeposit = parseMoneyValue(getInputValue("toolDeposit"));

      if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        markOfferFormError("toolPrice");
        hasError = true;
      }

      if (Number.isNaN(parsedDeposit) || parsedDeposit < 0) {
        markOfferFormError("toolDeposit");
        hasError = true;
      }

      const pickupUseCustom = document.getElementById("pickupUseCustom");
      const useCustomPickup = pickupUseCustom ? pickupUseCustom.checked : false;

      if (useCustomPickup) {
        ["pickupStreet", "pickupCity", "pickupPostalCode"].forEach(function (fieldId) {
          if (!getInputValue(fieldId)) {
            markOfferFormError(fieldId);
            hasError = true;
          }
        });
      }

      if (hasError) {
        showOfferFormMessage("Vyplňte prosím všechna povinná pole. GPS poloha je volitelná.", "error");
        return false;
      }

      return true;
    }

    function dataUrlToBlob(dataUrl) {
      const parts = dataUrl.split(",");
      const metadata = parts[0];
      const base64 = parts[1];

      const mimeMatch = metadata.match(/data:(.*?);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);

      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }

      return new Blob([bytes], {
        type: mimeType
      });
    }

    async function uploadOfferPhoto(supabaseClient, userId) {
      if (!offerPhotoDataUrl) {
        return "";
      }

      const photoBlob = dataUrlToBlob(offerPhotoDataUrl);
      const fileName = userId + "/" + Date.now() + "-offer.jpg";

      updatePhotoStatus("Nahrávám fotku do Supabase...", "");

      const { error } = await supabaseClient.storage
        .from("offer-photos")
        .upload(fileName, photoBlob, {
          contentType: "image/jpeg",
          upsert: false
        });

      if (error) {
        throw error;
      }

      const { data } = supabaseClient.storage
        .from("offer-photos")
        .getPublicUrl(fileName);

      updatePhotoStatus("Fotka byla nahraná.", "success");

      return data && data.publicUrl ? data.publicUrl : "";
    }

    function createSupabaseOfferObject(status, supabaseUser, photoUrl) {
      const currentUser =
  typeof getCurrentUserSafe === "function"
    ? getOfferCurrentUserSafe()
    : null;
      const pickupAddress = getPickupAddress(currentUser);

      const pickupLatitudeValue = getInputValue("pickupLatitude");
      const pickupLongitudeValue = getInputValue("pickupLongitude");

      const pickupLatitude = pickupLatitudeValue ? Number(pickupLatitudeValue) : null;
      const pickupLongitude = pickupLongitudeValue ? Number(pickupLongitudeValue) : null;

      const hasPickupGps =
        pickupLatitude !== null &&
        pickupLongitude !== null &&
        !Number.isNaN(pickupLatitude) &&
        !Number.isNaN(pickupLongitude);

      return {
        owner_id: supabaseUser.id,
        name: getInputValue("toolName"),
        category: getInputValue("toolCategory"),
        description: getInputValue("toolDescription"),
        city: getInputValue("toolCity"),
        postal_code: getInputValue("toolPostalCode"),
        price_per_day: parseMoneyValue(getInputValue("toolPrice")),
        deposit: parseMoneyValue(getInputValue("toolDeposit")),
        status: status,
        photo_url: photoUrl || null,

        pickup_street: pickupAddress.street,
        pickup_city: pickupAddress.city,
        pickup_postal_code: pickupAddress.postalCode,
        pickup_note: pickupAddress.note,
        pickup_phone: getUserPhone(currentUser),
        pickup_latitude: hasPickupGps ? pickupLatitude : null,
        pickup_longitude: hasPickupGps ? pickupLongitude : null
      };
    }

    function setOfferSavingState(isSaving, status) {
      const publishOfferButton = document.getElementById("publishOfferButton");
      const saveDraftButton = document.getElementById("saveDraftButton");

      if (publishOfferButton) {
        publishOfferButton.disabled = isSaving;
        publishOfferButton.textContent = isSaving && status !== "draft"
          ? "Ukládám nabídku..."
          : "Zveřejnit nabídku";
      }

      if (saveDraftButton) {
        saveDraftButton.disabled = isSaving;
        saveDraftButton.textContent = isSaving && status === "draft"
          ? "Ukládám koncept..."
          : "Uložit jako koncept";
      }
    }

    async function saveOffer(status) {
      if (offerSaveInProgress) {
        return;
      }

      if (!navIsLoggedIn()) {
        showOfferLoginRequired();
        return;
      }

      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        showOfferFormMessage("Chyba: Supabase klient není načtený. Zkontrolujte js/supabase-config.js.", "error");
        return;
      }

      if (!validateOfferForm(status)) {
        return;
      }

      offerSaveInProgress = true;
      setOfferSavingState(true, status);

      try {
        const supabaseUser = await getCurrentSupabaseUser();

        if (!supabaseUser) {
          showOfferFormMessage("Nejste přihlášený v Supabase. Přihlaste se prosím znovu.", "error");
          offerSaveInProgress = false;
          setOfferSavingState(false, status);
          return;
        }

        const photoUrl = await uploadOfferPhoto(supabaseClient, supabaseUser.id);
        const supabaseOffer = createSupabaseOfferObject(status, supabaseUser, photoUrl);

        const { data, error } = await supabaseClient
          .from("offers")
          .insert(supabaseOffer)
          .select()
          .single();

        if (error) {
          throw error;
        }

        sessionStorage.setItem("rentuloOfferSaved", status);
        window.location.href = "moje-nabidky.html";
      } catch (error) {
        console.error("Nabídku se nepodařilo uložit.", error);
        offerSaveInProgress = false;
        setOfferSavingState(false, status);

        const message = error && error.message ? error.message : "";

        if (message.includes("row-level security")) {
          showOfferFormMessage("Nabídku se nepodařilo uložit: Supabase odmítl zápis kvůli bezpečnostním pravidlům. Zkuste se odhlásit a znovu přihlásit.", "error");
          return;
        }

        if (message.includes("column") || message.includes("schema cache")) {
          showOfferFormMessage("Nabídku se nepodařilo uložit: některý sloupec v tabulce offers chybí. Pošli mi screenshot chyby z konzole.", "error");
          return;
        }

        showOfferFormMessage("Nabídku se nepodařilo uložit. Zkuste odebrat fotku a uložit znovu.", "error");
      }
    }

    function setupPickupCustomFields() {
      const pickupUseCustom = document.getElementById("pickupUseCustom");
      const pickupCustomFields = document.getElementById("pickupCustomFields");

      if (!pickupUseCustom || !pickupCustomFields) {
        return;
      }

      pickupUseCustom.addEventListener("change", function () {
        if (pickupUseCustom.checked) {
          pickupCustomFields.classList.add("is-visible");
        } else {
          pickupCustomFields.classList.remove("is-visible");
        }
      });
    }

    function setupPickupLocation() {
      const pickupLocationButton = document.getElementById("pickupLocationButton");
      const pickupLocationStatus = document.getElementById("pickupLocationStatus");
      const pickupLatitudeInput = document.getElementById("pickupLatitude");
      const pickupLongitudeInput = document.getElementById("pickupLongitude");

      if (!pickupLocationButton || !pickupLatitudeInput || !pickupLongitudeInput) {
        return;
      }

      pickupLocationButton.addEventListener("click", function () {
        if (!navigator.geolocation) {
          if (pickupLocationStatus) {
            pickupLocationStatus.textContent = "Poloha není v tomto prohlížeči dostupná.";
            pickupLocationStatus.className = "pickup-location-status error";
          }

          alert("Poloha není v tomto prohlížeči dostupná.");
          return;
        }

        pickupLocationButton.disabled = true;
        pickupLocationButton.textContent = "Zjišťuji polohu...";

        if (pickupLocationStatus) {
          pickupLocationStatus.textContent = "Zjišťuji polohu...";
          pickupLocationStatus.className = "pickup-location-status";
        }

        navigator.geolocation.getCurrentPosition(
          function (position) {
            pickupLatitudeInput.value = position.coords.latitude;
            pickupLongitudeInput.value = position.coords.longitude;

            pickupLocationButton.disabled = false;
            pickupLocationButton.textContent = "Poloha byla uložena";

            if (pickupLocationStatus) {
              pickupLocationStatus.textContent = "Poloha byla uložena k nabídce.";
              pickupLocationStatus.className = "pickup-location-status success";
            }
          },
          function () {
            pickupLatitudeInput.value = "";
            pickupLongitudeInput.value = "";

            pickupLocationButton.disabled = false;
            pickupLocationButton.textContent = "Použít moji aktuální polohu";

            if (pickupLocationStatus) {
              pickupLocationStatus.textContent = "Polohu se nepodařilo získat. Nabídku můžete uložit i bez GPS.";
              pickupLocationStatus.className = "pickup-location-status error";
            }

            alert("Polohu se nepodařilo získat. Nabídku můžete uložit i bez GPS polohy.");
          },
          {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 300000
          }
        );
      });
    }

    function setupOfferForm() {
      const offerForm = document.getElementById("offerForm");
      const saveDraftButton = document.getElementById("saveDraftButton");

      if (offerForm) {
        offerForm.addEventListener("submit", function (event) {
          event.preventDefault();
          saveOffer("active");
        });
      }

      if (saveDraftButton) {
        saveDraftButton.addEventListener("click", function () {
          saveOffer("draft");
        });
      }
    }

    document.addEventListener("DOMContentLoaded", function () {
      renderSharedNavigation("nabidnout");

      if (!navIsLoggedIn()) {
        showOfferLoginRequired();
        return;
      }

      setupCitySuggestions();
      setupPostalCodeAutocomplete();
      fillProfileAddressAsDefault();
      setupOfferPhotoUpload();
      setupPickupCustomFields();
      setupPickupLocation();
      setupOfferForm();
    });