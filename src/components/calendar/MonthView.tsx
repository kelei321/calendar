import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import dayjs from "dayjs";
import {
  DATE_FORMAT,
  WEEK_DAYS,
  getMonthGrid,
  isSameMonth,
  isToday,
  toDateKey
} from "../../dateUtils";
import { getCalendarDayMeta } from "../../holidays";
import type { CalendarEvent } from "../../types";
import { RotatingDayText, WorkdayBadge } from "./CalendarLabels";

interface MonthViewProps {
  activeDate: string;
  eventsByDate: Record<string, CalendarEvent[]>;
  onSelect: (date: string) => void;
  onCreate: (date: string) => void;
}

export function MonthView({ activeDate, eventsByDate, onSelect, onCreate }: MonthViewProps) {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const didDragRef = useRef(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [targetOffset, setTargetOffset] = useState(0);
  const [pendingDirection, setPendingDirection] = useState<-1 | 0 | 1>(0);
  const [pageHeight, setPageHeight] = useState(288);

  const monthAnchors = useMemo(
    () => [
      dayjs(activeDate).subtract(1, "month").format(DATE_FORMAT),
      activeDate,
      dayjs(activeDate).add(1, "month").format(DATE_FORMAT)
    ],
    [activeDate]
  );

  useEffect(() => {
    setDragY(0);
    setTargetOffset(0);
    setPendingDirection(0);
    setIsDragging(false);
    setIsAnimating(false);
    didDragRef.current = false;
  }, [activeDate]);

  useEffect(() => {
    const element = carouselRef.current;
    if (!element) return;

    const measure = () => setPageHeight(element.clientHeight || 288);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const getSixWeekMonthGrid = (anchor: string) => {
    const days = [...getMonthGrid(anchor)];
    while (days.length < 42) {
      days.push(days[days.length - 1].add(1, "day"));
    }
    return days;
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (isAnimating) return;
    startRef.current = { x: event.clientX, y: event.clientY, time: performance.now() };
    didDragRef.current = false;
    setIsDragging(true);
    setTargetOffset(0);
    setDragY(0);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!startRef.current || isAnimating) return;
    const dx = event.clientX - startRef.current.x;
    const dy = event.clientY - startRef.current.y;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 12) {
      return;
    }

    if (Math.abs(dy) > 8) {
      didDragRef.current = true;
    }

    setDragY(Math.max(-pageHeight, Math.min(pageHeight, dy)));
  };

  const settleDrag = (event?: PointerEvent<HTMLElement>) => {
    if (!startRef.current || isAnimating) return;

    const dy = event ? event.clientY - startRef.current.y : dragY;
    if (!didDragRef.current && Math.abs(dy) <= 8) {
      startRef.current = null;
      setIsDragging(false);
      setTargetOffset(0);
      setDragY(0);
      return;
    }

    const elapsed = Math.max(1, performance.now() - startRef.current.time);
    const velocity = dy / elapsed;
    const shouldCommit = Math.abs(dy) > pageHeight * 0.25 || (Math.abs(dy) > 64 && Math.abs(velocity) > 0.85);
    const direction: -1 | 0 | 1 = shouldCommit ? (dy < 0 ? 1 : -1) : 0;

    startRef.current = null;
    setIsDragging(false);
    setPendingDirection(direction);
    setTargetOffset(direction === 0 ? 0 : direction === 1 ? -pageHeight : pageHeight);
    setDragY(0);
    setIsAnimating(true);
  };

  const onPointerCancel = () => {
    settleDrag();
  };

  const onTransitionEnd = () => {
    if (!isAnimating) return;

    const direction = pendingDirection;
    setIsAnimating(false);
    setTargetOffset(0);
    setPendingDirection(0);

    if (direction !== 0) {
      onSelect(dayjs(activeDate).add(direction, "month").format(DATE_FORMAT));
      return;
    }

    didDragRef.current = false;
  };

  const selectDate = (dateKey: string) => {
    if (didDragRef.current || Math.abs(dragY) > 8 || isAnimating) return;
    onSelect(dateKey);
  };

  return (
    <section
      className="month-view swipe-vertical"
      aria-label="月视图"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={settleDrag}
      onPointerCancel={onPointerCancel}
    >
      <div className="weekday-row">
        {WEEK_DAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="month-carousel" ref={carouselRef}>
        <div
          className={["month-carousel-track", isDragging ? "dragging" : "", isAnimating ? "animating" : ""].join(" ")}
          style={{ transform: `translateY(${targetOffset + dragY - pageHeight}px)` }}
          onTransitionEnd={onTransitionEnd}
        >
          {monthAnchors.map((anchor) => (
            <div className="month-carousel-page" key={anchor} aria-hidden={anchor !== activeDate}>
              <div className="month-grid">
                {getSixWeekMonthGrid(anchor).map((date) => {
                  const dateKey = toDateKey(date);
                  const count = eventsByDate[dateKey]?.length ?? 0;
                  const selected = dateKey === activeDate;
                  const meta = getCalendarDayMeta(dateKey);
                  return (
                    <button
                      className={["day-cell", selected ? "selected" : "", isToday(date) ? "today" : "", isSameMonth(date, anchor) ? "" : "muted", meta.labels.length ? "has-label" : ""].join(" ")}
                      key={dateKey}
                      type="button"
                      onClick={() => selectDate(dateKey)}
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
            </div>
          ))}
        </div>
      </div>
      <p className="swipe-tip">上下滑动切换月份</p>
    </section>
  );
}
