import crypto from 'crypto';
import config from '../config/config';

// AES-256-GCM: vừa mã hoá vừa có auth tag để phát hiện dữ liệu bị sửa đổi.
const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(config.security.payoutEncryptionKey, 'base64');

// Fail-fast ngay khi khởi động nếu key cấu hình sai độ dài.
if (KEY.length !== 32) {
  throw new Error('PAYOUT_ENCRYPTION_KEY phải là key 32 byte (256-bit) mã hoá base64 để dùng cho AES-256-GCM');
}

/**
 * Mã hoá một chuỗi nhạy cảm (vd: số tài khoản ngân hàng).
 * Trả về chuỗi "iv:authTag:ciphertext" (mỗi phần base64) để lưu xuống DB.
 * @param {string} plaintext
 * @returns {string}
 */
export const encrypt = (plaintext: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(':');
};

/**
 * Giải mã chuỗi do encrypt() tạo ra. Ném lỗi nếu dữ liệu bị sửa đổi (auth tag không khớp).
 * @param {string} payload - chuỗi "iv:authTag:ciphertext"
 * @returns {string}
 */
export const decrypt = (payload: string): string => {
  const [ivB64, authTagB64, dataB64] = payload.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
};
