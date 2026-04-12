const FR_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

const FR_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
};

export function formatDateFR(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', FR_DATE_OPTIONS);
}

export function formatDateTimeFR(dateString: string): string {
  return new Date(dateString).toLocaleString('fr-FR', FR_DATETIME_OPTIONS);
}
