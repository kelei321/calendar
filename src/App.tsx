import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import dayjs from "dayjs";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, Trash2, X } from "lucide-react";
import { deleteEvent, getAllEvents, saveEvent } from "./calendarStore";
import {
  DATE_FORMAT,
  TIME_FORMAT,
  WEEK_DAYS,
  formatDayTitle,
  formatMonthTitle,
  getMonthGrid,
  getWeekDays,
  isSameMonth,
  isToday,
  toDateKey,
  today
} from "./dateUtils";
import {
  getCalendarDayMeta,
  getDayLabels,
  type DayLabel,
  type WorkdayMarker
} from "./holidays";
import type { CalendarEvent, CalendarView, EventDraft } from "./types";

const EVENT_COLORS = ["#f04444", "#ff8a3d", "#2f80ed", "#18a058", "#8b5cf6"];

const emptyDraft = (date: string): EventDraft => ({
  title: "",
  date,
  startTime: "09:00",
  endTime: "10:00",
  allDay: false,
  note: "",
  color: EVENT_COLORS[0]
});

function useSwipe(onSwipe: (direction: "left" | "right" | "up" | "down") => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    start.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (!start.current) return;
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    start.current = null;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) < 46) return;
    if (absX > absY) onSwipe(dx > 0 ? "right" : "left");
    else onSwipe(dy > 0 ? "down" : "up");
  };

  const onPointerCancel = () => {
    start.current = null;
  };

  return { onPointerDown, onPointerUp, onPointerCancel };
}

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
  const monthDays = useMemo(() => getMonthGrid(activeDate), [activeDate]);
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
            days={monthDays}
            eventsByDate={eventsByDate}
            onSelect={setActiveDate}
            onCreate={openCreate}
            onSwipe={(direction) => {
              if (direction === "up") changePeriod(1);
              if (direction === "down") changePeriod(-1);
            }}
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

interface MonthViewProps {
  activeDate: string;
  days: dayjs.Dayjs[];
  eventsByDate: Record<string, CalendarEvent[]>;
  onSelect: (date: string) => void;
  onCreate: (date: string) => void;
  onSwipe: (direction: "left" | "right" | "up" | "down") => void;
}

function MonthView({ activeDate, days, eventsByDate, onSelect, onCreate, onSwipe }: MonthViewProps) {
  const swipe = useSwipe(onSwipe);

  return (
    <section className="month-view swipe-vertical" aria-label="月视图" {...swipe}>
      <div className="weekday-row">
        {WEEK_DAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="month-grid">
        {days.map((date) => {
          const dateKey = toDateKey(date);
          const count = eventsByDate[dateKey]?.length ?? 0;
          const selected = dateKey === activeDate;
          const meta = getCalendarDayMeta(dateKey);
          return (
            <button
              className={["day-cell", selected ? "selected" : "", isToday(date) ? "today" : "", isSameMonth(date, activeDate) ? "" : "muted", meta.labels.length ? "has-label" : ""].join(" ")}
              key={dateKey}
              type="button"
              onClick={() => onSelect(dateKey)}
              onDoubleClick={() => onCreate(dateKey)}
            >
              {meta.workdayMarker && <WorkdayBadge marker={meta.workdayMarker} />}
              <span className="day-number">{date.date()}</span>
              <RotatingDayText items={meta.rotatingTexts} fallback={meta.primaryText} fallbackOnly={meta.labels.length === 0} />
              {count > 0 && <span className="event-dot" aria-label={`${count} 个日程`} />}
            </button>
          );
        })}
      </div>
      <p className="swipe-tip">上下滑动切换月份</p>
    </section>
  );
}

interface WeekViewProps {
  activeDate: string;
  days: dayjs.Dayjs[];
  eventsByDate: Record<string, CalendarEvent[]>;
  onSelect: (date: string) => void;
  onSwipe: (direction: "left" | "right" | "up" | "down") => void;
}

function WeekView({ activeDate, days, eventsByDate, onSelect, onSwipe }: WeekViewProps) {
  const swipe = useSwipe(onSwipe);

  return (
    <section className="week-strip swipe-horizontal" aria-label="周视图" {...swipe}>
      {days.map((date) => {
        const dateKey = toDateKey(date);
        const count = eventsByDate[dateKey]?.length ?? 0;
        const meta = getCalendarDayMeta(dateKey);
        return (
          <button className={["week-day", dateKey === activeDate ? "selected" : "", isToday(date) ? "today" : ""].join(" ")} key={dateKey} type="button" onClick={() => onSelect(dateKey)}>
            {meta.workdayMarker && <WorkdayBadge marker={meta.workdayMarker} />}
            <span>{date.format("dd")}</span>
            <strong>{date.date()}</strong>
            <RotatingDayText items={meta.rotatingTexts} fallback={meta.primaryText} compact fallbackOnly={meta.labels.length === 0} />
            {count > 0 && <i>{count}</i>}
          </button>
        );
      })}
    </section>
  );
}

function DaySummary({ activeDate, events, labels, workdayMarker }: { activeDate: string; events: CalendarEvent[]; labels: DayLabel[]; workdayMarker: WorkdayMarker | null }) {
  return (
    <section className="day-summary" aria-label="日视图">
      <div>
        <span>{dayjs(activeDate).format("dddd")}</span>
        <strong>{dayjs(activeDate).format("D")}</strong>
      </div>
      <section>
        <p>{events.length > 0 ? `今天有 ${events.length} 个日程` : "今天还没有日程"}</p>
        <LabelChips labels={labels} workdayMarker={workdayMarker} />
      </section>
    </section>
  );
}

interface AgendaProps {
  date: string;
  labels: DayLabel[];
  workdayMarker: WorkdayMarker | null;
  events: CalendarEvent[];
  onEdit: (event: CalendarEvent) => void;
  onCreate: () => void;
}

function Agenda({ date, labels, workdayMarker, events, onEdit, onCreate }: AgendaProps) {
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

function WorkdayBadge({ marker }: { marker: WorkdayMarker }) {
  return <span className={`workday-marker ${marker.type}`} aria-label={marker.reason}>{marker.text}</span>;
}

function RotatingDayText({ items, fallback, compact = false, fallbackOnly = false }: { items: DayLabel[]; fallback: string; compact?: boolean; fallbackOnly?: boolean }) {
  const displayItems = items.filter((item) => item.name);
  const rotationKey = displayItems.map((item) => `${item.type}:${item.name}`).join("|");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
    if (displayItems.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % displayItems.length);
    }, 2400);

    return () => window.clearInterval(timer);
  }, [displayItems.length, rotationKey]);

  if (displayItems.length === 0) {
    return <span className={compact ? "week-lunar" : "day-lunar"}>{fallback}</span>;
  }

  const activeItem = displayItems[activeIndex % displayItems.length];
  return (
    <span
      className={["rotating-day-text", compact ? "compact" : "", fallbackOnly ? "fallback-only" : "has-festival", displayItems.length > 1 ? "switching" : ""].join(" ")}
      style={{ "--item-count": displayItems.length } as CSSProperties}
    >
      <span className={activeItem.type} key={`${activeItem.type}-${activeItem.name}`}>
        {activeItem.name}
      </span>
    </span>
  );
}

