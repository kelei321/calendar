import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_CALENDAR_SETTINGS, normalizeSettings } from "../src/calendarSettings";

describe("normalizeSettings", () => {
  it("supplies defaults for legacy settings", () => {
    const normalized = normalizeSettings({
      defaultView: "week",
      festivalVisibility: {
        solar: false
      }
    });

    assert.equal(normalized.defaultView, "week");
    assert.equal(normalized.weekStartsOn, 1);
    assert.equal(normalized.showWeekNumbers, false);
    assert.equal(normalized.fontSize, "standard");
    assert.equal(normalized.festivalVisibility.solar, false);
    assert.equal(normalized.festivalVisibility.lunar, true);
  });

  it("replaces invalid persisted values with supported defaults", () => {
    const normalized = normalizeSettings({
      defaultView: "year",
      defaultEventDurationMinutes: 45,
      defaultEventColor: "#000000",
      weekStartsOn: 6,
      showWeekNumbers: "yes",
      fontSize: "huge",
      festivalVisibility: {
        solar: "false",
        lunar: null,
        term: 1,
        memorial: 0,
        workday: "true"
      }
    } as never);

    assert.equal(normalized.defaultView, DEFAULT_CALENDAR_SETTINGS.defaultView);
    assert.equal(normalized.defaultEventDurationMinutes, DEFAULT_CALENDAR_SETTINGS.defaultEventDurationMinutes);
    assert.equal(normalized.defaultEventColor, DEFAULT_CALENDAR_SETTINGS.defaultEventColor);
    assert.equal(normalized.weekStartsOn, DEFAULT_CALENDAR_SETTINGS.weekStartsOn);
    assert.equal(normalized.showWeekNumbers, DEFAULT_CALENDAR_SETTINGS.showWeekNumbers);
    assert.equal(normalized.fontSize, DEFAULT_CALENDAR_SETTINGS.fontSize);
    assert.deepEqual(normalized.festivalVisibility, DEFAULT_CALENDAR_SETTINGS.festivalVisibility);
  });
});
