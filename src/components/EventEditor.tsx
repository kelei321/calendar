import dayjs from "dayjs";
import { Clock3, Trash2, X } from "lucide-react";
import { TIME_FORMAT } from "../dateUtils";
import { EVENT_COLORS } from "../eventDefaults";
import type { EventDraft } from "../types";

interface EventEditorProps {
  draft: EventDraft;
  editing: boolean;
  error: string;
  onClose: () => void;
  onDelete: () => void;
  onSubmit: () => void;
  onUpdate: <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => void;
}

export function EventEditor({ draft, editing, error, onClose, onDelete, onSubmit, onUpdate }: EventEditorProps) {
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
