import type { EventDraft } from "./types";

export const EVENT_COLORS = ["#f04444", "#ff8a3d", "#2f80ed", "#18a058", "#8b5cf6"];

export const emptyDraft = (date: string): EventDraft => ({
  title: "",
  date,
  startTime: "09:00",
  endTime: "10:00",
  allDay: false,
  note: "",
  color: EVENT_COLORS[0]
});
