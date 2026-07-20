document.addEventListener("DOMContentLoaded", async function () {
  const currentUser = await apiGetCurrentUser();

  if (!currentUser) {
    window.location.href = "prihlaseni.html";
    return;
  }

  const reservations = await apiGetReservations();
  const currentUserId = String(currentUser.id);

  const finishedStatuses = [
    "returned",
    "cancelled",
    "rejected",
    "declined",
  ];

  const rentalHistory = reservations.filter(function (reservation) {
    return (
      String(reservation.renter_id || reservation.renterId) === currentUserId &&
      finishedStatuses.includes(String(reservation.status).toLowerCase())
    );
  });

  const offerHistory = reservations.filter(function (reservation) {
    return (
      String(reservation.owner_id || reservation.ownerId) === currentUserId &&
      finishedStatuses.includes(String(reservation.status).toLowerCase())
    );
  });

 

  document.getElementById("rentalHistoryList").innerHTML =
    renderHistoryList(rentalHistory);

  document.getElementById("offerHistoryList").innerHTML =
    renderHistoryList(offerHistory);
});

function renderHistoryList(reservations) {
  if (!reservations.length) {
    return '<p class="section-empty-note">Žádné záznamy v historii.</p>';
  }

  return `
    <div class="reservation-card-list history-list">
      ${reservations
        .map(function (reservation) {
          return renderHistoryRow(reservation);
        })
        .join("")}
    </div>
  `;
}

function renderHistoryRow(reservation) {
  const name = reservation.offer_name || "Nabídka";
  const startDate = reservation.date_from || reservation.startDate || "";
  const endDate = reservation.date_to || reservation.endDate || "";
  const price = reservation.total_price || reservation.totalPrice || 0;
  const statusMap = {
  returned: "Vráceno",
  cancelled: "Zrušeno",
  canceled: "Zrušeno",
  rejected: "Odmítnuto",
  declined: "Odmítnuto",
};

const rawStatus = String(reservation.status || "").toLowerCase();
const status = statusMap[rawStatus] || reservation.status || "";

  return `
    <article class="simple-reservation-row">
      <div class="simple-reservation-main">
        <div class="simple-reservation-info">
          <strong>${escapeHtml(name)}</strong>
        </div>
      </div>

      <div class="simple-reservation-date">
        ${escapeHtml(startDate)} – ${escapeHtml(endDate)}
      </div>

      <div class="simple-reservation-price">
        ${escapeHtml(price)} Kč
      </div>

      <div class="simple-reservation-status">
        ${escapeHtml(status)}
      </div>
    </article>
  `;
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