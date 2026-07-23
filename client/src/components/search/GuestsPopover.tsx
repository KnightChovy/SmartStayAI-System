import { useTranslation } from 'react-i18next';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/cn';

export interface GuestSelection {
  adults: number;
  children: number;
  rooms: number;
}

interface GuestsPopoverProps {
  value: GuestSelection;
  onChange: (value: GuestSelection) => void;
  className?: string;
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
    <div className="flex items-center justify-between py-2">
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
        <span className="min-w-6 text-center text-sm font-semibold text-on-surface">
          {value}
        </span>
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
 * Bộ chọn khách kiểu popover (SS-001): tách Người lớn / Trẻ em / Số phòng, mỗi dòng
 * có nút +/− riêng. Nút trigger hiển thị tóm tắt "2 người lớn · 1 phòng" (số nhiều đúng
 * ngữ pháp qua i18n plural).
 */
export default function GuestsPopover({ value, onChange, className }: GuestsPopoverProps) {
  const { t } = useTranslation('home');

  const summaryParts = [
    t('hero.adultsCount', { count: value.adults }),
    ...(value.children > 0 ? [t('hero.childrenCount', { count: value.children })] : []),
    t('hero.roomsCount', { count: value.rooms }),
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between gap-2 text-left',
            className
          )}
        >
          <span className="truncate text-sm font-medium text-on-surface">
            {summaryParts.join(' · ')}
          </span>
          <ChevronDown className="size-4 shrink-0 text-on-surface-variant" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 divide-y divide-outline-variant/20 p-4">
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
      </PopoverContent>
    </Popover>
  );
}
