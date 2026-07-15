/*
  Rentulo API vrstva

  Tento súbor je príprava na budúci backend.

  Teraz zatiaľ používa existujúce funkcie z:
  - js/storage.js
  - js/reservations.js

  Cieľ:
  Stránky neskôr nebudú pracovať priamo s localStorage,
  ale cez tieto api... funkcie.

  Dôležité:
  Tento súbor zatiaľ nikam nepripájame.
  Nechávame ho pripravený, aby sme nerozbili aktuálny funkčný prototyp.
*/

/* =========================
   Pomocné funkcie
========================= */

function apiCreateId(prefix) {
  const safePrefix = prefix || "item";

  return (
    safePrefix +
    "-" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

function apiClone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return value;
  }
}

function apiNormalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function apiNow() {
  return new Date().toISOString();
}

function apiGetUserId(user) {
  if (!user) {
    return "";
  }

  return (
    user.id ||
    user.userId ||
    apiNormalizeEmail(user.email || user.userEmail || user.mail || "")
  );
}

function apiGetOfferId(offer) {
  if (!offer) {
    return "";
  }

  return (
    offer.id ||
    offer.offerId ||
    offer.naradiId ||
    ""
  );
}

function apiGetReservationId(reservation) {
  if (!reservation) {
    return "";
  }

  return (
    reservation.id ||
    reservation.reservationId ||
    ""
  );
}

/* =========================
   Používateľ
========================= */

async function apiGetCurrentUser() {
  const storedUser =
    localStorage.getItem("naradiUser") ||
    localStorage.getItem("rentuloUser");

  const isLoggedIn =
    localStorage.getItem("naradiLoggedIn") === "true" ||
    localStorage.getItem("rentuloLoggedIn") === "true";

  if (!storedUser || !isLoggedIn) {
    return null;
  }

  try {
    return apiClone(JSON.parse(storedUser));
  } catch (error) {
    console.warn("Přihlášeného uživatele se nepodařilo načíst:", error);
    return null;
  }
}

async function apiRegister(userData) {
  if (!userData) {
    throw new Error("Chýbajú údaje používateľa.");
  }

  

  const now = apiNow();

  const newUser = {
    ...userData,
    id: userData.id || apiCreateId("user"),
    email: userData.email,
    createdAt: userData.createdAt || now,
    updatedAt: now
  };

  

  if (typeof saveCurrentUser === "function") {
    saveCurrentUser(newUser);
  }

  return apiClone(newUser);
}

async function apiLogin(email, password) {
  const users = [];
  const normalizedEmail = apiNormalizeEmail(email);

  const user = users.find(function (item) {
    const itemEmail = apiNormalizeEmail(
      item.email ||
      item.userEmail ||
      item.mail ||
      ""
    );

    return itemEmail === normalizedEmail;
  });

  if (!user) {
    throw new Error("Účet s týmto e-mailom neexistuje.");
  }

  if (user.password && user.password !== password) {
    throw new Error("Zadané heslo není správné.");
  }

  if (typeof saveCurrentUser === "function") {
    saveCurrentUser(user);
  }

  return apiClone(user);
}

async function apiLogout() {
  if (typeof clearCurrentUser === "function") {
    clearCurrentUser();
  } else {
    localStorage.removeItem("rentuloLoggedIn");
    localStorage.removeItem("rentuloUser");
    localStorage.removeItem("rentuloRememberLogin");

    localStorage.removeItem("naradiLoggedIn");
    localStorage.removeItem("naradiUser");
  }

  return true;
}

/* =========================
   Ponuky
========================= */

async function apiGetOffers() {
  const supabaseClient = apiGetSupabaseClient();

  if (!supabaseClient) {
    return [];
  }

  const { data, error } = await supabaseClient
    .from("offers")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.warn("Ponuky se nepodařilo načíst:", error);
    return [];
  }

  return Array.isArray(data) ? data.map(apiNormalizeOffer) : [];
}

async function apiGetOfferById(id) {
  const offers = await apiGetOffers();

  const offer = offers.find(function (item) {
    return String(apiGetOfferId(item)) === String(id);
  });

  return offer ? apiClone(offer) : null;
}

async function apiGetMyOffers() {
  const currentUser = await apiGetCurrentUser();

  if (!currentUser) {
    return [];
  }

  const userEmail = apiNormalizeEmail(
    currentUser.email ||
    currentUser.userEmail ||
    currentUser.mail ||
    ""
  );

  const userId = apiGetUserId(currentUser);
  const offers = await apiGetOffers();

  return offers.filter(function (offer) {
    const ownerEmail = apiNormalizeEmail(
      offer.ownerEmail ||
      offer.userEmail ||
      offer.email ||
      ""
    );

    const ownerId =
      offer.ownerId ||
      offer.userId ||
      "";

    return (
      ownerEmail === userEmail ||
      String(ownerId) === String(userId)
    );
  });
}

async function apiCreateOffer(offerData) {
  if (!offerData) {
    throw new Error("Chýbajú údaje ponuky.");
  }

  const currentUser = await apiGetCurrentUser();

  if (!currentUser) {
    throw new Error("Používateľ nie je prihlásený.");
  }

  const offers = await apiGetOffers();
  const now = apiNow();

  const newOffer = {
    ...offerData,
    id: offerData.id || apiCreateId("offer"),
    ownerId: offerData.ownerId || apiGetUserId(currentUser),
    createdAt: offerData.createdAt || now,
    updatedAt: now
  };

  

  return apiClone(newOffer);
}

