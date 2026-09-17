/**
 * Formate un montant numérique en FCFA (F CFA)
 * Exemple: 125500 -> "125 500 F CFA"
 */
export function formatFCFA(amount: number | undefined | null, suffix: boolean = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return suffix ? '0 F CFA' : '0';
  }
  
  // Formatage avec séparateur de milliers espace
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return suffix ? `${formatted} F CFA` : formatted;
}

/**
 * Formatage court pour les badges et boutons
 * Exemple: 500 -> "500 F"
 */
export function formatShortF(amount: number): string {
  if (amount === undefined || isNaN(amount)) return '0 F';
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} F`;
}

/**
 * Formate une date ISO en chaîne lisible en français
 * Exemple: "16 sept. 2026 à 14:35"
 */
export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Formate uniquement l'heure: "14:35"
 */
export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * Formate la date seule: "16/09/2026"
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * Détermine si une date correspond à aujourd'hui
 */
export function isToday(isoString: string): boolean {
  const date = new Date(isoString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Détermine si une date correspond à hier
 */
export function isYesterday(isoString: string): boolean {
  const date = new Date(isoString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Détermine si une date est dans la semaine courante (depuis lundi)
 */
export function isThisWeek(isoString: string): boolean {
  const date = new Date(isoString);
  const now = new Date();
  
  // Premier jour de la semaine (lundi)
  const firstDay = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // ajuster quand dimanche
  firstDay.setDate(diff);
  firstDay.setHours(0, 0, 0, 0);

  const lastDay = new Date(firstDay);
  lastDay.setDate(firstDay.getDate() + 7);

  return date >= firstDay && date < lastDay;
}

/**
 * Détermine si une date est dans le mois en cours
 */
export function isThisMonth(isoString: string): boolean {
  const date = new Date(isoString);
  const now = new Date();
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}
