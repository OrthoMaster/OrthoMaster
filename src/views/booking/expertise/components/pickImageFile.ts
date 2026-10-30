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

/** Ouvre le sélecteur ; liste vide si l'utilisateur ferme sans choisir. */
const chooseFiles = (accept: string, multiple = false): Promise<File[]> =>
  new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.style.display = 'none';

    const done = (files: File[]) => {
      input.remove();
      resolve(files);
    };

    input.addEventListener('change', () => done(Array.from(input.files ?? [])));
    // Fermeture sans choix (navigateurs récents) : sinon la promesse reste simplement en attente.
    input.addEventListener('cancel', () => done([]));

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

/** Réduction dans un canvas. PNG gardé en PNG (transparence des schémas), le reste en JPEG. */
const toResized = (img: HTMLImageElement, maxEdge: number, png = false): Promise<Blob | null> => {
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);

  const context = canvas.getContext('2d');
  if (!context) return Promise.resolve(null);
  if (!png) {
    // Fond blanc : une zone transparente ne devient pas noire en JPEG.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), png ? 'image/png' : 'image/jpeg', png ? undefined : JPEG_QUALITY)
  );
};

interface PickOptions {
  /** Plus petit côté accepté (px) ; 0 = pas de minimum. */
  minEdge?: number;
  maxKb?: number;
  /** Au-delà de ce côté (px), l'image est réduite avant l'envoi. */
  resizeMaxEdge?: number;
  /** PNG réduit en PNG (illustrations) plutôt qu'en JPEG (photo de profil). */
  keepPng?: boolean;
}

/** Une photo (photo de profil). */
export const pickImageFile = async (options: PickOptions = {}): Promise<PickImageResult> => {
  if (typeof document === 'undefined') return null;

  const [file] = await chooseFiles(IMAGE_ACCEPT);
  if (!file) return null;

  return prepareImage(file, options);
};

/**
 * Plusieurs images (illustrations d'une offre), au plus `max`.
 * Chaque fichier est vérifié et réduit séparément : les refus sont renvoyés à part.
 */
export const pickImageFiles = async (
  options: PickOptions & { max: number }
): Promise<{ images: PickedImage[]; errors: string[]; skipped: number } | null> => {
  if (typeof document === 'undefined' || options.max <= 0) return null;

  const files = await chooseFiles(IMAGE_ACCEPT, options.max > 1);
  if (files.length === 0) return null;

  const kept = files.slice(0, options.max);
  const images: PickedImage[] = [];
  const errors: string[] = [];

  for (const file of kept) {
    const result = await prepareImage(file, options);
    if (result?.ok) images.push(result.image);
    else if (result && result.ok === false) errors.push(`${file.name} : ${result.message}`);
  }

  return { images, errors, skipped: files.length - kept.length };
};

const prepareImage = async (file: File, options: PickOptions): Promise<PickImageResult> => {
  const resizeMaxEdge = options.resizeMaxEdge ?? RESIZE_MAX_EDGE;

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
  if (minEdge > 0 && Math.min(img.naturalWidth, img.naturalHeight) < minEdge) {
    URL.revokeObjectURL(sourceUrl);
    return { ok: false, message: `L'image doit faire au moins ${minEdge} × ${minEdge} pixels.` };
  }

  // Petite image : envoyée telle quelle.
  const large = file.size > RESIZE_ABOVE_BYTES || Math.max(img.naturalWidth, img.naturalHeight) > resizeMaxEdge;
  if (!large) {
    return { ok: true, image: { blob: file, fileName: file.name, previewUrl: sourceUrl } };
  }

  const png = options.keepPng === true && file.type === 'image/png';
  const resized = await toResized(img, resizeMaxEdge, png);
  URL.revokeObjectURL(sourceUrl);

  const maxBytes = (options.maxKb ?? 5120) * 1024;
  if (!resized || resized.size > maxBytes) {
    return { ok: false, message: `L'image ne doit pas dépasser ${Math.round(maxBytes / 1024 / 1024)} Mo.` };
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar';
  return {
    ok: true,
    image: { blob: resized, fileName: `${baseName}.${png ? 'png' : 'jpg'}`, previewUrl: URL.createObjectURL(resized) },
  };
};
