import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

export default function Promotions() {
  const { t } = useTranslation('home');
  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Summer Offer */}
        <div className="relative h-64 rounded-3xl overflow-hidden group cursor-pointer border border-outline-variant/20">
          <img
            alt="Summer Offer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwZm1mLcG2uWK34GELni3l9M7LTJOdSHF3oKKSUo1DlUmMrviQlkcFGUW4uyn6qZaipqVvFD4qKsjyyrb0drSGMbC_cUeTMUrX1DrsSM5Uws1-8THrXrlDlSVq6skw4ndssX1TymM2_J8kkdWoE_UDQCN_jFaeqtZOGzSJ4MnmhyzacsThZjWG5w8NRYDjL-FaVwjeiHg7sbavK-hk0SoD-Dd47Ec3BeG-buhT2iLnozQKMYWsdLnOt6duhci7v9sK1NQpKysIDNYu"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/60 to-transparent flex flex-col justify-center p-8">
            <span className="bg-ai-glow text-on-surface text-[10px] font-bold px-3 py-1 rounded-full w-fit mb-3 uppercase tracking-wider">
              {t('promotions.summer.badge')}
            </span>
            <h3 className="text-white text-xl md:text-2xl font-bold mb-2 font-be-vietnam">
              {t('promotions.summer.title')}
            </h3>
            <p className="text-white/80 text-sm mb-6 font-be-vietnam">
              {t('promotions.summer.desc')}
            </p>
            <Button className="bg-white text-on-surface px-6 py-2 rounded-xl text-xs font-bold w-fit hover:bg-surface-variant transition-colors border-none h-auto">
              {t('promotions.summer.cta')}
            </Button>
          </div>
        </div>

        {/* Member Deals */}
        <div className="relative h-64 rounded-3xl overflow-hidden group cursor-pointer border border-outline-variant/20">
          <img
            alt="Member Deals"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwbaucmuTapC804rAWuD3gnUC6PnXaPkoL9tSk7Hma_8E5oYnNAj7OMBKvAltg-TaoXpycEY1cCxHOYdUBoUpZUUK2FSq3S2a0E-clguSD91SaLCCwKpZoboLABtfiYLbC9PlOsECBor4ukUATq__aBjpFIn-hV5ZrdYuRD3vNfldHnHPntVBlg_LGxk4hAvzAjglhP-Ky2zLk29BOsVmdsTw-_RSnYYA6V-pYgsU-RqzkTw_7KR2PyS0b7cwHT9wgCseWi_U3LhYy"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/60 to-transparent flex flex-col justify-center p-8">
            <span className="bg-premium-gold text-white text-[10px] font-bold px-3 py-1 rounded-full w-fit mb-3 uppercase tracking-wider">
              {t('promotions.member.badge')}
            </span>
            <h3 className="text-white text-xl md:text-2xl font-bold mb-2 font-be-vietnam">
              {t('promotions.member.title')}
            </h3>
            <p className="text-white/80 text-sm mb-6 font-be-vietnam">
              {t('promotions.member.desc')}
            </p>
            <Button className="bg-white text-on-surface px-6 py-2 rounded-xl text-xs font-bold w-fit hover:bg-surface-variant transition-colors border-none h-auto">
              {t('promotions.member.cta')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
