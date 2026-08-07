import { Fragment } from 'react';

import { cn } from '@/lib/cn';

interface LinkifiedTextProps {
  text: string;
  className?: string;
  linkClassName?: string;
  boldClassName?: string;
}

// Bắt cả http(s) URL trần (VNPay/SePay, chặn dấu câu cuối câu dính vào URL) LẪN `**in đậm**`
// kiểu Markdown — AI (Gemini) hay tự chèn cả hai vào câu trả lời dù không ai yêu cầu, và trước
// đây khung chat chỉ render text thô nên `**...**` hiện nguyên dấu sao thay vì chữ đậm.
const TOKEN_REGEX = /\*\*([^*]+)\*\*|(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]])/g;

type Token =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'link'; value: string };

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
      tokens.push({ type: 'link', value: match[2] });
    }
    lastIndex = TOKEN_REGEX.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return tokens;
}

/** Render text thô của AI kèm `whitespace-pre-wrap`, nhưng biến URL trần thành link bấm được
 *  và `**...**` thành chữ đậm thật — thay vì hiện nguyên văn dấu sao hay bắt người dùng tự
 *  bôi đen URL để copy/paste. */
export function LinkifiedText({
  text,
  className,
  linkClassName,
  boldClassName,
}: LinkifiedTextProps) {
  const tokens = parseTokens(text);

  return (
    <span className={cn('whitespace-pre-wrap wrap-break-word', className)}>
      {tokens.map((token, index) => {
        if (token.type === 'link') {
          return (
            <a
              key={index}
              href={token.value}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'underline underline-offset-2 hover:opacity-80',
                linkClassName
              )}
            >
              {token.value}
            </a>
          );
        }
        if (token.type === 'bold') {
          return (
            <strong key={index} className={cn('font-semibold', boldClassName)}>
              {token.value}
            </strong>
          );
        }
        return <Fragment key={index}>{token.value}</Fragment>;
      })}
    </span>
  );
}
