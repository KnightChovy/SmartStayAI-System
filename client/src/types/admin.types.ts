import type { ReactNode } from 'react';

export interface AdminNavbarProps {
  searchPlaceholder: string;
}

export interface AdminAnalyticsHeaderProps {
  title: string;
  description: string;
}

export interface AdminAnalyticsKpiCardProps {
  label: string;
  value: string;
  delta: string;
}

export interface AdminBookingsFiltersProps {
  searchPlaceholder: string;
}

export interface AdminBookingsTableProps {
  rows: string[][];
}

export interface AdminDashboardStatCardProps {
  label: string;
  value: string;
  trend: string;
}

export interface AdminPropertiesTableProps {
  rows: string[][];
}

export interface AdminUsersTableProps {
  rows: string[][];
}

export interface AdminPageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export interface AdminTableProps {
  headers: string[];
  rows: string[][];
  renderLastColumn?: (row: string[]) => ReactNode;
}
