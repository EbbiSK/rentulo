document.addEventListener("DOMContentLoaded", async function () {
  const currentUser = await apiGetCurrentUser();

  if (!currentUser) {
    window.location.href = "prihlaseni.html";
    return;
  }

  const reservations = await apiGetReservations();
  const currentUserId = String(currentUser.id);
  const finishedStatuses = new Set([
    "returned",
    "completed",
    "cancelled",
    "canceled",
    "rejected",
    "declined",
    "vráceno",
    "dokončeno",
    "zrušeno",
    "odmítnuto"
  ]);

  function isHistorical(reservation) {
    const rawStatus = String(reservation.status || "").trim().toLowerCase();
    const normalizedStatus = typeof normalizeReservationStatus === "function"
      ? String(normalizeReservationStatus(reservation.status || "")).toLowerCase()
      : rawStatus;

    return finishedStatuses.has(rawStatus) || finishedStatuses.has(normalizedStatus);
  }

  function getSortTime(reservation) {
    const value = reservation.updated_at || reservation.updatedAt || reservation.created_at || reservation.createdAt || 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  const rentalHistory = reservations
    .filter(function (reservation) {
      return String(reservation.renter_id || reservation.renterId) === currentUserId && isHistorical(reservation);
    })
    .sort(function (a, b) {
      return getSortTime(b) - getSortTime(a);
    });

  const offerHistory = reservations
    .filter(function (reservation) {
      return String(reservation.owner_id || reservation.ownerId) === currentUserId && isHistorical(reservation);
    })
    .sort(function (a, b) {
      return getSortTime(b) - getSortTime(a);
    });

  document.getElementById("rentalHistoryList").innerHTML = renderHistoryList(
    rentalHistory,
    "Zatím nemáte žádné dokončené, zrušené ani odmítnuté rezervace."
  );

  document.getElementById("offerHistoryList").innerHTML = renderHistoryList(
    offerHistory,
    "Zatím nemáte žádné dokončené, zrušené ani odmítnuté žádosti k vašim nabídkám."
  );
});

function renderHistoryList(reservations, emptyText) {
  if (!reservations.length) {
    return `<p class="section-empty-note">${escapeHtml(emptyText)}</p>`;
  }

  return `
    <div class="reservation-card-list history-list">
      ${reservations.map(renderHistoryRow).join("")}
    </div>
  `;
}

function renderHistoryRow(reservation) {
  const name = reservation.offer_name || reservation.offerName || "Nabídka";
  const startDate = reservation.date_from || reservation.start_date || reservation.startDate || "";
  const endDate = reservation.date_to || reservation.end_date || reservation.endDate || "";
  const price = Number(reservation.total_price || reservation.totalPrice || 0);
  const statusMap = {
    returned: "Vráceno",
    completed: "Dokončeno",
    cancelled: "Zrušeno",
    canceled: "Zrušeno",
    rejected: "Odmítnuto",
    declined: "Odmítnuto"
  };
  const rawStatus = String(reservation.status || "").trim();
  const normalizedStatus = typeof normalizeReservationStatus === "function"
    ? normalizeReservationStatus(rawStatus)
    : rawStatus.toLowerCase();
  const status = statusMap[String(normalizedStatus).toLowerCase()] ||
    (typeof getReservationStatusText === "function" ? getReservationStatusText(normalizedStatus) : rawStatus);

  return `
    <article class="simple-reservation-row">
      <div class="simple-reservation-main">
        <div class="simple-reservation-info">
          <strong>${escapeHtml(name)}</strong>
        </div>
      </div>
      <div class="simple-reservation-date">
        ${escapeHtml(formatHistoryDate(startDate))} – ${escapeHtml(formatHistoryDate(endDate))}
      </div>
      <div class="simple-reservation-price">${escapeHtml(price)} Kč</div>
      <div class="simple-reservation-status">${escapeHtml(status)}</div>
    </article>
  `;
}

function formatHistoryDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("cs-CZ");
}

const historyButtons = document.querySelectorAll(".history-switch-button");
const rentalHistorySection = document.getElementById("rentalHistorySection");
const offerHistorySection = document.getElementById("offerHistorySection");

historyButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const selectedView = button.dataset.historyView;
    historyButtons.forEach(function (item) {
      item.classList.remove("active");
    });
    button.classList.add("active");
    rentalHistorySection.hidden = selectedView !== "rentals";
    offerHistorySection.hidden = selectedView !== "offers";
  });
});
