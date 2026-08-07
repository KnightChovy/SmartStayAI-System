/** Query keys cho ví của khách đang đăng nhập. */
export const walletKeys = {
  all: ['wallet'] as const,
  /** Ví của chính mình — không có tham số vì BE suy customer từ token. */
  mine: ['wallet', 'mine'] as const,
};
