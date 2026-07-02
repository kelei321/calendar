import { useEffect, useState, type CSSProperties } from "react";
import type { DayLabel, WorkdayMarker } from "../../holidays";

export function WorkdayBadge({ marker }: { marker: WorkdayMarker }) {
  return <span className={`workday-marker ${marker.type}`} aria-label={marker.reason}>{marker.text}</span>;
}

export function RotatingDayText({ items, fallback, compact = false, fallbackOnly = false }: { items: DayLabel[]; fallback: string; compact?: boolean; fallbackOnly?: boolean }) {
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

export function LabelChips({ labels, workdayMarker }: { labels: DayLabel[]; workdayMarker: WorkdayMarker | null }) {
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
