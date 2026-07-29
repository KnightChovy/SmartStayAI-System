import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BadgeCheck, Building2 } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

/** Cột trái thương hiệu + lợi ích (chỉ hiện từ lg trở lên). */
export function PartnerSignupBrandPanel() {
  const { t } = useTranslation('auth');
  const perks = [t('brand.perk1'), t('brand.perk2'), t('brand.perk3')];
  return (
    <div
      className="relative hidden lg:flex flex-col justify-between p-10 min-h-screen bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1600&auto=format&fit=crop')",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-role-partner-primary/90 via-role-partner-primary/50 to-slate-900/50"
      />
      <div className="relative z-10 flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-widest uppercase text-white">
          StayHub
        </h1>
        <Link
          to={ROUTES.listYourProperty}
          className="flex items-center gap-1 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-sm hover:bg-white/25 transition-colors"
        >
          {t('brand.learnMore')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="relative z-10 text-white">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-xs font-semibold mb-5">
          <Building2 className="w-3.5 h-3.5" /> {t('brand.badge')}
        </span>
        <h2 className="text-3xl font-bold max-w-sm leading-tight mb-6">
          {t('brand.title')}
        </h2>
        <ul className="space-y-3 text-sm text-white/90 max-w-sm">
          {perks.map(item => (
            <li key={item} className="flex items-center gap-2.5">
              <BadgeCheck className="w-5 h-5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
