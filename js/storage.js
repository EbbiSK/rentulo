function loadJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeStorageEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeStorageText(value) {
  return String(value || "").trim().toLowerCase();
}

function saveCurrentUser(user) {
  // Prihlasenie aj profil overuje Supabase. Stare lokalne kopie profilu
  // uz nie su potrebne a zbytocne by uchovavali osobne udaje v prehliadaci.
  localStorage.removeItem("rentuloUser");
  localStorage.removeItem("rentuloLoggedIn");
}

function clearCurrentUser() {
  localStorage.removeItem("rentuloUser");
  localStorage.removeItem("rentuloLoggedIn");
  localStorage.removeItem("rentuloRememberLogin");

}

// Odstrani aj kopie, ktore mohli zostat po starsich verziach aplikacie.
localStorage.removeItem("rentuloUser");
localStorage.removeItem("rentuloLoggedIn");

function getUserEmail(user) {
  if (!user) {
    return "";
  }

  return user.email || user.userEmail || user.mail || "";
}

function getUserName(user) {
  if (!user) {
    return "Uživatel";
  }

  return (
    user.fullName ||
    user.name ||
    user.jmeno ||
    getUserEmail(user) ||
    "Uživatel"
  );
}

function getUserPhone(user) {
  if (!user) {
    return "";
  }

  return user.phone || user.telefon || user.userPhone || "";
}

/*
  Supabase je teraz hlavný zdroj dát pre:
  - používateľské profily,
  - ponuky,
  - rezervácie,
  - notifikácie.

  Tieto funkcie nechávame kvôli starším stránkam a kompatibilite,
  ale už nevracajú ani neukladajú lokálne kolekcie, aby lokálne dáta
  neprebíjali stav zo Supabase.
*/


















