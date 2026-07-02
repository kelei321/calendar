import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/zh-cn";

dayjs.locale("zh-cn");

export const DATE_FORMAT = "YYYY-MM-DD";
export const TIME_FORMAT = "HH:mm";
export const WEEK_DAYS = ["一", "二", "三", "四", "五", "六", "日"];

export function today() {
  return dayjs().format(DATE_FORMAT);
}

export function toDateKey(date: Dayjs | string) {
  return dayjs(date).format(DATE_FORMAT);
}

export function getMonthGrid(anchor: string) {
  const startOfMonth = dayjs(anchor).startOf("month");
  const endOfMonth = dayjs(anchor).endOf("month");
  const startOffset = (startOfMonth.day() + 6) % 7;
  const endOffset = 6 - ((endOfMonth.day() + 6) % 7);
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

export function getWeekDays(anchor: string) {
  const date = dayjs(anchor);
  const start = date.subtract((date.day() + 6) % 7, "day");
  return Array.from({ length: 7 }, (_, index) => start.add(index, "day"));
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
