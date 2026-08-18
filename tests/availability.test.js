"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const PROJECT_ROOT = path.resolve(__dirname, "..");

function loadDetailContext(reservations, rpcError) {
  const calls = [];
  const client = {
    async rpc(name, args) {
      calls.push({ name, args });
      return {
        data: reservations,
        error: rpcError || null
      };
    }
  };

  const context = {
    URL,
    URLSearchParams,
    console: {
      log: console.log,
      error: console.error,
      warn() {}
    },
    document: {
      addEventListener() {},
      getElementById() {
        return null;
      }
    },
    getSupabaseClient() {
      return client;
    }
  };

  context.window = context;
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.join(PROJECT_ROOT, "js/detail-page.js"), "utf8"),
    context,
    { filename: "js/detail-page.js" }
  );

  return { context, calls };
}

async function checkConflict(existingStart, existingEnd, requestedStart, requestedEnd) {
  const { context, calls } = loadDetailContext([
    {
      start_date: existingStart,
      end_date: existingEnd
    }
  ]);

  const result = await context.hasReservationDateConflict(
    "123e4567-e89b-42d3-a456-426614174000",
    requestedStart,
    requestedEnd
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, "get_blocking_reservations");
  assert.equal(
    calls[0].args.p_offer_id,
    "123e4567-e89b-42d3-a456-426614174000"
  );

  return result;
}

test("availability detects full, partial and contained date overlaps", async () => {
  assert.equal(
    await checkConflict("2026-09-10", "2026-09-15", "2026-09-10", "2026-09-15"),
    true
  );
  assert.equal(
    await checkConflict("2026-09-10", "2026-09-15", "2026-09-08", "2026-09-12"),
    true
  );
  assert.equal(
    await checkConflict("2026-09-10", "2026-09-15", "2026-09-12", "2026-09-17"),
    true
  );
  assert.equal(
    await checkConflict("2026-09-10", "2026-09-15", "2026-09-11", "2026-09-13"),
    true
  );
});

test("availability allows adjacent date ranges that only touch at a boundary", async () => {
  assert.equal(
    await checkConflict("2026-09-10", "2026-09-15", "2026-09-08", "2026-09-10"),
    false
  );
  assert.equal(
    await checkConflict("2026-09-10", "2026-09-15", "2026-09-15", "2026-09-18"),
    false
  );
});

test("availability returns false when there are no blocking reservations", async () => {
  const { context } = loadDetailContext([]);

  assert.equal(
    await context.hasReservationDateConflict(
      "123e4567-e89b-42d3-a456-426614174000",
      "2026-09-10",
      "2026-09-12"
    ),
    false
  );
});

test("availability propagates RPC errors instead of treating them as free dates", async () => {
  const expectedError = new Error("availability unavailable");
  const { context } = loadDetailContext([], expectedError);

  await assert.rejects(
    context.hasReservationDateConflict(
      "123e4567-e89b-42d3-a456-426614174000",
      "2026-09-10",
      "2026-09-12"
    ),
    expectedError
  );
});
