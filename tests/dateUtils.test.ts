import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getCalendarWeekNumber,
  getIsoWeekNumber,
  getMonthGrid,
  getWeekDays,
  isValidMonthDay,
  toDateKey
} from "../src/dateUtils";

describe("calendar week calculations", () => {
  it("builds weeks from the configured start day", () => {
    assert.deepEqual(getWeekDays("2026-01-01", 1).map(toDateKey), [
      "2025-12-29",
      "2025-12-30",
      "2025-12-31",
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04"
    ]);
    assert.equal(getWeekDays("2026-01-01", 0).map(toDateKey)[0], "2025-12-28");
  });

  it("uses the Monday in a Sunday-first row for ISO week numbers", () => {
    assert.equal(getIsoWeekNumber("2025-12-28"), 52);
    assert.equal(getCalendarWeekNumber("2025-12-28", 0), 1);
    assert.equal(getCalendarWeekNumber("2025-12-29", 1), 1);
  });

  it("aligns month grids with the configured week start", () => {
    assert.equal(toDateKey(getMonthGrid("2026-02-15", 1)[0]), "2026-01-26");
    assert.equal(toDateKey(getMonthGrid("2026-02-15", 0)[0]), "2026-02-01");
  });
});

describe("annual Gregorian dates", () => {
  it("accepts leap day and rejects impossible dates", () => {
    assert.equal(isValidMonthDay("02-29"), true);
    assert.equal(isValidMonthDay("02-30"), false);
    assert.equal(isValidMonthDay("2-9"), false);
  });
});
