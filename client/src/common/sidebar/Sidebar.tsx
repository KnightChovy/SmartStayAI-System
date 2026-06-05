import React from 'react';
import { useLocation, Link } from 'react-router';
import { LogOut } from 'lucide-react';
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
}

export default function CommonSidebar({
  logoChar,
  title,
  subtitle,
  navItems,
  footerItems,
 
  onLogout,
}: CommonSidebarProps) {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-outline-variant/40 bg-white">
      {/* Header */}
      <SidebarHeader className="p-4 py-5 mb-2 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:py-5">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-9 shrink-0 items-center justify-center bg-black text-sm font-semibold text-white group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-md">
            {logoChar || title.charAt(0)}
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
            <p className="text-lg font-semibold leading-tight truncate">{title}</p>
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
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive} 
                      tooltip={item.name}
                      className={cn(
                        "flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium transition-colors h-auto w-full",
                        "group-data-[collapsible=icon]:rounded-md group-data-[collapsible=icon]:justify-center",
                        isActive 
                          ? "bg-blue-50 text-blue-600 hover:bg-blue-50 hover:text-blue-600" 
                          : "text-slate-600 hover:bg-surface-container-low"
                      )}
                    >
                      <Link to={item.href}>
                        <item.icon className="size-4 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
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
            {footerItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive} 
                    tooltip={item.name}
                    className={cn(
                      "flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium transition-colors h-auto w-full",
                      "group-data-[collapsible=icon]:rounded-md group-data-[collapsible=icon]:justify-center",
                      isActive 
                        ? "bg-blue-50 text-blue-600 hover:bg-blue-50 hover:text-blue-600" 
                        : "text-slate-600 hover:bg-surface-container-low"
                    )}
                  >
                    <Link to={item.href}>
                      <item.icon className="size-4 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        )}

        <div className="space-y-2">

          <button
            className="flex cursor-pointer items-center gap-2 px-2 text-sm text-slate-700 w-full text-left hover:text-slate-900 transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            type="button"
            onClick={onLogout}
            title="Logout"
          >
            <LogOut className="size-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
