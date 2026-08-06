import React from 'react';
import { Link } from 'react-router';
import {
  Bell,
  ChevronDown,
  HelpCircle,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  User as UserIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSidebar } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES, getProfilePathForRole } from '@/constants/routes';
import { ROLE_THEME, type PortalRole } from '@/constants/roleTheme';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';

export interface CommonNavbarProps {
  /** Cổng đang render — quyết định bảng màu. Bắt buộc, khớp với `role` của CommonSidebar. */
  role: PortalRole;
  currentTime?: Date;
  onDateClick?: () => void;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  rightContent?: React.ReactNode;
  /** Rendered before the default actions (bell + avatar). Kept even when the default block is used. */
  leadingActions?: React.ReactNode;
  /** Replaces the default (display-only) search box with a portal-specific one. */
  searchSlot?: React.ReactNode;
  /** Replaces the default inert bell button — pass a real notifications panel. */
  bellSlot?: React.ReactNode;
  /** Replaces the default inert help button — pass a real help menu. */
  helpSlot?: React.ReactNode;
  showDate?: boolean;
  userName?: string;
}

function SidebarToggleControl({ role }: { role: PortalRole }) {
  const { isMobile, openMobile, state, toggleSidebar } = useSidebar();
  const isExpanded = isMobile ? openMobile : state === 'expanded';
  const label = isExpanded ? 'Collapse sidebar' : 'Expand sidebar';
  const Icon = isExpanded ? PanelLeftClose : PanelLeftOpen;

  return (
    <button
      aria-label={label}
      className="group inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-1.5 pr-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 active:translate-y-px active:scale-[0.98]"
      onClick={toggleSidebar}
      title={label}
      type="button"
    >
      <span
        className={cn(
          'flex size-6 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors',
          ROLE_THEME[role].toggleHover
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="hidden sm:inline">
        {isExpanded ? 'Collapse' : 'Expand'}
      </span>
    </button>
  );
}

export default function CommonNavbar({
  role,
  currentTime,
  onDateClick,
  searchPlaceholder = 'Search...',
  onSearch,
  rightContent,
  leadingActions,
  searchSlot,
  bellSlot,
  helpSlot,
  showDate = true,
  userName = 'User',
}: CommonNavbarProps) {
  const [searchValue, setSearchValue] = React.useState('');
  const user = useAuthStore(state => state.user);
  const displayName = user?.fullName || userName;
  const initials = (displayName || 'U').slice(0, 1).toUpperCase();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const displayTime = currentTime ?? new Date();
  const today = displayTime.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const time = displayTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

  return (
    <header className="border-b border-outline-variant/40 bg-white px-5 py-2.5 lg:px-6 lg:py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 lg:gap-4 ">
          <SidebarToggleControl role={role} />

          {showDate &&
            (onDateClick ? (
              <button
                className="hidden whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-surface-container-low xl:block"
                onClick={onDateClick}
                type="button"
              >
                {today} | {time}
              </button>
            ) : (
              <>
                <p className="hidden text-xs font-medium text-slate-700 xl:block">
                  {today}
                </p>
                <p className="hidden text-xs font-medium text-slate-700 xl:block">
                  {time}
                </p>
              </>
            ))}
        </div>

        {searchSlot ?? (
          <div className="relative w-full max-w-125">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 w-full rounded-sm bg-white-container-low pl-8 text-xs"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearchChange}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {leadingActions}
          {rightContent || (
            <>
              {bellSlot ?? (
                <button
                  className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40"
                  type="button"
                >
                  <Bell className="size-3.5" />
                </button>
              )}
              {helpSlot ?? (
                <button
                  className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40"
                  type="button"
                >
                  <HelpCircle className="size-3.5" />
                </button>
              )}
              <div className="h-6 w-px bg-outline-variant/40" />
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-2 outline-none transition-colors hover:bg-surface-container-low data-[state=open]:bg-surface-container-low cursor-pointer">
                  <Avatar className="size-8 rounded-full bg-surface-container">
                    {user?.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={displayName} />
                    ) : null}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  {/* Tên dài ("Quản trị hệ thống") xuống dòng làm navbar cao thêm — cắt thay vì wrap. */}
                  <p className="hidden max-w-40 truncate text-sm font-semibold sm:block">
                    {displayName}
                  </p>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <div className="flex items-center gap-3 px-2 py-2.5">
                    <Avatar className="size-10 rounded-full bg-surface-container">
                      {user?.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt={displayName} />
                      ) : null}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {displayName}
                      </p>
                      {user?.fullName ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {user.fullName}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      to={getProfilePathForRole(user?.role)}
                      className="cursor-pointer"
                    >
                      <UserIcon className="size-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={ROUTES.home} className="cursor-pointer">
                      <Home className="size-4" />
                      Back to Home
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
