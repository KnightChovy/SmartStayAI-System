import { useTranslation } from 'react-i18next';
import InfoPageHeader from '../../components/shared/InfoPageHeader';

const PILLAR_ICONS = ['verified_user', 'lock', 'health_and_safety', 'support_agent'];

export default function SafetyInformationPage() {
  const { t } = useTranslation('pages');
  const pillars = t('safety.pillars', { returnObjects: true });
  const tips = t('safety.tips', { returnObjects: true });
  return (
    <div className="py-12 w-full">
      <InfoPageHeader
        eyebrow={t('safety.eyebrow')}
        title={t('safety.title')}
        description={t('safety.description')}
      />

      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, i) => (
            <div
              key={p.title}
              className="p-6 rounded-3xl bg-white ring-1 ring-outline-variant/10 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary">
                  {PILLAR_ICONS[i]}
                </span>
              </div>
              <h3 className="font-bold text-on-surface font-be-vietnam mb-2">
                {p.title}
              </h3>
              <p className="text-sm text-on-surface-variant font-be-vietnam">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8">
        <div className="rounded-3xl bg-surface-container-low/60 border border-outline-variant/30 p-8">
          <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-6">
            {t('safety.tipsTitle')}
          </h2>
          <ul className="space-y-4">
            {tips.map(tip => (
              <li key={tip} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-premium-gold text-xl shrink-0">
                  check_circle
                </span>
                <span className="text-on-surface-variant font-be-vietnam">
                  {tip}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
