import { useTranslation } from 'react-i18next';
import { Check, Globe } from 'lucide-react';
import { SUPPORTED_LANGS, type AppLang } from '@/i18n';
import { cn } from '@/lib/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LANG_LABEL: Record<AppLang, string> = { vi: 'VI', en: 'EN' };

interface LanguageSwitcherProps {
  className?: string;
}

/** Đổi ngôn ngữ giao diện (vi/en). Lựa chọn được i18next lưu vào localStorage. */
export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const current = (SUPPORTED_LANGS.includes(i18n.language as AppLang)
    ? i18n.language
    : 'vi') as AppLang;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors outline-none cursor-pointer',
          className
        )}
        aria-label={t('language.label')}
      >
        <Globe className="size-4" />
        {LANG_LABEL[current]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {SUPPORTED_LANGS.map(lng => (
          <DropdownMenuItem
            key={lng}
            onSelect={() => i18n.changeLanguage(lng)}
            className="cursor-pointer justify-between"
          >
            {t(`language.${lng}`)}
            {current === lng && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
