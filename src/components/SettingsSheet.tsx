import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { isValidMonthDay } from "../dateUtils";
import { EVENT_COLORS } from "../eventDefaults";
import type {
  CalendarFontSize,
  CalendarSettings,
  CalendarView,
  CustomFestival,
  CustomFestivalDraft,
  FestivalVisibility,
  WeekStartsOn
} from "../types";

type SettingsScreen = "settings" | "festivals";

interface SettingsSheetProps {
  settings: CalendarSettings;
  customFestivals: CustomFestival[];
  onClose: () => void;
  onSettingsChange: (settings: CalendarSettings) => Promise<void>;
  onSaveFestival: (draft: CustomFestivalDraft, editingId?: string) => Promise<void>;
  onDeleteFestival: (id: string) => Promise<void>;
}

const VIEW_LABELS: Record<CalendarView, string> = {
  month: "月视图",
  week: "周视图",
  day: "日视图"
};

const FONT_SIZE_LABELS: Record<CalendarFontSize, string> = {
  small: "小",
  standard: "标准",
  large: "大"
};

const WEEK_START_LABELS: Record<WeekStartsOn, string> = {
  0: "周日",
  1: "周一"
};

const DURATION_OPTIONS: CalendarSettings["defaultEventDurationMinutes"][] = [30, 60, 90, 120];
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

const FESTIVAL_ROWS: Array<{ key: keyof FestivalVisibility; title: string; desc: string }> = [
  { key: "solar", title: "公历节日", desc: "元旦、劳动节、国庆节等" },
  { key: "lunar", title: "农历节日", desc: "春节、端午、中秋等" },
  { key: "term", title: "二十四节气", desc: "立春、清明、冬至等" },
  { key: "memorial", title: "纪念日", desc: "国家公祭日、防灾减灾日等" },
  { key: "workday", title: "休/班调休", desc: "显示法定节假日与调休角标" }
];

const emptyFestivalDraft = (): CustomFestivalDraft => ({
  name: "",
  monthDay: "05-18",
  color: EVENT_COLORS[0],
  enabled: true
});

