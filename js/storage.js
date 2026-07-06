function loadJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeStorageEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeStorageText(value) {
  return String(value || "").trim().toLowerCase();
}

function getItemId(item) {
  if (!item) {
    return "";
  }

  return String(
    item.id ||
    item.userId ||
    item.offerId ||
    item.naradiId ||
    item.reservationId ||
    ""
  );
}

function getOfferPhotoValue(offer) {
  if (!offer) {
    return "";
  }

  return offer.photoDataUrl || offer.imageDataUrl || offer.image || offer.photo || "";
}

function offerHasPhoto(offer) {
  return Boolean(getOfferPhotoValue(offer));
}

function getOfferContentKey(offer) {
  if (!offer) {
    return "";
  }

  return [
    offer.name || offer.title || offer.nazev || "",
    offer.category || offer.kategorie || "",
    offer.city || offer.mesto || offer.location || "",
    offer.postalCode || offer.psc || "",
    offer.price || offer.pricePerDay || offer.cena || "",
    offer.deposit || offer.kauce || "",
    offer.ownerEmail || ""
  ].map(normalizeStorageText).join("|");
}

function getReservationContentKey(reservation) {
  if (!reservation) {
    return "";
  }

  return [
    reservation.offerId || reservation.toolId || reservation.naradiId || "",
    reservation.renterEmail || reservation.userEmail || reservation.borrowerEmail || "",
    reservation.startDate || reservation.dateFrom || "",
    reservation.endDate || reservation.dateTo || "",
    reservation.status || ""
  ].map(normalizeStorageText).join("|");
}

function getOfferCompletenessScore(offer) {
  if (!offer) {
    return 0;
  }

  let score = 0;

  [
    offer.id,
    offer.name || offer.title || offer.nazev,
    offer.category || offer.kategorie,
    offer.city || offer.mesto || offer.location,
    offer.postalCode || offer.psc,
    offer.price || offer.pricePerDay || offer.cena,
    offer.deposit || offer.kauce,
    offer.description,
    offer.ownerEmail,
    offer.pickupLatitude,
    offer.pickupLongitude,
    offer.pickupStreet,
    offer.pickupCity,
    offer.pickupPostalCode,
    offer.pickupFullAddress
  ].forEach(function (value) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      score += 1;
    }
  });

  if (offerHasPhoto(offer)) {
    score += 20;
  }

  return score;
}

function mergeDuplicateOffers(existingOffer, newOffer) {
  if (!existingOffer) {
    return newOffer;
  }

  if (!newOffer) {
    return existingOffer;
  }

  const existingPhoto = getOfferPhotoValue(existingOffer);
  const newPhoto = getOfferPhotoValue(newOffer);

  const existingScore = getOfferCompletenessScore(existingOffer);
  const newScore = getOfferCompletenessScore(newOffer);

  const baseOffer = newScore > existingScore ? newOffer : existingOffer;
  const otherOffer = baseOffer === newOffer ? existingOffer : newOffer;

  const mergedOffer = {
    ...otherOffer,
    ...baseOffer
  };

  const finalPhoto = newPhoto || existingPhoto || "";

  if (finalPhoto) {
    mergedOffer.photoDataUrl = finalPhoto;
    mergedOffer.imageDataUrl = finalPhoto;
    mergedOffer.image = finalPhoto;
  }

  if (!mergedOffer.title && mergedOffer.name) {
    mergedOffer.title = mergedOffer.name;
  }

  if (!mergedOffer.name && mergedOffer.title) {
    mergedOffer.name = mergedOffer.title;
  }

  if (!mergedOffer.pricePerDay && mergedOffer.price) {
    mergedOffer.pricePerDay = mergedOffer.price;
  }

  if (!mergedOffer.price && mergedOffer.pricePerDay) {
    mergedOffer.price = mergedOffer.pricePerDay;
  }

  return mergedOffer;
}

function mergeStorageArrays(primaryItems, secondaryItems) {
  const mergedItems = [];

  if (Array.isArray(primaryItems)) {
    mergedItems.push(...primaryItems);
  }

  if (Array.isArray(secondaryItems)) {
    secondaryItems.forEach(function (secondaryItem) {
      const secondaryId = getItemId(secondaryItem);
      const secondaryEmail = normalizeStorageEmail(secondaryItem && secondaryItem.email);

      const alreadyExists = mergedItems.some(function (item) {
        const itemId = getItemId(item);
        const itemEmail = normalizeStorageEmail(item && item.email);

        if (itemId && secondaryId && itemId === secondaryId) {
          return true;
        }

        if (itemEmail && secondaryEmail && itemEmail === secondaryEmail) {
          return true;
        }

        return false;
      });

      if (!alreadyExists) {
        mergedItems.push(secondaryItem);
      }
    });
  }

  return mergedItems;
}

function mergeOffers(primaryOffers, secondaryOffers) {
  const mergedOffers = [];

  function addOfferIfMissing(offer) {
    if (!offer) {
      return;
    }

    const offerId = getItemId(offer);
    const offerContentKey = getOfferContentKey(offer);

    const existingIndex = mergedOffers.findIndex(function (existingOffer) {
      const existingId = getItemId(existingOffer);
      const existingContentKey = getOfferContentKey(existingOffer);

      if (offerId && existingId && offerId === existingId) {
        return true;
      }

      if (offerContentKey && existingContentKey && offerContentKey === existingContentKey) {
        return true;
      }

      return false;
    });

    if (existingIndex === -1) {
      mergedOffers.push(offer);
      return;
    }

    mergedOffers[existingIndex] = mergeDuplicateOffers(mergedOffers[existingIndex], offer);
  }

  if (Array.isArray(primaryOffers)) {
    primaryOffers.forEach(addOfferIfMissing);
  }

  if (Array.isArray(secondaryOffers)) {
    secondaryOffers.forEach(addOfferIfMissing);
  }

  return mergedOffers;
}

