import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailEvent =
  | "new_request"
  | "approved"
  | "rejected"
  | "cancelled"
  | "paid"
  | "picked_up"
  | "returned";

const eventStatus: Record<EmailEvent, string> = {
  new_request: "pending",
  approved: "approved",
  rejected: "rejected",
  cancelled: "cancelled",
  paid: "paid",
  picked_up: "picked_up",
  returned: "returned",
};

const templates = {
  cs: {
    new_request: ["Nová žádost o půjčení", "U vaší nabídky čeká nová žádost o půjčení."],
    approved: ["Žádost byla schválena", "Majitel vaši žádost schválil. Rezervaci nyní můžete zaplatit."],
    rejected: ["Žádost byla odmítnuta", "Majitel vaši žádost o půjčení odmítl."],
    cancelled: ["Rezervace byla zrušena", "Rezervace byla zrušena a termín je znovu volný."],
    paid: ["Rezervace byla zaplacena", "Platba byla potvrzena. Kontaktní údaje jsou nyní dostupné účastníkům rezervace."],
    picked_up: ["Věc byla vyzvednuta", "Majitel označil věc jako vyzvednutou."],
    returned: ["Věc byla vrácena", "Půjčení bylo označeno jako dokončené."],
  },
  en: {
    new_request: ["New rental request", "A new rental request is waiting for your listing."],
    approved: ["Request approved", "The owner approved your request. You can now complete the payment."],
    rejected: ["Request rejected", "The owner rejected your rental request."],
    cancelled: ["Reservation cancelled", "The reservation was cancelled and the dates are available again."],
    paid: ["Reservation paid", "Payment was confirmed. Contact details are now available to the reservation participants."],
    picked_up: ["Item picked up", "The owner marked the item as picked up."],
    returned: ["Item returned", "The rental was marked as completed."],
  },
  de: {
    new_request: ["Neue Mietanfrage", "Für Ihr Angebot wartet eine neue Mietanfrage."],
    approved: ["Anfrage bestätigt", "Der Eigentümer hat Ihre Anfrage bestätigt. Sie können jetzt die Zahlung abschließen."],
    rejected: ["Anfrage abgelehnt", "Der Eigentümer hat Ihre Mietanfrage abgelehnt."],
    cancelled: ["Reservierung storniert", "Die Reservierung wurde storniert und der Zeitraum ist wieder verfügbar."],
    paid: ["Reservierung bezahlt", "Die Zahlung wurde bestätigt. Die Kontaktdaten sind jetzt für die Beteiligten sichtbar."],
    picked_up: ["Gegenstand abgeholt", "Der Eigentümer hat den Gegenstand als abgeholt markiert."],
    returned: ["Gegenstand zurückgegeben", "Die Vermietung wurde als abgeschlossen markiert."],
  },
} as const;

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return response({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("EMAIL_FROM");
  const siteUrl = (Deno.env.get("SITE_URL") || "https://rentulo-seven.vercel.app").replace(/\/$/, "");

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey || !emailFrom) {
    return response({ error: "Missing server configuration" }, 500);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const actor = userData.user;

  if (userError || !actor) {
    return response({ error: "Unauthorized" }, 401);
  }

  let payload: { reservation_id?: string; event?: EmailEvent };
  try {
    payload = await req.json();
  } catch {
    return response({ error: "Invalid JSON" }, 400);
  }

  const reservationId = String(payload.reservation_id || "");
  const event = payload.event;

  if (!reservationId || !event || !(event in eventStatus)) {
    return response({ error: "Invalid request" }, 400);
  }

  const { data: reservation, error: reservationError } = await admin
    .from("reservations")
    .select("id, offer_id, owner_id, renter_id, offer_name, start_date, end_date, status")
    .eq("id", reservationId)
    .single();

  if (reservationError || !reservation) {
    return response({ error: "Reservation not found" }, 404);
  }

  if (reservation.status !== eventStatus[event]) {
    return response({ error: "Reservation status does not match the email event" }, 409);
  }

  const actorIsOwner = actor.id === reservation.owner_id;
  const actorIsRenter = actor.id === reservation.renter_id;
  const ownerEvents: EmailEvent[] = ["approved", "rejected", "picked_up", "returned"];
  const renterEvents: EmailEvent[] = ["new_request", "paid", "cancelled"];

  if ((ownerEvents.includes(event) && !actorIsOwner) || (renterEvents.includes(event) && !actorIsRenter)) {
    return response({ error: "User is not allowed to send this email event" }, 403);
  }

  let recipientIds: string[];
  if (event === "new_request" || event === "paid") {
    recipientIds = [reservation.owner_id];
  } else if (event === "cancelled") {
    recipientIds = [actorIsOwner ? reservation.renter_id : reservation.owner_id];
  } else {
    recipientIds = [reservation.renter_id];
  }

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, email, full_name, preferred_language, email_notifications")
    .in("id", recipientIds);

  if (profilesError) {
    return response({ error: "Recipient lookup failed" }, 500);
  }

  const results = [];

  for (const profile of profiles || []) {
    if (!profile.email || profile.email_notifications === false) {
      results.push({ recipient_id: profile.id, status: "skipped" });
      continue;
    }

    const language = profile.preferred_language === "en" || profile.preferred_language === "de"
      ? profile.preferred_language
      : "cs";
    const [subject, intro] = templates[language][event];
    const detailUrl = `${siteUrl}/moje-rezervace.html`;
    const offerName = reservation.offer_name || "Rentulo";
    const dateText = `${reservation.start_date} – ${reservation.end_date}`;

    const { data: logRow, error: logError } = await admin
      .from("reservation_email_deliveries")
      .insert({
        reservation_id: reservation.id,
        event_type: event,
        recipient_id: profile.id,
        recipient_email: profile.email,
        status: "sending",
      })
      .select("id")
      .single();

    if (logError) {
      if (logError.code === "23505") {
        results.push({ recipient_id: profile.id, status: "duplicate" });
        continue;
      }
      return response({ error: "Email delivery log failed" }, 500);
    }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#103f32">
        <h1 style="font-size:24px">${escapeHtml(subject)}</h1>
        <p>${escapeHtml(intro)}</p>
        <p><strong>${escapeHtml(offerName)}</strong><br>${escapeHtml(dateText)}</p>
        <p><a href="${escapeHtml(detailUrl)}" style="display:inline-block;padding:12px 18px;background:#75d94f;color:#103f32;text-decoration:none;border-radius:10px;font-weight:700">Rentulo</a></p>
        <p style="font-size:12px;color:#66736f">Rentulo</p>
      </div>`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [profile.email],
        subject,
        html,
      }),
    });

    const resendBody = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      await admin
        .from("reservation_email_deliveries")
        .update({ status: "failed", error_message: JSON.stringify(resendBody).slice(0, 1000) })
        .eq("id", logRow.id);
      return response({ error: "Email provider rejected the message" }, 502);
    }

    await admin
      .from("reservation_email_deliveries")
      .update({
        status: "sent",
        provider_message_id: resendBody.id || null,
        sent_at: new Date().toISOString(),
      })
      .eq("id", logRow.id);

    results.push({ recipient_id: profile.id, status: "sent" });
  }

  return response({ ok: true, results });
});
