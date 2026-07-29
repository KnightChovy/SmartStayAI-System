import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ChatMessage,
  ChatOwnerState,
  ChatSession,
  StoredChatThread,
} from '@/types/chatbot.type';

/** Giữ tối đa ngần này tin gần nhất MỖI đoạn — persist ghi lại TOÀN BỘ store mỗi lần set,
 *  chat dài vô hạn sẽ phình AsyncStorage và làm chậm lúc khởi động app. */
const MAX_STORED_MESSAGES = 100;
/** Cùng lý do: nhiều đoạn thì dung lượng nhân lên theo số đoạn, phải có trần. */
const MAX_SESSIONS = 30;
const MAX_TITLE_LENGTH = 40;
const MAX_CUSTOM_TITLE_LENGTH = 60;

/** Bản cũ chưa khai `version` nên zustand ghi xuống máy là 0 ⇒ migrate sẽ chạy. */
const CHAT_STORE_VERSION = 2;

interface ChatStore {
  /** Khoá theo user: một máy nhiều tài khoản thì mỗi người một lịch sử, không lẫn của nhau. */
  owners: Record<string, ChatOwnerState>;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  /** Tạo đoạn mới và mở luôn. ĐÃ có một đoạn trống thì dùng lại đoạn đó — bấm "đoạn mới"
   *  hai lần liên tiếp không được để lại hai dòng trắng trong danh sách. Trả về id. */
  createSession: (ownerKey: string) => string;
  /** Có đoạn đang mở thì trả về, không thì tạo — gọi ngay trước khi gửi tin đầu tiên. */
  ensureActiveSession: (ownerKey: string) => string;
  setActiveSession: (ownerKey: string, sessionId: string) => void;
  saveMessages: (
    ownerKey: string,
    sessionId: string,
    messages: ChatMessage[],
    conversationId: string,
  ) => void;
  renameSession: (ownerKey: string, sessionId: string, title: string) => void;
  deleteSession: (ownerKey: string, sessionId: string) => void;
  clearOwner: (ownerKey: string) => void;
}

const EMPTY_OWNER: ChatOwnerState = { sessions: [], activeSessionId: null };

function ownerState(owners: Record<string, ChatOwnerState>, ownerKey: string): ChatOwnerState {
  return owners[ownerKey] ?? EMPTY_OWNER;
}

/** Tiêu đề tự sinh = tin ĐẦU TIÊN của khách, gom khoảng trắng, cắt theo ranh giới từ để
 *  không đứt giữa chữ. Không có tin nào của khách → '' (UI hiển thị nhãn i18n). */
