/**
 * Các "admin productivity tool" (Notes/Tasks/Calendar/Maintenance reminder) không có domain
 * model ở backend — dữ liệu lưu cục bộ theo trình duyệt (localStorage), riêng theo từng admin.
 */

export interface AdminNote {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
}

export type AdminTaskPriority = 'High' | 'Mid' | 'Low';
export type AdminTaskStatus = 'To do' | 'In progress' | 'Done';

export interface AdminTask {
  id: string;
  task: string;
  priority: AdminTaskPriority;
  status: AdminTaskStatus;
  due?: string;
  createdAt: string;
}

export interface AdminCalendarEvent {
  id: string;
  title: string;
  /** YYYY-MM-DD (giờ địa phương trình duyệt) */
  date: string;
  time: string;
  label: string;
  createdAt: string;
}

export interface AdminMaintenanceReminder {
  title: string;
  date: string;
  time: string;
  notes: string;
  createdAt: string;
}
