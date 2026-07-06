const RESERVATION_STATUS_PENDING = "pending";
const RESERVATION_STATUS_APPROVED = "approved";
const RESERVATION_STATUS_PAID = "paid";
const RESERVATION_STATUS_PICKED_UP = "picked_up";
const RESERVATION_STATUS_RETURNED = "returned";
const RESERVATION_STATUS_REJECTED = "rejected";
const RESERVATION_STATUS_CANCELLED = "cancelled";

const LEGACY_RESERVATION_STATUS_PENDING = "Čeká na potvrzení";
const LEGACY_RESERVATION_STATUS_APPROVED = "Čeká na platbu";
const LEGACY_RESERVATION_STATUS_PAID = "Zaplaceno";
const LEGACY_RESERVATION_STATUS_PICKED_UP = "Vyzvednuto";
const LEGACY_RESERVATION_STATUS_RETURNED = "Vráceno";
const LEGACY_RESERVATION_STATUS_REJECTED = "Odmítnuto";
const LEGACY_RESERVATION_STATUS_CANCELLED = "Zrušeno";

const OPEN_RESERVATION_STATUSES = [
  RESERVATION_STATUS_PENDING,
  RESERVATION_STATUS_APPROVED,
  RESERVATION_STATUS_PAID,
  RESERVATION_STATUS_PICKED_UP,
  LEGACY_RESERVATION_STATUS_PENDING,
  LEGACY_RESERVATION_STATUS_APPROVED,
  LEGACY_RESERVATION_STATUS_PAID,
  LEGACY_RESERVATION_STATUS_PICKED_UP
];

const CLOSED_RESERVATION_STATUSES = [
  RESERVATION_STATUS_RETURNED,
  RESERVATION_STATUS_REJECTED,
  RESERVATION_STATUS_CANCELLED,
  LEGACY_RESERVATION_STATUS_RETURNED,
  LEGACY_RESERVATION_STATUS_REJECTED,
  LEGACY_RESERVATION_STATUS_CANCELLED
];

const BLOCKING_RESERVATION_STATUSES = [
  RESERVATION_STATUS_PENDING,
  RESERVATION_STATUS_APPROVED,
  RESERVATION_STATUS_PAID,
  RESERVATION_STATUS_PICKED_UP,
  LEGACY_RESERVATION_STATUS_PENDING,
  LEGACY_RESERVATION_STATUS_APPROVED,
  LEGACY_RESERVATION_STATUS_PAID,
  LEGACY_RESERVATION_STATUS_PICKED_UP
];

function normalizeReservationStatus(status) {
  if (status === LEGACY_RESERVATION_STATUS_PENDING) {
    return RESERVATION_STATUS_PENDING;
  }

  if (status === LEGACY_RESERVATION_STATUS_APPROVED) {
    return RESERVATION_STATUS_APPROVED;
  }

  if (status === LEGACY_RESERVATION_STATUS_PAID) {
    return RESERVATION_STATUS_PAID;
  }

  if (status === LEGACY_RESERVATION_STATUS_PICKED_UP) {
    return RESERVATION_STATUS_PICKED_UP;
  }

  if (status === LEGACY_RESERVATION_STATUS_RETURNED) {
    return RESERVATION_STATUS_RETURNED;
  }

  if (status === LEGACY_RESERVATION_STATUS_REJECTED) {
    return RESERVATION_STATUS_REJECTED;
  }

  if (status === LEGACY_RESERVATION_STATUS_CANCELLED) {
    return RESERVATION_STATUS_CANCELLED;
  }

  return status || RESERVATION_STATUS_PENDING;
}

function getReservationOfferId(reservation) {
  if (!reservation) {
    return "";
  }

  return reservation.toolId || reservation.offerId || reservation.naradiId || "";
}

function getReservationToolName(reservation) {
  if (!reservation) {
    return "nářadí";
  }

  return (
    reservation.toolName ||
    reservation.offerName ||
    reservation.naradiName ||
    "nářadí"
  );
}

