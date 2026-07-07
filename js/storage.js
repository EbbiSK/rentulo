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

function clearLegacyLocalCollectionData() {
  [
    "rentuloUsers",
    "naradiUsers",
    "rentuloOffers",
    "naradiNabidky",
    "rentuloReservations",
    "naradiRezervace",
    "rentuloNotifications",
    "naradiNotifications"
  ].forEach(function (key) {
    localStorage.removeItem(key);
  });
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

/*
  Supabase je teraz hlavný zdroj dát pre:
  - používateľské profily,
  - ponuky,
  - rezervácie,
  - notifikácie.

  Tieto funkcie nechávame kvôli starším stránkam a kompatibilite,
  ale už nevracajú ani neukladajú lokálne kolekcie, aby lokálne dáta
  neprebíjali stav zo Supabase.
*/

function getUsers() {
  clearLegacyLocalCollectionData();
  return [];
}

function saveUsers() {
  clearLegacyLocalCollectionData();
}

function getOffers() {
  clearLegacyLocalCollectionData();
  return [];
}

function saveOffers() {
  clearLegacyLocalCollectionData();
}

function getReservations() {
  clearLegacyLocalCollectionData();
  return [];
}

function saveReservations() {
  clearLegacyLocalCollectionData();
}

function getNotifications() {
  clearLegacyLocalCollectionData();
  return [];
}

function saveNotifications() {
  clearLegacyLocalCollectionData();
}

function addSimulatedPhoneNotification(notificationData) {
  console.warn(
    "addSimulatedPhoneNotification už nepoužíva localStorage. Notifikácie sa majú ukladať do Supabase.",
    notificationData || {}
  );

  return {
    id: "notification-disabled-" + Date.now(),
    type: notificationData && notificationData.type ? notificationData.type : "notification",
    recipientName: notificationData && notificationData.recipientName ? notificationData.recipientName : "Uživatel",
    recipientEmail: notificationData && notificationData.recipientEmail ? notificationData.recipientEmail : "",
    recipientPhone: notificationData && notificationData.recipientPhone ? notificationData.recipientPhone : "",
    message: notificationData && notificationData.message ? notificationData.message : "",
    status: "disabled-local-storage",
    createdAt: new Date().toISOString()
  };
}
