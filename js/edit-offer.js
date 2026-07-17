let editOfferPhotoDataUrl = "";
let editCurrentOffer = null;
let editHasBlockingReservation = false;
let editSaveInProgress = false;

document.addEventListener("DOMContentLoaded", function () {
  protectEditOfferPage();
  initializeEditOfferPage();
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
    preview.innerHTML = "Bez fotky";
    return;
  }

  preview.innerHTML = `<img src="${photoValue}" alt="Fotka nářadí">`;
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
    photoInput.addEventListener("change", function () {
      const file = photoInput.files && photoInput.files[0];

      if (!file) {
        updateEditPhotoStatus("Fotka nebyla vybraná.", "");
        return;
      }

      if (!file.type || !file.type.startsWith("image/")) {
        photoInput.value = "";
        updateEditPhotoStatus("Vyberte prosím obrázek ve formátu JPG, PNG nebo WEBP.", "error");
        return;
      }

      updateEditPhotoStatus("Zpracovávám fotku...", "");

      resizeEditImageToDataUrl(file, function (dataUrl) {
        if (!dataUrl) {
          photoInput.value = "";
          updateEditPhotoStatus("Fotku se nepodařilo načíst. Zkuste jiný obrázek.", "error");
          return;
        }

        editOfferPhotoDataUrl = dataUrl;
        renderEditPhotoPreview(editOfferPhotoDataUrl);
        updateEditPhotoStatus("Nová fotka je připravená k uložení.", "success");
      });
    });
  }

  if (removePhotoButton) {
    removePhotoButton.addEventListener("click", function () {
      editOfferPhotoDataUrl = "";

      if (photoInput) {
        photoInput.value = "";
      }

      renderEditPhotoPreview("");
      updateEditPhotoStatus("Fotka bude po uložení odstraněná.", "");
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

  if (isLoggedIn()) {
    return;
  }

  editPage.innerHTML = `
    <section class="login-required-box">
      <p class="eyebrow">Přihlášení je potřeba</p>

      <h1>Pro úpravu nabídky se nejdříve přihlaste.</h1>

      <p>
        Nabídky mohou upravovat pouze přihlášení uživatelé.
      </p>

      <div class="login-required-actions">
        <a href="prihlaseni.html">Přihlásit se</a>
        <a href="registrace.html" class="secondary-action">Vytvořit účet</a>
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
      <p class="eyebrow">Nabídka nenalezena</p>

      <h1>Tuto nabídku se nepodařilo najít.</h1>

      <p>
        Nabídka mohla být smazána nebo odkaz není správný.
      </p>

      <div class="login-required-actions">
        <a href="moje-nabidky.html">Zpět na moje nabídky</a>
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
      <p class="eyebrow">Nemáte oprávnění</p>

      <h1>Tuto nabídku nemůžete upravovat.</h1>

      <p>
        Upravovat můžete pouze nabídky, které jste sami vytvořili.
      </p>

      <div class="login-required-actions">
        <a href="moje-nabidky.html">Zpět na moje nabídky</a>
      </div>
    </section>
  `;
}

async function loadOfferFromSupabase(offerId) {
  const supabaseClient = getEditSupabaseClient();

  if (!supabaseClient) {
    throw new Error("Supabase klient není načtený.");
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
    .from("reservations")
    .select("id,status")
    .eq("offer_id", offerId)
    .in("status", ["pending", "approved", "paid", "picked_up"])
    .limit(1);

  if (error) {
    console.warn("Nepodařilo se ověřit aktivní rezervace nabídky.", error);
    return false;
  }

  return Array.isArray(data) && data.length > 0;
}

function editLockPriceFields(hasBlockingReservation) {
  const priceInput = document.querySelector("#edit-price");
  const depositInput = document.querySelector("#edit-deposit");

  if (!priceInput || !depositInput) {
    return;
  }

  if (!hasBlockingReservation) {
    priceInput.readOnly = false;
    depositInput.readOnly = false;
    priceInput.classList.remove("locked-input");
    depositInput.classList.remove("locked-input");
    return;
  }

  priceInput.readOnly = true;
  depositInput.readOnly = true;
  priceInput.classList.add("locked-input");
  depositInput.classList.add("locked-input");

  const existingNotice = document.querySelector(".edit-price-lock-notice");

  if (existingNotice) {
    return;
  }

  const notice = document.createElement("p");
  notice.className = "edit-price-lock-notice";
  notice.textContent = "Cena a kauce jsou zamčené, protože nabídka má aktivní rezervaci.";

  depositInput.insertAdjacentElement("afterend", notice);
}

function fillEditForm(offer) {
  const nameInput = document.querySelector("#edit-name");
  const categorySelect = document.querySelector("#edit-category");
  const cityInput = document.querySelector("#edit-city");
  const postalInput = document.querySelector("#edit-postal");
  const priceInput = document.querySelector("#edit-price");
  const depositInput = document.querySelector("#edit-deposit");
  const descriptionInput = document.querySelector("#edit-description");

  if (
    !nameInput ||
    !categorySelect ||
    !cityInput ||
    !postalInput ||
    !priceInput ||
    !depositInput ||
    !descriptionInput
  ) {
    editShowMessage("Formulář pro úpravu nabídky se nepodařilo načíst.");
    return;
  }

  nameInput.value = offer.name || "";
  categorySelect.value = offer.category || "Vyberte kategorii";
  cityInput.value = offer.city || "";
  postalInput.value = offer.postal_code || "";
  priceInput.value = editValueOrEmpty(offer.price_per_day);
  depositInput.value = editValueOrEmpty(offer.deposit);
  descriptionInput.value = offer.description || "";

  editOfferPhotoDataUrl = getEditOfferPhoto(offer);
  renderEditPhotoPreview(editOfferPhotoDataUrl);

  if (editOfferPhotoDataUrl) {
    updateEditPhotoStatus("Aktuální fotka je uložená. Můžete ji změnit nebo odebrat.", "success");
  } else {
    updateEditPhotoStatus("Tato nabídka zatím nemá fotku.", "");
  }

  document.title = "Upravit nabídku - " + (offer.name || "Nabídka");
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

async function uploadEditedOfferPhoto(supabaseClient, userId) {
  if (!editOfferPhotoDataUrl) {
    return null;
  }

  if (!editOfferPhotoDataUrl.startsWith("data:")) {
    return editOfferPhotoDataUrl;
  }

  const photoBlob = dataUrlToBlob(editOfferPhotoDataUrl);
  const fileName = userId + "/" + Date.now() + "-offer.jpg";

  updateEditPhotoStatus("Nahrávám fotku do Supabase...", "");

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

  updateEditPhotoStatus("Fotka byla nahraná.", "success");

  return data && data.publicUrl ? data.publicUrl : null;
}

function setEditSavingState(isSaving) {
  const saveButton = document.querySelector("#save-edit-button");

  if (!saveButton) {
    return;
  }

  saveButton.disabled = isSaving;
  saveButton.textContent = isSaving ? "Ukládám změny..." : "Uložit změny";
}

async function initializeEditOfferPage() {
  if (!isLoggedIn()) {
    return;
  }

  const offerId = getEditToolId();

  if (!offerId) {
    showEditOfferNotFound();
    return;
  }

  const supabaseClient = getEditSupabaseClient();

  if (!supabaseClient) {
    editShowMessage("Supabase klient není načtený.");
    return;
  }

  try {
    const supabaseUser = await getEditSupabaseUser();

    if (!supabaseUser) {
      showEditOfferForbidden();
      return;
    }

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
      editShowMessage("Nabídku se nepodařilo načíst.");
      return;
    }

    const supabaseClient = getEditSupabaseClient();
    const supabaseUser = await getEditSupabaseUser();

    if (!supabaseClient || !supabaseUser) {
      editShowMessage("Nejste přihlášený v Supabase. Přihlaste se prosím znovu.");
      return;
    }

    if (String(editCurrentOffer.owner_id) !== String(supabaseUser.id)) {
      editShowMessage("Tuto nabídku nemůžete upravovat.");
      return;
    }

    const nameInput = document.querySelector("#edit-name");
    const categorySelect = document.querySelector("#edit-category");
    const cityInput = document.querySelector("#edit-city");
    const postalInput = document.querySelector("#edit-postal");
    const priceInput = document.querySelector("#edit-price");
    const depositInput = document.querySelector("#edit-deposit");
    const descriptionInput = document.querySelector("#edit-description");

    if (
      !nameInput ||
      !categorySelect ||
      !cityInput ||
      !postalInput ||
      !priceInput ||
      !depositInput ||
      !descriptionInput
    ) {
      editShowMessage("Formulář pro úpravu nabídky se nepodařilo načíst.");
      return;
    }

    let hasError = false;

    [nameInput, cityInput, postalInput, descriptionInput].forEach(function (field) {
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
    let depositValue = Number(editCurrentOffer.deposit || 0);

    if (!editHasBlockingReservation) {
      if (editIsEmpty(priceInput.value)) {
        editMarkError(priceInput);
        hasError = true;
      }

      if (editIsEmpty(depositInput.value)) {
        editMarkError(depositInput);
        hasError = true;
      }

      priceValue = editMoneyToNumber(priceInput.value);
      depositValue = editMoneyToNumber(depositInput.value);

      if (priceValue <= 0) {
        editMarkError(priceInput);
        hasError = true;
      }

      if (depositValue < 0) {
        editMarkError(depositInput);
        hasError = true;
      }
    }

    if (hasError) {
      editShowMessage("Vyplňte prosím všechna pole. Cena musí být číslo větší než 0.");
      return;
    }

    editSaveInProgress = true;
    setEditSavingState(true);

    try {
      const photoUrl = await uploadEditedOfferPhoto(supabaseClient, supabaseUser.id);

      const updatePayload = {
        name: nameInput.value.trim(),
        category: categorySelect.value.trim(),
        city: cityInput.value.trim(),
        postal_code: postalInput.value.trim(),
        description: descriptionInput.value.trim(),
        photo_url: photoUrl
      };

      if (!editHasBlockingReservation) {
        updatePayload.price_per_day = priceValue;
        updatePayload.deposit = depositValue;
      }

      const { error } = await supabaseClient
        .from("offers")
        .update(updatePayload)
        .eq("id", editCurrentOffer.id)
        .eq("owner_id", supabaseUser.id);

      if (error) {
        throw error;
      }

      if (editHasBlockingReservation) {
        editShowMessage("Změny byly uloženy. Cena a kauce zůstaly stejné, protože nabídka má aktivní rezervaci.", "success");
      } else {
        editShowMessage("Změny byly uloženy.", "success");
      }

      setTimeout(function () {
        window.location.href = "moje-nabidky.html";
      }, 900);
    } catch (error) {
      console.error(error);
      editSaveInProgress = false;
      setEditSavingState(false);
      editShowMessage("Změny se nepodařilo uložit. Zkontrolujte konzoli nebo Supabase pravidla.");
    }
  });
}
document.addEventListener("DOMContentLoaded", function () {
  renderSharedNavigation("muj-ucet");
});