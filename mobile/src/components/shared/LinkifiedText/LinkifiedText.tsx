import { Fragment, type ComponentProps } from 'react';
import { Linking } from 'react-native';

import { Text } from '@/components/ui/text';

interface LinkifiedTextProps extends Omit<ComponentProps<typeof Text>, 'children'> {
  text: string;
  linkClassName?: string;
  boldClassName?: string;
}

// Bắt cả http(s) URL trần (link VNPay/SePay, chặn dấu câu cuối câu dính vào URL) LẪN
// `**in đậm**` kiểu Markdown — AI (Gemini) hay tự chèn cả hai dù không ai yêu cầu, và trước
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

/** Render text thô của AI, nhưng biến URL trần (link thanh toán VNPay/SePay) thành đoạn
 *  bấm được (`Linking.openURL`) và `**...**` thành chữ đậm thật — thay vì bắt người dùng
 *  tự bôi đen URL để copy/paste, hoặc thấy nguyên văn dấu sao markdown. */
export function LinkifiedText({
  text,
  linkClassName,
  boldClassName,
  ...textProps
}: LinkifiedTextProps) {
  const tokens = parseTokens(text);

  return (
    <Text {...textProps}>
      {tokens.map((token, index) => {
        if (token.type === 'link') {
          return (
            <Text
              key={index}
              className={linkClassName ?? 'underline'}
              onPress={() => Linking.openURL(token.value).catch(() => {})}
            >
              {token.value}
            </Text>
          );
        }
        if (token.type === 'bold') {
          return (
            <Text key={index} bold className={boldClassName}>
              {token.value}
            </Text>
          );
        }
        return <Fragment key={index}>{token.value}</Fragment>;
      })}
    </Text>
  );
}