function getReservationRenterName(reservation) {
  if (!reservation) {
    return "Zájemce";
  }

  return (
    reservation.renterName ||
    reservation.userName ||
    reservation.borrowerName ||
    "Zájemce"
  );
}

function getReservationRenterEmail(reservation) {
  if (!reservation) {
    return "";
  }

  return (
    reservation.renterEmail ||
    reservation.userEmail ||
    reservation.borrowerEmail ||
    ""
  );
}

function getReservationRenterPhone(reservation) {
  if (!reservation) {
    return "";
  }

  return (
    reservation.renterPhone ||
    reservation.userPhone ||
    reservation.borrowerPhone ||
    ""
  );
}

function getReservationStatus(reservation) {
  if (!reservation) {
    return RESERVATION_STATUS_PENDING;
  }

  return normalizeReservationStatus(reservation.status);
}

function getReservationStatusText(status) {
  const normalizedStatus = normalizeReservationStatus(status);

  if (normalizedStatus === RESERVATION_STATUS_PENDING) {
    return "Čeká na potvrzení";
  }

  if (normalizedStatus === RESERVATION_STATUS_APPROVED) {
    return "Čeká na platbu";
  }

  if (normalizedStatus === RESERVATION_STATUS_PAID) {
    return "Zaplaceno";
  }

  if (normalizedStatus === RESERVATION_STATUS_PICKED_UP) {
    return "Vyzvednuto";
  }

  if (normalizedStatus === RESERVATION_STATUS_RETURNED) {
    return "Vráceno";
  }

  if (normalizedStatus === RESERVATION_STATUS_REJECTED) {
    return "Odmítnuto";
  }

  if (normalizedStatus === RESERVATION_STATUS_CANCELLED) {
    return "Zrušeno";
  }

  return status || "Čeká na potvrzení";
}

function isOpenReservationStatus(status) {
  const normalizedStatus = normalizeReservationStatus(status);

  return OPEN_RESERVATION_STATUSES.includes(status) ||
    OPEN_RESERVATION_STATUSES.includes(normalizedStatus);
}

function isClosedReservationStatus(status) {
  const normalizedStatus = normalizeReservationStatus(status);

  return CLOSED_RESERVATION_STATUSES.includes(status) ||
    CLOSED_RESERVATION_STATUSES.includes(normalizedStatus);
}

function isBlockingReservationStatus(status) {
  const normalizedStatus = normalizeReservationStatus(status);

  return BLOCKING_RESERVATION_STATUSES.includes(status) ||
    BLOCKING_RESERVATION_STATUSES.includes(normalizedStatus);
}

function isPendingReservationStatus(status) {
  return normalizeReservationStatus(status) === RESERVATION_STATUS_PENDING;
}

function isApprovedReservationStatus(status) {
  return normalizeReservationStatus(status) === RESERVATION_STATUS_APPROVED;
}

function isPaidReservationStatus(status) {
  return normalizeReservationStatus(status) === RESERVATION_STATUS_PAID;
}

function isPickedUpReservationStatus(status) {
  return normalizeReservationStatus(status) === RESERVATION_STATUS_PICKED_UP;
}

function isReturnedReservationStatus(status) {
  return normalizeReservationStatus(status) === RESERVATION_STATUS_RETURNED;
}

function isRejectedReservationStatus(status) {
  return normalizeReservationStatus(status) === RESERVATION_STATUS_REJECTED;
}

function isCancelledReservationStatus(status) {
  return normalizeReservationStatus(status) === RESERVATION_STATUS_CANCELLED;
}

function isBlockingReservation(reservation) {
  return isBlockingReservationStatus(getReservationStatus(reservation));
}

function isOpenReservation(reservation) {
  return isOpenReservationStatus(getReservationStatus(reservation));
}

function isClosedReservation(reservation) {
  return isClosedReservationStatus(getReservationStatus(reservation));
}

function getBlockingReservationsForOffer(offerId) {
  const reservations = getReservations();

  return reservations.filter(function (reservation) {
    return (
      String(getReservationOfferId(reservation)) === String(offerId) &&
      isBlockingReservation(reservation)
    );
  });
}

