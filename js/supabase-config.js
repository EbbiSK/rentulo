const SUPABASE_URL = "https://vspposovhdgvbeukoivh.supabase.co/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_1WQZ-gW9198Qu2amXZ-nPg_1dkadBSz";

const RENTULO_REMEMBER_LOGIN_KEY = "rentuloRememberLogin";

function rentuloGetStorage(storageName) {
  try {
    return window[storageName] || null;
  } catch (_error) {
    return null;
  }
}

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
    rentuloReadStorage(
      rentuloGetStorage("localStorage"),
      RENTULO_REMEMBER_LOGIN_KEY
    ) === "true"
  );
}

const rentuloAuthStorage = {
  getItem: function (key) {
    const rememberLogin = rentuloShouldRememberLogin();
    const localStorageRef = rentuloGetStorage("localStorage");
    const sessionStorageRef = rentuloGetStorage("sessionStorage");
    const primaryStorage = rememberLogin
      ? localStorageRef
      : sessionStorageRef;
    const secondaryStorage = rememberLogin
      ? sessionStorageRef
      : localStorageRef;
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
    const localStorageRef = rentuloGetStorage("localStorage");
    const sessionStorageRef = rentuloGetStorage("sessionStorage");
    const targetStorage = rememberLogin
      ? localStorageRef
      : sessionStorageRef;
    const otherStorage = rememberLogin
      ? sessionStorageRef
      : localStorageRef;

    if (rentuloWriteStorage(targetStorage, key, value)) {
      rentuloRemoveStorage(otherStorage, key);
      return;
    }

    rentuloWriteStorage(otherStorage, key, value);
  },

  removeItem: function (key) {
    rentuloRemoveStorage(rentuloGetStorage("localStorage"), key);
    rentuloRemoveStorage(rentuloGetStorage("sessionStorage"), key);
  }
};

const rentuloSupabase =
  window.supabase && typeof window.supabase.createClient === "function"
    ? window.supabase.createClient(
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
      )
    : null;
