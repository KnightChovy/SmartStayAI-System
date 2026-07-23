import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import visaLogo from '@/assets/images/visa_logo.png';
import mastercardLogo from '@/assets/images/mastercard_logo.png';
import vnpayLogo from '@/assets/images/vnpay_logo.png';
import sepayLogo from '@/assets/images/sepay_logo.png';

interface PaymentBadgesProps {
  className?: string;
}

// Cổng thanh toán sàn hỗ trợ (khớp luồng thật: VNPAY redirect + SePay QR, thẻ Visa/Mastercard).
const LOGOS = [
  { src: vnpayLogo, alt: 'VNPAY' },
  { src: sepayLogo, alt: 'SePay' },
  { src: visaLogo, alt: 'Visa' },
  { src: mastercardLogo, alt: 'Mastercard' },
];

const REEL = [...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS];

export default function PaymentBadges({ className }: PaymentBadgesProps) {
  const { t } = useTranslation('common');

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Marquee: che mờ 2 mép để logo trôi vào/ra êm */}
      <div className="w-full overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <motion.div
          className="flex w-max items-center gap-4"
          // x: -50% → 0% ⇒ nội dung dịch sang phải (chạy từ trái qua phải)
          animate={{ x: ['-50%', '0%'] }}
          transition={{ duration: 24, ease: 'linear', repeat: Infinity }}
        >
          {[...REEL, ...REEL].map((logo, i) => (
            <span
              key={`${logo.alt}-${i}`}
              className="flex h-14 w-28 shrink-0 items-center justify-center rounded-xl border border-outline-variant/40 bg-white px-4 shadow-sm"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                loading="lazy"
                className="max-h-8 w-auto max-w-full object-contain"
              />
            </span>
          ))}
        </motion.div>
      </div>

      <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
        <Lock className="size-3.5" aria-hidden="true" /> {t('trust.sslSecured')}
      </span>
    </div>
  );
}
