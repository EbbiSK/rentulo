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
  localStorage.setItem("rentuloLanguage", "cs");
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


















