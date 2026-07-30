import { useTranslation } from 'react-i18next';
import { ChevronDown, Minus, Plus, Users } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/cn';
import { SegmentLabel } from './SearchSegment';
import { SEGMENT_CLASS, segmentValueClass } from './segment-styles';
import {
  MAX_ADULTS,
  MAX_CHILDREN,
  MAX_ROOMS,
  setAdults,
  setChildren,
  setRooms,
  type GuestSelection,
} from './guest-limits';

export type { GuestSelection };

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
  max: number;
  onChange: (v: number) => void;
}

function CounterRow({ label, hint, value, min, max, onChange }: RowProps) {
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
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex size-8 items-center justify-center rounded-full border border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-primary disabled:opacity-30"
          aria-label={`${label} +`}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Ô chọn khách của thanh tìm kiếm (SS-001): tách Người lớn / Trẻ em / Số phòng, mỗi dòng
 * có nút +/− riêng. Trigger là một segment giống hệt các ô còn lại (nhãn + tóm tắt
 * "2 người lớn · 1 phòng", số nhiều đúng ngữ pháp qua i18n plural).
 */
export default function GuestsPopover({ value, onChange, className }: GuestsPopoverProps) {
  const { t } = useTranslation(['home', 'common']);

  const summaryParts = [
    t('common:adultsCount', { count: value.adults }),
    ...(value.children > 0 ? [t('common:childrenCount', { count: value.children })] : []),
    t('hero.roomsCount', { count: value.rooms }),
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={cn(SEGMENT_CLASS, className)}>
          <SegmentLabel icon={Users}>{t('hero.guests')}</SegmentLabel>
          <span className="flex items-center gap-2">
            <span className={segmentValueClass(true)}>{summaryParts.join(' · ')}</span>
            <ChevronDown
              className="size-4 shrink-0 text-on-surface-variant transition-transform group-aria-expanded:rotate-180"
              aria-hidden="true"
            />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 divide-y divide-outline-variant/20 p-4">
        <CounterRow
          label={t('common:adults')}
          value={value.adults}
          min={1}
          max={MAX_ADULTS}
          onChange={adults => onChange(setAdults(value, adults))}
        />
        <CounterRow
          label={t('common:children')}
          hint={t('common:childrenHint')}
          value={value.children}
          min={0}
          max={MAX_CHILDREN}
          onChange={children => onChange(setChildren(value, children))}
        />
        <CounterRow
          label={t('hero.rooms')}
          hint={t('hero.roomsHint')}
          value={value.rooms}
          min={1}
          max={MAX_ROOMS}
          onChange={rooms => onChange(setRooms(value, rooms))}
        />
      </PopoverContent>
    </Popover>
  );
}
