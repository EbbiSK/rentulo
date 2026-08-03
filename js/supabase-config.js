const SUPABASE_URL = "https://vspposovhdgvbeukoivh.supabase.co/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_1WQZ-gW9198Qu2amXZ-nPg_1dkadBSz";

const RENTULO_REMEMBER_LOGIN_KEY = "rentuloRememberLogin";

function rentuloReadStorage(storage, key) {
  try {
    return storage ? storage.getItem(key) : null;
  } catch (_error) {
    return null;
  }
}

function rentuloWriteStorage(storage, key, value) {
  try {
    if (!storage) {
      return false;
    }

    storage.setItem(key, value);
    return true;
  } catch (_error) {
    return false;
  }
}

function rentuloRemoveStorage(storage, key) {
  try {
    if (storage) {
      storage.removeItem(key);
    }
  } catch (_error) {
    // The session can still continue in the other available browser storage.
  }
}

function rentuloShouldRememberLogin() {
  return (
    rentuloReadStorage(window.localStorage, RENTULO_REMEMBER_LOGIN_KEY) ===
    "true"
  );
}

const rentuloAuthStorage = {
  getItem: function (key) {
    const rememberLogin = rentuloShouldRememberLogin();
    const primaryStorage = rememberLogin
      ? window.localStorage
      : window.sessionStorage;
    const secondaryStorage = rememberLogin
      ? window.sessionStorage
      : window.localStorage;
    const primaryValue = rentuloReadStorage(primaryStorage, key);

    if (primaryValue !== null) {
      return primaryValue;
    }

    const secondaryValue = rentuloReadStorage(secondaryStorage, key);

    if (
      secondaryValue !== null &&
      rentuloWriteStorage(primaryStorage, key, secondaryValue)
    ) {
      rentuloRemoveStorage(secondaryStorage, key);
    }

    return secondaryValue;
  },

  setItem: function (key, value) {
    const rememberLogin = rentuloShouldRememberLogin();
    const targetStorage = rememberLogin
      ? window.localStorage
      : window.sessionStorage;
    const otherStorage = rememberLogin
      ? window.sessionStorage
      : window.localStorage;

    if (rentuloWriteStorage(targetStorage, key, value)) {
      rentuloRemoveStorage(otherStorage, key);
      return;
    }

    rentuloWriteStorage(otherStorage, key, value);
  },

  removeItem: function (key) {
    rentuloRemoveStorage(window.localStorage, key);
    rentuloRemoveStorage(window.sessionStorage, key);
  }
};

const rentuloSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: rentuloAuthStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
