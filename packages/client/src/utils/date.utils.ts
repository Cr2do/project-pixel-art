const FR_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

export function formatDateFR(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', FR_DATE_OPTIONS);
}
