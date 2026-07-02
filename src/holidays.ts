import dayjs from "dayjs";

export type DayLabelType = "solar" | "lunar" | "term" | "memorial";
export type WorkdayMarkerType = "holiday" | "workday";

export interface DayLabel {
  name: string;
  type: DayLabelType;
}

export interface WorkdayMarker {
  type: WorkdayMarkerType;
  text: "休" | "班";
  reason: string;
}

export interface CalendarDayMeta {
  labels: DayLabel[];
  primaryText: string;
  workdayMarker: WorkdayMarker | null;
  rotatingTexts: DayLabel[];
}

interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeap: boolean;
}

const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06aa0, 0x1a6c4, 0x0aae0,
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252
];

const SOLAR_FESTIVALS: Record<string, string[]> = {
  "01-01": ["元旦"],
  "01-10": ["中国人民警察节"],
  "02-14": ["情人节"],
  "03-08": ["妇女节"],
  "03-12": ["植树节"],
  "03-15": ["消费者权益日"],
  "04-01": ["愚人节"],
  "04-05": ["清明节"],
  "05-01": ["劳动节"],
  "05-04": ["青年节"],
  "06-01": ["儿童节"],
  "07-01": ["建党节"],
  "08-01": ["建军节"],
  "09-10": ["教师节"],
  "10-01": ["国庆节"],
  "10-31": ["万圣夜"],
  "12-24": ["平安夜"],
  "12-25": ["圣诞节"]
};

const MEMORIAL_DAYS: Record<string, string[]> = {
  "05-12": ["防灾减灾日"], "07-07": ["七七事变纪念日"], "09-03": ["抗战胜利纪念日"],
  "09-18": ["九一八事变纪念日"], "09-30": ["烈士纪念日"], "10-25": ["抗美援朝纪念日"],
  "12-13": ["国家公祭日"]
};

const LUNAR_FESTIVALS: Record<string, string[]> = {
  "01-01": ["春节"], "01-15": ["元宵节"], "02-02": ["龙抬头"], "05-05": ["端午节"],
  "07-07": ["七夕"], "07-15": ["中元节"], "08-15": ["中秋节"], "09-09": ["重阳节"],
  "10-01": ["寒衣节"], "12-08": ["腊八节"], "12-23": ["北方小年"], "12-24": ["南方小年"]
};

