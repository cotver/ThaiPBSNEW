/**
 * The image being carried into an article by the image morph. The loading screen shows it in its hero
 * frame, so the morph can run card → loading frame → article hero when the article isn't ready yet.
 */
let morphImage: string | null = null;
const listeners = new Set<() => void>();

export function setMorphImage(source: string | null) {
  morphImage = source;
  listeners.forEach((listener) => listener());
}

export function getMorphImage() {
  return morphImage;
}

export function subscribeMorphImage(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
