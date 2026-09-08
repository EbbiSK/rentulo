"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const AUTH_GUARD_PATH = path.join(PROJECT_ROOT, "js", "auth-guard.js");

function authGuardSource() {
  return fs.readFileSync(AUTH_GUARD_PATH, "utf8");
}

function createSandbox(options = {}) {
  let fallbackGetUserCalls = 0;
  let navigationGetUserCalls = 0;
  const removedKeys = [];
  const redirects = [];
  const user = { id: "user-1", email: "user@example.com" };

  const sandbox = {
    window: {
      rentuloSupabase: {
        auth: {
          async getUser() {
            fallbackGetUserCalls += 1;
            return { data: { user }, error: null };
          }
        }
      },
      location: {
        pathname: "/nastaveni.html",
        search: "",
        hash: "",
        replace(url) {
          redirects.push(url);
        }
      }
    },
    localStorage: {
      removeItem(key) {
        if (options.storageThrows) {
          throw new Error("localStorage unavailable");
        }

        removedKeys.push(key);
      }
    },
    console
  };

  sandbox.window.window = sandbox.window;

  if (options.withNavigation !== false) {
    sandbox.navGetVerifiedUser = async function () {
      navigationGetUserCalls += 1;
      return user;
    };
  }

  vm.createContext(sandbox);
  vm.runInContext(authGuardSource(), sandbox);

  return {
    sandbox,
    user,
    removedKeys,
    redirects,
    getFallbackGetUserCalls: () => fallbackGetUserCalls,
    getNavigationGetUserCalls: () => navigationGetUserCalls
  };
}

test("auth guard reuses the shared navigation verification promise", async () => {
  const state = createSandbox();
  const firstPromise = state.sandbox.window.rentuloAuthGuard.requireUser();
  const secondPromise = state.sandbox.window.rentuloAuthGuard.requireUser();

  assert.strictEqual(firstPromise, secondPromise, "requireUser must cache one verification promise");

  const [firstUser, secondUser] = await Promise.all([firstPromise, secondPromise]);

  assert.equal(firstUser.id, state.user.id);
  assert.equal(secondUser.id, state.user.id);
  assert.equal(state.getNavigationGetUserCalls(), 1, "navigation verification must run once");
  assert.equal(state.getFallbackGetUserCalls(), 0, "Supabase fallback must not run when navigation verification exists");
  assert.deepEqual(state.redirects, []);
});

test("auth guard keeps direct Supabase verification as a fallback", async () => {
  const state = createSandbox({ withNavigation: false });

  const user = await state.sandbox.window.rentuloAuthGuard.requireUser();

  assert.equal(user.id, state.user.id);
  assert.equal(state.getNavigationGetUserCalls(), 0);
  assert.equal(state.getFallbackGetUserCalls(), 1, "fallback auth.getUser must still work");
  assert.deepEqual(state.redirects, []);
});

test("successful auth verification preserves the remember-login preference", async () => {
  const state = createSandbox();

  const user = await state.sandbox.window.rentuloAuthGuard.requireUser();

  assert.equal(user.id, state.user.id);
  assert.deepEqual(
    state.removedKeys,
    ["rentuloUser", "rentuloLoggedIn"],
    "legacy cleanup must not remove the active rentuloRememberLogin preference"
  );
});

test("blocked localStorage does not invalidate a verified user", async () => {
  const state = createSandbox({ storageThrows: true });

  const user = await state.sandbox.window.rentuloAuthGuard.requireUser();

  assert.equal(user.id, state.user.id);
  assert.equal(state.getNavigationGetUserCalls(), 1);
  assert.equal(state.getFallbackGetUserCalls(), 0);
  assert.deepEqual(
    state.redirects,
    [],
    "storage cleanup failure must not redirect a valid user to login"
  );
});

test("every HTML page using auth guard loads navigation first", () => {
  const htmlFiles = fs.readdirSync(PROJECT_ROOT)
    .filter((name) => name.endsWith(".html"));

  const guardedPages = [];

  htmlFiles.forEach((name) => {
    const source = fs.readFileSync(path.join(PROJECT_ROOT, name), "utf8");
    const authIndex = source.indexOf('src="js/auth-guard.js"');

    if (authIndex === -1) {
      return;
    }

    guardedPages.push(name);

    const navigationIndex = source.indexOf('src="js/navigation.js"');
    assert.notEqual(
      navigationIndex,
      -1,
      `${name} must load navigation.js when it uses auth-guard.js`
    );
    assert.ok(
      navigationIndex < authIndex,
      `${name} must load navigation.js before auth-guard.js`
    );
  });

  assert.ok(guardedPages.length > 0, "at least one protected HTML page must be checked");
});
