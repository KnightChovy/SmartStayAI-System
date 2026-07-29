import { api } from '@/lib/api';
import type {
  Destination,
  DestinationSuggestion,
  DestinationSuggestParams,
} from '@/types/destination.types';

export const destinationService = {
  /** Điểm đến kèm số khách sạn thật (`GET /v1/destinations`). Public. */
  async list(): Promise<Destination[]> {
    const { data } = await api.get<Destination[]>('/destinations');
    return data;
  },

  /** Gợi ý điểm đến theo từ khoá (`GET /v1/destinations/suggest?q=`). Public. */
  async suggest(params: DestinationSuggestParams): Promise<DestinationSuggestion[]> {
    const { data } = await api.get<DestinationSuggestion[]>('/destinations/suggest', {
      params,
    });
    return data;
  },
};
