import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Tag } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import HeroSearchBar from '../search/HeroSearchBar';

export default function Hero() {
  const { t } = useTranslation('home');

  return (
    <section className="relative pt-20 pb-24 px-margin-mobile overflow-hidden bg-surface w-full">
      {/* Background image layer */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://imagevietnam.vnanet.vn//MediaUpload/Org/2023/07/27/5-cover27-10-19-16.jpg')",
        }}
      />
      {/* Dark gradient overlay để chữ trắng đọc rõ trên mọi ảnh nền (contrast WCAG AA — SS-002) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-linear-to-t from-black/70 via-black/45 to-black/30"
      />
      <div className="relative z-10 max-w-4xl mx-auto text-center mb-12">
        <h1 className="font-be-vietnam text-display-lg md:text-6xl text-white mb-6 font-bold leading-tight drop-shadow-lg">
          {t('hero.title')}
        </h1>
        <p className="font-be-vietnam text-lg text-white/90 max-w-xl mx-auto drop-shadow">
          {t('hero.subtitle')}
        </p>
        {/* CTA phụ dưới tiêu đề — link nhanh tới ưu đãi */}
        <Link
          to={ROUTES.deals}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm transition-colors hover:bg-white/25"
        >
          <Tag className="size-4" /> {t('hero.dealsCta')}
        </Link>
      </div>
      {/* Search Bar Area */}
      <div className="relative z-20 mx-auto max-w-5xl">
        <HeroSearchBar />
      </div>
    </section>
  );
}
