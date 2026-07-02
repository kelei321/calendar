import { openDB, type DBSchema } from "idb";
import type { CalendarEvent } from "./types";

interface CalendarDB extends DBSchema {
  events: {
    key: string;
    value: CalendarEvent;
    indexes: {
      "by-date": string;
    };
  };
}

const dbPromise = openDB<CalendarDB>("pwa-calendar-db", 1, {
  upgrade(db) {
    const store = db.createObjectStore("events", { keyPath: "id" });
    store.createIndex("by-date", "date");
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
