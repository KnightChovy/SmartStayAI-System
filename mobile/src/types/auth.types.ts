export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  profile?: {
    nationality?: string | null;
    preferredLanguage?: 'vi' | 'en';
    preferredCurrency?: 'VND' | 'USD';
    marketingOptIn?: boolean;
  } | null;
}
export interface AuthResponse {
  user: UserProfile;
  tokens: { access: { token: string }; refresh: { token: string } };
}
export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  verificationCode: string;
  phone?: string;
}
export interface UpdateProfilePayload {
  name?: string;
  phone?: string | null;
  nationality?: string | null;
}
