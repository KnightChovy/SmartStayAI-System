import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import InfoPageHeader from '../../components/shared/InfoPageHeader';

const CATEGORY_ICONS = ['travel_explore', 'payments', 'login', 'support_agent'];

export default function HelpCenterPage() {
  const { t } = useTranslation('pages');
  const [open, setOpen] = useState<number | null>(0);
  const categories = t('help.categories', { returnObjects: true });
  const faqs = t('help.faqs', { returnObjects: true });

  return (
    <div className="py-12 w-full">
      <InfoPageHeader
        eyebrow={t('help.eyebrow')}
        title={t('help.title')}
        description={t('help.description')}
      />

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8 mb-14">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
            search
          </span>
          <input
            type="search"
            placeholder={t('help.searchPlaceholder')}
            className="w-full h-14 pl-12 pr-4 rounded-full bg-surface-container-low border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-be-vietnam"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <div
              key={cat.title}
              className="p-6 rounded-3xl bg-white ring-1 ring-outline-variant/10 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary">
                  {CATEGORY_ICONS[i]}
                </span>
              </div>
              <h3 className="font-bold text-on-surface font-be-vietnam mb-2">
                {cat.title}
              </h3>
              <p className="text-sm text-on-surface-variant font-be-vietnam">
                {cat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8">
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-6">
          {t('help.faqTitle')}
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={faq.q}
              className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left cursor-pointer"
              >
                <span className="font-semibold text-on-surface font-be-vietnam">
                  {faq.q}
                </span>
                <span
                  className={`material-symbols-outlined text-on-surface-variant transition-transform ${
                    open === i ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>
              {open === i && (
                <p className="px-5 pb-5 text-sm text-on-surface-variant font-be-vietnam leading-relaxed">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
