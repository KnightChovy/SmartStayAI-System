import { Fragment, type ComponentProps } from 'react';
import { Image, Linking } from 'react-native';

import { Text } from '@/components/ui/text';

interface LinkifiedTextProps extends Omit<ComponentProps<typeof Text>, 'children'> {
  text: string;
  /** Nhãn nút thanh toán — mỗi màn tự truyền theo ngôn ngữ của mình (staff portal để tiếng Anh). */
  payLabel: string;
  /** Nhãn/alt của ảnh QR chuyển khoản. */
  qrLabel: string;
  linkClassName?: string;
  boldClassName?: string;
  payClassName?: string;
}

/**
 * Host của các cổng thanh toán. Chỉ link tới đúng những host này mới được nâng lên thành NÚT —
 * so theo `hostname` đã parse chứ không `includes()` trên chuỗi thô, để một URL bịa kiểu
 * `https://vnpayment.vn.ke-gian.com/...` không mạo danh được nút "Thanh toán".
 */
const PAYMENT_HOSTS = ['vnpayment.vn', 'vnpay.vn'];

/** Host trả về ẢNH QR chuyển khoản (SePay dựng sẵn ảnh VietQR) — render thẳng thành ảnh. */
const QR_IMAGE_HOSTS = ['qr.sepay.vn'];

// Bắt cả http(s) URL trần (chặn dấu câu cuối câu dính vào URL) LẪN `**in đậm**` kiểu Markdown —
// AI (Gemini) hay tự chèn cả hai vào câu trả lời dù không ai yêu cầu.
const TOKEN_REGEX = /\*\*([^*]+)\*\*|(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]])/g;

type Token =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'link'; value: string }
  | { type: 'pay'; value: string }
  | { type: 'qr'; value: string };

function hostMatches(url: string, hosts: string[]): boolean {
  try {
    const { hostname } = new URL(url);
    return hosts.some(h => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function classifyUrl(url: string): 'pay' | 'qr' | 'link' {
  if (hostMatches(url, PAYMENT_HOSTS)) return 'pay';
  if (hostMatches(url, QR_IMAGE_HOSTS)) return 'qr';
  return 'link';
}

function parseTokens(text: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      tokens.push({ type: 'bold', value: match[1] });
    } else {
      const url = match[2]!;
      tokens.push({ type: classifyUrl(url), value: url });
    }
    lastIndex = TOKEN_REGEX.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return tokens;
}

function openLink(url: string) {
  Linking.openURL(url).catch(() => {});
}

/**
 * Render text thô của AI trong bong bóng chat, nhận diện thêm 4 thứ hay lòi ra thô:
 * - URL trần → đoạn bấm được (`Linking.openURL`) thay vì bắt người dùng tự bôi đen copy/paste.
 * - Link cổng thanh toán (VNPay) → nút "Thanh toán ngay" nổi bật, không lẫn vào giữa câu.
 * - Link ảnh QR chuyển khoản (SePay) → render thẳng thành ảnh, khách quét được ngay trong khung
 *   chat thay vì nhận một chuỗi URL không thể quét.
 * - `**...**` → chữ đậm thật.
 *
 * Dùng `Image` gốc của `react-native` (KHÔNG phải `expo-image` như quy ước chung) vì chỉ core
 * `Image` mới nhúng được làm phần tử NỘI TUYẾN bên trong `Text` trên cả iOS lẫn Android.
 */
export function LinkifiedText({
  text,
  payLabel,
  qrLabel,
  linkClassName,
  boldClassName,
  payClassName,
  ...textProps
}: LinkifiedTextProps) {
  const tokens = parseTokens(text);

  return (
    <Text {...textProps}>
      {tokens.map((token, index) => {
        switch (token.type) {
          case 'link':
            return (
              <Text
                key={index}
                className={linkClassName ?? 'underline'}
                onPress={() => openLink(token.value)}
              >
                {token.value}
              </Text>
            );
          case 'pay':
            return (
              <Text
                key={index}
                bold
                className={
                  payClassName ??
                  'overflow-hidden rounded-lg bg-bronze px-2 py-0.5 text-white'
                }
                onPress={() => openLink(token.value)}
              >
                {'  '}
                {payLabel}
                {'  '}
              </Text>
            );
          case 'qr':
            return (
              <Text key={index} onPress={() => openLink(token.value)}>
                {'\n'}
                <Image
                  source={{ uri: token.value }}
                  accessibilityLabel={qrLabel}
                  style={{ width: 176, height: 176, borderRadius: 12 }}
                  resizeMode="contain"
                />
                {'\n'}
              </Text>
            );
          case 'bold':
            return (
              <Text key={index} bold className={boldClassName}>
                {token.value}
              </Text>
            );
          default:
            return <Fragment key={index}>{token.value}</Fragment>;
        }
      })}
    </Text>
  );
}
