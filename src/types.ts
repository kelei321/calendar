export type CalendarView = "month" | "week" | "day";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  note: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type EventDraft = Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">;
