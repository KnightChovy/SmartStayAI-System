/**
 * Thang điểm ĐÁNH GIÁ của khách (overall + tiêu chí + avgRating) — thang 10, bám theo web FE.
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
 * Màu badge điểm đánh giá theo mức (thang 10) — cao xanh, thấp cam. Trả hex cho inline style
 * (RN không dùng class động tiện như web). Cố ý KHÔNG dùng vàng để không lẫn với hạng sao.
 */
export function scoreColor(score: number): { bg: string; text: string } {
  if (score >= 8) return { bg: '#059669', text: '#ffffff' }; // emerald-600
  if (score >= 6) return { bg: '#0D9488', text: '#ffffff' }; // teal-600
  if (score >= 4) return { bg: '#F59E0B', text: '#ffffff' }; // amber-500
  return { bg: '#F97316', text: '#ffffff' }; // orange-500
}
