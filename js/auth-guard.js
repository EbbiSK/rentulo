(function () {
  let verifiedUserPromise = null;

  function getSupabaseClient() {
    if (window.rentuloSupabase) {
      return window.rentuloSupabase;
    }

    if (typeof rentuloSupabase !== "undefined") {
      return rentuloSupabase;
    }

    return null;
  }

  function clearLegacyAuthState() {
    try {
      localStorage.removeItem("rentuloUser");
      localStorage.removeItem("rentuloLoggedIn");
    } catch (error) {
      // Legacy cleanup must never interrupt a valid Supabase session.
    }
  }

  function redirectToLogin() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const returnTo = currentPage + window.location.search + window.location.hash;

    window.location.replace(
      "prihlaseni.html?returnTo=" + encodeURIComponent(returnTo)
    );
  }

  async function verifySupabaseUser() {
    const supabaseClient = getSupabaseClient();

    if (!supabaseClient || !supabaseClient.auth) {
      clearLegacyAuthState();
      redirectToLogin();
      return null;
    }

    try {
      if (typeof navGetVerifiedUser === "function") {
        const user = await navGetVerifiedUser();

        if (!user) {
          clearLegacyAuthState();
          redirectToLogin();
          return null;
        }

        clearLegacyAuthState();
        return user;
      }

      const { data, error } = await supabaseClient.auth.getUser();
      const user = data && data.user ? data.user : null;

      if (error || !user) {
        clearLegacyAuthState();
        redirectToLogin();
        return null;
      }

      clearLegacyAuthState();
      return user;
    } catch (error) {
      console.error("Ověření přihlášení se nezdařilo:", error);
      clearLegacyAuthState();
      redirectToLogin();
      return null;
    }
  }

  function requireUser() {
    if (!verifiedUserPromise) {
      verifiedUserPromise = verifySupabaseUser();
    }

    return verifiedUserPromise;
  }

  window.rentuloAuthGuard = {
    requireUser: requireUser,
    clearLegacyAuthState: clearLegacyAuthState
  };
})();
