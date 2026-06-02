import React from 'react';
import { Bell, HelpCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface CommonNavbarProps {
  currentTime?: Date;
  onDateClick?: () => void;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  rightContent?: React.ReactNode;
  showDate?: boolean;
  userName?: string;
}

export default function CommonNavbar({
  currentTime,
  onDateClick,
  searchPlaceholder = 'Search...',
  onSearch,
  rightContent,
  showDate = true,
  userName = 'User',
}: CommonNavbarProps) {
  const [searchValue, setSearchValue] = React.useState('');

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
          <SidebarTrigger className="cursor-pointer" />

          {showDate &&
            (onDateClick ? (
              <button
                className="hidden rounded-full px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-surface-container-low xl:block"
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

        <div className="relative w-full max-w-[500px]">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 w-full rounded-sm bg-white-container-low pl-8 text-xs"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex items-center gap-2">
          {rightContent || (
            <>
              <button
                className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40"
                type="button"
              >
                <Bell className="size-3.5" />
              </button>
              <button
                className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40"
                type="button"
              >
                <HelpCircle className="size-3.5" />
              </button>
              <div className="h-6 w-px bg-outline-variant/40" />
              <div className="flex items-center gap-2">
                <Avatar className="size-8 rounded-full bg-surface-container">
                  <AvatarImage src="https://pbs.twimg.com/profile_images/1593304942210478080/TUYae5z7_400x400.jpg" />
                  <AvatarFallback>{userName[0]}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold">{userName}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
