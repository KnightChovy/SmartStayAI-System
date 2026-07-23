import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

export default function LoyaltyBanner() {
  const navigate = useNavigate();
  const { t } = useTranslation('home');
  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <div className="relative rounded-3xl bg-inverse-surface p-12 md:p-16 overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')",
          }}
        ></div>
        <div className="relative z-10 max-w-xl text-center lg:text-left">
          <h2 className="font-be-vietnam text-3xl md:text-display-lg text-white mb-6 font-bold">
            {t('loyalty.title')}
          </h2>
          <p className="text-sm md:text-base text-inverse-on-surface/80 mb-4 font-be-vietnam">
            {t('loyalty.subtitle')}
          </p>
          <div className="flex flex-wrap gap-6 mt-8 justify-center lg:justify-start">
            <div className="flex items-center gap-2 text-white/90">
              <span className="material-symbols-outlined text-ai-glow">
                check_circle
              </span>
              <span className="text-xs font-semibold font-be-vietnam">
                {t('loyalty.pointsBack')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <span className="material-symbols-outlined text-ai-glow">
                check_circle
              </span>
              <span className="text-xs font-semibold font-be-vietnam">
                {t('loyalty.freeUpgrades')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <span className="material-symbols-outlined text-ai-glow">
                check_circle
              </span>
              <span className="text-xs font-semibold font-be-vietnam">
                {t('loyalty.prioritySupport')}
              </span>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Nút chính trước đây là `bg-primary` (#5f5e5b) đặt trên nền `inverse-surface`
              (#313030) — hai màu xám sát nhau, contrast ~1.4:1 nên nút gần như tàng hình. */}
          <Button
            onClick={() => navigate('/account/loyalty')}
            variant="cta"
            className="h-auto rounded-2xl px-10 py-5 font-be-vietnam text-sm shadow-lg"
          >
            {t('loyalty.joinRewards')}
          </Button>
          <Button
            onClick={() => navigate('/deals')}
            className="px-10 py-5 bg-white/10 backdrop-blur-md border border-white/40 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all text-center cursor-pointer font-be-vietnam text-sm h-auto"
          >
            {t('loyalty.learnMore')}
          </Button>
        </div>
      </div>
    </section>
  );
}
