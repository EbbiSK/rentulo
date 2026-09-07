try {
  localStorage.removeItem("rentuloUser");
  localStorage.removeItem("rentuloLoggedIn");
} catch (error) {
  // Browser storage may be unavailable in some modes.
}