function LabelChips({ labels, workdayMarker }: { labels: DayLabel[]; workdayMarker: WorkdayMarker | null }) {
  if (labels.length === 0 && !workdayMarker) return null;
  return (
    <div className="label-chips" aria-label="节日与纪念日">
      {workdayMarker && <span className={workdayMarker.type}>{workdayMarker.text} {workdayMarker.reason}</span>}
      {labels.map((label) => (
        <span className={label.type} key={`${label.type}-${label.name}`}>{label.name}</span>
      ))}
    </div>
  );
}

interface EventEditorProps {
  draft: EventDraft;
  editing: boolean;
  error: string;
  onClose: () => void;
  onDelete: () => void;
  onSubmit: () => void;
  onUpdate: <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => void;
}

function EventEditor({ draft, editing, error, onClose, onDelete, onSubmit, onUpdate }: EventEditorProps) {
  return (
    <div className="sheet-backdrop" role="presentation">
      <section className="event-sheet" role="dialog" aria-modal="true" aria-label={editing ? "编辑日程" : "新增日程"}>
        <header className="sheet-header">
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
          <strong>{editing ? "编辑日程" : "新增日程"}</strong>
          <button className="save-button" type="button" onClick={onSubmit}>完成</button>
        </header>

        <label className="field">
          <span>标题</span>
          <input value={draft.title} onChange={(event) => onUpdate("title", event.target.value)} placeholder="添加标题" />
        </label>

        <label className="field">
          <span>日期</span>
          <input type="date" value={draft.date} onChange={(event) => onUpdate("date", event.target.value)} />
        </label>

        <label className="toggle-field">
          <span>全天</span>
          <input type="checkbox" checked={draft.allDay} onChange={(event) => onUpdate("allDay", event.target.checked)} />
        </label>

        {!draft.allDay && (
          <div className="time-row">
            <label className="field">
              <span>开始</span>
              <input type="time" value={draft.startTime} onChange={(event) => onUpdate("startTime", event.target.value || dayjs().format(TIME_FORMAT))} />
            </label>
            <label className="field">
              <span>结束</span>
              <input type="time" value={draft.endTime} onChange={(event) => onUpdate("endTime", event.target.value || dayjs().add(1, "hour").format(TIME_FORMAT))} />
            </label>
          </div>
        )}

        <label className="field">
          <span>备注</span>
          <textarea value={draft.note} onChange={(event) => onUpdate("note", event.target.value)} placeholder="添加备注" />
        </label>

        <div className="color-row" aria-label="颜色">
          {EVENT_COLORS.map((color) => (
            <button className={draft.color === color ? "selected" : ""} key={color} type="button" style={{ background: color }} onClick={() => onUpdate("color", color)} aria-label={`选择颜色 ${color}`} />
          ))}
        </div>

        {error && <p className="form-error">{error}</p>}

        {editing && (
          <button className="delete-button" type="button" onClick={onDelete}>
            <Trash2 size={17} />
            删除日程
          </button>
        )}

        <div className="sheet-hint">
          <Clock3 size={15} />
          <span>日程仅保存在本机，离线也可访问。</span>
        </div>
      </section>
    </div>
  );
}