export function deriveTitle(messages: ChatMessage[]): string {
  const first = messages.find((message) => message.role === 'user')?.text.replace(/\s+/g, ' ').trim();
  if (!first) return '';
  if (first.length <= MAX_TITLE_LENGTH) return first;
  const cut = first.slice(0, MAX_TITLE_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > MAX_TITLE_LENGTH / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Tin đang stream dở (tắt app giữa chừng) lưu nguyên cờ sẽ hiện con trỏ "▌" đứng im mãi
 *  và không bao giờ có ai stream tiếp — bỏ cờ để nó thành tin thường. */
function sanitizeMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .slice(-MAX_STORED_MESSAGES)
    .map(({ streaming: _streaming, ...rest }) => rest);
}

function sortByRecent(sessions: ChatSession[]): ChatSession[] {
  return [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
}

function makeSessionId(seed: number) {
  return `s_${seed}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

interface LegacyChatState {
  threads?: Record<string, StoredChatThread>;
}

function isLegacyState(value: unknown): value is LegacyChatState {
  return Boolean(value) && typeof value === 'object' && 'threads' in (value as object);
}

/** v0 (mỗi tài khoản một hội thoại) → v2: hội thoại cũ thành ĐOẠN ĐẦU TIÊN và được mở sẵn,
 *  thay vì biến mất im lặng. Hội thoại rỗng thì bỏ, không tạo đoạn ma. */
export function migrateChatState(
  persisted: unknown,
  version: number,
): { owners: Record<string, ChatOwnerState> } {
  if (version >= CHAT_STORE_VERSION || !isLegacyState(persisted)) {
    return { owners: (persisted as { owners?: Record<string, ChatOwnerState> })?.owners ?? {} };
  }

  const owners: Record<string, ChatOwnerState> = {};
  for (const [ownerKey, thread] of Object.entries(persisted.threads ?? {})) {
    if (!thread?.messages?.length) continue;
    const updatedAt = thread.updatedAt ?? Date.now();
    const session: ChatSession = {
      id: `s_legacy_${ownerKey}`,
      title: deriveTitle(thread.messages),
      messages: thread.messages,
      conversationId: thread.conversationId ?? '',
      createdAt: updatedAt,
      updatedAt,
    };
    owners[ownerKey] = { sessions: [session], activeSessionId: session.id };
  }
  return { owners };
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      owners: {},
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      createSession: (ownerKey) => {
        const owner = ownerState(get().owners, ownerKey);
        const blank = owner.sessions.find((session) => session.messages.length === 0);
        if (blank) {
          set((state) => ({
            owners: {
              ...state.owners,
              [ownerKey]: { ...ownerState(state.owners, ownerKey), activeSessionId: blank.id },
            },
          }));
          return blank.id;
        }

        const now = Date.now();
        const session: ChatSession = {
          id: makeSessionId(now),
          title: '',
          messages: [],
          conversationId: '',
          createdAt: now,
          updatedAt: now,
        };
        set((state) => {
          const current = ownerState(state.owners, ownerKey);
          return {
            owners: {
              ...state.owners,
              [ownerKey]: {
                sessions: [session, ...current.sessions].slice(0, MAX_SESSIONS),
                activeSessionId: session.id,
              },
            },
          };
        });
        return session.id;
      },

      ensureActiveSession: (ownerKey) => {
        const owner = ownerState(get().owners, ownerKey);
        const active = owner.sessions.find((session) => session.id === owner.activeSessionId);
        if (active) return active.id;
        return get().createSession(ownerKey);
      },

      setActiveSession: (ownerKey, sessionId) =>
        set((state) => ({
          owners: {
            ...state.owners,
            [ownerKey]: { ...ownerState(state.owners, ownerKey), activeSessionId: sessionId },
          },
        })),

      saveMessages: (ownerKey, sessionId, messages, conversationId) =>
        set((state) => {
          const owner = ownerState(state.owners, ownerKey);
          if (!owner.sessions.some((session) => session.id === sessionId)) return state;
          const cleaned = sanitizeMessages(messages);
          const sessions = owner.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: cleaned,
                  conversationId,
                  // Khách tự đặt tên rồi thì thôi ghi đè.
                  title: session.isTitleCustom ? session.title : deriveTitle(cleaned),
                  updatedAt: Date.now(),
                }
              : session,
          );
          return {
            owners: { ...state.owners, [ownerKey]: { ...owner, sessions: sortByRecent(sessions) } },
          };
        }),

      renameSession: (ownerKey, sessionId, title) =>
        set((state) => {
          const owner = ownerState(state.owners, ownerKey);
          const trimmed = title.trim().slice(0, MAX_CUSTOM_TITLE_LENGTH);
          const sessions = owner.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  // Xoá trắng tên = quay về chế độ tự đặt theo tin nhắn đầu.
                  title: trimmed || deriveTitle(session.messages),
                  isTitleCustom: Boolean(trimmed),
                }
              : session,
          );
          // Cố ý KHÔNG đụng `updatedAt`: đổi tên mà làm dòng nhảy chỗ dưới ngón tay là khó chịu.
          return { owners: { ...state.owners, [ownerKey]: { ...owner, sessions } } };
        }),

      deleteSession: (ownerKey, sessionId) =>
        set((state) => {
          const owner = ownerState(state.owners, ownerKey);
          const sessions = owner.sessions.filter((session) => session.id !== sessionId);
          return {
            owners: {
              ...state.owners,
              [ownerKey]: {
                sessions,
                // Xoá đúng đoạn đang mở → rơi về đoạn mới nhất còn lại. KHÔNG tự tạo đoạn thay
                // thế: `null` vốn đã render ra màn chat trắng có lời chào, tạo thêm chỉ để lại
                // một dòng rỗng trong danh sách sau mỗi lần xoá.
                activeSessionId:
                  owner.activeSessionId === sessionId
                    ? (sessions[0]?.id ?? null)
                    : owner.activeSessionId,
              },
            },
          };
        }),

      clearOwner: (ownerKey) =>
        set((state) => {
          const { [ownerKey]: _removed, ...rest } = state.owners;
          return { owners: rest };
        }),
    }),
    {
      name: 'smartstay-chat',
      version: CHAT_STORE_VERSION,
      migrate: migrateChatState,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ owners: state.owners }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

/** Chưa đăng nhập vẫn chat được (backend dùng `optionalAuth`) nên cần một khoá riêng cho khách vãng lai. */
export function chatOwnerKey(userId?: string | null) {
  return userId ?? 'guest';
}
