const RESERVATION_STATUS_PENDING = "pending";
const RESERVATION_STATUS_APPROVED = "approved";
const RESERVATION_STATUS_PAID = "paid";
const RESERVATION_STATUS_PICKED_UP = "picked_up";
const RESERVATION_STATUS_RETURNED = "returned";
const RESERVATION_STATUS_REJECTED = "rejected";

const LEGACY_RESERVATION_STATUS_PENDING = "Čeká na potvrzení";
const LEGACY_RESERVATION_STATUS_APPROVED = "Čeká na platbu";
const LEGACY_RESERVATION_STATUS_PAID = "Zaplaceno";
const LEGACY_RESERVATION_STATUS_PICKED_UP = "Vyzvednuto";
const LEGACY_RESERVATION_STATUS_RETURNED = "Vráceno";
const LEGACY_RESERVATION_STATUS_REJECTED = "Odmítnuto";
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
  const normalizedStatus = String(status || "").trim();

  const statusMap = {
    [LEGACY_RESERVATION_STATUS_PENDING]: RESERVATION_STATUS_PENDING,
    [LEGACY_RESERVATION_STATUS_APPROVED]: RESERVATION_STATUS_APPROVED,
    [LEGACY_RESERVATION_STATUS_PAID]: RESERVATION_STATUS_PAID,
    [LEGACY_RESERVATION_STATUS_PICKED_UP]: RESERVATION_STATUS_PICKED_UP,
    [LEGACY_RESERVATION_STATUS_RETURNED]: RESERVATION_STATUS_RETURNED,
    [LEGACY_RESERVATION_STATUS_REJECTED]: RESERVATION_STATUS_REJECTED
  };

  return statusMap[normalizedStatus] || normalizedStatus;
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

  if (
    CLOSED_RESERVATION_STATUSES.includes(status) ||
    CLOSED_RESERVATION_STATUSES.includes(normalizedStatus)
  ) {
    return false;
  }

  return BLOCKING_RESERVATION_STATUSES.includes(status) ||
    BLOCKING_RESERVATION_STATUSES.includes(normalizedStatus);
}