const CHINA_HOLIDAY_OVERRIDES: Record<string, WorkdayMarker> = {
  "2025-01-01": { type: "holiday", text: "休", reason: "元旦假期" },
  "2025-01-26": { type: "workday", text: "班", reason: "春节调休上班" },
  "2025-01-28": { type: "holiday", text: "休", reason: "春节假期" },
  "2025-01-29": { type: "holiday", text: "休", reason: "春节假期" },
  "2025-01-30": { type: "holiday", text: "休", reason: "春节假期" },
  "2025-01-31": { type: "holiday", text: "休", reason: "春节假期" },
  "2025-02-01": { type: "holiday", text: "休", reason: "春节假期" },
  "2025-02-02": { type: "holiday", text: "休", reason: "春节假期" },
  "2025-02-03": { type: "holiday", text: "休", reason: "春节假期" },
  "2025-02-04": { type: "holiday", text: "休", reason: "春节假期" },
  "2025-02-08": { type: "workday", text: "班", reason: "春节调休上班" },
  "2025-04-04": { type: "holiday", text: "休", reason: "清明假期" },
  "2025-04-05": { type: "holiday", text: "休", reason: "清明假期" },
  "2025-04-06": { type: "holiday", text: "休", reason: "清明假期" },
  "2025-04-27": { type: "workday", text: "班", reason: "劳动节调休上班" },
  "2025-05-01": { type: "holiday", text: "休", reason: "劳动节假期" },
  "2025-05-02": { type: "holiday", text: "休", reason: "劳动节假期" },
  "2025-05-03": { type: "holiday", text: "休", reason: "劳动节假期" },
  "2025-05-04": { type: "holiday", text: "休", reason: "劳动节假期" },
  "2025-05-05": { type: "holiday", text: "休", reason: "劳动节假期" },
  "2025-05-31": { type: "holiday", text: "休", reason: "端午假期" },
  "2025-06-01": { type: "holiday", text: "休", reason: "端午假期" },
  "2025-06-02": { type: "holiday", text: "休", reason: "端午假期" },
  "2025-09-28": { type: "workday", text: "班", reason: "国庆中秋调休上班" },
  "2025-10-01": { type: "holiday", text: "休", reason: "国庆中秋假期" },
  "2025-10-02": { type: "holiday", text: "休", reason: "国庆中秋假期" },
  "2025-10-03": { type: "holiday", text: "休", reason: "国庆中秋假期" },
  "2025-10-04": { type: "holiday", text: "休", reason: "国庆中秋假期" },
  "2025-10-05": { type: "holiday", text: "休", reason: "国庆中秋假期" },
  "2025-10-06": { type: "holiday", text: "休", reason: "国庆中秋假期" },
  "2025-10-07": { type: "holiday", text: "休", reason: "国庆中秋假期" },
  "2025-10-08": { type: "holiday", text: "休", reason: "国庆中秋假期" },
  "2025-10-11": { type: "workday", text: "班", reason: "国庆中秋调休上班" },
  "2026-01-01": { type: "holiday", text: "休", reason: "元旦假期" },
  "2026-02-14": { type: "workday", text: "班", reason: "春节调休上班" },
  "2026-02-15": { type: "holiday", text: "休", reason: "春节假期" },
  "2026-02-16": { type: "holiday", text: "休", reason: "春节假期" },
  "2026-02-17": { type: "holiday", text: "休", reason: "春节假期" },
  "2026-02-18": { type: "holiday", text: "休", reason: "春节假期" },
  "2026-02-19": { type: "holiday", text: "休", reason: "春节假期" },
  "2026-02-20": { type: "holiday", text: "休", reason: "春节假期" },
  "2026-02-21": { type: "holiday", text: "休", reason: "春节假期" },
  "2026-02-22": { type: "holiday", text: "休", reason: "春节假期" },
  "2026-02-23": { type: "holiday", text: "休", reason: "春节假期" },
  "2026-02-28": { type: "workday", text: "班", reason: "春节调休上班" },
  "2026-04-05": { type: "holiday", text: "休", reason: "清明假期" },
  "2026-04-06": { type: "holiday", text: "休", reason: "清明假期" },
  "2026-04-26": { type: "workday", text: "班", reason: "劳动节调休上班" },
  "2026-05-01": { type: "holiday", text: "休", reason: "劳动节假期" },
  "2026-05-02": { type: "holiday", text: "休", reason: "劳动节假期" },
  "2026-05-03": { type: "holiday", text: "休", reason: "劳动节假期" },
  "2026-05-04": { type: "holiday", text: "休", reason: "劳动节假期" },
  "2026-05-05": { type: "holiday", text: "休", reason: "劳动节假期" },
  "2026-05-09": { type: "workday", text: "班", reason: "劳动节调休上班" },
  "2026-06-19": { type: "holiday", text: "休", reason: "端午假期" },
  "2026-06-20": { type: "holiday", text: "休", reason: "端午假期" },
  "2026-06-21": { type: "holiday", text: "休", reason: "端午假期" },
  "2026-09-25": { type: "holiday", text: "休", reason: "中秋假期" },
  "2026-09-26": { type: "holiday", text: "休", reason: "中秋假期" },
  "2026-09-27": { type: "holiday", text: "休", reason: "中秋假期" },
  "2026-09-20": { type: "workday", text: "班", reason: "国庆调休上班" },
  "2026-10-01": { type: "holiday", text: "休", reason: "国庆假期" },
  "2026-10-02": { type: "holiday", text: "休", reason: "国庆假期" },
  "2026-10-03": { type: "holiday", text: "休", reason: "国庆假期" },
  "2026-10-04": { type: "holiday", text: "休", reason: "国庆假期" },
  "2026-10-05": { type: "holiday", text: "休", reason: "国庆假期" },
  "2026-10-06": { type: "holiday", text: "休", reason: "国庆假期" },
  "2026-10-07": { type: "holiday", text: "休", reason: "国庆假期" },
  "2026-10-10": { type: "workday", text: "班", reason: "国庆调休上班" }
};

