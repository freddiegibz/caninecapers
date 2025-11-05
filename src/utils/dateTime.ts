/**
 * Formats a datetime string to London timezone display
 * @param datetime - ISO datetime string
 * @returns Formatted string in 'en-GB' locale with 'Europe/London' timezone
 */
export function formatLondon(datetime: string): string {
  const d = new Date(datetime);

  return d.toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Formats a datetime string to London timezone date only
 * @param datetime - ISO datetime string
 * @returns Formatted date string in 'en-GB' locale with 'Europe/London' timezone
 */
export function formatLondonDate(datetime: string): string {
  const d = new Date(datetime);
  return d.toLocaleDateString('en-GB', {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: 'Europe/London'
  });
}

/**
 * Formats a datetime string to London timezone time only
 * @param datetime - ISO datetime string
 * @returns Formatted time string in 'en-GB' locale with 'Europe/London' timezone
 */
export function formatLondonTime(datetime: string): string {
  const d = new Date(datetime);
  return d.toLocaleTimeString('en-GB', {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: 'Europe/London'
  });
}
