import { useQuery } from '@tanstack/react-query';

import { platformManagerKeys } from '@/hooks/platform-manager/keys';
import { platformManagerService } from '@/services/platform-manager.service';
import type { PlatformPartnersParams } from '@/types/platform-manager.types';

export function usePlatformPartners(params: PlatformPartnersParams = {}) {
  return useQuery({
    queryKey: platformManagerKeys.partners(params),
    queryFn: () => platformManagerService.listPartners(params),
  });
}
