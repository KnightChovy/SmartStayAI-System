import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/** Khoảng thở giữa mép dưới thanh neo và tiêu đề section khi cuộn tới. */
const SCROLL_GAP = 8;

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
  const navRef = useRef<HTMLElement>(null);

  /**
   * Công bố `--app-anchor-offset` = mép dưới của thanh neo khi đã dính (navbar + chính nó).
   * Các section dùng nó làm `scroll-margin-top` nên cuộn tới đâu tiêu đề cũng nằm ngay dưới
   * hai thanh sticky, thay vì bị che như khi hardcode `scroll-mt-28`.
   */
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const publish = () => {
      // `top` đã resolve ra px (từ --app-navbar-h) kể cả khi thanh chưa dính.
      const stickyTop = parseFloat(getComputedStyle(el).top) || 0;
      document.documentElement.style.setProperty(
        '--app-anchor-offset',
        `${stickyTop + el.offsetHeight + SCROLL_GAP}px`
      );
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    // Navbar cao lên/thấp xuống theo breakpoint mà thanh neo không đổi kích thước ⇒ RO không bắn.
    window.addEventListener('resize', publish);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', publish);
      // Trang khác không có thanh neo ⇒ đừng để lại offset cũ.
      document.documentElement.style.removeProperty('--app-anchor-offset');
    };
  }, []);

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
      ref={navRef}
      aria-label="Section navigation"
      // Neo theo chiều cao THẬT của navbar: `top-16` (64px) thấp hơn navbar nên mép trên của
      // thanh này chui xuống dưới navbar (z-50 > z-30) và bị cắt mất khi cuộn.
      style={{ top: 'var(--app-navbar-h, 4rem)' }}
      className="sticky z-30 -mx-margin-mobile mb-2 border-b border-outline-variant/30 bg-surface/90 px-margin-mobile backdrop-blur md:mx-0 md:px-0"
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
                  ? 'bg-premium-gold text-on-surface'
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
