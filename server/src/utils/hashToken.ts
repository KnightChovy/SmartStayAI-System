import crypto from 'crypto';

/**
 * Hash a token/OTP with SHA-256 so it can be stored safely at rest.
 * Use the same function on the incoming value when verifying.
 * @param {string} token
 * @returns {string} hex-encoded SHA-256 digest
 */
const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

export default hashToken;
