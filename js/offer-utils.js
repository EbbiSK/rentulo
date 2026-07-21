"use strict";

function getOfferName(offer, fallback = "Věc") {
  const source = offer || {};
  return source.name || source.title || source.nazev || fallback;
}

function getOfferPrice(offer) {
  const source = offer || {};
  const candidates = [
    source.price,
    source.pricePerDay,
    source.price_per_day,
    source.cena
  ];

  for (const value of candidates) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    const normalized = typeof value === "string"
      ? value.replace(/\s/g, "").replace(",", ".").replace(/[^0-9.-]/g, "")
      : value;
    const parsed = Number(normalized);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}
