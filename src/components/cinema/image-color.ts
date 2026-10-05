const cache = new Map<string, [number, number, number]>();

/**
 * An image's average colour, lifted so dark images still read on the navy page. Null when the image isn't
 * ready or can't be read (e.g. a cross-origin image without CORS); only successful reads are cached.
 */
export function averageImageColor(image: HTMLImageElement | null | undefined): [number, number, number] | null {
  const source = image?.currentSrc || image?.src;
  if (!image || !source || !image.complete || !image.naturalWidth) return null;
  const cached = cache.get(source);
  if (cached) return cached;

  let color: [number, number, number] | null = null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 8;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (context) {
      context.drawImage(image, 0, 0, 8, 8);
      const pixels = context.getImageData(0, 0, 8, 8).data;
      let red = 0, green = 0, blue = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        red += pixels[index];
        green += pixels[index + 1];
        blue += pixels[index + 2];
      }
      const count = pixels.length / 4;
      const lift = (value: number) => Math.round(Math.min(255, (value / count) * 1.35 + 30));
      color = [lift(red), lift(green), lift(blue)];
    }
  } catch {}
  if (color) cache.set(source, color);
  return color;
}

export function rgba([red, green, blue]: [number, number, number], alpha: number) {
  return `rgb(${red} ${green} ${blue} / ${Math.round(alpha * 100)}%)`;
}
