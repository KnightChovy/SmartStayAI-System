import { useTranslation } from 'react-i18next';
import InfoPageHeader from '../../components/shared/InfoPageHeader';
import { Button } from '../../components/ui/button';

const PERK_ICONS = ['rocket_launch', 'public', 'flight_takeoff', 'school'];

export default function CareersPage() {
  const { t } = useTranslation('pages');
  const perks = t('careers.perks', { returnObjects: true });
  const openings = t('careers.openings', { returnObjects: true });
  return (
    <div className="py-12 w-full">
      <InfoPageHeader
        eyebrow={t('careers.eyebrow')}
        title={t('careers.title')}
        description={t('careers.description')}
      />

      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {perks.map((label, i) => (
            <div
              key={label}
              className="flex items-center gap-3 p-5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-primary">
                {PERK_ICONS[i]}
              </span>
              <span className="text-sm font-semibold text-on-surface font-be-vietnam">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8">
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-6">
          {t('careers.openPositions')}
        </h2>
        <div className="space-y-4">
          {openings.map(job => (
            <div
              key={job.title}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white ring-1 ring-outline-variant/10 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <h3 className="font-bold text-on-surface font-be-vietnam">
                  {job.title}
                </h3>
                <p className="text-sm text-on-surface-variant font-be-vietnam mt-1">
                  {job.team} · {job.location} · {job.type}
                </p>
              </div>
              <Button variant="outline" className="rounded-full shrink-0">
                {t('careers.apply')}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
