"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const UTILS_PATH = path.join(PROJECT_ROOT, "js", "utils.js");

function utilsSource() {
  return fs.readFileSync(UTILS_PATH, "utf8");
}

function createSandbox(options = {}) {
  let directGetUserCalls = 0;
  let navigationGetUserCalls = 0;

  const navigationUser = { id: "navigation-user" };
  const fallbackUser = { id: "fallback-user" };

  const sandbox = {
    window: {
      rentuloSupabase: {
        auth: {
          async getUser() {
            directGetUserCalls += 1;
            return {
              data: { user: fallbackUser },
              error: null
            };
          }
        }
      }
    },
    console
  };

  sandbox.window.window = sandbox.window;

  if (options.withNavigation !== false) {
    sandbox.navGetVerifiedUser = async function () {
      navigationGetUserCalls += 1;
      return navigationUser;
    };
  }

  vm.createContext(sandbox);
  vm.runInContext(utilsSource(), sandbox);

  return {
    sandbox,
    navigationUser,
    fallbackUser,
    getDirectGetUserCalls: () => directGetUserCalls,
    getNavigationGetUserCalls: () => navigationGetUserCalls
  };
}

test("current user helper reuses shared navigation verification", async () => {
  const state = createSandbox();

  const user = await state.sandbox.getCurrentSupabaseUser();

  assert.equal(user.id, state.navigationUser.id);
  assert.equal(state.getNavigationGetUserCalls(), 1);
  assert.equal(
    state.getDirectGetUserCalls(),
    0,
    "utils must not send a second auth.getUser request when navigation already verifies the user"
  );
});

test("current user helper keeps direct Supabase verification as a fallback", async () => {
  const state = createSandbox({ withNavigation: false });

  const user = await state.sandbox.getCurrentSupabaseUser();

  assert.equal(user.id, state.fallbackUser.id);
  assert.equal(state.getNavigationGetUserCalls(), 0);
  assert.equal(
    state.getDirectGetUserCalls(),
    1,
    "direct auth.getUser fallback must remain available without shared navigation"
  );
});
