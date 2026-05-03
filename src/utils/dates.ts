export function parseSpanishDate(text: string | null | undefined): Date | null {
  if (!text) return null;

  text = text.trim().toLowerCase();

  // Try ISO date first
  const isoMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  if (isoMatch) {
    const date = new Date(isoMatch[0]);
    if (!isNaN(date.getTime())) return date;
  }

  // Try format: "25 de mayo de 2026"
  const spanishLongMatch = text.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/);
  if (spanishLongMatch) {
    const [, day, monthStr, year] = spanishLongMatch;
    const monthMap: { [key: string]: number } = {
      enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
      julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
    };
    const month = monthMap[monthStr];
    if (month !== undefined) {
      const date = new Date(parseInt(year), month, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }
  }

  // Try format: "25/05/2026" or "25-05-2026"
  const slashMatch = text.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

export function formatDate(date: Date | null): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function isDateSoon(date: Date, days: number = 7): boolean {
  const now = new Date();
  const daysMs = days * 24 * 60 * 60 * 1000;
  return date.getTime() - now.getTime() <= daysMs && date.getTime() > now.getTime();
}
