import dayjs from "dayjs";
import { TIME_FORMAT } from "./dateUtils";
import type { CalendarSettings, EventDraft } from "./types";

export const EVENT_COLORS = ["#f04444", "#ff8a3d", "#2f80ed", "#18a058", "#8b5cf6"];

export const emptyDraft = (date: string, settings?: CalendarSettings): EventDraft => {
  const startTime = "09:00";
  const endTime = dayjs(`2026-01-01 ${startTime}`)
    .add(settings?.defaultEventDurationMinutes ?? 60, "minute")
    .format(TIME_FORMAT);

  return {
  title: "",
  date,
  startTime,
  endTime,
  allDay: false,
  note: "",
  color: settings?.defaultEventColor ?? EVENT_COLORS[0]
  };
};
