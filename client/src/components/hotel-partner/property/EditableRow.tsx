import type { ReactNode } from 'react';
import { Check, Pencil, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

type IconTone = 'slate' | 'emerald' | 'red';

const ICON_TONE_CLASS: Record<IconTone, string> = {
  slate: 'hover:bg-slate-100 hover:text-slate-600',
  emerald: 'hover:bg-emerald-50 hover:text-emerald-600',
  red: 'hover:bg-red-50 hover:text-red-500',
};

function IconButton({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  tone: IconTone;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn('rounded-lg p-1 text-slate-400', ICON_TONE_CLASS[tone])}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

interface RowSummaryProps {
  /** Badge loại (thường là `<Pill>`) đứng đầu dòng. */
  badge: ReactNode;
  /** Thông tin phụ ghép bằng `·`; chỉ truyền field có giá trị. */
  meta?: string[];
  /** Dòng chính: tên / mô tả. */
  primary: string;
  /** Chữ thay thế khi `primary` trống. */
  emptyPrimary: string;
}

/** Nội dung tóm tắt của một dòng khi thu gọn. */
export function RowSummary({ badge, meta = [], primary, emptyPrimary }: RowSummaryProps) {
  const text = primary.trim();
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        {badge}
        {meta.length > 0 && <span className="text-xs text-slate-500">{meta.join(' · ')}</span>}
      </div>
      <p className="mt-1 truncate text-sm text-slate-700" title={text || undefined}>
        {text || <span className="italic text-slate-400">{emptyPrimary}</span>}
      </p>
    </div>
  );
}

interface EditableRowProps {
  /** `true` → hiện form; `false` → chỉ hiện `summary`. */
  editing: boolean;
  /** Nội dung khi thu gọn — thường là `<RowSummary />`. */
  summary: ReactNode;
  /** Nhãn header khi mở form, vd "New policy" / "Editing policy". */
  editingLabel: string;
  /** Tên thực thể cho aria-label, vd "policy" → "Edit policy". */
  entity: string;
  onEdit: () => void;
  onDone: () => void;
  onRemove: () => void;
  /** Các field của form; được bọc sẵn trong grid 1→2 cột. */
  children: ReactNode;
}

/**
 * Một dòng trong editor replace-all: thu gọn thành tóm tắt sau khi tạo,
 * bung ra form khi Add/Edit.
 */
export function EditableRow({
  editing,
  summary,
  editingLabel,
  entity,
  onEdit,
  onDone,
  onRemove,
  children,
}: EditableRowProps) {
  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3">
        {summary}
        <div className="flex shrink-0 items-center gap-1">
          <IconButton icon={Pencil} label={`Edit ${entity}`} tone="slate" onClick={onEdit} />
          <IconButton icon={Trash2} label={`Remove ${entity}`} tone="red" onClick={onRemove} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {editingLabel}
        </span>
        <div className="flex items-center gap-1">
          <IconButton
            icon={Check}
            label={`Done editing ${entity}`}
            tone="emerald"
            onClick={onDone}
          />
          <IconButton icon={Trash2} label={`Remove ${entity}`} tone="red" onClick={onRemove} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}
