import { useTranslation } from 'react-i18next';
import InfoPageHeader from '../../components/shared/InfoPageHeader';
import { Button } from '../../components/ui/button';

export default function PressPage() {
  const { t } = useTranslation('pages');
  const releases = t('press.releases', { returnObjects: true });
  return (
    <div className="py-12 w-full">
      <InfoPageHeader
        eyebrow={t('press.eyebrow')}
        title={t('press.title')}
        description={t('press.description')}
      />

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8 mb-12">
        <div className="rounded-3xl bg-primary text-on-primary p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-be-vietnam text-xl font-bold mb-1">
              {t('press.mediaKit')}
            </h2>
            <p className="text-on-primary/80 text-sm font-be-vietnam">
              {t('press.mediaKitDesc')}
            </p>
          </div>
          <Button
            variant="secondary"
            className="rounded-full shrink-0 bg-white text-primary hover:bg-white/90"
          >
            {t('press.downloadKit')}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8">
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-6">
          {t('press.recentCoverage')}
        </h2>
        <div className="space-y-4">
          {releases.map(r => (
            <div
              key={r.title}
              className="p-6 rounded-2xl bg-white ring-1 ring-outline-variant/10 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-primary uppercase tracking-widest font-be-vietnam">
                  {r.source}
                </span>
                <span className="text-xs text-on-surface-variant font-be-vietnam">
                  {r.date}
                </span>
              </div>
              <h3 className="font-bold text-on-surface font-be-vietnam">
                {r.title}
              </h3>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8 mt-12 text-center">
        <p className="text-on-surface-variant font-be-vietnam">
          {t('press.inquiries')}
          <a
            href="mailto:press@stayhub.ai"
            className="text-primary font-semibold hover:underline"
          >
            press@stayhub.ai
          </a>
        </p>
      </div>
    </div>
  );
}
