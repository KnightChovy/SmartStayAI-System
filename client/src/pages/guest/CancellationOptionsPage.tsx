import { useTranslation } from 'react-i18next';
import InfoPageHeader from '../../components/shared/InfoPageHeader';

const TIER_HIGHLIGHT = [true, false, false];

export default function CancellationOptionsPage() {
  const { t } = useTranslation('pages');
  const tiers = t('cancellation.tiers', { returnObjects: true });
  const steps = t('cancellation.steps', { returnObjects: true });
  return (
    <div className="py-12 w-full">
      <InfoPageHeader
        eyebrow={t('cancellation.eyebrow')}
        title={t('cancellation.title')}
        description={t('cancellation.description')}
      />

      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, ti) => {
            const highlight = TIER_HIGHLIGHT[ti];
            return (
            <div
              key={tier.name}
              className={`p-8 rounded-3xl transition-shadow ${
                highlight
                  ? 'bg-primary text-on-primary shadow-lg'
                  : 'bg-white ring-1 ring-outline-variant/10 shadow-sm hover:shadow-md'
              }`}
            >
              <h3 className="font-be-vietnam text-lg font-bold mb-1">
                {tier.name}
              </h3>
              <p
                className={`text-2xl font-bold font-be-vietnam mb-2 ${
                  highlight ? 'text-on-primary' : 'text-primary'
                }`}
              >
                {tier.refund}
              </p>
              <p
                className={`text-sm font-medium mb-4 ${
                  highlight
                    ? 'text-on-primary/80'
                    : 'text-on-surface-variant'
                }`}
              >
                {tier.window}
              </p>
              <p
                className={`text-sm font-be-vietnam ${
                  highlight
                    ? 'text-on-primary/90'
                    : 'text-on-surface-variant'
                }`}
              >
                {tier.desc}
              </p>
            </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8">
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-6">
          {t('cancellation.howToCancel')}
        </h2>
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={step} className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 font-be-vietnam">
                {i + 1}
              </span>
              <span className="text-on-surface-variant font-be-vietnam pt-1">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
