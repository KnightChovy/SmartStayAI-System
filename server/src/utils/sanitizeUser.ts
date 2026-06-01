/**
 * Strip sensitive fields from a user object before sending it to the client.
 * Keeps any extra relations (e.g. `profile`) attached to the record.
 * @param {T} user a user record that contains a passwordHash
 * @returns {Omit<T, 'passwordHash'>} the user without its password hash
 */
const sanitizeUser = <T extends { passwordHash: string }>(user: T): Omit<T, 'passwordHash'> => {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

export default sanitizeUser;
