/**
 * Returns today's calendar date as YYYY-MM-DD in the Asia/Kolkata timezone,
 * regardless of the server's own timezone (Render runs in UTC).
 */
function todayIST() {
  return new Date()
    .toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // en-CA gives YYYY-MM-DD
}

/** Compares YYYY-MM-DD calendar dates without timezone conversion. */
function isFutureDateString(date) {
  return date > todayIST();
}

/** Basic validation for a YYYY-MM-DD date string. */
function isValidDateString(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;

  const [year, month, day] = str.split('-').map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;

  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return (
    utcDate.getUTCFullYear() === year &&
    utcDate.getUTCMonth() === month - 1 &&
    utcDate.getUTCDate() === day
  );
}

module.exports = { todayIST, isValidDateString, isFutureDateString };
