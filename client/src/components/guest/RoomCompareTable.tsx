import { useTranslation } from 'react-i18next';
import { Check, Minus } from 'lucide-react';
import { useMoney } from '@/hooks/currency';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import type { RoomType } from '@/types/hotel.types';

interface RoomCompareTableProps {
  roomTypes: RoomType[];
  onSelect: (roomType: RoomType) => void;
}

/** Một dòng so sánh: nhãn + cách lấy giá trị của từng phòng. */
interface CompareRow {
  key: string;
  /** Nhãn đã dịch sẵn (giữ literal key ở nơi gọi để `t()` type-safe). */
  label: string;
  value: (rt: RoomType) => string;
}

/**
 * Bảng so sánh các loại phòng cạnh nhau, **tô sáng ô khác biệt** (ô nào không giống
 * nhau ở mọi phòng thì làm nổi) — đúng vấn đề "không biết phòng khác nhau chỗ nào".
 * Chỉ hiện khi có ≥ 2 loại phòng.
 */
export default function RoomCompareTable({ roomTypes, onSelect }: RoomCompareTableProps) {
  const { t } = useTranslation('hotel');
  const { format } = useMoney();

  if (roomTypes.length < 2) return null;

  const rows: CompareRow[] = [
    {
      key: 'price',
      label: t('compare.price'),
      value: rt => (rt.totalPrice ? format(rt.totalPrice) : format(rt.basePrice)),
    },
    { key: 'occupancy', label: t('compare.occupancy'), value: rt => String(rt.maxOccupancy) },
    { key: 'bed', label: t('compare.bed'), value: rt => rt.bedType ?? '—' },
    { key: 'size', label: t('compare.size'), value: rt => (rt.areaSqm ? `${rt.areaSqm} m²` : '—') },
    { key: 'view', label: t('compare.view'), value: rt => rt.viewType ?? '—' },
  ];

  // Tiện nghi hợp nhất từ mọi phòng → mỗi tiện nghi là một dòng có/không.
  const allAmenities = [
    ...new Map(
      roomTypes.flatMap(rt => (rt.amenities ?? []).map(a => [a.amenity.id, a.amenity] as const))
    ).values(),
  ];

  /** Ô có khác biệt giữa các phòng → tô sáng để mắt bắt ngay. */
  const isDistinct = (values: string[]) => new Set(values).size > 1;

  return (
    <div className="overflow-x-auto rounded-2xl border border-outline-variant/30">
      <table className="w-full min-w-130 text-sm">
        <caption className="sr-only">{t('compare.caption')}</caption>
        <thead>
          <tr className="bg-surface-container-low/60">
            <th scope="col" className="p-3 text-left font-semibold text-on-surface-variant">
              {t('compare.feature')}
            </th>
            {roomTypes.map(rt => (
              <th key={rt.id} scope="col" className="p-3 text-left font-semibold text-on-surface">
                {rt.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/20">
          {rows.map(row => {
            const values = roomTypes.map(row.value);
            const distinct = isDistinct(values);
            return (
              <tr key={row.key}>
                <th scope="row" className="p-3 text-left font-normal text-on-surface-variant">
                  {row.label}
                </th>
                {values.map((v, i) => (
                  <td
                    key={roomTypes[i].id}
                    className={cn('p-3', distinct && 'bg-tertiary/5 font-semibold text-on-surface')}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            );
          })}

          {allAmenities.map(a => {
            const values = roomTypes.map(rt =>
              (rt.amenities ?? []).some(x => x.amenity.id === a.id) ? 'y' : 'n'
            );
            const distinct = isDistinct(values);
            return (
              <tr key={a.id}>
                <th scope="row" className="p-3 text-left font-normal text-on-surface-variant">
                  {a.name}
                </th>
                {values.map((v, i) => (
                  <td key={roomTypes[i].id} className={cn('p-3', distinct && 'bg-tertiary/5')}>
                    {v === 'y' ? (
                      <>
                        <Check className="size-4 text-emerald-600" aria-hidden="true" />
                        <span className="sr-only">{t('compare.included')}</span>
                      </>
                    ) : (
                      <>
                        <Minus className="size-4 text-on-surface-variant/40" aria-hidden="true" />
                        <span className="sr-only">{t('compare.notIncluded')}</span>
                      </>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}

          <tr>
            <td className="p-3" />
            {roomTypes.map(rt => (
              <td key={rt.id} className="p-3">
                <Button
                  size="sm"
                  variant="cta"
                  className="min-h-11"
                  onClick={() => onSelect(rt)}
                >
                  {t('room.bookNow')}
                </Button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
