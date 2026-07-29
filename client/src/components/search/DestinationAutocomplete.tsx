import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, MapPin } from 'lucide-react';
import { useDestinationSuggest } from '@/hooks/destinations';
import type { DestinationSuggestion } from '@/types/destination.types';
import { cn } from '@/lib/cn';

interface DestinationAutocompleteProps {
  /** Id của ô nhập — để `<label>` bên ngoài liên kết đúng (a11y). */
  id?: string;
  /** Giá trị text điểm đến (city) — controlled. */
  value: string;
  onChange: (value: string) => void;
  /** Gọi khi khách chọn một gợi ý (đã set value trước đó). Dùng để đóng/submit. */
  onSelect?: (value: string) => void;
  placeholder?: string;
  inputClassName?: string;
}

/**
 * Ô nhập điểm đến có gợi ý (SS-001) — nguồn `GET /v1/destinations/suggest` (BE).
 * Gợi ý là city/district thật trên sàn kèm số khách sạn. Chọn xong luôn set về CITY để bộ
 * lọc search (so theo `city`) chắc chắn ra kết quả. Debounce 250ms; điều hướng ↑/↓/Enter/Esc.
 */
export default function DestinationAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  placeholder,
  inputClassName,
}: DestinationAutocompleteProps) {
  const { t } = useTranslation('home');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [debounced, setDebounced] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Debounce 250ms giá trị đưa vào query (setState trong callback async, không đồng bộ trong effect).
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebounced(value.trim()), 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]);

  const { data, isFetching } = useDestinationSuggest(debounced);
  const suggestions: DestinationSuggestion[] = data ?? [];

  // Đóng dropdown khi bấm ra ngoài.
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const pick = (s: DestinationSuggestion) => {
    // Luôn set về CITY để search (lọc theo `city`) chắc chắn ra kết quả, kể cả khi chọn district.
    onChange(s.city);
    setOpen(false);
    onSelect?.(s.city);
  };

  const showList = open && debounced.length >= 1;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        pick(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          'w-full bg-transparent border-none p-0 focus:ring-0 focus-visible:ring-0 text-sm placeholder:text-outline/50 font-medium outline-none mt-1 shadow-none h-auto',
          inputClassName
        )}
      />

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 top-full z-30 mt-3 max-h-72 w-full min-w-64 overflow-auto rounded-2xl border border-outline-variant/30 bg-white p-1.5 text-left shadow-2xl"
        >
          {isFetching && suggestions.length === 0 ? (
            <li className="flex items-center gap-2 px-3 py-3 text-sm text-on-surface-variant">
              <Loader2 className="size-4 animate-spin" /> {t('hero.destinationSearching')}
            </li>
          ) : suggestions.length === 0 ? (
            <li className="px-3 py-3 text-sm text-on-surface-variant">
              {t('hero.destinationEmpty')}
            </li>
          ) : (
            suggestions.map((s, i) => (
              <li key={`${s.type}-${s.name}-${i}`} role="none">
                <button
                  type="button"
                  role="option"
                  id={`${listboxId}-opt-${i}`}
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => pick(s)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors',
                    i === activeIndex ? 'bg-primary/10' : 'hover:bg-surface-container'
                  )}
                >
                  <MapPin className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-on-surface">
                      {s.name}
                    </span>
                    {s.type === 'district' && (
                      <span className="block truncate text-xs text-on-surface-variant">{s.city}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-on-surface-variant">
                    {t('hero.hotelCount', { count: s.hotelCount })}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