const TERM_NAMES = ["小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"];
const TERM_21_CENTURY = [5.4055, 20.12, 3.87, 18.73, 5.63, 20.646, 4.81, 20.1, 5.52, 21.04, 5.678, 21.37, 7.108, 22.83, 7.5, 23.13, 7.646, 23.042, 8.318, 23.438, 7.438, 22.36, 7.18, 21.94];
const TERM_20_CENTURY = [6.11, 20.84, 4.6295, 19.4599, 6.3826, 21.4155, 5.59, 20.888, 6.318, 21.86, 6.5, 22.2, 7.928, 23.65, 8.35, 23.95, 8.44, 23.822, 9.098, 24.218, 8.218, 23.08, 7.9, 22.6];
const LUNAR_DAY_NAMES = ["初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十", "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十", "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];

function leapMonth(year: number) { return LUNAR_INFO[year - 1900] & 0xf; }
function leapDays(year: number) { return leapMonth(year) ? ((LUNAR_INFO[year - 1900] & 0x10000) ? 30 : 29) : 0; }
function monthDays(year: number, month: number) { return (LUNAR_INFO[year - 1900] & (0x10000 >> month)) ? 30 : 29; }
function yearDays(year: number) {
  let sum = 348;
  for (let bit = 0x8000; bit > 0x8; bit >>= 1) sum += (LUNAR_INFO[year - 1900] & bit) ? 1 : 0;
  return sum + leapDays(year);
}

function solarToLunar(dateKey: string): LunarDate | null {
  const target = dayjs(dateKey).startOf("day");
  if (target.year() < 1900 || target.year() > 2099) return null;
  let offset = target.diff(dayjs("1900-01-31"), "day");
  let year = 1900;
  while (year < 2100 && offset >= yearDays(year)) {
    offset -= yearDays(year);
    year += 1;
  }
  const leap = leapMonth(year);
  let isLeap = false;
  let month = 1;
  while (month <= 12) {
    const days = isLeap ? leapDays(year) : monthDays(year, month);
    if (offset < days) break;
    offset -= days;
    if (leap === month && !isLeap) isLeap = true;
    else {
      if (isLeap) isLeap = false;
      month += 1;
    }
  }
  return { year, month, day: offset + 1, isLeap };
}

function getSolarTerm(dateKey: string): string | null {
  const date = dayjs(dateKey);
  const year = date.year();
  if (year < 1901 || year > 2099) return null;
  const constants = year < 2000 ? TERM_20_CENTURY : TERM_21_CENTURY;
  const shortYear = year % 100;
  const firstIndex = date.month() * 2;
  for (const index of [firstIndex, firstIndex + 1]) {
    const termDay = Math.floor(shortYear * 0.2422 + constants[index]) - Math.floor((shortYear - 1) / 4);
    if (date.date() === termDay) return TERM_NAMES[index];
  }
  return null;
}

function isNthWeekdayOfMonth(dateKey: string, month: number, weekday: number, nth: number) {
  const date = dayjs(dateKey);
  if (date.month() + 1 !== month || date.day() !== weekday) {
    return false;
  }

  return Math.floor((date.date() - 1) / 7) + 1 === nth;
}

function getCalculatedSolarFestivals(dateKey: string, term: string | null) {
  const festivals: string[] = [];

  if (isNthWeekdayOfMonth(dateKey, 5, 0, 2)) {
    festivals.push("母亲节");
  }

  if (isNthWeekdayOfMonth(dateKey, 6, 0, 3)) {
    festivals.push("父亲节");
  }

  if (term === "秋分") {
    festivals.push("中国农民丰收节");
  }

  if (isNthWeekdayOfMonth(dateKey, 11, 4, 4)) {
    festivals.push("感恩节");
  }

  return festivals;
}

export function getDayLabels(dateKey: string): DayLabel[] {
  const labels: DayLabel[] = [];
  const solarKey = dayjs(dateKey).format("MM-DD");
  const lunar = solarToLunar(dateKey);
  const term = getSolarTerm(dateKey);
  for (const name of SOLAR_FESTIVALS[solarKey] ?? []) labels.push({ name, type: "solar" });
  for (const name of getCalculatedSolarFestivals(dateKey, term)) labels.push({ name, type: "solar" });
  if (lunar && !lunar.isLeap) {
    const lunarKey = `${String(lunar.month).padStart(2, "0")}-${String(lunar.day).padStart(2, "0")}`;
    for (const name of LUNAR_FESTIVALS[lunarKey] ?? []) labels.push({ name, type: "lunar" });
    if (lunar.month === 12 && lunar.day === monthDays(lunar.year, 12)) labels.push({ name: "除夕", type: "lunar" });
  }
  if (term) labels.push({ name: term, type: "term" });
  for (const name of MEMORIAL_DAYS[solarKey] ?? []) labels.push({ name, type: "memorial" });
  return labels;
}

export function getPrimaryDayText(dateKey: string) {
  const important = getDayLabels(dateKey)[0];
  if (important) return important.name;
  const lunar = solarToLunar(dateKey);
  if (!lunar) return "";
  return lunar.day === 1 ? `${lunar.isLeap ? "闰" : ""}${lunar.month}月` : LUNAR_DAY_NAMES[lunar.day - 1];
}

export function getWorkdayMarker(dateKey: string): WorkdayMarker | null {
  return CHINA_HOLIDAY_OVERRIDES[dateKey] ?? null;
}

export function getCalendarDayMeta(dateKey: string): CalendarDayMeta {
  const labels = getDayLabels(dateKey);
  const primaryText = getPrimaryDayText(dateKey);

  return {
    labels,
    primaryText,
    workdayMarker: getWorkdayMarker(dateKey),
    rotatingTexts: labels.length > 0 ? labels : [{ name: primaryText, type: "lunar" }]
  };
}
