/** Type cho hồ sơ người dùng — model theo backend (`PATCH /v1/users/:userId`). */

/** Payload cập nhật hồ sơ (backend yêu cầu tối thiểu 1 field). */
export interface UpdateProfilePayload {
  email?: string;
  password?: string;
  name?: string;
}

/** Payload đổi mật khẩu khi đang đăng nhập (`PATCH /v1/users/me/password`). */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// ----- Hồ sơ self-service (`GET/PATCH /v1/users/me`) -----

/** Phần `profile` lồng trong response `GET /users/me`. */
export interface MyProfileRaw {
  dateOfBirth: string | null;
  nationality: string | null;
  idCardNumber: string | null;
  passportNumber: string | null;
}

/** Raw response của `GET/PATCH /users/me` (User đã bỏ passwordHash, kèm `profile`). */
export interface MyProfileResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
  profile: MyProfileRaw | null;
}

/** View-model phẳng dùng cho form hồ sơ (map từ response lồng). */
export interface MyProfile {
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  idCardNumber: string | null;
  passportNumber: string | null;
}

/** Payload `PATCH /users/me` — chỉ field self-service (BE reject key lạ). */
export interface UpdateMyProfilePayload {
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  idCardNumber?: string | null;
  passportNumber?: string | null;
}
