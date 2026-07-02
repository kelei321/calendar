import dayjs from "dayjs";
import type { DayLabel, WorkdayMarker } from "../../holidays";
import type { CalendarEvent } from "../../types";
import { LabelChips } from "./CalendarLabels";

interface DaySummaryProps {
  activeDate: string;
  events: CalendarEvent[];
  labels: DayLabel[];
  workdayMarker: WorkdayMarker | null;
}

export function DaySummary({ activeDate, events, labels, workdayMarker }: DaySummaryProps) {
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
