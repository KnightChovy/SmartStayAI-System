import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, MapPin } from 'lucide-react';
import { autocompleteAddress } from '@/services/vietnam-geo.service';
import type { VietmapSuggestion } from '@/types/vietnam-geo.types';
import { cn } from '@/lib/cn';

interface DestinationAutocompleteProps {
  /** Giá trị text điểm đến (city) — controlled. */
  value: string;
  onChange: (value: string) => void;
  /** Gọi khi khách chọn một gợi ý (đã set value trước đó). Dùng để đóng/submit. */
  onSelect?: (value: string) => void;
  placeholder?: string;
  inputClassName?: string;
}

/**
 * Ô nhập điểm đến có gợi ý (SS-001). Nguồn gợi ý: VietMap autocomplete qua
 * `vietnam-geo.service` — dùng làm fallback cho tới khi BE có `/destinations/suggest`.
 * Debounce 250ms; điều hướng bàn phím ↑/↓/Enter/Esc. Vẫn cho gõ tự do (submit form
 * dùng nguyên text đang nhập) nên không phụ thuộc bắt buộc vào danh sách gợi ý.
 */
export default function DestinationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  inputClassName,
}: DestinationAutocompleteProps) {
  const { t } = useTranslation('home');
  const [suggestions, setSuggestions] = useState<VietmapSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Debounce 250ms — mỗi lần đổi text hẹn gọi lại autocomplete, huỷ lượt trước.
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const text = value.trim();
    if (text.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const result = await autocompleteAddress(text);
      setSuggestions(result.slice(0, 8));
      setActiveIndex(-1);
      setLoading(false);
    }, 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]);

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

  const pick = (s: VietmapSuggestion) => {
    // Lấy tên địa điểm làm điểm đến; search theo `city` là so text nên giữ tên gọn.
    const picked = s.name || s.display;
    onChange(picked);
    setOpen(false);
    setSuggestions([]);
    onSelect?.(picked);
  };

  const showList = open && (loading || suggestions.length > 0 || value.trim().length >= 2);

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
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
        }
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setOpen(true);
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
          {loading && suggestions.length === 0 ? (
            <li className="flex items-center gap-2 px-3 py-3 text-sm text-on-surface-variant">
              <Loader2 className="size-4 animate-spin" /> {t('hero.destinationSearching')}
            </li>
          ) : suggestions.length === 0 ? (
            <li className="px-3 py-3 text-sm text-on-surface-variant">
              {t('hero.destinationEmpty')}
            </li>
          ) : (
            suggestions.map((s, i) => (
              <li key={s.ref_id} role="none">
                <button
                  type="button"
                  role="option"
                  id={`${listboxId}-opt-${i}`}
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => pick(s)}
                  className={cn(
                    'flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors',
                    i === activeIndex ? 'bg-primary/10' : 'hover:bg-surface-container'
                  )}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-on-surface">
                      {s.name || s.display}
                    </span>
                    {s.address && (
                      <span className="block truncate text-xs text-on-surface-variant">
                        {s.address}
                      </span>
                    )}
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
