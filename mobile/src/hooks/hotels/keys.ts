export const hotelKeys = {
  all: ['hotels'] as const,
  search: (params: object) => ['hotels', 'search', params] as const,
};
