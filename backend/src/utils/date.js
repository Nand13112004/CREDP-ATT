/**
 * Returns today's calendar date as YYYY-MM-DD in the Asia/Kolkata timezone,
 * regardless of the server's own timezone (Render runs in UTC).
 */
function todayIST() {
  return new Date()
    .toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // en-CA gives YYYY-MM-DD
}

/** Basic validation for a YYYY-MM-DD date string. */
function isValidDateString(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

module.exports = { todayIST, isValidDateString };
