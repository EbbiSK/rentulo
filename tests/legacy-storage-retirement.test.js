"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const RETIRED_STORAGE_PATH = path.join(PROJECT_ROOT, "js", "storage.js");

test("root HTML pages do not load the retired storage script", () => {
  const htmlFiles = fs.readdirSync(PROJECT_ROOT)
    .filter((name) => name.endsWith(".html"));

  assert.ok(htmlFiles.length > 0, "at least one root HTML page must be checked");

  const retiredStorageScriptPattern =
    /<script\b[^>]*\bsrc\s*=\s*["']js\/storage\.js["'][^>]*>\s*<\/script>/i;

  htmlFiles.forEach((name) => {
    const source = fs.readFileSync(path.join(PROJECT_ROOT, name), "utf8");

    assert.doesNotMatch(
      source,
      retiredStorageScriptPattern,
      `${name} must not load retired js/storage.js`
    );
  });
});

test("retired legacy storage script is removed from the project", () => {
  assert.equal(
    fs.existsSync(RETIRED_STORAGE_PATH),
    false,
    "js/storage.js must remain removed after the Supabase auth migration"
  );
});
