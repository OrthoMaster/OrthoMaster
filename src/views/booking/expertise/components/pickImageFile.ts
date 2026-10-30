/**
 * Version WEB uniquement : choix d'une image avec le sélecteur de fichiers du navigateur,
 * sans bibliothèque (un <input type="file"> créé à la volée).
 *
 * L'image est vérifiée (format, taille minimale) puis, si elle est lourde ou très grande,
 * réduite dans un <canvas> avant l'envoi : une photo de téléphone de 8 Mo part en ~300 Ko.
 * Le serveur la recadre de toute façon à 600 px.
 */

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
const ACCEPTED_TYPES = IMAGE_ACCEPT.split(',');

/** Au-delà, l'image est réduite avant l'envoi. */
const RESIZE_ABOVE_BYTES = 1024 * 1024;
const RESIZE_MAX_EDGE = 1200;
const JPEG_QUALITY = 0.9;

export interface PickedImage {
  blob: Blob;
  fileName: string;
  /** Aperçu local (URL.revokeObjectURL quand il ne sert plus). */
  previewUrl: string;
}

export type PickImageResult = { ok: true; image: PickedImage } | { ok: false; message: string } | null;

/** Ouvre le sélecteur ; null si l'utilisateur ferme sans choisir. */
const chooseFile = (accept: string): Promise<File | null> =>
  new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';

    const done = (file: File | null) => {
      input.remove();
      resolve(file);
    };

    input.addEventListener('change', () => done(input.files?.[0] ?? null));
    // Fermeture sans choix (navigateurs récents) : sinon la promesse reste simplement en attente.
    input.addEventListener('cancel', () => done(null));

    document.body.appendChild(input);
    input.click();
  });

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

const toJpeg = (img: HTMLImageElement, maxEdge: number): Promise<Blob | null> => {
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);

  const context = canvas.getContext('2d');
  if (!context) return Promise.resolve(null);
  // Fond blanc : un PNG transparent ne devient pas noir en JPEG.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', JPEG_QUALITY));
};

export const pickImageFile = async (options: { minEdge?: number; maxKb?: number } = {}): Promise<PickImageResult> => {
  if (typeof document === 'undefined') return null;

  const file = await chooseFile(IMAGE_ACCEPT);
  if (!file) return null;

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { ok: false, message: 'Formats acceptés : JPG, PNG ou WebP.' };
  }

  const sourceUrl = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = await loadImage(sourceUrl);
  } catch (e) {
    URL.revokeObjectURL(sourceUrl);
    return { ok: false, message: "Cette image ne peut pas être lue. Essayez avec une autre." };
  }

  const minEdge = options.minEdge ?? 200;
  if (Math.min(img.naturalWidth, img.naturalHeight) < minEdge) {
    URL.revokeObjectURL(sourceUrl);
    return { ok: false, message: `L'image doit faire au moins ${minEdge} × ${minEdge} pixels.` };
  }

  // Petite image : envoyée telle quelle.
  const large = file.size > RESIZE_ABOVE_BYTES || Math.max(img.naturalWidth, img.naturalHeight) > RESIZE_MAX_EDGE;
  if (!large) {
    return { ok: true, image: { blob: file, fileName: file.name, previewUrl: sourceUrl } };
  }

  const resized = await toJpeg(img, RESIZE_MAX_EDGE);
  URL.revokeObjectURL(sourceUrl);

  const maxBytes = (options.maxKb ?? 5120) * 1024;
  if (!resized || resized.size > maxBytes) {
    return { ok: false, message: `L'image ne doit pas dépasser ${Math.round(maxBytes / 1024 / 1024)} Mo.` };
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar';
  return {
    ok: true,
    image: { blob: resized, fileName: `${baseName}.jpg`, previewUrl: URL.createObjectURL(resized) },
  };
};
