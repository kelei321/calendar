import type dayjs from "dayjs";
import { getCalendarDayMeta } from "../../holidays";
import { isToday, toDateKey } from "../../dateUtils";
import type { CalendarEvent, CalendarSettings, CustomFestival } from "../../types";
import { useSwipe, type SwipeDirection } from "../../hooks/useSwipe";
import { RotatingDayText, WorkdayBadge } from "./CalendarLabels";

interface WeekViewProps {
  activeDate: string;
  days: dayjs.Dayjs[];
  eventsByDate: Record<string, CalendarEvent[]>;
  settings: CalendarSettings;
  customFestivals: CustomFestival[];
  onSelect: (date: string) => void;
  onSwipe: (direction: SwipeDirection) => void;
}

export function WeekView({ activeDate, days, eventsByDate, settings, customFestivals, onSelect, onSwipe }: WeekViewProps) {
  const swipe = useSwipe(onSwipe);

  return (
    <section className="week-strip swipe-horizontal" aria-label="周视图" {...swipe}>
      {days.map((date) => {
        const dateKey = toDateKey(date);
        const count = eventsByDate[dateKey]?.length ?? 0;
        const meta = getCalendarDayMeta(dateKey, {
          festivalVisibility: settings.festivalVisibility,
          customFestivals
        });
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
