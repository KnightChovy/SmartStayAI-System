import { api } from '@/lib/api';
import type { Deal, DealsParams } from '@/types/deal.types';

function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

export const dealService = {
  /** Deal đang hiệu lực (`GET /v1/deals`). Public. Trả mảng thẳng (không phân trang). */
  async list(params: DealsParams = {}): Promise<Deal[]> {
    const { data } = await api.get<Deal[]>('/deals', { params: cleanParams(params) });
    return data;
  },
};
