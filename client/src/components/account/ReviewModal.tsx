import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, PencilLine, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateReview, useUpdateReview } from '@/hooks/bookings';
import StarRating from '@/components/shared/StarRating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ReviewItem } from '@/types/account.types';

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  /** Hiển thị (read-only) để khách yên tâm đang đánh giá đúng chuyến — KHÔNG gửi lên BE. */
  hotelName: string;
  bookingCode: string;
  /** Có review sẵn cho booking này → modal chuyển sang chế độ sửa (PATCH). */
  existingReview?: ReviewItem | null;
}

const SUBSCORES = [
  { key: 'cleanlinessRating', labelKey: 'review.cleanliness' },
  { key: 'serviceRating', labelKey: 'review.service' },
  { key: 'locationRating', labelKey: 'review.location' },
  { key: 'valueRating', labelKey: 'review.value' },
] as const;

type SubKey = (typeof SUBSCORES)[number]['key'];

/** Lấy message lỗi từ axios error mà không dùng `any`. */
function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    return resp?.data?.message ?? fallback;
  }
  return fallback;
}

/** Thang điểm đánh giá (BE thang 10) — khác hạng sao KS. */
const RATING_MAX = 10;

const EMPTY = {
  cleanlinessRating: RATING_MAX,
  serviceRating: RATING_MAX,
  locationRating: RATING_MAX,
  valueRating: RATING_MAX,
  title: '',
  content: '',
  images: [] as string[],
};

/**
 * Modal viết đánh giá cho một booking đã trả phòng. Mở ngay tại trang booking detail,
 * điền sẵn tên khách sạn + mã booking (read-only); gửi ngầm `bookingId` — BE tự suy ra hotel.
 */
export default function ReviewModal({
  open,
  onClose,
  bookingId,
  hotelName,
  bookingCode,
  existingReview,
}: ReviewModalProps) {
  const { t } = useTranslation('account');
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const isEdit = !!existingReview;
  const [form, setForm] = useState(EMPTY);
  const [imageUrl, setImageUrl] = useState('');

  // Mở lại / đổi review → nạp lại form. Chỉnh trong render (không dùng effect) để tránh cascading
  // render; khoá theo id review nên không clobber khi khách đang gõ (open + cùng review = không reset).
  const reviewKey = open ? (existingReview?.id ?? 'new') : null;
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  if (reviewKey !== syncedKey) {
    setSyncedKey(reviewKey);
    if (open) {
      setForm(
        existingReview
          ? {
              cleanlinessRating: existingReview.cleanlinessRating,
              serviceRating: existingReview.serviceRating,
              locationRating: existingReview.locationRating,
              valueRating: existingReview.valueRating,
              title: existingReview.title ?? '',
              content: existingReview.content,
              images: existingReview.images,
            }
          : EMPTY
      );
      setImageUrl('');
    }
  }

  // Đóng bằng phím Esc.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // Overall = trung bình 4 tiêu chí; BE cần số nguyên 1–10 nên làm tròn khi gửi.
  const avgRating =
    (form.cleanlinessRating + form.serviceRating + form.locationRating + form.valueRating) / 4;
  const overallRating = Math.round(avgRating);

  const addImage = () => {
    if (imageUrl.trim()) {
      set('images', [...form.images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const isPending = createReview.isPending || updateReview.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    try {
      if (existingReview) {
        // Sửa: gửi toàn bộ field hiện tại (title '' → BE tự set null; images [] → xoá hết ảnh).
        await updateReview.mutateAsync({
          reviewId: existingReview.id,
          payload: {
            overallRating,
            cleanlinessRating: form.cleanlinessRating,
            serviceRating: form.serviceRating,
            locationRating: form.locationRating,
            valueRating: form.valueRating,
            title: form.title.trim(),
            content: form.content.trim(),
            images: form.images,
          },
        });
        toast.success(t('review.updated'));
      } else {
        await createReview.mutateAsync({
          bookingId,
          overallRating,
          cleanlinessRating: form.cleanlinessRating,
          serviceRating: form.serviceRating,
          locationRating: form.locationRating,
          valueRating: form.valueRating,
          title: form.title.trim() || undefined,
          content: form.content.trim(),
          images: form.images.length ? form.images : undefined,
        });
        toast.success(t('review.published'));
      }
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, t('review.submitError')));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/30 px-6 py-4">
          <div>
            <h2 className="font-be-vietnam text-lg font-bold text-on-surface">
              {isEdit ? t('review.editTitle') : t('review.writeTitle')}
            </h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              {hotelName} · {bookingCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-low"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {/* Context read-only — cho khách biết đang đánh giá đúng chuyến, không sửa được */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>{t('review.hotel')}</Label>
              <Input value={hotelName} disabled readOnly />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('review.bookingCode')}</Label>
              <Input value={bookingCode} disabled readOnly />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              {t('review.overall')}{' '}
              <span className="font-normal text-on-surface-variant">
                {t('review.overallHint')}
              </span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-baseline gap-0.5 rounded-lg bg-premium-gold px-2.5 py-1 text-on-surface">
                <span className="text-xl font-bold">{avgRating.toFixed(1)}</span>
                <span className="text-xs font-semibold opacity-70">/ {RATING_MAX}</span>
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {SUBSCORES.map(({ key, labelKey }) => (
              <div
                key={key}
                className="flex flex-col gap-1.5 rounded-xl bg-surface-container-low px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">{t(labelKey)}</span>
                  <span className="text-sm font-semibold text-on-surface">
                    {form[key as SubKey]}/{RATING_MAX}
                  </span>
                </div>
                {/* Bộ chọn điểm 1–10 (thang 10) */}
                <StarRating
                  value={form[key as SubKey]}
                  editable
                  max={RATING_MAX}
                  size={16}
                  onChange={v => set(key as SubKey, v)}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('review.titleLabel')}</Label>
            <Input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder={t('review.titlePlaceholder')}
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('review.content')}</Label>
            <textarea
              rows={4}
              required
              value={form.content}
              onChange={e => set('content', e.target.value)}
              maxLength={2000}
              className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder={t('review.contentPlaceholder')}
            />
          </div>

          {/* Photos (paste image URL) */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('review.photos')}</Label>
            <div className="flex gap-2">
              <Input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder={t('review.photoPlaceholder')}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImage();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addImage}>
                <ImagePlus className="size-4" /> {t('review.add')}
              </Button>
            </div>
            {form.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.images.map((url, i) => (
                  <div key={i} className="relative size-16 overflow-hidden rounded-lg border">
                    <img src={url} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          'images',
                          form.images.filter((_, j) => j !== i)
                        )
                      }
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-outline-variant/30 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('review.cancel')}
          </Button>
          <Button
            type="submit"
            className="bg-primary text-on-primary hover:bg-primary/90"
            disabled={isPending || !form.content.trim()}
          >
            {isPending ? (
              isEdit ? (
                t('review.saving')
              ) : (
                t('review.publishing')
              )
            ) : isEdit ? (
              <>
                <PencilLine className="size-4" /> {t('review.saveChanges')}
              </>
            ) : (
              <>
                <Star className="size-4" /> {t('review.publish')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
