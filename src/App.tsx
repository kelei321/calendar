import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { deleteEvent, getAllEvents, saveEvent } from "./calendarStore";
import { DATE_FORMAT, formatDayTitle, formatMonthTitle, getWeekDays, isToday, today } from "./dateUtils";
import { emptyDraft } from "./eventDefaults";
import { getCalendarDayMeta } from "./holidays";
import { Agenda } from "./components/calendar/Agenda";
import { DaySummary } from "./components/calendar/DaySummary";
import { MonthView } from "./components/calendar/MonthView";
import { WeekView } from "./components/calendar/WeekView";
import { EventEditor } from "./components/EventEditor";
import type { CalendarEvent, CalendarView, EventDraft } from "./types";

export default function App() {
  const [activeDate, setActiveDate] = useState(today());
  const [view, setView] = useState<CalendarView>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    void refreshEvents();
  }, []);

  async function refreshEvents() {
    setEvents(await getAllEvents());
  }

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      acc[event.date] = [...(acc[event.date] ?? []), event];
      return acc;
    }, {});
  }, [events]);

  const selectedEvents = eventsByDate[activeDate] ?? [];
  const selectedMeta = useMemo(() => getCalendarDayMeta(activeDate), [activeDate]);
  const weekDays = useMemo(() => getWeekDays(activeDate), [activeDate]);

  const changePeriod = (direction: -1 | 1) => {
    const unit = view === "month" ? "month" : view === "week" ? "week" : "day";
    setActiveDate(dayjs(activeDate).add(direction, unit).format(DATE_FORMAT));
  };

  const openCreate = (date = activeDate) => {
    setEditingEvent(null);
    setDraft(emptyDraft(date));
    setFormError("");
  };

  const openEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setDraft({
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      allDay: event.allDay,
      note: event.note,
      color: event.color
    });
    setFormError("");
  };

  const closeEditor = () => {
    setDraft(null);
    setEditingEvent(null);
    setFormError("");
  };

  const updateDraft = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const submitDraft = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      setFormError("请输入日程标题");
      return;
    }
    if (!draft.allDay && draft.endTime < draft.startTime) {
      setFormError("结束时间不能早于开始时间");
      return;
    }

    const now = new Date().toISOString();
    const event: CalendarEvent = {
      id: editingEvent?.id ?? crypto.randomUUID(),
      createdAt: editingEvent?.createdAt ?? now,
      updatedAt: now,
      ...draft,
      title: draft.title.trim(),
      note: draft.note.trim()
    };

    await saveEvent(event);
    setActiveDate(event.date);
    await refreshEvents();
    closeEditor();
  };

  const removeEvent = async () => {
    if (!editingEvent) return;
    await deleteEvent(editingEvent.id);
    await refreshEvents();
    closeEditor();
  };

  return (
    <main className="app-shell">
      <section className="calendar-app" aria-label="轻日历">
        <header className="top-bar">
          <button className="icon-button" type="button" onClick={() => changePeriod(-1)} aria-label="上一段时间">
            <ChevronLeft size={22} />
          </button>
          <button className="title-button" type="button" onClick={() => setActiveDate(today())}>
            <span>{view === "day" ? formatDayTitle(activeDate) : formatMonthTitle(activeDate)}</span>
            <small>{isToday(activeDate) ? "今天" : "点按回到今天"}</small>
          </button>
          <button className="icon-button" type="button" onClick={() => changePeriod(1)} aria-label="下一段时间">
            <ChevronRight size={22} />
          </button>
        </header>

        <nav className="view-tabs" aria-label="日历视图">
          {[
            ["month", "月"],
            ["week", "周"],
            ["day", "日"]
          ].map(([key, label]) => (
            <button className={view === key ? "active" : ""} key={key} type="button" onClick={() => setView(key as CalendarView)}>
              {label}
            </button>
          ))}
        </nav>

        {view === "month" && (
          <MonthView
            activeDate={activeDate}
            eventsByDate={eventsByDate}
            onSelect={setActiveDate}
            onCreate={openCreate}
          />
        )}

        {view === "week" && (
          <WeekView
            activeDate={activeDate}
            days={weekDays}
            eventsByDate={eventsByDate}
            onSelect={setActiveDate}
            onSwipe={(direction) => {
              if (direction === "left") changePeriod(1);
              if (direction === "right") changePeriod(-1);
            }}
          />
        )}

        {view === "day" && (
          <DaySummary
            activeDate={activeDate}
            events={selectedEvents}
            labels={selectedMeta.labels}
            workdayMarker={selectedMeta.workdayMarker}
          />
        )}

        <Agenda
          date={activeDate}
          labels={selectedMeta.labels}
          workdayMarker={selectedMeta.workdayMarker}
          events={selectedEvents}
          onEdit={openEdit}
          onCreate={() => openCreate(activeDate)}
        />

        <button className="fab" type="button" onClick={() => openCreate(activeDate)} aria-label="新增日程">
          <Plus size={28} />
        </button>
      </section>

      {draft && (
        <EventEditor
          draft={draft}
          editing={Boolean(editingEvent)}
          error={formError}
          onClose={closeEditor}
          onDelete={removeEvent}
          onSubmit={submitDraft}
          onUpdate={updateDraft}
        />
      )}
    </main>
  );
}
