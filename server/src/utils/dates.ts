/**
 * Date helpers for booking date ranges. Prisma stores `@db.Date` columns as
 * UTC-midnight Date objects, so every date we compare/persist must be
 * normalised the same way to avoid timezone off-by-one bugs.
 */

/**
 * Normalise a Date to UTC midnight (drop the time part)
 * @param {Date} date
 * @returns {Date}
 */
export const toUtcDate = (date: Date): Date => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

/**
 * List every night of a stay: [checkIn, checkOut) — the check-out day itself is not a night.
 * @param {Date} checkIn
 * @param {Date} checkOut
 * @returns {Date[]} one UTC-midnight Date per night
 */
export const eachNightOfStay = (checkIn: Date, checkOut: Date): Date[] => {
  const nights: Date[] = [];
  const current = toUtcDate(checkIn);
  const end = toUtcDate(checkOut);
  while (current < end) {
    nights.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return nights;
};
