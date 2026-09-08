/*
  Rentulo API / Supabase pomocná vrstva.

  Obsahuje zdieľanú frontendovú funkciu pre odosielanie
  rezervačných e-mailov cez Supabase Edge Function.

  Tento súbor je aktívnou súčasťou aplikácie Rentulo.
*/

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

window.apiSendReservationEmail = apiSendReservationEmail;