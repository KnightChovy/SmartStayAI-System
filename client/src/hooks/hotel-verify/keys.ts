export const hotelVerifyKeys = {
  all: ['hotel-verify'] as const,
  applications: () => [...hotelVerifyKeys.all, 'applications'] as const,
  application: (id: string) => [...hotelVerifyKeys.all, 'application', id] as const,
};
