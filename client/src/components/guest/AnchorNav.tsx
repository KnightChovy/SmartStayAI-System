import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

export interface AnchorSection {
  id: string;
  label: string;
}

interface AnchorNavProps {
  sections: AnchorSection[];
}

/**
 * Thanh điều hướng neo (SS-201) — sticky dưới navbar, cuộn mượt tới section khi click,
 * và tự đổi mục active theo vị trí cuộn (scroll spy qua IntersectionObserver).
 * Chỉ theo dõi những section thực sự tồn tại trong DOM (tránh anchor chết).
 */
export default function AnchorNav({ sections }: AnchorNavProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '');

  useEffect(() => {
    const els = sections
      .map(s => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        // Chọn section đang gần đỉnh viewport nhất trong số đang giao nhau.
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // Kích hoạt khi section vào vùng ~1/3 trên của màn hình.
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      aria-label="Section navigation"
      className="sticky top-16 z-30 -mx-margin-mobile mb-2 border-b border-outline-variant/30 bg-surface/90 px-margin-mobile backdrop-blur md:mx-0 md:px-0"
    >
      <ul className="flex gap-1 overflow-x-auto py-2">
        {sections.map(s => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => handleClick(s.id)}
              aria-current={activeId === s.id ? 'true' : undefined}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                activeId === s.id
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              )}
            >
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
