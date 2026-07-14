import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { useCurrencyStore, type Currency } from '@/stores/currencyStore';
import { cn } from '@/lib/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const OPTIONS: { value: Currency; symbol: string; label: string }[] = [
  { value: 'VND', symbol: '₫', label: 'VND' },
  { value: 'USD', symbol: '$', label: 'USD' },
];

interface CurrencySwitcherProps {
  className?: string;
}

/** Đổi tiền tệ hiển thị (VND/USD). Giá được quy đổi qua `useMoney()`. */
export function CurrencySwitcher({ className }: CurrencySwitcherProps) {
  const { t } = useTranslation();
  const currency = useCurrencyStore(s => s.currency);
  const setCurrency = useCurrencyStore(s => s.setCurrency);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors outline-none cursor-pointer',
          className
        )}
        aria-label={t('currency.label')}
      >
        {currency}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {OPTIONS.map(opt => (
          <DropdownMenuItem
            key={opt.value}
            onSelect={() => setCurrency(opt.value)}
            className="cursor-pointer justify-between"
          >
            <span>
              <span className="inline-block w-4 text-on-surface-variant">
                {opt.symbol}
              </span>{' '}
              {opt.label}
            </span>
            {currency === opt.value && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