async function apiUpdateOffer(id, offerData) {
  const offers = await apiGetOffers();

  const index = offers.findIndex(function (offer) {
    return String(apiGetOfferId(offer)) === String(id);
  });

  if (index < 0) {
    throw new Error("Ponuka nebola nájdená.");
  }

  const updatedOffer = {
    ...offers[index],
    ...offerData,
    id: offers[index].id || id,
    updatedAt: apiNow()
  };

  

  return apiClone(updatedOffer);
}

async function apiDeleteOffer(id) {
  const offers = await apiGetOffers();

  const filteredOffers = offers.filter(function (offer) {
    return String(apiGetOfferId(offer)) !== String(id);
  });

  if (filteredOffers.length === offers.length) {
    throw new Error("Ponuka nebola nájdená.");
  }

  

  return true;
}

/* =========================
   Rezervácie
========================= */

async function apiGetReservations() {
  const supabaseClient = apiGetSupabaseClient();

  if (!supabaseClient) {
    return [];
  }

  const { data, error } = await supabaseClient
    .from("reservations")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.warn("Rezervace se nepodařilo načíst:", error);
    return [];
  }
return Array.isArray(data) ? data.map(apiNormalizeReservation) : [];
}
async function apiGetReservationById(id) {
  const reservations = await apiGetReservations();

  const reservation = reservations.find(function (item) {
    return String(apiGetReservationId(item)) === String(id);
  });

  return reservation ? apiClone(reservation) : null;
}

async function apiGetMyReservations() {
  const currentUser = await apiGetCurrentUser();

  if (!currentUser) {
    return [];
  }

  const userEmail = apiNormalizeEmail(
    currentUser.email ||
    currentUser.userEmail ||
    currentUser.mail ||
    ""
  );

  const userId = apiGetUserId(currentUser);
  const reservations = await apiGetReservations();

  return reservations.filter(function (reservation) {
    const renterEmail = apiNormalizeEmail(
      reservation.renterEmail ||
      reservation.userEmail ||
      reservation.borrowerEmail ||
      ""
    );

    const renterId =
      reservation.renterId ||
      reservation.userId ||
      reservation.borrowerId ||
      "";

    return (
      renterEmail === userEmail ||
      String(renterId) === String(userId)
    );
  });
}

async function apiGetOwnerReservations() {
  const currentUser = await apiGetCurrentUser();

  if (!currentUser) {
    return [];
  }

  const userEmail = apiNormalizeEmail(
    currentUser.email ||
    currentUser.userEmail ||
    currentUser.mail ||
    ""
  );

  const userId = apiGetUserId(currentUser);
  const reservations = await apiGetReservations();

  return reservations.filter(function (reservation) {
    const ownerEmail = apiNormalizeEmail(
      reservation.ownerEmail ||
      ""
    );

    const ownerId =
      reservation.ownerId ||
      "";

    return (
      ownerEmail === userEmail ||
      String(ownerId) === String(userId)
    );
  });
}

async function apiCreateReservation(reservationData) {
  if (!reservationData) {
    throw new Error("Chýbajú údaje rezervácie.");
  }

  const currentUser = await apiGetCurrentUser();

  if (!currentUser) {
    throw new Error("Používateľ nie je prihlásený.");
  }

  const reservations = await apiGetReservations();
  const now = apiNow();

  const newReservation = {
    ...reservationData,
    id: reservationData.id || apiCreateId("reservation"),
    renterId: reservationData.renterId || apiGetUserId(currentUser),
    status: reservationData.status || "pending",
    createdAt: reservationData.createdAt || now,
    updatedAt: now
  };

  reservations.push(newReservation);

  

  return apiClone(newReservation);
}

async function apiUpdateReservationStatus(id, status) {
  const reservations = await apiGetReservations();

  const index = reservations.findIndex(function (reservation) {
    return String(apiGetReservationId(reservation)) === String(id);
  });

  if (index < 0) {
    throw new Error("Rezervácia nebola nájdená.");
  }

  const updatedReservation = {
    ...reservations[index],
    status: status,
    updatedAt: apiNow()
  };

  reservations[index] = updatedReservation;

  

  return apiClone(updatedReservation);
}

/* =========================
   Notifikácie
========================= */

async function apiGetNotifications() {
  const supabaseClient = apiGetSupabaseClient();

  if (!supabaseClient) {
    return [];
  }

  const { data, error } = await supabaseClient
    .from("notifications")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.warn("Notifikace se nepodařilo načíst:", error);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

async function apiCreateNotification(notificationData) {
  if (!notificationData) {
    throw new Error("Chybějí údaje notifikácie.");
  }

  const supabaseClient =
  typeof rentuloSupabase !== "undefined" ? rentuloSupabase : null;

  if (!supabaseClient) {
    throw new Error("Supabase klient není dostupný.");
  }

  const now = apiNow();

  const newNotification = {
    ...notificationData,
    id: notificationData.id || apiCreateId("notification"),
    status: notificationData.status || "unread",
    created_at:
      notificationData.created_at ||
      notificationData.createdAt ||
      now
  };

  delete newNotification.createdAt;

  const { data, error } = await supabaseClient
    .from("notifications")
    .insert([newNotification])
    .select("*")
    .single();

  if (error) {
    console.error("Notifikaci se nepodařilo uložit:", error);
    throw error;
  }

  return data;
}