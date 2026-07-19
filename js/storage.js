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



function saveCurrentUser(user) {
  saveJson("rentuloUser", user);
  localStorage.setItem("rentuloLoggedIn", "true");
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


















