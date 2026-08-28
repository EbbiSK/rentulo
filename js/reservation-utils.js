"use strict";

function getStars(rating) {
  const count = Math.max(0, Math.min(5, Number(rating) || 0));
  let stars = "";

  for (let index = 1; index <= 5; index += 1) {
    stars += index <= count ? "★" : "☆";
  }

  return stars;
}
