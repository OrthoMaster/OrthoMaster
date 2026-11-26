/** Dates et petits libellés de l'espace SCAT6 (heure locale du navigateur). */

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export const formatTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';

/** « Aujourd'hui », « Hier », « il y a 3 jours », sinon la date. */
export const relativeDay = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((day(new Date()) - day(new Date(iso))) / 86_400_000);
  if (diff === 0) return 'Aujourd’hui';
  if (diff === 1) return 'Hier';
  if (diff > 1 && diff < 7) return `Il y a ${diff} jours`;
  return formatDate(iso);
};

/** Initiales pour la pastille du patient (le nom est libre : initiales, code…). */
export const initials = (name: string) => {
  const parts = name.trim().split(/[\s.\-_]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
