import { useTranslation } from 'react-i18next';
import { Minus, Plus } from 'lucide-react';
import type { GuestSelection } from './GuestsPopover';

interface GuestCountersProps {
  value: GuestSelection;
  onChange: (value: GuestSelection) => void;
}

interface RowProps {
  label: string;
  hint?: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}

function CounterRow({ label, hint, value, min, onChange }: RowProps) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-medium text-on-surface">{label}</p>
        {hint && <p className="text-xs text-on-surface-variant">{hint}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex size-8 items-center justify-center rounded-full border border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-primary disabled:opacity-30"
          aria-label={`${label} -`}
        >
          <Minus className="size-4" />
        </button>
        <span className="min-w-6 text-center text-sm font-semibold text-on-surface">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex size-8 items-center justify-center rounded-full border border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-primary"
          aria-label={`${label} +`}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Bộ chọn khách dạng danh sách dọc (Người lớn / Trẻ em / Số phòng) — dùng trong filter sidebar,
 * khớp với `GuestsPopover` của thanh tìm kiếm hero (không gộp chung một số nữa).
 */
export default function GuestCounters({ value, onChange }: GuestCountersProps) {
  const { t } = useTranslation('home');

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-on-surface-variant">{t('hero.guests')}</p>
      <div className="divide-y divide-outline-variant/20 rounded-xl border border-outline-variant/40 px-3">
        <CounterRow
          label={t('hero.adults')}
          value={value.adults}
          min={1}
          onChange={adults => onChange({ ...value, adults })}
        />
        <CounterRow
          label={t('hero.children')}
          hint={t('hero.childrenHint')}
          value={value.children}
          min={0}
          onChange={children => onChange({ ...value, children })}
        />
        <CounterRow
          label={t('hero.rooms')}
          value={value.rooms}
          min={1}
          onChange={rooms => onChange({ ...value, rooms })}
        />
      </div>
    </div>
  );
}
