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
    ""
  );
}
function apiNormalizeOffer(row) {
  if (!row) {
    return {};
  }

  return {
    ...row,

    id: row.id,
    ownerId: row.ownerId || row.owner_id || "",
    owner_id: row.owner_id || row.ownerId || "",

    name: row.name || row.title || row.nazev || "",
    title: row.title || row.name || row.nazev || "",
    nazev: row.nazev || row.name || row.title || "",

    category: row.category || row.kategorie || "",
    kategorie: row.kategorie || row.category || "",

    description: row.description || row.popis || "",
    popis: row.popis || row.description || "",

    city: row.city || row.mesto || "",
    mesto: row.mesto || row.city || "",

    postalCode: row.postalCode || row.postal_code || row.psc || "",
    postal_code: row.postal_code || row.postalCode || row.psc || "",
    psc: row.psc || row.postal_code || row.postalCode || "",

    price:
      row.price ??
      row.pricePerDay ??
      row.price_per_day ??
      row.cena ??
      0,

    pricePerDay:
      row.pricePerDay ??
      row.price_per_day ??
      row.price ??
      row.cena ??
      0,

    price_per_day:
      row.price_per_day ??
      row.pricePerDay ??
      row.price ??
      row.cena ??
      0,

    cena:
      row.cena ??
      row.price_per_day ??
      row.pricePerDay ??
      row.price ??
      0,

    status: row.status === "active" ? "Aktivní" : row.status,
    supabaseStatus: row.supabaseStatus || row.status || "",

    photoUrl: row.photoUrl || row.photo_url || row.image || "",
    photo_url: row.photo_url || row.photoUrl || row.image || "",
    image: row.image || row.photo_url || row.photoUrl || "",

    createdAt: row.createdAt || row.created_at || "",
    updatedAt: row.updatedAt || row.updated_at || "",

    source: row.source || "supabase"
  };
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
function apiNormalizeReservation(row) {
  if (!row) {
    return {};
  }

  return {
    ...row,

    id: row.id || row.reservationId || "",
    reservationId: row.reservationId || row.id || "",

    offerId: row.offerId || row.offer_id || "",
    offer_id: row.offer_id || row.offerId || "",

    renterId:
      row.renterId ||
      row.renter_id ||
      row.userId ||
      row.borrowerId ||
      "",

    renter_id:
      row.renter_id ||
      row.renterId ||
      row.userId ||
      row.borrowerId ||
      "",

    ownerId: row.ownerId || row.owner_id || "",
    owner_id: row.owner_id || row.ownerId || "",

    renterEmail:
      row.renterEmail ||
      row.renter_email ||
      row.userEmail ||
      row.borrowerEmail ||
      "",

    renter_email:
      row.renter_email ||
      row.renterEmail ||
      row.userEmail ||
      row.borrowerEmail ||
      "",

    ownerEmail:
      row.ownerEmail ||
      row.owner_email ||
      "",

    owner_email:
      row.owner_email ||
      row.ownerEmail ||
      "",

    startDate:
      row.startDate ||
      row.start_date ||
      row.dateFrom ||
      row.from ||
      "",

    start_date:
      row.start_date ||
      row.startDate ||
      row.dateFrom ||
      row.from ||
      "",

    endDate:
      row.endDate ||
      row.end_date ||
      row.dateTo ||
      row.to ||
      "",

    end_date:
      row.end_date ||
      row.endDate ||
      row.dateTo ||
      row.to ||
      "",

    totalPrice:
      row.totalPrice ??
      row.total_price ??
      row.priceTotal ??
      0,

    total_price:
      row.total_price ??
      row.totalPrice ??
      row.priceTotal ??
      0,

    status: row.status || "pending",

    createdAt: row.createdAt || row.created_at || "",
    created_at: row.created_at || row.createdAt || "",

    updatedAt: row.updatedAt || row.updated_at || "",
    updated_at: row.updated_at || row.updatedAt || "",

    source: row.source || "supabase"
  };
}
/* =========================
   Používateľ
========================= */

async function apiGetCurrentUser() {
  const supabaseClient =
    typeof rentuloSupabase !== "undefined" ? rentuloSupabase : null;

  if (!supabaseClient) {
    return null;
  }

  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data || !data.user) {
    if (typeof clearCurrentUser === "function") {
      clearCurrentUser();
    }

    return null;
  }

  return apiClone(data.user);
}


/* =========================
   Ponuky
========================= */

async function apiGetOffers() {
  const supabaseClient = getSupabaseClient();

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


/* =========================
   Rezervácie
========================= */

async function apiGetReservations() {
  const supabaseClient = getSupabaseClient();

  if (!supabaseClient) {
    return [];
  }

  const { data, error } = await supabaseClient
  .rpc("get_my_reservations");

  if (error) {
    console.warn("Rezervace se nepodařilo načíst:", error);
    return [];
  }
return Array.isArray(data) ? data.map(apiNormalizeReservation) : [];
}

/* =========================
   Notifikácie
========================= */




async function apiSendReservationEmail(reservationId, eventType) {
  const supabaseClient = getSupabaseClient();

  if (!supabaseClient || !reservationId || !eventType) {
    return { ok: false, skipped: true };
  }

  try {
    const { data, error } = await supabaseClient.functions.invoke(
      "send-reservation-email",
      {
        body: {
          reservation_id: reservationId,
          event: eventType
        }
      }
    );

    if (error) {
      console.warn("E-mailové upozornění se nepodařilo odeslat:", error);
      return { ok: false, error: error };
    }

    return data || { ok: true };
  } catch (error) {
    console.warn("E-mailové upozornění se nepodařilo odeslat:", error);
    return { ok: false, error: error };
  }
}

window.apiGetReservations = apiGetReservations;
window.apiSendReservationEmail = apiSendReservationEmail;