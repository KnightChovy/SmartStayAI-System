import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Hotel, User, CalendarCheck, Loader2, CornerDownLeft } from 'lucide-react';
import useDebounce from '@/hooks/useDebounce';
import { useDashboardSearch } from '@/hooks/dashboard';

/**
 * Global search palette (AC-6): mở bằng click, ⌘/Ctrl+K hoặc "/"; gõ ≥ 2 ký tự → gợi ý
 * phân nhóm Hotels / Users / Bookings. Esc để đóng.
 */
export function DashboardSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isFetching } = useDashboardSearch(debounced);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
    else setQuery('');
  }, [open]);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const hasQuery = debounced.trim().length >= 2;
  const groups = data
    ? [
        {
          key: 'hotels',
          label: 'Hotels',
          icon: Hotel,
          items: data.hotels.map(h => ({ id: h.id, primary: h.name, secondary: h.city, path: `/manager/hotel-partners?hotelId=${h.id}` })),
        },
        {
          key: 'users',
          label: 'Users',
          icon: User,
          items: data.users.map(u => ({ id: u.id, primary: u.name, secondary: u.email, path: '/manager/hotel-partners' })),
        },
        {
          key: 'bookings',
          label: 'Bookings',
          icon: CalendarCheck,
          items: data.bookings.map(b => ({ id: b.id, primary: b.code, secondary: b.hotelName, path: '/manager/revenue' })),
        },
      ].filter(g => g.items.length > 0)
    : [];
  const empty = hasQuery && !isFetching && groups.length === 0;

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-slate-400 border border-slate-200 rounded-lg pl-3 pr-2 py-2 hover:bg-slate-50 transition-colors w-full sm:w-72 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-role-manager-primary"
        aria-label="Open search"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left truncate">Search hotels, users, bookings…</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1.5 text-[10px] font-medium text-slate-500">
          Ctrl K
        </kbd>
      </button>

      {/* Palette overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/30 px-4 pt-24"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-label="Search"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 px-4">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search hotel, user, booking, VR code…"
                className="flex-1 h-12 text-sm outline-none placeholder:text-slate-400"
                aria-label="Search query"
              />
              {isFetching && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {!hasQuery ? (
                <p className="px-3 py-6 text-center text-sm text-slate-400">
                  Type at least 2 characters to search
                </p>
              ) : empty ? (
                <p className="px-3 py-6 text-center text-sm text-slate-400">No results found</p>
              ) : (
                groups.map(group => {
                  const GroupIcon = group.icon;
                  return (
                    <div key={group.key} className="mb-2 last:mb-0">
                      <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        {group.label}
                      </p>
                      {group.items.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => go(item.path)}
                          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
                        >
                          <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0">
                            <GroupIcon className="w-4 h-4" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm text-slate-800 truncate">{item.primary}</span>
                            <span className="block text-xs text-slate-500 truncate">{item.secondary}</span>
                          </span>
                          <CornerDownLeft className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