function mergeReservations(primaryReservations, secondaryReservations) {
  const mergedReservations = [];

  function addReservationIfMissing(reservation) {
    if (!reservation) {
      return;
    }

    const reservationId = getItemId(reservation);
    const reservationContentKey = getReservationContentKey(reservation);

    const alreadyExists = mergedReservations.some(function (existingReservation) {
      const existingId = getItemId(existingReservation);
      const existingContentKey = getReservationContentKey(existingReservation);

      if (reservationId && existingId && reservationId === existingId) {
        return true;
      }

      if (
        reservationContentKey &&
        existingContentKey &&
        reservationContentKey === existingContentKey
      ) {
        return true;
      }

      return false;
    });

    if (!alreadyExists) {
      mergedReservations.push(reservation);
    }
  }

  if (Array.isArray(primaryReservations)) {
    primaryReservations.forEach(addReservationIfMissing);
  }

  if (Array.isArray(secondaryReservations)) {
    secondaryReservations.forEach(addReservationIfMissing);
  }

  return mergedReservations;
}

function isLoggedIn() {
  const rentuloLoggedIn = localStorage.getItem("rentuloLoggedIn") === "true";
  const oldNaradiLoggedIn = localStorage.getItem("naradiLoggedIn") === "true";

  return rentuloLoggedIn || oldNaradiLoggedIn;
}

function getCurrentUser() {
  const rentuloUser = loadJson("rentuloUser", null);
  const oldNaradiUser = loadJson("naradiUser", null);

  if (!isLoggedIn()) {
    return null;
  }

  return rentuloUser || oldNaradiUser || null;
}

function saveCurrentUser(user) {
  saveJson("rentuloUser", user);
  localStorage.setItem("rentuloLoggedIn", "true");

  saveJson("naradiUser", user);
  localStorage.setItem("naradiLoggedIn", "true");
}

function clearCurrentUser() {
  localStorage.removeItem("rentuloUser");
  localStorage.removeItem("rentuloLoggedIn");
  localStorage.removeItem("rentuloRememberLogin");

  localStorage.removeItem("naradiUser");
  localStorage.removeItem("naradiLoggedIn");
}

function getUserEmail(user) {
  if (!user) {
    return "";
  }

  return user.email || user.userEmail || user.mail || "";
}

function getUserName(user) {
  if (!user) {
    return "Uživatel";
  }

  return (
    user.fullName ||
    user.name ||
    user.jmeno ||
    getUserEmail(user) ||
    "Uživatel"
  );
}

function getUserPhone(user) {
  if (!user) {
    return "";
  }

  return user.phone || user.telefon || user.userPhone || "";
}

function getUsers() {
  const rentuloUsers = loadJson("rentuloUsers", []);
  const oldNaradiUsers = loadJson("naradiUsers", []);

  return mergeStorageArrays(rentuloUsers, oldNaradiUsers);
}

function saveUsers(users) {
  saveJson("rentuloUsers", users);
  saveJson("naradiUsers", users);
}

function getOffers() {
  const rentuloOffers = loadJson("rentuloOffers", []);
  const oldNaradiOffers = loadJson("naradiNabidky", []);

  const mergedOffers = mergeOffers(rentuloOffers, oldNaradiOffers);

  if (
    mergedOffers.length !== rentuloOffers.length ||
    mergedOffers.length !== oldNaradiOffers.length ||
    JSON.stringify(mergedOffers) !== JSON.stringify(rentuloOffers) ||
    JSON.stringify(mergedOffers) !== JSON.stringify(oldNaradiOffers)
  ) {
    saveOffers(mergedOffers);
  }

  return mergedOffers;
}

function saveOffers(offers) {
  const cleanOffers = mergeOffers(offers, []);

  saveJson("rentuloOffers", cleanOffers);
  saveJson("naradiNabidky", cleanOffers);
}

function getReservations() {
  const rentuloReservations = loadJson("rentuloReservations", []);
  const oldNaradiReservations = loadJson("naradiRezervace", []);

  const mergedReservations = mergeReservations(rentuloReservations, oldNaradiReservations);

  if (
    mergedReservations.length !== rentuloReservations.length ||
    mergedReservations.length !== oldNaradiReservations.length
  ) {
    saveReservations(mergedReservations);
  }

  return mergedReservations;
}

function saveReservations(reservations) {
  const cleanReservations = mergeReservations(reservations, []);

  saveJson("rentuloReservations", cleanReservations);
  saveJson("naradiRezervace", cleanReservations);
}

function getNotifications() {
  const rentuloNotifications = loadJson("rentuloNotifications", []);
  const oldNaradiNotifications = loadJson("naradiNotifications", []);

  return mergeStorageArrays(rentuloNotifications, oldNaradiNotifications);
}

function saveNotifications(notifications) {
  saveJson("rentuloNotifications", notifications);
  saveJson("naradiNotifications", notifications);
}

function addSimulatedPhoneNotification(notificationData) {
  const notifications = getNotifications();

  const notification = {
    id: "notification-" + Date.now(),
    type: notificationData.type || "notification",
    recipientName: notificationData.recipientName || "Uživatel",
    recipientEmail: notificationData.recipientEmail || "",
    recipientPhone: notificationData.recipientPhone || "",
    message: notificationData.message || "",
    status: "simulated",
    createdAt: new Date().toISOString()
  };

  notifications.push(notification);
  saveNotifications(notifications);

  return notification;
}