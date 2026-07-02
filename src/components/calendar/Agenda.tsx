import dayjs from "dayjs";
import { CalendarDays, Plus } from "lucide-react";
import type { DayLabel, WorkdayMarker } from "../../holidays";
import type { CalendarEvent } from "../../types";
import { isToday } from "../../dateUtils";
import { LabelChips } from "./CalendarLabels";

interface AgendaProps {
  date: string;
  labels: DayLabel[];
  workdayMarker: WorkdayMarker | null;
  events: CalendarEvent[];
  onEdit: (event: CalendarEvent) => void;
  onCreate: () => void;
}

export function Agenda({ date, labels, workdayMarker, events, onEdit, onCreate }: AgendaProps) {
  return (
    <section className="agenda" aria-label="日程列表">
      <div className="agenda-title">
        <div>
          <span>{dayjs(date).format("M月D日")}</span>
          <strong>{isToday(date) ? "今天" : dayjs(date).format("dddd")}</strong>
        </div>
        <button type="button" onClick={onCreate}>
          <Plus size={16} />
          新建
        </button>
      </div>

      <LabelChips labels={labels} workdayMarker={workdayMarker} />

      {events.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={36} />
          <p>暂无日程</p>
        </div>
      ) : (
        <div className="event-list">
          {events.map((event) => (
            <button className="event-card" key={event.id} type="button" onClick={() => onEdit(event)}>
              <span className="event-color" style={{ background: event.color }} />
              <span className="event-time">{event.allDay ? "全天" : `${event.startTime} - ${event.endTime}`}</span>
              <strong>{event.title}</strong>
              {event.note && <small>{event.note}</small>}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
