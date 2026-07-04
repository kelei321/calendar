import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Plus, Settings } from "lucide-react";
import {
  DEFAULT_CALENDAR_SETTINGS,
  deleteCustomFestival,
  deleteEvent,
  getAllCustomFestivals,
  getAllEvents,
  getSettings,
  saveCustomFestival,
  saveEvent,
  saveSettings
} from "./calendarStore";
import { DATE_FORMAT, formatDayTitle, formatMonthTitle, getWeekDays, isToday, today } from "./dateUtils";
import { emptyDraft } from "./eventDefaults";
import { getCalendarDayMeta } from "./holidays";
import { Agenda } from "./components/calendar/Agenda";
import { DaySummary } from "./components/calendar/DaySummary";
import { MonthView } from "./components/calendar/MonthView";
import { WeekView } from "./components/calendar/WeekView";
import { EventEditor } from "./components/EventEditor";
import { SettingsSheet } from "./components/SettingsSheet";
import type { CalendarEvent, CalendarSettings, CalendarView, CustomFestival, CustomFestivalDraft, EventDraft } from "./types";

export default function App() {
  const [activeDate, setActiveDate] = useState(today());
  const [view, setView] = useState<CalendarView>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [settings, setSettings] = useState<CalendarSettings>(DEFAULT_CALENDAR_SETTINGS);
  const [customFestivals, setCustomFestivals] = useState<CustomFestival[]>([]);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [formError, setFormError] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    void loadAppData();
  }, []);

  async function loadAppData() {
    const [storedSettings, storedEvents, storedFestivals] = await Promise.all([
      getSettings(),
      getAllEvents(),
      getAllCustomFestivals()
    ]);
    setSettings(storedSettings);
    setView(storedSettings.defaultView);
    setEvents(storedEvents);
    setCustomFestivals(storedFestivals);
  }

  async function refreshEvents() {
    setEvents(await getAllEvents());
  }

  async function refreshCustomFestivals() {
    setCustomFestivals(await getAllCustomFestivals());
  }

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      acc[event.date] = [...(acc[event.date] ?? []), event];
      return acc;
    }, {});
  }, [events]);

  const calendarMetaOptions = useMemo(
    () => ({
      festivalVisibility: settings.festivalVisibility,
      customFestivals
    }),
    [settings.festivalVisibility, customFestivals]
  );

  const selectedEvents = eventsByDate[activeDate] ?? [];
  const selectedMeta = useMemo(() => getCalendarDayMeta(activeDate, calendarMetaOptions), [activeDate, calendarMetaOptions]);
  const weekDays = useMemo(() => getWeekDays(activeDate, settings.weekStartsOn), [activeDate, settings.weekStartsOn]);

  const changePeriod = (direction: -1 | 1) => {
    const unit = view === "month" ? "month" : view === "week" ? "week" : "day";
    setActiveDate(dayjs(activeDate).add(direction, unit).format(DATE_FORMAT));
  };

  const openCreate = (date = activeDate) => {
    setEditingEvent(null);
    setDraft(emptyDraft(date, settings));
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

  const updateSettings = async (nextSettings: CalendarSettings) => {
    setSettings(nextSettings);
    setView(nextSettings.defaultView);
    await saveSettings(nextSettings);
    setSettings(await getSettings());
  };

  const upsertCustomFestival = async (festivalDraft: CustomFestivalDraft, editingId?: string) => {
    const existing = editingId ? customFestivals.find((festival) => festival.id === editingId) : null;
    const now = new Date().toISOString();
    await saveCustomFestival({
      id: existing?.id ?? crypto.randomUUID(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      ...festivalDraft
    });
    await refreshCustomFestivals();
  };

  const removeCustomFestival = async (id: string) => {
    await deleteCustomFestival(id);
    await refreshCustomFestivals();
  };

  return (
    <main className={`app-shell font-size-${settings.fontSize}`}>
      <section className="calendar-app" aria-label="轻日历">
        <header className="top-bar">
          <button className="icon-button" type="button" onClick={() => changePeriod(-1)} aria-label="上一段时间">
            <ChevronLeft size={22} />
          </button>
          <button className="title-button" type="button" onClick={() => setActiveDate(today())}>
            <span>{view === "day" ? formatDayTitle(activeDate) : formatMonthTitle(activeDate)}</span>
            <small>{isToday(activeDate) ? "今天" : "点击回到今天"}</small>
          </button>
          <div className="top-actions">
            <button className="icon-button" type="button" onClick={() => changePeriod(1)} aria-label="下一段时间">
              <ChevronRight size={22} />
            </button>
            <button className="icon-button" type="button" onClick={() => setShowSettings(true)} aria-label="打开设置">
              <Settings size={21} />
            </button>
          </div>
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
            settings={settings}
            customFestivals={customFestivals}
            onSelect={setActiveDate}
            onCreate={openCreate}
          />
        )}

        {view === "week" && (
          <WeekView
            activeDate={activeDate}
            days={weekDays}
            eventsByDate={eventsByDate}
            settings={settings}
            customFestivals={customFestivals}
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

      {showSettings && (
        <SettingsSheet
          settings={settings}
          customFestivals={customFestivals}
          onClose={() => setShowSettings(false)}
          onSettingsChange={(nextSettings) => void updateSettings(nextSettings)}
          onSaveFestival={(festivalDraft, editingId) => void upsertCustomFestival(festivalDraft, editingId)}
          onDeleteFestival={(id) => void removeCustomFestival(id)}
        />
      )}
    </main>
  );
}
