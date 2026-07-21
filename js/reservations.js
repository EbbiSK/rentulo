





function getReservationOfferId(reservation) {
  if (!reservation) {
    return "";
  }

  return reservation.offer_id || reservation.offerId || reservation.toolId || "";
}

function getReservationToolName(reservation) {
  if (!reservation) {
    return "věc";
  }

  return (
    reservation.offer_name ||
    reservation.toolName ||
    reservation.offerName ||
    "věc"
  );
}

function getReservationRenterName(reservation) {
  if (!reservation) {
    return "Zájemce";
  }

  return (
    reservation.renter_name ||
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
    reservation.renter_email ||
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
    reservation.renter_phone ||
    reservation.renterPhone ||
    reservation.userPhone ||
    reservation.borrowerPhone ||
    ""
  );
}













/*
  Dostupnosť ponúk sa už nemá počítať z localStorage.

  Aktuálny stav ponuky sa má načítať priamo zo Supabase:
  - vysledky.html používa otvorené rezervácie z tabuľky reservations,
  - detail.html kontroluje otvorenú rezerváciu v tabuľke reservations.

  Tieto staré funkcie nechávame iba kvôli kompatibilite so stránkami,
  ktoré ich ešte môžu volať. Už však nesiahajú do lokálnych rezervácií.
*/

function getBlockingReservationsForOffer() {
  return [];
}

function isOfferCurrentlyReserved(offer) {
  if (!offer) {
    return false;
  }

  if (offer.isReserved === true) {
    return true;
  }

  if (offer.hasOpenReservation === true) {
    return true;
  }

  if (offer.reserved === true) {
    return true;
  }

  return false;
}

function reservationBlocksOfferDelete(reservation) {
  return isBlockingReservation(reservation);
}

function getReservationDateFrom(reservation) {
  if (!reservation) {
    return "";
  }

  return reservation.start_date || reservation.startDate || reservation.dateFrom || "";
}

function getReservationDateTo(reservation) {
  if (!reservation) {
    return "";
  }

  return reservation.end_date || reservation.endDate || reservation.dateTo || "";
}

function getReservationTotalPrice(reservation) {
  if (!reservation) {
    return 0;
  }

  return Number(
    reservation.total_price ||
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
  const percent = Number(
    platformFeePercent ||
    reservation.platform_fee_percent ||
    reservation.platformFeePercent ||
    10
  );

  return Number(
    reservation.platform_fee_amount ||
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

  return Number(reservation.owner_payout || reservation.ownerPayout || totalPrice - platformFee);
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
