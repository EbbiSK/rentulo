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


function apiClone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return value;
  }
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