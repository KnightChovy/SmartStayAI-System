// components/common/AppFilter.tsx

import { Search, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterOption {
  label: string;
  value: string;
}

interface AppFilterProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  /** Mặc định "Search...". Đặt lại khi ô tìm kiếm áp cho một trường cụ thể (vd "Search full name"). */
  searchPlaceholder?: string;

  status?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: FilterOption[];
  statusPlaceholder?: string;

  /**
   * Ô lọc thứ hai. Tên "category" là do chỗ dùng đầu tiên, nhưng nó là ô lọc dùng chung —
   * đổi `categoryPlaceholder` để tái dụng cho Role, Method, Dimension...
   */
  category?: string;
  onCategoryChange?: (value: string) => void;
  categoryOptions?: FilterOption[];
  categoryPlaceholder?: string;

  sort?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: FilterOption[];
  sortPlaceholder?: string;

  onReset?: () => void;
  /** Khoá nút Reset khi chưa có bộ lọc nào đang bật. */
  resetDisabled?: boolean;
}

export default function AppFilter({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',

  status,
  onStatusChange,
  statusOptions = [],
  statusPlaceholder = 'Status',

  category,
  onCategoryChange,
  categoryOptions = [],
  categoryPlaceholder = 'Category',

  sort,
  onSortChange,
  sortOptions = [],
  sortPlaceholder = 'Sort By',

  onReset,
  resetDisabled = false,
}: AppFilterProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative min-w-62.5 flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

        <Input
          value={search ?? ''}
          placeholder={searchPlaceholder}
          className="pl-8.5"
          onChange={e => onSearchChange?.(e.target.value)}
        />
      </div>

      {statusOptions.length > 0 && (
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-45">
            <SelectValue placeholder={statusPlaceholder} />
          </SelectTrigger>

          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {categoryOptions.length > 0 && (
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-45">
            <SelectValue placeholder={categoryPlaceholder} />
          </SelectTrigger>

          <SelectContent>
            {categoryOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {sortOptions.length > 0 && (
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger className="w-45">
            <SelectValue placeholder={sortPlaceholder} />
          </SelectTrigger>

          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button variant="outline" onClick={onReset} disabled={resetDisabled}>
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>
    </div>
  );
}
