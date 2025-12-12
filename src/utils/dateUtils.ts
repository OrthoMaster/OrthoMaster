/**
 * Format MySQL datetime to relative time in French
 * @param dateString - MySQL datetime string (e.g., "2024-12-08 14:30:00")
 * @returns Formatted relative time (e.g., "Il y a 5 min", "Hier", "Il y a 3 jours")
 */
export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return '';

  const now = new Date();
  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return dateString;
  }

  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  // Less than 1 minute
  if (diffInSeconds < 60) {
    return 'À l\'instant';
  }

  // Less than 1 hour
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} min`;
  }

  // Less than 24 hours
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  }

  // Yesterday
  if (diffInDays === 1) {
    return 'Hier';
  }

  // Less than 7 days
  if (diffInDays < 7) {
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  }

  // Less than 30 days
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }

  // Less than 365 days
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `Il y a ${months} mois`;
  }

  // More than 1 year
  const years = Math.floor(diffInDays / 365);
  return `Il y a ${years} an${years > 1 ? 's' : ''}`;
};

/**
 * Format MySQL datetime to a short date format
 * @param dateString - MySQL datetime string
 * @returns Formatted date (e.g., "08/12/2024")
 */
export const formatShortDate = (dateString: string): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Format MySQL datetime to full date and time
 * @param dateString - MySQL datetime string
 * @returns Formatted date and time (e.g., "08 décembre 2024 à 14:30")
 */
export const formatFullDateTime = (dateString: string): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }

  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} à ${hours}:${minutes}`;
};

/**
 * Check if a date is today
 * @param dateString - MySQL datetime string
 * @returns true if the date is today
 */
export const isToday = (dateString: string): boolean => {
  if (!dateString) return false;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * Check if a date is yesterday
 * @param dateString - MySQL datetime string
 * @returns true if the date is yesterday
 */
export const isYesterday = (dateString: string): boolean => {
  if (!dateString) return false;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return false;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
};