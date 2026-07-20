document.addEventListener("DOMContentLoaded", async function () {
  const currentUser = await apiGetCurrentUser();

  if (!currentUser) {
    window.location.href = "prihlaseni.html";
    return;
  }

  const reservations = await apiGetReservations();

  console.log("První rezervace:", reservations[0]);
});