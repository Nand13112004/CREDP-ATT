// Returns today's date as YYYY-MM-DD in the Asia/Kolkata timezone.
export function todayISO() {
  const now = new Date();
  const istString = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return istString; // already YYYY-MM-DD
}

// Formats "2026-09-27" -> "27 September 2026"
export function formatDateLong(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${day} ${months[month - 1]} ${year}`;
}
