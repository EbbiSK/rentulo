let offerSaveInProgress = false;
    let offerSaveStatus = "";
    let offerPhotoDataUrl = "";
    let offerPhotoFile = null;
    let offerPhotoProcessing = false;
    let offerPhotoSelectionToken = 0;
    let offerOwnerProfile = {
      phone: "",
      street: "",
      city: "",
      postalCode: ""
    };

    const OFFER_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
    const OFFER_PHOTO_ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    function offerTranslate(key, fallback) {
      if (typeof window.rentuloTranslate === "function") {
        const translated = window.rentuloTranslate(key);
        return translated === key ? fallback : translated;
      }

      return fallback;
    }

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
          <p class="eyebrow">${offerTranslate("offer.loginRequiredEyebrow", "Přihlášení je potřeba")}</p>

          <h1>${offerTranslate("offer.loginRequiredTitle", "Pro přidání nabídky se nejdříve přihlaste.")}</h1>

          <p>${offerTranslate("offer.loginRequiredDescription", "Věci mohou nabízet pouze přihlášení uživatelé. Po přihlášení se můžete vrátit a přidat vlastní nabídku.")}</p>

          <div class="login-required-actions">
            <a href="prihlaseni.html">${offerTranslate("nav.login", "Přihlásit se")}</a>
            <a href="registrace.html" class="secondary-action">${offerTranslate("offer.createAccount", "Vytvořit účet")}</a>
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
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
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
        if (postalInput.dataset.autoFilled === "true") {
          postalInput.value = "";
        }

        return;
      }

      if (!postalInput.value.trim() || postalInput.dataset.autoFilled === "true") {
        postalInput.value = postalCode;
        postalInput.dataset.autoFilled = "true";
      }
    }

    function setupPostalCodeAutocomplete() {
      const pickupCityInput = document.getElementById("pickupCity");
      const pickupPostalInput = document.getElementById("pickupPostalCode");

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
    async function fillProfileAddressAsDefault(authenticatedUser) {
      const supabaseClient = window.rentuloSupabase ||
        (typeof rentuloSupabase !== "undefined" ? rentuloSupabase : null);

      if (!authenticatedUser || !authenticatedUser.id || !supabaseClient) {
        return;
      }

      const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("phone, street, city, postal_code")
        .eq("id", authenticatedUser.id)
        .maybeSingle();

      if (error || !profile) {
        return;
      }

      const userCity = profile.city || "";
      const userPostalCode = profile.postal_code || "";

      offerOwnerProfile = {
        phone: profile.phone || "",
        street: profile.street || "",
        city: userCity,
        postalCode: userPostalCode
      };

      renderProfilePickupAddress();
    }

    function renderProfilePickupAddress() {
      const summary = document.getElementById("profilePickupSummary");
      const address = document.getElementById("profilePickupAddress");
      const pickupUseCustom = document.getElementById("pickupUseCustom");

      if (!summary || !address) {
        return;
      }

      const hasCompleteProfileAddress = Boolean(
        offerOwnerProfile.street &&
        offerOwnerProfile.city &&
        offerOwnerProfile.postalCode
      );

      if (!hasCompleteProfileAddress) {
        summary.hidden = true;
        address.textContent = "";
        return;
      }

      address.textContent = [
        offerOwnerProfile.street,
        offerOwnerProfile.city,
        offerOwnerProfile.postalCode
      ].join(", ");
      summary.hidden = Boolean(pickupUseCustom && pickupUseCustom.checked);
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

    function setDynamicTranslatedText(element, key, fallback) {
      if (!element) {
        return;
      }

      element.dataset.dynamicI18nKey = key || "";
      element.dataset.dynamicI18nFallback = fallback || "";
      element.textContent = offerTranslate(key, fallback);
    }

    function refreshDynamicTranslatedText(element) {
      if (!element || !element.dataset.dynamicI18nKey) {
        return;
      }

      element.textContent = offerTranslate(
        element.dataset.dynamicI18nKey,
        element.dataset.dynamicI18nFallback || ""
      );
    }

    function showOfferFormMessage(message, type, key) {
      const messageBox = document.getElementById("offerFormMessage");

      if (!messageBox) {
        return;
      }

      messageBox.textContent = message;
      messageBox.className = "form-message active " + type;
      messageBox.dataset.dynamicI18nKey = key || "";
      messageBox.dataset.dynamicI18nFallback = message || "";

      messageBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }

    function showOfferTranslatedFormMessage(key, fallback, type) {
      showOfferFormMessage(
        offerTranslate(key, fallback),
        type,
        key
      );
    }

    function hideOfferFormMessage() {
      const messageBox = document.getElementById("offerFormMessage");

      if (!messageBox) {
        return;
      }

      messageBox.textContent = "";
      messageBox.className = "form-message";
      delete messageBox.dataset.dynamicI18nKey;
      delete messageBox.dataset.dynamicI18nFallback;
    }

    function updatePhotoStatus(message, type, key) {
      const status = document.getElementById("toolPhotoStatus");

      if (!status) {
        return;
      }

      status.textContent = message;
      status.className = "photo-upload-status " + (type || "");
      status.dataset.dynamicI18nKey = key || "";
      status.dataset.dynamicI18nFallback = message || "";
    }

    function updatePhotoStatusByKey(key, fallback, type) {
      updatePhotoStatus(
        offerTranslate(key, fallback),
        type,
        key
      );
    }

    function renderPhotoPreview(dataUrl) {
      const preview = document.getElementById("toolPhotoPreview");

      if (!preview) {
        return;
      }

      if (!dataUrl) {
        preview.textContent = offerTranslate("offer.noPhoto", "Bez fotky");
        return;
      }

preview.innerHTML = `<img src="${dataUrl}" alt="${offerTranslate("offer.photoAlt", "Fotka nabízené věci")}">`;
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

    function setRemovePhotoButtonVisible(button, isVisible) {
      if (!button) {
        return;
      }

      button.hidden = !isVisible;
    }

    function setupOfferPhotoUpload() {
      const photoInput = document.getElementById("toolPhoto");
      const removePhotoButton = document.getElementById("removeToolPhotoButton");

      if (!photoInput) {
        return;
      }

      setRemovePhotoButtonVisible(removePhotoButton, Boolean(offerPhotoDataUrl));

      photoInput.addEventListener("change", function () {
        const file = photoInput.files && photoInput.files[0];
        const selectionToken = ++offerPhotoSelectionToken;

        if (!file) {
          offerPhotoDataUrl = "";
          offerPhotoFile = null;
          offerPhotoProcessing = false;
          renderPhotoPreview("");
          updatePhotoStatusByKey("offer.photoNotSelected", "Fotka nebyla vybraná.", "");
          setRemovePhotoButtonVisible(removePhotoButton, false);
          return;
        }

        if (!OFFER_PHOTO_ALLOWED_TYPES.includes(file.type)) {
          offerPhotoDataUrl = "";
          offerPhotoFile = null;
          offerPhotoProcessing = false;
          photoInput.value = "";
          renderPhotoPreview("");
          updatePhotoStatusByKey("offer.photoInvalidType", "Vyberte prosím obrázek ve formátu JPG, PNG nebo WEBP.", "error");
          setRemovePhotoButtonVisible(removePhotoButton, false);
          return;
        }

        if (file.size > OFFER_PHOTO_MAX_BYTES) {
          offerPhotoDataUrl = "";
          offerPhotoFile = null;
          offerPhotoProcessing = false;
          photoInput.value = "";
          renderPhotoPreview("");
          updatePhotoStatusByKey("offer.photoTooLarge", "Fotka je příliš velká. Maximální velikost je 5 MB.", "error");
          setRemovePhotoButtonVisible(removePhotoButton, false);
          return;
        }

        offerPhotoFile = file;
        offerPhotoProcessing = true;
        updatePhotoStatusByKey("offer.photoProcessing", "Zpracovávám fotku...", "");

        resizeImageToDataUrl(file, function (dataUrl) {
          if (selectionToken !== offerPhotoSelectionToken) {
            return;
          }

          offerPhotoProcessing = false;

          if (!dataUrl) {
            offerPhotoDataUrl = "";
            offerPhotoFile = null;
            photoInput.value = "";
            renderPhotoPreview("");
            updatePhotoStatusByKey("offer.photoLoadFailed", "Fotku se nepodařilo načíst. Zkuste jiný obrázek.", "error");
            setRemovePhotoButtonVisible(removePhotoButton, false);
            return;
          }

          offerPhotoDataUrl = dataUrl;
          renderPhotoPreview(offerPhotoDataUrl);
          updatePhotoStatusByKey("offer.photoReady", "Fotka byla připravená k uložení.", "success");
          setRemovePhotoButtonVisible(removePhotoButton, true);
        });
      });

      if (removePhotoButton) {
        removePhotoButton.addEventListener("click", function () {
          offerPhotoSelectionToken += 1;
          offerPhotoDataUrl = "";
          offerPhotoFile = null;
          offerPhotoProcessing = false;
          photoInput.value = "";
          renderPhotoPreview("");
          updatePhotoStatusByKey("offer.photoRemoved", "Fotka byla odebraná.", "");
          setRemovePhotoButtonVisible(removePhotoButton, false);
        });
      }
    }

    function getPickupAddress() {
      const pickupUseCustom = document.getElementById("pickupUseCustom");
      const useCustomPickup = pickupUseCustom ? pickupUseCustom.checked : false;

      if (useCustomPickup) {
        return {
          mode: "custom",
          street: getInputValue("pickupStreet"),
          city: getInputValue("pickupCity"),
          postalCode: getInputValue("pickupPostalCode"),
          note: getInputValue("pickupNote"),
          phone: offerOwnerProfile.phone
        };
      }

      return {
        mode: "profile",
        street: offerOwnerProfile.street,
        city: offerOwnerProfile.city,
        postalCode: offerOwnerProfile.postalCode,
        note: "",
        phone: offerOwnerProfile.phone
      };
    }

    function validateOfferForm(status) {
      clearOfferFormErrors();
      hideOfferFormMessage();

      const requiredFields = [
        "toolName",
        "toolCategory",
        "toolPrice",
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

      if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        markOfferFormError("toolPrice");
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
      } else {
        const profilePickup = getPickupAddress();

        if (!profilePickup.street || !profilePickup.city || !profilePickup.postalCode) {
          showOfferTranslatedFormMessage(
            "offer.profilePickupMissing",
            "Ve vašem profilu chybí úplná adresa pro vyzvednutí. Doplňte ji v Nastavení nebo zvolte jiné místo vyzvednutí.",
            "error"
          );
          return false;
        }
      }

      if (hasError) {
        showOfferTranslatedFormMessage("offer.validationRequired", "Vyplňte prosím všechna povinná pole.", "error");
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

    async function removeOfferPhotoFromStorage(supabaseClient, photoPath) {
      if (!photoPath) {
        return;
      }

      const { error } = await supabaseClient.storage
        .from("offer-photos")
        .remove([photoPath]);

      if (error) {
        console.error("Nepoužitou fotku se nepodařilo odstranit ze Storage.", error);
      }
    }

    async function uploadOfferPhoto(supabaseClient, userId) {
      if (!offerPhotoDataUrl) {
        return { url: "", path: "" };
      }

      const photoBlob = dataUrlToBlob(offerPhotoDataUrl);
      const fileName = userId + "/" + Date.now() + "-offer.jpg";

      updatePhotoStatusByKey("offer.photoUploading", "Nahrávám fotku...", "");

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

      updatePhotoStatusByKey("offer.photoUploaded", "Fotka byla nahraná.", "success");

      return {
        url: data && data.publicUrl ? data.publicUrl : "",
        path: fileName
      };
    }

    async function geocodePickupAddress(supabaseClient, pickupAddress) {
      const { data, error } = await supabaseClient.functions.invoke("geocode-pickup", {
        body: {
  street: pickupAddress.street,
  city: pickupAddress.city,
  postalCode: pickupAddress.postalCode
}
      });

      if (error) {
        const geocodeError = new Error("Pickup geocoding is temporarily unavailable");
        geocodeError.code = "PICKUP_GEOCODING_UNAVAILABLE";
        throw geocodeError;
      }

      if (!data || data.ok !== true) {
        const geocodeError = new Error("Pickup address was not found");
        geocodeError.code = data && data.reason === "not_found"
          ? "PICKUP_GEOCODING_NOT_FOUND"
          : "PICKUP_GEOCODING_UNAVAILABLE";
        throw geocodeError;
      }

      const latitude = Number(data.latitude);
      const longitude = Number(data.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        const geocodeError = new Error("Pickup geocoding returned invalid coordinates");
        geocodeError.code = "PICKUP_GEOCODING_UNAVAILABLE";
        throw geocodeError;
      }

      return {
        latitude: latitude,
        longitude: longitude
      };
    }

    function createSupabaseOfferObject(status, supabaseUser, photoUrl, pickupAddress, pickupCoordinates) {
      return {
        owner_id: supabaseUser.id,
        name: getInputValue("toolName"),
        category: getInputValue("toolCategory"),
        description: getInputValue("toolDescription"),
        city: pickupAddress.city,
        postal_code: pickupAddress.postalCode,
        price_per_day: parseMoneyValue(getInputValue("toolPrice")),

        status: status,
        photo_url: photoUrl || null,

        pickup_mode: pickupAddress.mode,
        pickup_street: pickupAddress.street,
        pickup_city: pickupAddress.city,
        pickup_postal_code: pickupAddress.postalCode,
        pickup_note: pickupAddress.note,
        pickup_phone: pickupAddress.phone,
        pickup_latitude: pickupCoordinates.latitude,
        pickup_longitude: pickupCoordinates.longitude
      };
    }

    function setOfferSavingState(isSaving, status) {
      const publishOfferButton = document.getElementById("publishOfferButton");
      const saveDraftButton = document.getElementById("saveDraftButton");

      offerSaveStatus = isSaving ? status : "";

      if (publishOfferButton) {
        publishOfferButton.disabled = isSaving;
        publishOfferButton.textContent = isSaving && status !== "draft"
          ? offerTranslate("offer.savingOffer", "Ukládám nabídku...")
          : offerTranslate("offer.publish", "Zveřejnit nabídku");
      }

      if (saveDraftButton) {
        saveDraftButton.disabled = isSaving;
        saveDraftButton.textContent = isSaving && status === "draft"
          ? offerTranslate("offer.savingDraft", "Ukládám koncept...")
          : offerTranslate("offer.saveDraft", "Uložit jako koncept");
      }
    }

    async function saveOffer(status) {
      if (offerSaveInProgress) {
        return;
      }

      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        showOfferTranslatedFormMessage("offer.errorSupabaseMissing", "Služba je dočasně nedostupná. Obnovte stránku a zkuste to znovu.", "error");
        return;
      }

      if (!validateOfferForm(status)) {
        return;
      }

      if (offerPhotoProcessing) {
        showOfferTranslatedFormMessage("offer.photoProcessingWait", "Počkejte prosím, až se dokončí zpracování fotky.", "error");
        return;
      }

      offerSaveInProgress = true;
      setOfferSavingState(true, status);

      let uploadedPhotoPath = "";

      try {
        const supabaseUser = await getCurrentSupabaseUser();

        if (!supabaseUser) {
          showOfferTranslatedFormMessage("offer.errorNotAuthenticated", "Vaše přihlášení vypršelo. Přihlaste se prosím znovu.", "error");
          offerSaveInProgress = false;
          setOfferSavingState(false, status);
          return;
        }

        const pickupAddress = getPickupAddress();
        const pickupCoordinates = await geocodePickupAddress(supabaseClient, pickupAddress);
        const uploadedPhoto = await uploadOfferPhoto(supabaseClient, supabaseUser.id);
        uploadedPhotoPath = uploadedPhoto.path;
        const supabaseOffer = createSupabaseOfferObject(
          status,
          supabaseUser,
          uploadedPhoto.url,
          pickupAddress,
          pickupCoordinates
        );

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
        if (uploadedPhotoPath) {
          await removeOfferPhotoFromStorage(supabaseClient, uploadedPhotoPath);

          if (offerPhotoDataUrl) {
            updatePhotoStatusByKey("offer.photoReady", "Fotka byla připravená k uložení.", "success");
          }
        }

        console.error("Nabídku se nepodařilo uložit.", error);
        offerSaveInProgress = false;
        setOfferSavingState(false, status);

        const message = error && error.message
          ? String(error.message).toLowerCase()
          : "";

        if (error && error.code === "PICKUP_GEOCODING_NOT_FOUND") {
          showOfferTranslatedFormMessage(
            "offer.geocodeNotFound",
            "Místo vyzvednutí se nepodařilo najít na mapě. Zkontrolujte ulici, město a PSČ.",
            "error"
          );
          return;
        }

        if (error && error.code === "PICKUP_GEOCODING_UNAVAILABLE") {
          showOfferTranslatedFormMessage(
            "offer.geocodeUnavailable",
            "Polohu místa vyzvednutí se teď nepodařilo ověřit. Zkuste to prosím znovu.",
            "error"
          );
          return;
        }

        if (message.includes("row-level security")) {
          showOfferTranslatedFormMessage("offer.errorRls", "Nabídku se nepodařilo uložit. Odhlaste se, znovu se přihlaste a opakujte akci.", "error");
          return;
        }

        if (message.includes("column") || message.includes("schema cache")) {
          showOfferTranslatedFormMessage("offer.errorSchema", "Nabídku se nyní nepodařilo uložit. Zkuste to prosím později.", "error");
          return;
        }

        showOfferTranslatedFormMessage("offer.errorSave", "Nabídku se nepodařilo uložit. Zkuste odebrat fotku a uložit znovu.", "error");
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

        renderProfilePickupAddress();
      });

      renderProfilePickupAddress();
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

    function refreshOfferDynamicTranslations() {
      renderPhotoPreview(offerPhotoDataUrl);
      refreshDynamicTranslatedText(document.getElementById("toolPhotoStatus"));
      refreshDynamicTranslatedText(document.getElementById("offerFormMessage"));
      setOfferSavingState(offerSaveInProgress, offerSaveStatus);
    }

    document.addEventListener("DOMContentLoaded", async function () {
      const authenticatedUser = await window.rentuloAuthGuard.requireUser();

      if (!authenticatedUser) {
        return;
      }

      renderSharedNavigation("nabidnout");
      setupCitySuggestions();
      setupPostalCodeAutocomplete();
      await fillProfileAddressAsDefault(authenticatedUser);
      setupOfferPhotoUpload();
      setupPickupCustomFields();
      setupOfferForm();
    });

    document.addEventListener("rentuloLanguageChanged", function () {
      refreshOfferDynamicTranslations();
    });