function isOfferCurrentlyReserved(offer) {
  if (!offer) {
    return false;
  }

  const offerId = offer.id || offer.offerId || offer.naradiId;

  return getBlockingReservationsForOffer(offerId).length > 0;
}

function reservationBlocksOfferDelete(reservation) {
  return isBlockingReservation(reservation);
}

function getReservationDateFrom(reservation) {
  if (!reservation) {
    return "";
  }

  return reservation.startDate || reservation.dateFrom || "";
}

function getReservationDateTo(reservation) {
  if (!reservation) {
    return "";
  }

  return reservation.endDate || reservation.dateTo || "";
}

function getReservationTotalPrice(reservation) {
  if (!reservation) {
    return 0;
  }

  return Number(
    reservation.totalPrice ||
    reservation.price ||
    reservation.pricePerDay ||
    0
  );
}

function getReservationPlatformFee(reservation, platformFeePercent) {
  if (!reservation) {
    return 0;
  }

  const totalPrice = getReservationTotalPrice(reservation);
  const percent = Number(platformFeePercent || reservation.platformFeePercent || 10);

  return Number(
    reservation.platformFeeAmount ||
    Math.round(totalPrice * percent / 100)
  );
}

function getReservationOwnerPayout(reservation, platformFeePercent) {
  if (!reservation) {
    return 0;
  }

  const totalPrice = getReservationTotalPrice(reservation);
  const platformFee = getReservationPlatformFee(reservation, platformFeePercent);

  return Number(reservation.ownerPayout || totalPrice - platformFee);
}

function getReservationContactVisible(status) {
  const normalizedStatus = normalizeReservationStatus(status);

  return (
    normalizedStatus === RESERVATION_STATUS_PAID ||
    normalizedStatus === RESERVATION_STATUS_PICKED_UP ||
    normalizedStatus === RESERVATION_STATUS_RETURNED
  );
}

function canReservationShowContact(reservation) {
  return getReservationContactVisible(getReservationStatus(reservation));
}

function canOwnerApproveReservation(reservation) {
  return getReservationStatus(reservation) === RESERVATION_STATUS_PENDING;
}

function canOwnerRejectReservation(reservation) {
  return getReservationStatus(reservation) === RESERVATION_STATUS_PENDING;
}

function canRenterPayReservation(reservation) {
  return getReservationStatus(reservation) === RESERVATION_STATUS_APPROVED;
}

function canRenterCancelReservation(reservation) {
  const status = getReservationStatus(reservation);

  return (
    status === RESERVATION_STATUS_PENDING ||
    status === RESERVATION_STATUS_APPROVED
  );
}

function canOwnerConfirmPickedUpReservation(reservation) {
  return getReservationStatus(reservation) === RESERVATION_STATUS_PAID;
}

function canOwnerConfirmReturnedReservation(reservation) {
  return getReservationStatus(reservation) === RESERVATION_STATUS_PICKED_UP;
}

function canReservationBeEdited(reservation) {
  const status = getReservationStatus(reservation);

  return (
    status === RESERVATION_STATUS_PENDING ||
    status === RESERVATION_STATUS_APPROVED
  );
}

function canReservationBeDeleted(reservation) {
  return isClosedReservation(reservation);
}

function getReservationStatusClass(status) {
  const normalizedStatus = normalizeReservationStatus(status);

  if (normalizedStatus === RESERVATION_STATUS_PENDING) {
    return "status-pending";
  }

  if (normalizedStatus === RESERVATION_STATUS_APPROVED) {
    return "status-approved";
  }

  if (normalizedStatus === RESERVATION_STATUS_PAID) {
    return "status-paid";
  }

  if (normalizedStatus === RESERVATION_STATUS_PICKED_UP) {
    return "status-picked-up";
  }

  if (normalizedStatus === RESERVATION_STATUS_RETURNED) {
    return "status-returned";
  }

  if (normalizedStatus === RESERVATION_STATUS_REJECTED) {
    return "status-rejected";
  }

  if (normalizedStatus === RESERVATION_STATUS_CANCELLED) {
    return "status-cancelled";
  }

  return "status-pending";
}