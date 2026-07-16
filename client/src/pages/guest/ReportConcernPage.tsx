import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import InfoPageHeader from '../../components/shared/InfoPageHeader';
import { Button } from '../../components/ui/button';

export default function ReportConcernPage() {
  const { t } = useTranslation('pages');
  const topics = t('report.topics', { returnObjects: true });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Client-only demo — no backend call.
    setSubmitted(true);
  };

  return (
    <div className="py-12 w-full">
      <InfoPageHeader
        eyebrow={t('report.eyebrow')}
        title={t('report.title')}
        description={t('report.description')}
      />

      <div className="max-w-2xl mx-auto px-margin-mobile md:px-8">
        {submitted ? (
          <div className="rounded-3xl bg-white ring-1 ring-outline-variant/10 shadow-sm p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-primary text-3xl">
                task_alt
              </span>
            </div>
            <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-2">
              {t('report.receivedTitle')}
            </h2>
            <p className="text-on-surface-variant font-be-vietnam mb-6">
              {t('report.receivedBody')}
            </p>
            <Button
              onClick={() => setSubmitted(false)}
              className="rounded-full px-6"
            >
              {t('report.submitAnother')}
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white ring-1 ring-outline-variant/10 shadow-sm p-8 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2 font-be-vietnam">
                  {t('report.fullName')}
                </label>
                <input
                  required
                  type="text"
                  placeholder={t('report.namePlaceholder')}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-be-vietnam"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2 font-be-vietnam">
                  {t('report.email')}
                </label>
                <input
                  required
                  type="email"
                  placeholder={t('report.emailPlaceholder')}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-be-vietnam"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2 font-be-vietnam">
                {t('report.typeLabel')}
              </label>
              <select
                required
                defaultValue=""
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-be-vietnam"
              >
                <option value="" disabled>
                  {t('report.selectTopic')}
                </option>
                {topics.map(topic => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2 font-be-vietnam">
                {t('report.bookingCode')}
              </label>
              <input
                type="text"
                placeholder={t('report.bookingPlaceholder')}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-be-vietnam"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2 font-be-vietnam">
                {t('report.whatHappened')}
              </label>
              <textarea
                required
                rows={5}
                placeholder={t('report.detailsPlaceholder')}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-be-vietnam resize-none"
              />
            </div>

            <Button type="submit" className="w-full h-12 rounded-full">
              {t('report.submit')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
