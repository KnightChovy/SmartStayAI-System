import React from 'react';
import { useLocation, Link } from 'react-router';
import { LogOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

export interface CommonSidebarProps {
  logoChar?: string;
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  footerItems?: NavItem[];
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  /** Đang trong quá trình đăng xuất → nút hiện spinner + in đậm + khoá click. */
  isLoggingOut?: boolean;
}

export default function CommonSidebar({
  logoChar,
  title,
  subtitle,
  navItems,
  footerItems,

  onLogout,
  isLoggingOut = false,
}: CommonSidebarProps) {
  const location = useLocation();

  const activeHref = [...navItems, ...(footerItems ?? [])]
    .filter(
      item =>
        location.pathname === item.href ||
        location.pathname.startsWith(`${item.href}/`)
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-outline-variant/40 bg-white"
    >
      {/* Header */}
      <SidebarHeader className="p-4 py-5 mb-2 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:py-5">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-9 shrink-0 items-center justify-center bg-black text-sm font-semibold text-white group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-md">
            {logoChar || title.charAt(0)}
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
            <p className="text-lg font-semibold leading-tight truncate">
              {title}
            </p>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="px-4 group-data-[collapsible=icon]:px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {navItems.map(item => {
                const isActive = item.href === activeHref;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                      className={cn(
                        'flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium transition-colors h-auto w-full',
                        'group-data-[collapsible=icon]:rounded-md group-data-[collapsible=icon]:justify-center',
                        isActive
                          ? 'bg-blue-50 text-blue-600 hover:bg-blue-50 hover:text-blue-600'
                          : 'text-slate-600 hover:bg-surface-container-low'
                      )}
                    >
                      <Link to={item.href}>
                        <item.icon className="size-4 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.name}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Navigation & Profile */}
      <SidebarFooter className="mt-auto border-t border-outline-variant/40 p-4 pt-4 space-y-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pt-4">
        {footerItems && footerItems.length > 0 && (
          <SidebarMenu className="space-y-1.5">
            {footerItems.map(item => {
              const isActive = item.href === activeHref;
              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.name}
                    className={cn(
                      'flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium transition-colors h-auto w-full',
                      'group-data-[collapsible=icon]:rounded-md group-data-[collapsible=icon]:justify-center',
                      isActive
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-50 hover:text-blue-600'
                        : 'text-slate-600 hover:bg-surface-container-low'
                    )}
                  >
                    <Link to={item.href}>
                      <item.icon className="size-4 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.name}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        )}

        <div className="space-y-2">
          <button
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-red-600 transition-colors',
              'hover:bg-red-50 hover:text-red-700 active:font-bold',
              'disabled:cursor-not-allowed disabled:opacity-70',
              'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0',
              isLoggingOut ? 'font-bold cursor-wait' : 'font-medium cursor-pointer'
            )}
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            title="Logout"
          >
            {isLoggingOut ? (
              <Loader2 className="size-4 shrink-0 animate-spin" />
            ) : (
              <LogOut className="size-4 shrink-0" />
            )}
            <span className="group-data-[collapsible=icon]:hidden">
              {isLoggingOut ? 'Logging out…' : 'Logout'}
            </span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
