/** Type cho hồ sơ người dùng — model theo backend (`PATCH /v1/users/:userId`). */

/** Payload cập nhật hồ sơ (backend yêu cầu tối thiểu 1 field). */
export interface UpdateProfilePayload {
  email?: string;
  password?: string;
  name?: string;
}
