import { MoreHorizontal, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export interface ActionItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionItem[];
  /** Nhãn cho screen reader trên nút mở menu. */
  label?: string;
  /** Dùng icon "⋮" dọc thay cho "⋯" ngang. */
  vertical?: boolean;
  /** Biến thể nút mở menu (mặc định `outline`; dùng `ghost` cho trigger mờ, không viền). */
  triggerVariant?: React.ComponentProps<typeof Button>['variant'];
}

/**
 * Menu hành động dạng "⋯"/"⋮" dùng chung cho mọi bảng quản trị — thay cho việc
 * xếp nhiều nút icon nằm ngang (gọn gàng, dễ mở rộng thêm action).
 */
export function ActionMenu({
  items,
  label = 'Open actions',
  vertical = false,
  triggerVariant = 'outline',
}: ActionMenuProps) {
  if (items.length === 0) return null;

  const TriggerIcon = vertical ? MoreVertical : MoreHorizontal;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={triggerVariant}
          size="icon"
          aria-label={label}
          onClick={e => e.stopPropagation()}
        >
          <TriggerIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.label}
              variant={item.destructive ? 'destructive' : 'default'}
              disabled={item.disabled}
              className="cursor-pointer"
              onClick={e => e.stopPropagation()}
              onSelect={() => item.onClick()}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
