export type CalendarView = "month" | "week" | "day";
export type FestivalLabelType = "solar" | "lunar" | "term" | "memorial" | "custom";

export interface FestivalVisibility {
  solar: boolean;
  lunar: boolean;
  term: boolean;
  memorial: boolean;
  workday: boolean;
}

export interface CalendarSettings {
  id: "default";
  defaultView: CalendarView;
  defaultEventDurationMinutes: 30 | 60 | 90 | 120;
  defaultEventColor: string;
  festivalVisibility: FestivalVisibility;
  updatedAt: string;
}

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

export interface CustomFestival {
  id: string;
  name: string;
  monthDay: string;
  color: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CustomFestivalDraft = Pick<CustomFestival, "name" | "monthDay" | "color" | "enabled">;
