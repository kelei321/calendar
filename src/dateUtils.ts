import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/zh-cn";
import type { WeekStartsOn } from "./types";

dayjs.locale("zh-cn");

export const DATE_FORMAT = "YYYY-MM-DD";
export const TIME_FORMAT = "HH:mm";
export const WEEK_DAYS = ["一", "二", "三", "四", "五", "六", "日"];
export const SUNDAY_FIRST_WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];

export function today() {
  return dayjs().format(DATE_FORMAT);
}

export function toDateKey(date: Dayjs | string) {
  return dayjs(date).format(DATE_FORMAT);
}

export function getWeekDayLabels(weekStartsOn: WeekStartsOn) {
  return weekStartsOn === 0 ? SUNDAY_FIRST_WEEK_DAYS : WEEK_DAYS;
}

export function getMonthGrid(anchor: string, weekStartsOn: WeekStartsOn = 1) {
  const startOfMonth = dayjs(anchor).startOf("month");
  const endOfMonth = dayjs(anchor).endOf("month");
  const startOffset = getStartOffset(startOfMonth, weekStartsOn);
  const endOffset = 6 - getStartOffset(endOfMonth, weekStartsOn);
  const gridStart = startOfMonth.subtract(startOffset, "day");
  const gridEnd = endOfMonth.add(endOffset, "day");
  const days: Dayjs[] = [];
  let cursor = gridStart;
  while (cursor.isBefore(gridEnd) || cursor.isSame(gridEnd, "day")) {
    days.push(cursor);
    cursor = cursor.add(1, "day");
  }
  return days;
}

export function getWeekDays(anchor: string, weekStartsOn: WeekStartsOn = 1) {
  const date = dayjs(anchor);
  const start = date.subtract(getStartOffset(date, weekStartsOn), "day");
  return Array.from({ length: 7 }, (_, index) => start.add(index, "day"));
}

export function getIsoWeekNumber(date: Dayjs | string) {
  const target = dayjs(date).startOf("day");
  const isoDay = (target.day() + 6) % 7;
  const thursday = target.add(3 - isoDay, "day");
  const firstThursdayBase = dayjs(`${thursday.year()}-01-04`);
  const firstThursdayIsoDay = (firstThursdayBase.day() + 6) % 7;
  const weekOneStart = firstThursdayBase.subtract(firstThursdayIsoDay, "day");
  return thursday.diff(weekOneStart, "week") + 1;
}

export function formatMonthTitle(anchor: string) {
  return dayjs(anchor).format("YYYY年M月");
}

export function formatDayTitle(anchor: string) {
  return dayjs(anchor).format("M月D日 dddd");
}

export function isSameMonth(date: Dayjs, anchor: string) {
  return date.isSame(dayjs(anchor), "month");
}

export function isToday(date: Dayjs | string) {
  return dayjs(date).isSame(dayjs(), "day");
}

function getStartOffset(date: Dayjs, weekStartsOn: WeekStartsOn) {
  return weekStartsOn === 0 ? date.day() : (date.day() + 6) % 7;
}
