/**
 * Thang điểm ĐÁNH GIÁ của khách (overall + tiêu chí + avgRating) — BE dùng thang 10.
 * ⚠️ Khác với HẠNG SAO khách sạn (`starRating`, 1–5 sao) là phân loại cơ sở vật chất.
 */
export const REVIEW_SCORE_MAX = 10;

/** Key i18n nhãn chữ cho điểm 0–10 (theo tinh thần Booking "8.9 Excellent"). */
export function scoreLabelKey(score: number) {
  if (score >= 9) return 'reviews.exceptional' as const;
  if (score >= 8) return 'reviews.excellent' as const;
  if (score >= 7) return 'reviews.veryGood' as const;
  if (score >= 6) return 'reviews.good' as const;
  return 'reviews.score' as const;
}

/**
 * Màu nền badge điểm đánh giá theo mức (thang 10) — điểm cao xanh, thấp cam.
 * Cố ý KHÔNG dùng vàng (`premium-gold`) để không lẫn với hạng sao khách sạn.
 */
export function scoreColorClass(score: number): string {
  if (score >= 8) return 'bg-emerald-600 text-white';
  if (score >= 6) return 'bg-teal-600 text-white';
  if (score >= 4) return 'bg-amber-500 text-white';
  return 'bg-orange-500 text-white';
}
