import { openDB, type DBSchema } from "idb";
import { DEFAULT_CALENDAR_SETTINGS, normalizeSettings } from "./calendarSettings";
import type { CalendarEvent, CalendarSettings, CustomFestival } from "./types";

export { DEFAULT_CALENDAR_SETTINGS } from "./calendarSettings";

interface CalendarDB extends DBSchema {
  events: {
    key: string;
    value: CalendarEvent;
    indexes: {
      "by-date": string;
    };
  };
  settings: {
    key: string;
    value: CalendarSettings;
  };
  customFestivals: {
    key: string;
    value: CustomFestival;
    indexes: {
      "by-month-day": string;
    };
  };
}

const SETTINGS_KEY = "default" as const;

const dbPromise = openDB<CalendarDB>("pwa-calendar-db", 2, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("events")) {
      const store = db.createObjectStore("events", { keyPath: "id" });
      store.createIndex("by-date", "date");
    }

    if (!db.objectStoreNames.contains("settings")) {
      db.createObjectStore("settings", { keyPath: "id" });
    }

    if (!db.objectStoreNames.contains("customFestivals")) {
      const store = db.createObjectStore("customFestivals", { keyPath: "id" });
      store.createIndex("by-month-day", "monthDay");
    }
  }
});

export async function getAllEvents() {
  const db = await dbPromise;
  const events = await db.getAll("events");
  return events.sort(compareEvents);
}

export async function getEventsByDate(date: string) {
  const db = await dbPromise;
  const events = await db.getAllFromIndex("events", "by-date", date);
  return events.sort(compareEvents);
}

export async function saveEvent(event: CalendarEvent) {
  const db = await dbPromise;
  await db.put("events", event);
}

export async function deleteEvent(id: string) {
  const db = await dbPromise;
  await db.delete("events", id);
}

export async function getSettings() {
  const db = await dbPromise;
  const settings = await db.get("settings", SETTINGS_KEY);
  return normalizeSettings(settings);
}

export async function saveSettings(settings: CalendarSettings) {
  const db = await dbPromise;
  await db.put("settings", normalizeSettings({ ...settings, updatedAt: new Date().toISOString() }));
}

export async function resetSettings() {
  const settings = { ...DEFAULT_CALENDAR_SETTINGS, updatedAt: new Date().toISOString() };
  const db = await dbPromise;
  await db.put("settings", settings);
  return settings;
}

export async function getAllCustomFestivals() {
  const db = await dbPromise;
  const festivals = await db.getAll("customFestivals");
  return festivals.sort(compareCustomFestivals);
}

export async function saveCustomFestival(festival: CustomFestival) {
  const db = await dbPromise;
  await db.put("customFestivals", festival);
}

export async function deleteCustomFestival(id: string) {
  const db = await dbPromise;
  await db.delete("customFestivals", id);
}

export function compareEvents(a: CalendarEvent, b: CalendarEvent) {
  if (a.allDay !== b.allDay) {
    return a.allDay ? -1 : 1;
  }

  const timeCompare = a.startTime.localeCompare(b.startTime);
  if (timeCompare !== 0) {
    return timeCompare;
  }

  return a.createdAt.localeCompare(b.createdAt);
}

function compareCustomFestivals(a: CustomFestival, b: CustomFestival) {
  const dateCompare = a.monthDay.localeCompare(b.monthDay);
  if (dateCompare !== 0) return dateCompare;
  return a.name.localeCompare(b.name, "zh-CN");
}
