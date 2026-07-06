let editOfferPhotoDataUrl = "";

document.addEventListener("DOMContentLoaded", function () {
  protectEditOfferPage();
  loadOfferForEdit();
  setupEditOfferPhotoUpload();
  setupEditOfferSave();
});

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

function editNormalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
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

  return numberValue;
}

function editValueOrEmpty(value) {
  return value === undefined || value === null ? "" : value;
}

function getEditToolId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function getEditTool() {
  const id = getEditToolId();

  if (!id) {
    return null;
  }

  const tools = getOffers();

  return tools.find(function (tool) {
    return String(tool.id || tool.offerId || tool.naradiId) === String(id);
  }) || null;
}

function getEditOfferPhoto(tool) {
  if (!tool) {
    return "";
  }

  return tool.photoDataUrl || tool.imageDataUrl || tool.image || tool.photo || "";
}

function renderEditPhotoPreview(dataUrl) {
  const preview = document.querySelector("#editPhotoPreview");

  if (!preview) {
    return;
  }

  if (!dataUrl) {
    preview.innerHTML = "Bez fotky";
    return;
  }

  preview.innerHTML = `<img src="${dataUrl}" alt="Fotka nářadí">`;
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

      const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
      callback(dataUrl);
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

function isCurrentUserOwnerOfEditedTool(tool) {
  const user = getCurrentUser();

  if (!user || !tool || !tool.ownerEmail) {
    return false;
  }

  return editNormalizeEmail(getUserEmail(user)) === editNormalizeEmail(tool.ownerEmail);
}

function editGetReservationOfferId(reservation) {
  if (typeof getReservationOfferId === "function") {
    return getReservationOfferId(reservation);
  }

  if (!reservation) {
    return "";
  }

  return reservation.toolId || reservation.offerId || reservation.naradiId || "";
}

function editGetReservationStatus(reservation) {
  if (typeof getReservationStatus === "function") {
    return getReservationStatus(reservation);
  }

  if (!reservation) {
    return "pending";
  }

  return reservation.status || "pending";
}

function editNormalizeReservationStatus(status) {
  if (typeof normalizeReservationStatus === "function") {
    return normalizeReservationStatus(status);
  }

  const normalizedStatus = String(status || "pending").trim().toLowerCase();

  if (normalizedStatus === "čeká na potvrzení") {
    return "pending";
  }

  if (normalizedStatus === "čeká na platbu") {
    return "approved";
  }

  if (normalizedStatus === "zaplaceno") {
    return "paid";
  }

  if (normalizedStatus === "vyzvednuto") {
    return "picked_up";
  }

  if (normalizedStatus === "vráceno") {
    return "returned";
  }

  if (normalizedStatus === "odmítnuto") {
    return "rejected";
  }

  if (normalizedStatus === "zrušeno") {
    return "cancelled";
  }

  return normalizedStatus;
}

function editIsBlockingReservationStatus(status) {
  if (typeof isBlockingReservationStatus === "function") {
    return isBlockingReservationStatus(status);
  }

  const normalizedStatus = editNormalizeReservationStatus(status);

  return (
    normalizedStatus === "pending" ||
    normalizedStatus === "approved" ||
    normalizedStatus === "paid" ||
    normalizedStatus === "picked_up"
  );
}

function editToolHasBlockingReservation(tool) {
  if (!tool) {
    return false;
  }

  const toolId = tool.id || tool.offerId || tool.naradiId;

  if (!toolId) {
    return false;
  }

  const reservations = getReservations();

  return reservations.some(function (reservation) {
    const reservationOfferId = editGetReservationOfferId(reservation);
    const reservationStatus = editGetReservationStatus(reservation);

    return (
      String(reservationOfferId) === String(toolId) &&
      editIsBlockingReservationStatus(reservationStatus)
    );
  });
}

function editLockPriceFieldsIfReserved(tool) {
  const priceInput = document.querySelector("#edit-price");
  const depositInput = document.querySelector("#edit-deposit");

  if (!priceInput || !depositInput) {
    return;
  }

  const hasBlockingReservation = editToolHasBlockingReservation(tool);

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

function loadOfferForEdit() {
  if (!isLoggedIn()) {
    return;
  }

  const editPage = getEditPageElement();

  if (!editPage) {
    return;
  }

  const tool = getEditTool();

  if (!tool) {
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
    return;
  }

  if (!isCurrentUserOwnerOfEditedTool(tool)) {
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

  nameInput.value = tool.name || tool.title || tool.nazev || "";
  categorySelect.value = tool.category || tool.kategorie || "Vyberte kategorii";
  cityInput.value = tool.city || tool.mesto || tool.location || "";
  postalInput.value = tool.postalCode || tool.postal || tool.psc || "";
  priceInput.value = editValueOrEmpty(tool.price || tool.pricePerDay || tool.cena);
  depositInput.value = editValueOrEmpty(tool.deposit !== undefined && tool.deposit !== null ? tool.deposit : tool.kauce);
  descriptionInput.value = tool.description || tool.popis || "";

  editOfferPhotoDataUrl = getEditOfferPhoto(tool);
  renderEditPhotoPreview(editOfferPhotoDataUrl);

  if (editOfferPhotoDataUrl) {
    updateEditPhotoStatus("Aktuální fotka je uložená. Můžete ji změnit nebo odebrat.", "success");
  } else {
    updateEditPhotoStatus("Tato nabídka zatím nemá fotku.", "");
  }

  editLockPriceFieldsIfReserved(tool);

  document.title = "Upravit nabídku - " + (tool.name || tool.title || tool.nazev || "Nabídka");
}

function setupEditOfferSave() {
  const saveButton = document.querySelector("#save-edit-button");

  if (!saveButton) {
    return;
  }

  saveButton.addEventListener("click", function () {
    editClearErrors();

    const tool = getEditTool();

    if (!tool) {
      editShowMessage("Nabídku se nepodařilo načíst.");
      return;
    }

    if (!isCurrentUserOwnerOfEditedTool(tool)) {
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

    const requiredFields = [
      nameInput,
      cityInput,
      postalInput,
      descriptionInput
    ];

    requiredFields.forEach(function (field) {
      if (editIsEmpty(field.value)) {
        editMarkError(field);
        hasError = true;
      }
    });

    if (categorySelect.selectedIndex === 0) {
      editMarkError(categorySelect);
      hasError = true;
    }

    const hasBlockingReservation = editToolHasBlockingReservation(tool);

    let priceValue = Number(tool.price || tool.pricePerDay || 0);
    let depositValue = Number(tool.deposit || 0);

    if (!hasBlockingReservation) {
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

    const tools = getOffers();

    const updatedTools = tools.map(function (item) {
      if (String(item.id || item.offerId || item.naradiId) !== String(tool.id || tool.offerId || tool.naradiId)) {
        return item;
      }

      return {
        ...item,
        name: nameInput.value.trim(),
        title: nameInput.value.trim(),
        category: categorySelect.value.trim(),
        city: cityInput.value.trim(),
        postalCode: postalInput.value.trim(),
        price: priceValue,
        pricePerDay: priceValue,
        deposit: depositValue,
        description: descriptionInput.value.trim(),

        photoDataUrl: editOfferPhotoDataUrl,
        imageDataUrl: editOfferPhotoDataUrl,
        image: editOfferPhotoDataUrl,

        updatedAt: new Date().toISOString()
      };
    });

    saveOffers(updatedTools);

    if (hasBlockingReservation) {
      editShowMessage("Změny byly uloženy. Cena a kauce zůstaly stejné, protože nabídka má aktivní rezervaci.", "success");
    } else {
      editShowMessage("Změny byly uloženy.", "success");
    }

    setTimeout(function () {
      window.location.href = "moje-nabidky.html";
    }, 900);
  });
}