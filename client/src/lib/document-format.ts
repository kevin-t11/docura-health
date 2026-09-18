/** Format document sizes and dates for display. */
export function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC'
});

/** Format a date in ISO 8601 format to a human-readable string. */
export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso));
}

/** Format a recording offset in minutes and seconds. */
export function formatAudioTime(seconds: number) {
  const whole = Math.floor(Math.max(0, seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
