import { Fragment } from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Host của các cổng thanh toán. Chỉ link tới đúng những host này mới được nâng lên thành NÚT —
 * so theo `hostname` đã parse chứ không `includes()` trên chuỗi thô, để một URL bịa kiểu
 * `https://vnpayment.vn.kẻ-gian.com/...` không mạo danh được nút "Thanh toán".
 */
const PAYMENT_HOSTS = ['vnpayment.vn', 'vnpay.vn'];

/** Host trả về ẢNH QR chuyển khoản (SePay dựng sẵn ảnh VietQR) — render thẳng thành `<img>`. */
const QR_IMAGE_HOSTS = ['qr.sepay.vn'];

/** Bắt URL http(s) trong văn bản. Dấu câu dính đuôi được cắt riêng ở `splitTrailingPunctuation`. */
const URL_PATTERN = /https?:\/\/[^\s<>"']+/g;

/** `**đậm**` — thứ duy nhất của markdown mà bot hay dùng và đang lòi dấu sao ra màn hình. */
const BOLD_PATTERN = /\*\*(.+?)\*\*/g;

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

function hostMatches(url: string, hosts: string[]): boolean {
  try {
    const { hostname } = new URL(url);
    return hosts.some(h => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/**
 * Đổi `**...**` thành `<strong>`. CỐ Ý chỉ làm mỗi in đậm: bot viết văn xuôi tiếng Việt, dựng cả
 * bộ markdown ở đây là mời lỗi (dấu `*` giữa câu, `_` trong mã booking…). Chuỗi không khớp thì
 * trả nguyên văn nên không bao giờ mất chữ.
 */
function renderBold(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let i = 0;

  for (const match of text.matchAll(BOLD_PATTERN)) {
    const start = match.index;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(<strong key={`${keyPrefix}-b${i++}`}>{match[1]}</strong>);
    cursor = start + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

interface ChatMessageTextProps {
  text: string;
  /** Nhãn nút thanh toán — mỗi cổng tự truyền theo ngôn ngữ của mình (staff portal để tiếng Anh). */
  payLabel: string;
  /** Nhãn/alt của ảnh QR chuyển khoản. */
  qrLabel: string;
  /** Bong bóng nền tối/đậm (tin của khách) cần link sáng màu để còn đọc được. */
  onDarkBubble?: boolean;
  className?: string;
}

/**
 * Nội dung một tin nhắn chat, có nhận diện đường dẫn + in đậm.
 *
 * Vì sao cần: khi khách đặt phòng qua trợ lý AI, backend nhét **link thanh toán VNPay nguyên vẹn**
 * vào lời đáp (`conversation.service.ts` — "gửi link này NGUYÊN VẸN, không rút gọn"). Link đó dài
 * hơn 300 ký tự và trước đây render bằng `<p>` thuần ⇒ khách phải **bôi đen copy tay** một chuỗi
 * xuống mấy dòng, trong khi đơn chỉ được giữ chỗ 15 phút. Nay nó thành **một nút bấm là đi**.
 *
 * Tương tự với **ảnh QR SePay**: BE dặn bot gửi thẳng URL ảnh, mà một URL thô thì khách không quét
 * được — nay hiện luôn thành ảnh trong khung chat.
 */
export default function ChatMessageText({
  text,
  payLabel,
  qrLabel,
  onDarkBubble = false,
  className,
}: ChatMessageTextProps) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  const pushText = (chunk: string) => {
    if (chunk) parts.push(...renderBold(chunk, `t${key++}`));
  };

  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = match[0];
    const start = match.index;
    const [url, trailing] = splitTrailingPunctuation(raw);

    if (start > cursor) pushText(text.slice(cursor, start));
    cursor = start + raw.length;

    if (!url) {
      pushText(raw);
      continue;
    }

    if (hostMatches(url, PAYMENT_HOSTS)) {
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
    } else if (hostMatches(url, QR_IMAGE_HOSTS)) {
      // Ảnh QR là THỨ khách phải quét — bọc trong link để bấm ra ảnh gốc phóng to được.
      parts.push(
        <a
          key={`qr-${key++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="my-1.5 block w-fit rounded-xl border border-outline-variant/40 bg-white p-2"
        >
          <img
            src={url}
            alt={qrLabel}
            className="block h-auto w-full max-w-52 rounded-lg"
            loading="lazy"
          />
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

    if (trailing) pushText(trailing);
  }

  if (cursor < text.length) pushText(text.slice(cursor));

  return (
    <span className={cn('whitespace-pre-wrap wrap-break-word', className)}>
      {parts.map((part, i) => (
        <Fragment key={i}>{part}</Fragment>
      ))}
    </span>
  );
}
