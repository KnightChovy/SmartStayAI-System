import { useLocalStorageList } from '@/hooks/admin-tools/use-local-storage-list';
import type {
  AdminTask,
  AdminTaskPriority,
  AdminTaskStatus,
} from '@/types/admin-tools.types';

const STORAGE_KEY = 'admin.tasks';

const STATUS_CYCLE: AdminTaskStatus[] = ['To do', 'In progress', 'Done'];

export function useAdminTasks() {
  const { items, add, update, remove } = useLocalStorageList<AdminTask>(STORAGE_KEY);

  const addTask = (task: string, priority: AdminTaskPriority, due?: string) => {
    add({
      id: crypto.randomUUID(),
      task: task.trim(),
      priority,
      status: 'To do',
      due: due || undefined,
      createdAt: new Date().toISOString(),
    });
  };

  const cycleStatus = (id: string) => {
    const task = items.find(item => item.id === id);
    if (!task) return;
    const nextIndex = (STATUS_CYCLE.indexOf(task.status) + 1) % STATUS_CYCLE.length;
    update(id, { status: STATUS_CYCLE[nextIndex] });
  };

  const tasks = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const openCount = tasks.filter(task => task.status !== 'Done').length;

  return { tasks, openCount, addTask, cycleStatus, removeTask: remove };
}
