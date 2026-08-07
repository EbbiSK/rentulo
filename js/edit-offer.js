let editOfferPhotoDataUrl = "";
let editCurrentOffer = null;
let editHasBlockingReservation = false;
let editSaveInProgress = false;

const EDIT_OFFER_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const EDIT_OFFER_PHOTO_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

function editT(key, fallback) {
  if (typeof window.rentuloTranslate === "function") {
    const translated = window.rentuloTranslate(key);
    return translated === key ? fallback : translated;
  }

  return fallback;
}

document.addEventListener("DOMContentLoaded", async function () {
  const supabaseUser = await window.rentuloAuthGuard.requireUser();

  if (!supabaseUser) {
    return;
  }

  initializeEditOfferPage(supabaseUser);
});

function getEditSupabaseClient() {
  if (window.rentuloSupabase) {
    return window.rentuloSupabase;
  }

  if (typeof rentuloSupabase !== "undefined") {
    return rentuloSupabase;
  }

  return null;
}

async function getEditSupabaseUser() {
  const supabaseClient = getEditSupabaseClient();

  if (!supabaseClient) {
    return null;
  }

  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data || !data.user) {
    return null;
  }

  return data.user;
}

function editShowMessage(message, type = "error") {
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

function editMarkError(input) {
  if (input) {
    input.classList.add("input-error");
  }
}

function editClearErrors() {
  const fields = document.querySelectorAll("input, textarea, select");

  fields.forEach(function (field) {
    field.classList.remove("input-error");
  });
}

function editIsEmpty(value) {
  return String(value === undefined || value === null ? "" : value).trim() === "";
}

function editMoneyToNumber(value) {
  const cleanedValue = String(value === undefined || value === null ? "" : value)
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  const numberValue = Number(cleanedValue);

  if (Number.isNaN(numberValue) || numberValue < 0) {
    return 0;
  }

  return Math.round(numberValue);
}

function editValueOrEmpty(value) {
  return value === undefined || value === null ? "" : value;
}

function getEditToolId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function getEditOfferPhoto(offer) {
  if (!offer) {
    return "";
  }

  return offer.photo_url || offer.photoUrl || offer.image || offer.photo || "";
}

function renderEditPhotoPreview(photoValue) {
  const preview = document.querySelector("#editPhotoPreview");

  if (!preview) {
    return;
  }

  if (!photoValue) {
    preview.textContent = editT("editOffer.noPhoto", "Bez fotky");
    return;
  }

  preview.innerHTML = `<img src="${photoValue}" alt="${editT("editOffer.photoTitle", "Fotka věci")}">`;
}

function updateEditPhotoFileName(file) {
  const fileName = document.getElementById("editPhotoFileName");

  if (!fileName) {
    return;
  }

  if (file && file.name) {
    fileName.textContent = file.name;
    fileName.removeAttribute("data-i18n");
    return;
  }

  fileName.setAttribute("data-i18n", "editOffer.noFileChosen");
  fileName.textContent = editT(
    "editOffer.noFileChosen",
    "Nebyl vybrán žádný soubor"
  );
}

function updateEditPhotoStatus(message, type) {
  const status = document.querySelector("#editPhotoStatus");

  if (!status) {
    return;
  }

  status.textContent = message;
  status.className = "photo-upload-status " + (type || "");
}

function resizeEditImageToDataUrl(file, callback) {
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

function setupEditOfferPhotoUpload() {
  const photoInput = document.querySelector("#edit-photo");
  const removePhotoButton = document.querySelector("#removeEditPhotoButton");

  if (photoInput) {
    updateEditPhotoFileName(null);
    photoInput.addEventListener("change", function () {
      const file = photoInput.files && photoInput.files[0];
      updateEditPhotoFileName(file);

      if (!file) {
        updateEditPhotoStatus(editT("editOffer.photoNotSelected", "Fotka nebyla vybraná."), "");
        return;
      }

      if (!EDIT_OFFER_PHOTO_ALLOWED_TYPES.includes(file.type)) {
        photoInput.value = "";
        updateEditPhotoFileName(null);
        updateEditPhotoStatus(editT("editOffer.invalidPhoto", "Vyberte prosím obrázek ve formátu JPG, PNG nebo WEBP."), "error");
        return;
      }

      if (file.size > EDIT_OFFER_PHOTO_MAX_BYTES) {
        photoInput.value = "";
        updateEditPhotoFileName(null);
        updateEditPhotoStatus(editT("editOffer.photoTooLarge", "Fotka je příliš velká. Maximální velikost je 5 MB."), "error");
        return;
      }

      updateEditPhotoStatus(editT("editOffer.processingPhoto", "Zpracovávám fotku..."), "");

      resizeEditImageToDataUrl(file, function (dataUrl) {
        if (!dataUrl) {
          photoInput.value = "";
        updateEditPhotoFileName(null);
          updateEditPhotoStatus(editT("editOffer.photoLoadFailed", "Fotku se nepodařilo načíst. Zkuste jiný obrázek."), "error");
          return;
        }

        editOfferPhotoDataUrl = dataUrl;
        renderEditPhotoPreview(editOfferPhotoDataUrl);
        updateEditPhotoStatus(editT("editOffer.photoReady", "Nová fotka je připravená k uložení."), "success");
      });
    });
  }

  if (removePhotoButton) {
    removePhotoButton.addEventListener("click", function () {
      editOfferPhotoDataUrl = "";

      if (photoInput) {
        photoInput.value = "";
        updateEditPhotoFileName(null);
      }

      renderEditPhotoPreview("");
      updateEditPhotoStatus(editT("editOffer.photoWillBeRemoved", "Fotka bude po uložení odstraněná."), "");
    });
  }
}

function getEditPageElement() {
  return document.querySelector(".edit-page") || document.querySelector(".offer-page");
}

function protectEditOfferPage() {
  const editPage = getEditPageElement();

  if (!editPage) {
    return;
  }

  if (navIsLoggedIn()) {
    return;
  }

  editPage.innerHTML = `
    <section class="login-required-box">
      <p class="eyebrow">${editT("editOffer.loginRequired", "Přihlášení je potřeba")}</p>
      <h1>${editT("editOffer.loginTitle", "Pro úpravu nabídky se nejdříve přihlaste.")}</h1>
      <p>${editT("editOffer.loginDescription", "Nabídky mohou upravovat pouze přihlášení uživatelé.")}</p>
      <div class="login-required-actions">
        <a href="prihlaseni.html">${editT("editOffer.signIn", "Přihlásit se")}</a>
        <a href="registrace.html" class="secondary-action">${editT("editOffer.createAccount", "Vytvořit účet")}</a>
      </div>
    </section>
  `;
}

function showEditOfferNotFound() {
  const editPage = getEditPageElement();

  if (!editPage) {
    return;
  }

  editPage.innerHTML = `
    <section class="login-required-box">
      <p class="eyebrow">${editT("editOffer.notFoundEyebrow", "Nabídka nenalezena")}</p>
      <h1>${editT("editOffer.notFoundTitle", "Tuto nabídku se nepodařilo najít.")}</h1>
      <p>${editT("editOffer.notFoundDescription", "Nabídka mohla být smazána nebo odkaz není správný.")}</p>
      <div class="login-required-actions">
        <a href="moje-nabidky.html">${editT("editOffer.backToListings", "Zpět na moje nabídky")}</a>
      </div>
    </section>
  `;
}

function showEditOfferForbidden() {
  const editPage = getEditPageElement();

  if (!editPage) {
    return;
  }

  editPage.innerHTML = `
    <section class="login-required-box">
      <p class="eyebrow">${editT("editOffer.forbiddenEyebrow", "Nemáte oprávnění")}</p>
      <h1>${editT("editOffer.forbiddenTitle", "Tuto nabídku nemůžete upravovat.")}</h1>
      <p>${editT("editOffer.forbiddenDescription", "Upravovat můžete pouze nabídky, které jste sami vytvořili.")}</p>
      <div class="login-required-actions">
        <a href="moje-nabidky.html">${editT("editOffer.backToListings", "Zpět na moje nabídky")}</a>
      </div>
    </section>
  `;
}

async function loadOfferFromSupabase(offerId) {
  const supabaseClient = getEditSupabaseClient();

  if (!supabaseClient) {
    throw new Error(editT("editOffer.supabaseMissing", "Služba je dočasně nedostupná. Obnovte stránku."));
  }

  const { data, error } = await supabaseClient
    .from("offers")
    .select("*")
    .eq("id", offerId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function offerHasOpenReservationInSupabase(offerId) {
  const supabaseClient = getEditSupabaseClient();

  if (!supabaseClient || !offerId) {
    return false;
  }

  const { data, error } = await supabaseClient
  .rpc("get_blocking_reservations", {
    p_offer_id: offerId
  });

const blockingReservations = Array.isArray(data)
  ? data.slice(0, 1)
  : [];

  if (error) {
    console.warn(editT("editOffer.reservationCheckFailed", "Nepodařilo se ověřit aktivní rezervace nabídky."), error);
    return false;
  }

 return blockingReservations.length > 0;
}

function editLockPriceFields(hasBlockingReservation) {
  const priceInput = document.querySelector("#edit-price");

  if (!priceInput) {
    return;
  }

  if (!hasBlockingReservation) {
    priceInput.readOnly = false;
    priceInput.classList.remove("locked-input");
    return;
  }

  priceInput.readOnly = true;
  priceInput.classList.add("locked-input");

  const existingNotice = document.querySelector(".edit-price-lock-notice");

  if (existingNotice) {
    return;
  }

  const notice = document.createElement("p");
  notice.className = "edit-price-lock-notice";
  notice.textContent =
    editT("editOffer.priceLocked", "Cena je zamčená, protože nabídka má aktivní rezervaci.");

  priceInput.insertAdjacentElement("afterend", notice);
}

function normalizeEditOfferCategory(category) {
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

  return legacyMap[value] || value;
}

function fillEditForm(offer) {
  const nameInput = document.querySelector("#edit-name");
  const categorySelect = document.querySelector("#edit-category");
  const pickupStreetInput = document.querySelector("#edit-pickup-street");
  const cityInput = document.querySelector("#edit-city");
  const postalInput = document.querySelector("#edit-postal-code");
  const pickupNoteInput = document.querySelector("#edit-pickup-note");
  const priceInput = document.querySelector("#edit-price");
  const descriptionInput = document.querySelector("#edit-description");

  if (
    !nameInput ||
    !categorySelect ||
    !pickupStreetInput ||
    !cityInput ||
    !postalInput ||
    !pickupNoteInput ||
    !priceInput ||
    !descriptionInput
  ) {
    editShowMessage(editT("editOffer.formLoadFailed", "Formulář pro úpravu nabídky se nepodařilo načíst."));
    return;
  }

  nameInput.value = offer.name || "";
  categorySelect.value = normalizeEditOfferCategory(offer.category);
  pickupStreetInput.value = offer.pickup_street || "";
  cityInput.value = offer.pickup_city || offer.city || "";
  postalInput.value = offer.pickup_postal_code || offer.postal_code || "";
  pickupNoteInput.value = offer.pickup_note || "";
  priceInput.value = editValueOrEmpty(offer.price_per_day);
  descriptionInput.value = offer.description || "";

  editOfferPhotoDataUrl = getEditOfferPhoto(offer);
  renderEditPhotoPreview(editOfferPhotoDataUrl);

  if (editOfferPhotoDataUrl) {
    updateEditPhotoStatus(editT("editOffer.currentPhoto", "Aktuální fotka je uložená. Můžete ji změnit nebo odebrat."), "success");
  } else {
    updateEditPhotoStatus(editT("editOffer.noCurrentPhoto", "Tato nabídka zatím nemá fotku."), "");
  }

  document.title = editT("editOffer.title", "Upravit nabídku") + " - " + (offer.name || editT("editOffer.offerFallback", "Nabídka"));
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

function getOwnedOfferPhotoPath(photoUrl, userId) {
  if (!photoUrl || !userId) {
    return "";
  }

  try {
    const parsedUrl = new URL(photoUrl, window.location.origin);
    const marker = "/storage/v1/object/public/offer-photos/";
    const markerIndex = parsedUrl.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return "";
    }

    const photoPath = decodeURIComponent(parsedUrl.pathname.slice(markerIndex + marker.length));
    return photoPath.startsWith(userId + "/") ? photoPath : "";
  } catch (error) {
    return "";
  }
}

async function removeEditedOfferPhotoFromStorage(supabaseClient, photoPath) {
  if (!photoPath) {
    return;
  }

  const { error } = await supabaseClient.storage
    .from("offer-photos")
    .remove([photoPath]);

  if (error) {
    console.error("Starou fotku se nepodařilo odstranit ze Storage.", error);
  }
}

async function uploadEditedOfferPhoto(supabaseClient, userId) {
  if (!editOfferPhotoDataUrl) {
    return { url: null, path: "", isNew: false };
  }

  if (!editOfferPhotoDataUrl.startsWith("data:")) {
    return { url: editOfferPhotoDataUrl, path: "", isNew: false };
  }

  const photoBlob = dataUrlToBlob(editOfferPhotoDataUrl);
  const fileName = userId + "/" + Date.now() + "-offer.jpg";

  updateEditPhotoStatus(editT("editOffer.uploadingPhoto", "Nahrávám fotku do Supabase..."), "");

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

  updateEditPhotoStatus(editT("editOffer.photoUploaded", "Fotka byla nahraná."), "success");

  return {
    url: data && data.publicUrl ? data.publicUrl : null,
    path: fileName,
    isNew: true
  };
}

function setEditSavingState(isSaving) {
  const saveButton = document.querySelector("#save-edit-button");

  if (!saveButton) {
    return;
  }

  saveButton.disabled = isSaving;
  saveButton.textContent = isSaving
    ? editT("editOffer.saving", "Ukládám změny...")
    : editT("editOffer.save", "Uložit změny");
}

async function geocodeEditedPickupAddress(supabaseClient, pickupAddress) {
  const { data, error } = await supabaseClient.functions.invoke("geocode-pickup", {
    body: {
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

  return { latitude, longitude };
}

async function initializeEditOfferPage(supabaseUser) {
  const offerId = getEditToolId();

  if (!offerId) {
    showEditOfferNotFound();
    return;
  }

  const supabaseClient = getEditSupabaseClient();

  if (!supabaseClient) {
    editShowMessage(editT("editOffer.supabaseMissing", "Služba je dočasně nedostupná. Obnovte stránku."));
    return;
  }

  try {
    const offer = await loadOfferFromSupabase(offerId);

    if (!offer) {
      showEditOfferNotFound();
      return;
    }

    if (String(offer.owner_id) !== String(supabaseUser.id)) {
      showEditOfferForbidden();
      return;
    }

    editCurrentOffer = offer;
    editHasBlockingReservation = await offerHasOpenReservationInSupabase(offer.id);

    fillEditForm(offer);
    editLockPriceFields(editHasBlockingReservation);
    setupEditOfferPhotoUpload();
    setupEditOfferSave();
  } catch (error) {
    console.error(error);
    showEditOfferNotFound();
  }
}

function setupEditOfferSave() {
  const saveButton = document.querySelector("#save-edit-button");

  if (!saveButton) {
    return;
  }

  saveButton.addEventListener("click", async function () {
    if (editSaveInProgress) {
      return;
    }

    editClearErrors();

    if (!editCurrentOffer) {
      editShowMessage(editT("editOffer.offerLoadFailed", "Nabídku se nepodařilo načíst."));
      return;
    }

    const supabaseClient = getEditSupabaseClient();
    const supabaseUser = await getEditSupabaseUser();

    if (!supabaseClient || !supabaseUser) {
      editShowMessage(editT("editOffer.sessionMissing", "Vaše přihlášení vypršelo. Přihlaste se prosím znovu."));
      return;
    }

    if (String(editCurrentOffer.owner_id) !== String(supabaseUser.id)) {
      editShowMessage(editT("editOffer.cannotEdit", "Tuto nabídku nemůžete upravovat."));
      return;
    }

    const nameInput = document.querySelector("#edit-name");
    const categorySelect = document.querySelector("#edit-category");
    const pickupStreetInput = document.querySelector("#edit-pickup-street");
    const cityInput = document.querySelector("#edit-city");
    const postalInput = document.querySelector("#edit-postal-code");
    const pickupNoteInput = document.querySelector("#edit-pickup-note");
    const priceInput = document.querySelector("#edit-price");
    const descriptionInput = document.querySelector("#edit-description");

    if (
      !nameInput ||
      !categorySelect ||
      !pickupStreetInput ||
      !cityInput ||
      !postalInput ||
      !pickupNoteInput ||
      !priceInput ||
      !descriptionInput
    ) {
      editShowMessage(editT("editOffer.formLoadFailed", "Formulář pro úpravu nabídky se nepodařilo načíst."));
      return;
    }

    let hasError = false;

    [nameInput, pickupStreetInput, cityInput, postalInput, descriptionInput].forEach(function (field) {
      if (editIsEmpty(field.value)) {
        editMarkError(field);
        hasError = true;
      }
    });

    if (categorySelect.selectedIndex === 0 || editIsEmpty(categorySelect.value)) {
      editMarkError(categorySelect);
      hasError = true;
    }

    let priceValue = Number(editCurrentOffer.price_per_day || 0);


    if (!editHasBlockingReservation) {
      if (editIsEmpty(priceInput.value)) {
        editMarkError(priceInput);
        hasError = true;
      }

      

      priceValue = editMoneyToNumber(priceInput.value);
      

      if (priceValue <= 0) {
        editMarkError(priceInput);
        hasError = true;
      }

      
    }

    if (hasError) {
      editShowMessage(editT("editOffer.validation", "Vyplňte prosím všechna pole. Cena musí být číslo větší než 0."));
      return;
    }

    editSaveInProgress = true;
    setEditSavingState(true);

    let newlyUploadedPhotoPath = "";

    try {
      const pickupAddress = {
        street: pickupStreetInput.value.trim(),
        city: cityInput.value.trim(),
        postalCode: postalInput.value.trim()
      };
      const pickupCoordinates = await geocodeEditedPickupAddress(supabaseClient, pickupAddress);
      const previousPhotoUrl = getEditOfferPhoto(editCurrentOffer);
      const uploadedPhoto = await uploadEditedOfferPhoto(supabaseClient, supabaseUser.id);
      newlyUploadedPhotoPath = uploadedPhoto.isNew ? uploadedPhoto.path : "";

      const originalPickupAddress = [
        editCurrentOffer.pickup_street || "",
        editCurrentOffer.pickup_city || editCurrentOffer.city || "",
        editCurrentOffer.pickup_postal_code || editCurrentOffer.postal_code || ""
      ].map(function (value) {
        return String(value).trim().toLowerCase();
      }).join("|");
      const editedPickupAddress = [
        pickupAddress.street,
        pickupAddress.city,
        pickupAddress.postalCode
      ].map(function (value) {
        return String(value).trim().toLowerCase();
      }).join("|");

      const updatePayload = {
        name: nameInput.value.trim(),
        category: categorySelect.value.trim(),
        city: pickupAddress.city,
        postal_code: pickupAddress.postalCode,
        description: descriptionInput.value.trim(),
        photo_url: uploadedPhoto.url,
        pickup_mode: originalPickupAddress === editedPickupAddress
          ? (editCurrentOffer.pickup_mode || "profile")
          : "custom",
        pickup_street: pickupAddress.street,
        pickup_city: pickupAddress.city,
        pickup_postal_code: pickupAddress.postalCode,
        pickup_note: pickupNoteInput.value.trim(),
        pickup_latitude: pickupCoordinates.latitude,
        pickup_longitude: pickupCoordinates.longitude
      };

      if (!editHasBlockingReservation) {
        updatePayload.price_per_day = priceValue;

      }

      const { error } = await supabaseClient
        .from("offers")
        .update(updatePayload)
        .eq("id", editCurrentOffer.id)
        .eq("owner_id", supabaseUser.id);

      if (error) {
        throw error;
      }

      const photoChanged = previousPhotoUrl && previousPhotoUrl !== uploadedPhoto.url;
      const previousPhotoPath = photoChanged
        ? getOwnedOfferPhotoPath(previousPhotoUrl, supabaseUser.id)
        : "";

      if (previousPhotoPath) {
        await removeEditedOfferPhotoFromStorage(supabaseClient, previousPhotoPath);
      }

      if (editHasBlockingReservation) {
        editShowMessage(editT("editOffer.savedPriceLocked", "Změny byly uloženy. Cena zůstala stejná, protože nabídka má aktivní rezervaci."), "success");
      } else {
        editShowMessage(editT("editOffer.saved", "Změny byly uloženy."), "success");
      }

      setTimeout(function () {
        window.location.href = "moje-nabidky.html";
      }, 900);
    } catch (error) {
      if (newlyUploadedPhotoPath) {
        await removeEditedOfferPhotoFromStorage(supabaseClient, newlyUploadedPhotoPath);
      }

      console.error(error);
      editSaveInProgress = false;
      setEditSavingState(false);

      if (error && error.code === "PICKUP_GEOCODING_NOT_FOUND") {
        editShowMessage(editT(
          "offer.geocodeNotFound",
          "Místo vyzvednutí se nepodařilo najít na mapě. Zkontrolujte ulici, město a PSČ."
        ));
        return;
      }

      if (error && error.code === "PICKUP_GEOCODING_UNAVAILABLE") {
        editShowMessage(editT(
          "offer.geocodeUnavailable",
          "Polohu místa vyzvednutí se teď nepodařilo ověřit. Zkuste to prosím znovu."
        ));
        return;
      }

      editShowMessage(editT("editOffer.saveFailed", "Změny se nepodařilo uložit. Zkuste to prosím znovu."));
    }
  });
}
document.addEventListener("DOMContentLoaded", function () {
  renderSharedNavigation("muj-ucet");
});