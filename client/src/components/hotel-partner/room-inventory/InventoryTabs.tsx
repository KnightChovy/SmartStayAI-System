import { Layers, BedDouble, Tag } from 'lucide-react';
import { cn } from '@/lib/cn';

export type InventoryTabId = 'room-types' | 'rooms' | 'pricing';

const TABS: { id: InventoryTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'room-types', label: 'Room Types', icon: Layers },
  { id: 'rooms', label: 'Rooms', icon: BedDouble },
  { id: 'pricing', label: 'Pricing Rules', icon: Tag },
];

interface InventoryTabsProps {
  active: InventoryTabId;
  onChange: (tab: InventoryTabId) => void;
}

/** Thanh tab điều hướng giữa Room Types / Rooms / Pricing trong Room Inventory. */
export function InventoryTabs({ active, onChange }: InventoryTabsProps) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-role-partner-primary text-role-partner-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/** Type guard để đọc tab an toàn từ query string. */
export function isInventoryTab(value: string | null): value is InventoryTabId {
  return value === 'room-types' || value === 'rooms' || value === 'pricing';
}
