import { EVENT_COLORS } from "./eventDefaults";
import type { CalendarSettings, FestivalVisibility } from "./types";

type CalendarSettingsInput = Partial<Omit<CalendarSettings, "festivalVisibility">> & {
  festivalVisibility?: Partial<FestivalVisibility>;
};

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  id: "default",
  defaultView: "month",
  defaultEventDurationMinutes: 60,
  defaultEventColor: EVENT_COLORS[0],
  weekStartsOn: 1,
  showWeekNumbers: false,
  fontSize: "standard",
  festivalVisibility: {
    solar: true,
    lunar: true,
    term: true,
    memorial: true,
    workday: true
  },
  updatedAt: new Date(0).toISOString()
};

export function normalizeSettings(settings?: CalendarSettingsInput): CalendarSettings {
  const defaultView = settings?.defaultView;
  const defaultDuration = settings?.defaultEventDurationMinutes;
  const fontSize = settings?.fontSize;
  const festivalVisibility = settings?.festivalVisibility;

  return {
    ...DEFAULT_CALENDAR_SETTINGS,
    ...settings,
    id: "default",
    defaultView: ["month", "week", "day"].includes(defaultView ?? "")
      ? defaultView ?? DEFAULT_CALENDAR_SETTINGS.defaultView
      : DEFAULT_CALENDAR_SETTINGS.defaultView,
    defaultEventDurationMinutes: [30, 60, 90, 120].includes(defaultDuration ?? 0)
      ? defaultDuration ?? DEFAULT_CALENDAR_SETTINGS.defaultEventDurationMinutes
      : DEFAULT_CALENDAR_SETTINGS.defaultEventDurationMinutes,
    festivalVisibility: {
      solar: normalizeBoolean(festivalVisibility?.solar, DEFAULT_CALENDAR_SETTINGS.festivalVisibility.solar),
      lunar: normalizeBoolean(festivalVisibility?.lunar, DEFAULT_CALENDAR_SETTINGS.festivalVisibility.lunar),
      term: normalizeBoolean(festivalVisibility?.term, DEFAULT_CALENDAR_SETTINGS.festivalVisibility.term),
      memorial: normalizeBoolean(festivalVisibility?.memorial, DEFAULT_CALENDAR_SETTINGS.festivalVisibility.memorial),
      workday: normalizeBoolean(festivalVisibility?.workday, DEFAULT_CALENDAR_SETTINGS.festivalVisibility.workday)
    },
    defaultEventColor: EVENT_COLORS.includes(settings?.defaultEventColor ?? "")
      ? settings?.defaultEventColor ?? DEFAULT_CALENDAR_SETTINGS.defaultEventColor
      : DEFAULT_CALENDAR_SETTINGS.defaultEventColor,
    weekStartsOn: settings?.weekStartsOn === 0 ? 0 : 1,
    showWeekNumbers:
      typeof settings?.showWeekNumbers === "boolean"
        ? settings.showWeekNumbers
        : DEFAULT_CALENDAR_SETTINGS.showWeekNumbers,
    fontSize: ["small", "standard", "large"].includes(fontSize ?? "")
      ? fontSize ?? DEFAULT_CALENDAR_SETTINGS.fontSize
      : DEFAULT_CALENDAR_SETTINGS.fontSize
  };
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}