export function SettingsSheet({
  settings,
  customFestivals,
  onClose,
  onSettingsChange,
  onSaveFestival,
  onDeleteFestival
}: SettingsSheetProps) {
  const pageRef = useRef<HTMLElement>(null);
  const festivalEditorRef = useRef<HTMLElement>(null);
  const pageOpenerRef = useRef<HTMLElement | null>(null);
  const editorOpenerRef = useRef<HTMLElement | null>(null);
  const editorWasOpenRef = useRef(false);
  const previousScreenRef = useRef<SettingsScreen>("settings");
  const settingsSaveInFlightRef = useRef(false);
  const festivalSaveInFlightRef = useRef(false);
  const [screen, setScreen] = useState<SettingsScreen>("settings");
  const [editingFestival, setEditingFestival] = useState<CustomFestival | null>(null);
  const [festivalDraft, setFestivalDraft] = useState<CustomFestivalDraft | null>(null);
  const [error, setError] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingFestival, setIsSavingFestival] = useState(false);

  const enabledFestivalCount = useMemo(
    () => customFestivals.filter((festival) => festival.enabled).length,
    [customFestivals]
  );

  useEffect(() => {
    pageOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => focusFirstControl(pageRef.current));

    return () => {
      window.cancelAnimationFrame(frame);
      pageOpenerRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    if (festivalDraft) {
      editorOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      editorWasOpenRef.current = true;
      const frame = window.requestAnimationFrame(() => focusFirstControl(festivalEditorRef.current));
      return () => window.cancelAnimationFrame(frame);
    }

    if (editorWasOpenRef.current) {
      editorWasOpenRef.current = false;
      const frame = window.requestAnimationFrame(() => editorOpenerRef.current?.focus());
      return () => window.cancelAnimationFrame(frame);
    }
  }, [Boolean(festivalDraft)]);

  useEffect(() => {
    if (previousScreenRef.current === screen) return;
    previousScreenRef.current = screen;
    const frame = window.requestAnimationFrame(() => focusFirstControl(pageRef.current));
    return () => window.cancelAnimationFrame(frame);
  }, [screen]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (festivalDraft) {
        if (!isSavingFestival) closeFestivalEditor();
      } else {
        if (!isSavingSettings) onClose();
      }
      return;
    }

    if (event.key !== "Tab") return;
    const container = festivalDraft ? festivalEditorRef.current : pageRef.current;
    if (!container) return;

    const controls = getFocusableControls(container);
    if (controls.length === 0) {
      event.preventDefault();
      container.focus();
      return;
    }

    const activeElement = document.activeElement;
    const firstControl = controls[0];
    const lastControl = controls[controls.length - 1];
    if (event.shiftKey && (activeElement === firstControl || !container.contains(activeElement))) {
      event.preventDefault();
      lastControl.focus();
    } else if (!event.shiftKey && (activeElement === lastControl || !container.contains(activeElement))) {
      event.preventDefault();
      firstControl.focus();
    }
  };

  const updateSettings = async (next: Partial<CalendarSettings>) => {
    if (settingsSaveInFlightRef.current) return;
    settingsSaveInFlightRef.current = true;
    setSettingsError("");
    setIsSavingSettings(true);
    try {
      await onSettingsChange({ ...settings, ...next });
    } catch {
      setSettingsError("设置保存失败，请重试");
    } finally {
      settingsSaveInFlightRef.current = false;
      setIsSavingSettings(false);
    }
  };

  const updateVisibility = async (key: keyof FestivalVisibility, value: boolean) => {
    await updateSettings({
      festivalVisibility: {
        ...settings.festivalVisibility,
        [key]: value
      }
    });
  };

  const openCreateFestival = () => {
    setEditingFestival(null);
    setFestivalDraft(emptyFestivalDraft());
    setError("");
  };

  const openEditFestival = (festival: CustomFestival) => {
    setEditingFestival(festival);
    setFestivalDraft({
      name: festival.name,
      monthDay: festival.monthDay,
      color: festival.color,
      enabled: festival.enabled
    });
    setError("");
  };

  const closeFestivalEditor = () => {
    setEditingFestival(null);
    setFestivalDraft(null);
    setError("");
  };

  const updateFestivalDraft = <K extends keyof CustomFestivalDraft>(key: K, value: CustomFestivalDraft[K]) => {
    setFestivalDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const submitFestival = async () => {
    if (!festivalDraft || festivalSaveInFlightRef.current) return;
    if (!festivalDraft.name.trim()) {
      setError("请输入节日名称");
      return;
    }
    if (!isValidMonthDay(festivalDraft.monthDay)) {
      setError("请选择节日日期");
      return;
    }

    setError("");
    festivalSaveInFlightRef.current = true;
    setIsSavingFestival(true);
    try {
      await onSaveFestival(
        {
          ...festivalDraft,
          name: festivalDraft.name.trim()
        },
        editingFestival?.id
      );
      closeFestivalEditor();
    } catch {
      setError("节日保存失败，请重试");
    } finally {
      festivalSaveInFlightRef.current = false;
      setIsSavingFestival(false);
    }
  };

  const removeFestival = async () => {
    if (!editingFestival || festivalSaveInFlightRef.current) return;
    if (!window.confirm(`删除“${editingFestival.name}”？`)) return;
    setError("");
    festivalSaveInFlightRef.current = true;
    setIsSavingFestival(true);
    try {
      await onDeleteFestival(editingFestival.id);
      closeFestivalEditor();
    } catch {
      setError("节日删除失败，请重试");
    } finally {
      festivalSaveInFlightRef.current = false;
      setIsSavingFestival(false);
    }
  };

  return (
    <section
      className="settings-page"
      ref={pageRef}
      role="dialog"
      aria-modal="true"
      aria-label={screen === "settings" ? "设置" : "节日管理"}
      aria-busy={isSavingSettings}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {screen === "settings" ? (
        <>
          <header className="settings-page-header">
            <button className="icon-button" type="button" onClick={onClose} disabled={isSavingSettings} aria-label="关闭设置">
              <X size={20} />
            </button>
            <strong>设置</strong>
            <span />
          </header>

          <div className="settings-page-body">
            {settingsError && <p className="settings-save-error" role="alert">{settingsError}</p>}
            <section className="settings-group" aria-label="日历显示">
              <h2>日历显示</h2>
              <SegmentedRow
                title="默认视图"
                desc={VIEW_LABELS[settings.defaultView]}
                value={settings.defaultView}
                options={[
                  ["month", "月"],
                  ["week", "周"],
                  ["day", "日"]
                ]}
                disabled={isSavingSettings}
                onChange={(value) => void updateSettings({ defaultView: value })}
              />
              <SegmentedRow
                title="一周开始日"
                desc={`当前从${WEEK_START_LABELS[settings.weekStartsOn]}开始`}
                value={settings.weekStartsOn}
                options={[
                  [1, "周一"],
                  [0, "周日"]
                ]}
                disabled={isSavingSettings}
                onChange={(value) => void updateSettings({ weekStartsOn: value })}
              />
              <ToggleRow
                title="显示周数"
                desc="在月视图左侧显示 ISO 周数"
                checked={settings.showWeekNumbers}
                disabled={isSavingSettings}
                onChange={(checked) => void updateSettings({ showWeekNumbers: checked })}
              />
              <SegmentedRow
                title="字体大小"
                desc={`当前为${FONT_SIZE_LABELS[settings.fontSize]}`}
                value={settings.fontSize}
                options={[
                  ["small", "小"],
                  ["standard", "标准"],
                  ["large", "大"]
                ]}
                disabled={isSavingSettings}
                onChange={(value) => void updateSettings({ fontSize: value })}
              />
            </section>

            <section className="settings-group" aria-label="日程设置">
              <h2>日程设置</h2>
              <SegmentedRow
                title="日程默认值"
                desc={`${settings.defaultEventDurationMinutes}分钟`}
                value={settings.defaultEventDurationMinutes}
                options={DURATION_OPTIONS.map((duration) => [duration, `${duration}分钟`] as const)}
                disabled={isSavingSettings}
                onChange={(value) => void updateSettings({ defaultEventDurationMinutes: value })}
              />
              <ColorSettingRow
                title="默认颜色"
                value={settings.defaultEventColor}
                disabled={isSavingSettings}
                onChange={(value) => void updateSettings({ defaultEventColor: value })}
              />
            </section>

            <section className="settings-group" aria-label="功能设置">
              <h2>功能设置</h2>
              <button className="settings-nav-row highlighted" type="button" onClick={() => setScreen("festivals")}>
                <span className="settings-row-icon festival-icon">
                  <CalendarDays size={18} />
                </span>
                <span>
                  <strong>节日管理</strong>
                  <small>{enabledFestivalCount > 0 ? `${enabledFestivalCount} 个自定义节日已启用` : "管理内置节日与自定义节日"}</small>
                </span>
                <ChevronRight size={18} />
              </button>
            </section>

            <p className="settings-footnote">本地保存，离线可用</p>
          </div>
        </>
      ) : (
        <>
          <header className="settings-page-header">
            <button className="icon-button" type="button" onClick={() => setScreen("settings")} disabled={isSavingSettings} aria-label="返回设置">
              <ChevronLeft size={21} />
            </button>
            <strong>节日管理</strong>
            <button className="text-button" type="button" onClick={openCreateFestival}>新增</button>
          </header>

          <div className="settings-page-body">
            {settingsError && <p className="settings-save-error" role="alert">{settingsError}</p>}
            <section className="settings-group" aria-label="内置节日">
              <h2>内置节日</h2>
              {FESTIVAL_ROWS.map((row) => (
                <ToggleRow
                  key={row.key}
                  title={row.title}
                  desc={row.desc}
                  checked={settings.festivalVisibility[row.key]}
                  disabled={isSavingSettings}
                  onChange={(checked) => void updateVisibility(row.key, checked)}
                />
              ))}
            </section>

            <section className="settings-group custom-festival-group" aria-label="自定义节日">
              <div className="settings-section-title">
                <h2>自定义节日</h2>
                <button type="button" onClick={openCreateFestival}>
                  <Plus size={15} />
                  新增节日
                </button>
              </div>
              {customFestivals.length === 0 ? (
                <div className="festival-empty">
                  <CalendarDays size={28} />
                  <p>还没有自定义节日</p>
                </div>
              ) : (
                customFestivals.map((festival) => (
                  <button className="custom-festival-row" type="button" key={festival.id} onClick={() => openEditFestival(festival)}>
                    <span className="festival-dot" style={{ background: festival.color }} />
                    <span>
                      <strong>{festival.name}</strong>
                      <small>每年 {formatMonthDay(festival.monthDay)}</small>
                    </span>
                    <span className={festival.enabled ? "festival-status enabled" : "festival-status"}>{festival.enabled ? "已启用" : "已停用"}</span>
                  </button>
                ))
              )}
            </section>
          </div>
        </>
      )}

      {festivalDraft && (
        <div className="nested-sheet-backdrop" role="presentation">
          <section
            className="festival-editor"
            ref={festivalEditorRef}
            role="dialog"
            aria-modal="true"
            aria-label={editingFestival ? "编辑节日" : "新增节日"}
            aria-busy={isSavingFestival}
            tabIndex={-1}
          >
            <header className="festival-editor-header">
              <button type="button" onClick={closeFestivalEditor} disabled={isSavingFestival}>取消</button>
              <strong>{editingFestival ? "编辑节日" : "新增节日"}</strong>
              <button type="button" onClick={() => void submitFestival()} disabled={isSavingFestival}>
                {isSavingFestival ? "保存中" : "完成"}
              </button>
            </header>

            <label className="field">
              <span>节日名称</span>
              <input disabled={isSavingFestival} value={festivalDraft.name} onChange={(event) => updateFestivalDraft("name", event.target.value)} placeholder="例如：家人生日" />
            </label>

            <label className="field">
              <span>日期</span>
              <input
                type="date"
                disabled={isSavingFestival}
                value={`2024-${festivalDraft.monthDay}`}
                onChange={(event) => updateFestivalDraft("monthDay", event.target.value.slice(5))}
              />
            </label>

            <div className="color-row festival-color-row" aria-label="节日颜色">
              {EVENT_COLORS.map((color) => (
                <button
                  className={festivalDraft.color === color ? "selected" : ""}
                  key={color}
                  type="button"
                  disabled={isSavingFestival}
                  style={{ background: color }}
                  onClick={() => updateFestivalDraft("color", color)}
                  aria-label={`选择颜色 ${color}`}
                />
              ))}
            </div>

            <ToggleRow
              title="启用"
              desc="关闭后该节日不会显示在日历中"
              checked={festivalDraft.enabled}
              disabled={isSavingFestival}
              onChange={(checked) => updateFestivalDraft("enabled", checked)}
            />

            <div className="sheet-hint">
              <CalendarDays size={15} />
              <span>按公历日期每年重复</span>
            </div>

            {error && <p className="form-error">{error}</p>}

            {editingFestival && (
              <button className="delete-button" type="button" onClick={() => void removeFestival()} disabled={isSavingFestival}>
                <Trash2 size={17} />
                删除节日
              </button>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

function SegmentedRow<T extends string | number>({
  title,
  desc,
  value,
  options,
  disabled = false,
  onChange
}: {
  title: string;
  desc: string;
  value: T;
  options: readonly (readonly [T, string])[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <div className="settings-control-row">
      <span>
        <strong>{title}</strong>
        <small>{desc}</small>
      </span>
      <div className="settings-segmented">
        {options.map(([optionValue, label]) => (
          <button className={value === optionValue ? "active" : ""} key={String(optionValue)} type="button" disabled={disabled} onClick={() => onChange(optionValue)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorSettingRow({ title, value, disabled = false, onChange }: { title: string; value: string; disabled?: boolean; onChange: (value: string) => void }) {
  return (
    <div className="settings-control-row">
      <span>
        <strong>{title}</strong>
        <small>新建日程默认颜色</small>
      </span>
      <div className="settings-colors">
        {EVENT_COLORS.map((color) => (
          <button
            className={value === color ? "selected" : ""}
            key={color}
            type="button"
            disabled={disabled}
            style={{ "--swatch-color": color } as CSSProperties}
            onClick={() => onChange(color)}
            aria-label={`选择默认颜色 ${color}`}
          />
        ))}
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  disabled = false,
  onChange
}: {
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="settings-toggle-row">
      <span>
        <strong>{title}</strong>
        <small>{desc}</small>
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function formatMonthDay(monthDay: string) {
  const [month, day] = monthDay.split("-");
  return `${Number(month)}月${Number(day)}日`;
}

function getFocusableControls(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (control) => control.getClientRects().length > 0
  );
}

function focusFirstControl(container: HTMLElement | null) {
  if (!container) return;
  const firstControl = getFocusableControls(container)[0];
  (firstControl ?? container).focus();
}
