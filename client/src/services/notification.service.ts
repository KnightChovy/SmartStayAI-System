import { delay, readMock, writeMock } from './mock/mockStore';
import type { AppNotification } from '@/types/account.types';

/** [MOCK] Thông báo. Backend chưa có endpoint notifications. */
const KEY = 'notifications';

const SEED: AppNotification[] = [
  {
    id: 'n1',
    type: 'booking_confirmed',
    title: 'Booking confirmed',
    body: 'Your stay at Lotus Riverside Hotel is confirmed. See you soon!',
    createdAt: '2026-06-10T09:00:00Z',
    readAt: null,
  },
  {
    id: 'n2',
    type: 'check_in_reminder',
    title: 'Check-in tomorrow',
    body: 'Reminder: your check-in at Pearl Bay Resort is tomorrow at 14:00.',
    createdAt: '2026-06-09T08:00:00Z',
    readAt: null,
  },
  {
    id: 'n3',
    type: 'promotion',
    title: 'Weekend flash deal',
    body: 'Save up to 25% on selected sanctuaries this weekend only.',
    createdAt: '2026-06-05T12:00:00Z',
    readAt: '2026-06-06T07:00:00Z',
  },
  {
    id: 'n4',
    type: 'review_request',
    title: 'How was your stay?',
    body: 'Share your experience at Mountain Mist Lodge and earn 100 points.',
    createdAt: '2026-05-28T15:00:00Z',
    readAt: '2026-05-29T07:00:00Z',
  },
];

export const notificationService = {
  async list(): Promise<AppNotification[]> {
    return delay(readMock(KEY, SEED));
  },

  async markRead(id: string): Promise<AppNotification[]> {
    const list = readMock(KEY, SEED).map(n =>
      n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n
    );
    writeMock(KEY, list);
    return delay(list, 100);
  },

  async markAllRead(): Promise<AppNotification[]> {
    const now = new Date().toISOString();
    const list = readMock(KEY, SEED).map(n => (n.readAt ? n : { ...n, readAt: now }));
    writeMock(KEY, list);
    return delay(list, 100);
  },
};
