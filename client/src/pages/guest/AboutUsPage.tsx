import { useTranslation } from 'react-i18next';
import InfoPageHeader from '../../components/shared/InfoPageHeader';

const VALUE_ICONS = ['auto_awesome', 'spa', 'handshake'];

export default function AboutUsPage() {
  const { t } = useTranslation('pages');
  const stats = t('about.stats', { returnObjects: true });
  const values = t('about.values', { returnObjects: true });
  return (
    <div className="py-12 w-full">
      <InfoPageHeader
        eyebrow={t('about.eyebrow')}
        title={t('about.title')}
        description={t('about.description')}
      />

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8 mb-16">
        <div className="rounded-3xl overflow-hidden shadow-md mb-10">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop"
            alt={t('about.imageAlt')}
            className="w-full h-64 object-cover"
          />
        </div>
        <p className="text-on-surface-variant font-be-vietnam leading-relaxed mb-4">
          {t('about.p1')}
        </p>
        <p className="text-on-surface-variant font-be-vietnam leading-relaxed">
          {t('about.p2')}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(s => (
            <div
              key={s.label}
              className="text-center p-8 rounded-3xl bg-surface-container-low/60 border border-outline-variant/30"
            >
              <p className="text-3xl font-bold text-primary font-be-vietnam mb-1">
                {s.value}
              </p>
              <p className="text-sm text-on-surface-variant font-be-vietnam">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8">
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-6 text-center">
          {t('about.whatWeValue')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <div
              key={v.title}
              className="p-6 rounded-3xl bg-white ring-1 ring-outline-variant/10 shadow-sm"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary">
                  {VALUE_ICONS[i]}
                </span>
              </div>
              <h3 className="font-bold text-on-surface font-be-vietnam mb-2">
                {v.title}
              </h3>
              <p className="text-sm text-on-surface-variant font-be-vietnam">
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
