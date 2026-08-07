import { Fragment } from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Host của các cổng thanh toán. Chỉ link tới đúng những host này mới được nâng lên thành NÚT —
 * so theo `hostname` đã parse chứ không `includes()` trên chuỗi thô, để một URL bịa kiểu
 * `https://vnpayment.vn.kẻ-gian.com/...` không mạo danh được nút "Thanh toán".
 */
const PAYMENT_HOSTS = ['vnpayment.vn', 'vnpay.vn'];

/** Bắt URL http(s) trong văn bản. Dấu câu dính đuôi được cắt riêng ở `splitTrailingPunctuation`. */
const URL_PATTERN = /https?:\/\/[^\s<>"']+/g;

/**
 * Dấu câu người viết đặt SAU link (`...vpcpay.html?a=1).` hay `..., rồi`) sẽ bị regex nuốt vào URL.
 * Cắt chúng ra — nhưng chỉ khi dấu đóng ngoặc không có ngoặc mở tương ứng bên trong URL, vì
 * `)` là ký tự hợp lệ trong query string.
 */
function splitTrailingPunctuation(url: string): [string, string] {
  let end = url.length;
  while (end > 0) {
    const ch = url[end - 1]!;
    if ('.,;:!?"\''.includes(ch)) {
      end -= 1;
      continue;
    }
    if (ch === ')' && !url.slice(0, end - 1).includes('(')) {
      end -= 1;
      continue;
    }
    break;
  }
  return [url.slice(0, end), url.slice(end)];
}

function isPaymentUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return PAYMENT_HOSTS.some(h => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

interface ChatMessageTextProps {
  text: string;
  /** Nhãn nút thanh toán — mỗi cổng tự truyền theo ngôn ngữ của mình (staff portal để tiếng Anh). */
  payLabel: string;
  /** Bong bóng nền tối/đậm (tin của khách) cần link sáng màu để còn đọc được. */
  onDarkBubble?: boolean;
  className?: string;
}

/**
 * Nội dung một tin nhắn chat, có nhận diện đường dẫn.
 *
 * Vì sao cần: khi khách đặt phòng qua trợ lý AI, backend nhét **link thanh toán VNPay nguyên vẹn**
 * vào lời đáp (`conversation.service.ts` — "gửi link này NGUYÊN VẸN, không rút gọn"). Link đó dài
 * hơn 300 ký tự và trước đây render bằng `<p>` thuần ⇒ khách phải **bôi đen copy tay** một chuỗi
 * xuống mấy dòng, trong khi đơn chỉ được giữ chỗ 15 phút. Nay nó thành **một nút bấm là đi**.
 *
 * Các link khác (ảnh QR SePay, trang chi tiết…) vẫn thành thẻ `<a>` bấm được — vẫn hơn hẳn text thô.
 */
export default function ChatMessageText({
  text,
  payLabel,
  onDarkBubble = false,
  className,
}: ChatMessageTextProps) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = match[0];
    const start = match.index;
    const [url, trailing] = splitTrailingPunctuation(raw);

    if (start > cursor) parts.push(text.slice(cursor, start));
    cursor = start + raw.length;

    if (!url) {
      parts.push(raw);
      continue;
    }

    if (isPaymentUrl(url)) {
      parts.push(
        <a
          key={`pay-${key++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="my-1.5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-premium-gold px-4 py-2.5 text-sm font-semibold text-on-surface no-underline transition-colors hover:bg-premium-gold/85 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
          {payLabel}
        </a>
      );
    } else {
      parts.push(
        <a
          key={`link-${key++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'font-medium underline underline-offset-2 wrap-anywhere',
            onDarkBubble ? 'text-inherit' : 'text-primary'
          )}
        >
          {url}
        </a>
      );
    }

    if (trailing) parts.push(trailing);
  }

  if (cursor < text.length) parts.push(text.slice(cursor));

  return (
    <span className={cn('whitespace-pre-wrap wrap-break-word', className)}>
      {parts.map((part, i) => (
        <Fragment key={i}>{part}</Fragment>
      ))}
    </span>
  );
}
