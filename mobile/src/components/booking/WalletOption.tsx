import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { useMyWallet } from '@/hooks/wallet';
import { formatVnd } from '@/utils/formatCurrency';
import { GUEST_COLORS } from '@/constants/guestTheme';

interface WalletOptionProps {
  /** Tổng tiền đơn đang chờ trả — dùng để tính `walletApplied`/`remainingToPay`. */
  total: number;
  /**
   * `null` = khách CHƯA tự bấm gì (mặc định tick sẵn khi có số dư — đọc `?? true`
   * lúc render, không set-state trong effect). `true/false` = khách đã tự chọn.
   */
  choice: boolean | null;
  onChange: (next: boolean) => void;
}

/**
 * Checkbox "dùng ví trả trước" ở bước thanh toán — mirror `WalletOption` phía client
 * (`BookingCheckoutPage` — mặc định TICK SẴN, khách bỏ chọn được). Tự ẩn khi khách
 * chưa có ví hoặc số dư bằng 0.
 */
export function WalletOption({ total, choice, onChange }: WalletOptionProps) {
  const { t } = useTranslation('booking');
  const { data: wallet } = useMyWallet();
  const balance = Number(wallet?.balanceAvailable ?? 0);
  const useWallet = choice ?? true;

  if (!wallet || balance <= 0) return null;

  const walletApplied = Math.min(balance, total);
  const remainingToPay = Math.max(total - walletApplied, 0);
  const coversAll = useWallet && remainingToPay <= 0;

  return (
    <Pressable
      onPress={() => onChange(!useWallet)}
      className="flex-row items-start gap-3 rounded-2xl border border-hairline/60 bg-surface-container-low p-4"
    >
      <View
        className="w-5 h-5 rounded-md border items-center justify-center mt-0.5"
        style={{
          borderColor: useWallet ? GUEST_COLORS.bronze : GUEST_COLORS.hairline,
          backgroundColor: useWallet ? GUEST_COLORS.bronze : 'transparent',
        }}
      >
        {useWallet ? <Ionicons name="checkmark" size={14} color={GUEST_COLORS.white} /> : null}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="wallet-outline" size={16} color={GUEST_COLORS.bronze} />
          <Text bold className="font-bevi-bold text-on-surface text-sm">
            {t('payment.walletUse', { amount: formatVnd(walletApplied) })}
          </Text>
        </View>
        <Text size="xs" className="font-bevi text-muted mt-0.5">
          {t('payment.walletBalanceLine', { balance: formatVnd(balance) })}
        </Text>
        <Text size="xs" className="font-bevi text-on-surface-variant mt-0.5">
          {coversAll
            ? t('payment.walletCovers')
            : t('payment.walletPartialSplit', {
                applied: formatVnd(walletApplied),
                remaining: formatVnd(remainingToPay),
              })}
        </Text>
      </View>
    </Pressable>
  );
}
