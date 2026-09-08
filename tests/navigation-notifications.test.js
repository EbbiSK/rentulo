"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const NAVIGATION_PATH = path.join(PROJECT_ROOT, "js", "navigation.js");

function navigationSource() {
  return fs.readFileSync(NAVIGATION_PATH, "utf8");
}

function notificationLoaderSource(source) {
  const start = source.indexOf("async function navLoadNotificationCountFromSupabase");
  const end = source.indexOf("\nwindow.refreshRentuloNotificationBadge", start);

  assert.notEqual(start, -1, "notification loader must exist");
  assert.notEqual(end, -1, "notification loader must end before the public refresh helper");

  return source.slice(start, end);
}

test("shared navigation owns its notification data dependency", () => {
  const source = navigationSource();
  const loader = notificationLoaderSource(source);

  assert.match(loader, /navGetSupabaseClient\(\)/, "notification loader must use the shared navigation Supabase client");
  assert.match(loader, /\.rpc\(\s*["']get_my_reservations["']\s*\)/, "notification loader must call get_my_reservations directly");
  assert.doesNotMatch(source, /\bapiGetReservations\b/, "shared navigation must not depend on api.js for notification badges");
});

test("auth transition pages skip account profile and notification loads", () => {
  const source = navigationSource();

  assert.match(
    source,
    /function navShouldLoadAccountData\(page\)[\s\S]*"prihlaseni"[\s\S]*"registrace"[\s\S]*"ucet-vytvoren"/,
    "auth transition pages must be excluded from account data loading"
  );
  assert.match(
    source,
    /const shouldLoadAccountData = navShouldLoadAccountData\(page\)/,
    "shared navigation must evaluate the account-data guard for the active page"
  );
  assert.match(
    source,
    /if \(navVerifiedUser && shouldLoadAccountData\)[\s\S]*navLoadProfileSummary\(navVerifiedUser\)/,
    "profile summary loading must respect the auth-page guard"
  );
  assert.match(
    source,
    /if \(shouldLoadAccountData\)[\s\S]*navLoadNotificationCountFromSupabase\(page\)/,
    "notification loading must respect the auth-page guard"
  );

  const guardedProfileLoads = source.match(
    /if \(navVerifiedUser && shouldLoadAccountData\)/g
  ) || [];

  assert.equal(
    guardedProfileLoads.length,
    2,
    "both initial load and auth-state refresh must guard profile/account requests"
  );
});

