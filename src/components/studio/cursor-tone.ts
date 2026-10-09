import { averageImageColor } from "@/components/cinema/image-color";

export type CursorKind = "none" | "action" | "media" | "text" | "field";
export type CursorTone = "light" | "dark";
export type CursorSample = { kind: CursorKind; tone: CursorTone };

type Rgba = [number, number, number, number];

const fieldSelector = "input, textarea, select, [contenteditable='true']";
const actionSelector = "[data-cursor], a, button, [role='button']";
const mediaSelector = "img, video, canvas, picture";
const lightThreshold = 0.5;

const colorCache = new Map<string, Rgba>();
let probe: CanvasRenderingContext2D | null = null;

/** Any CSS colour (rgb, oklch, color-mix…) as RGBA, by letting a 1×1 canvas resolve it. */
function parseColor(value: string): Rgba {
  const cached = colorCache.get(value);
  if (cached) return cached;
  let rgba: Rgba = [0, 0, 0, 0];
  if (value && value !== "transparent") {
    probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = "#000";
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const [red, green, blue, alpha] = probe.getImageData(0, 0, 1, 1).data;
      rgba = [red, green, blue, alpha / 255];
    }
  }
  colorCache.set(value, rgba);
  return rgba;
}

/** The average of a gradient's colour stops, so gradient-backed cards still read as light or dark. */
function gradientColor(image: string): Rgba | null {
  const stops = image.match(/(?:rgba?|hsla?|oklch|oklab|color)\([^()]*\)|#[0-9a-f]{3,8}\b/gi);
  if (!stops?.length) return null;
  const colors = stops.map(parseColor);
  const sum = colors.reduce((total, color) => total.map((value, index) => value + color[index]) as Rgba, [0, 0, 0, 0] as Rgba);
  return sum.map((value) => value / colors.length) as Rgba;
}

/** Relative luminance (0 black – 1 white). */
function luminance([red, green, blue]: Rgba | [number, number, number]) {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

/** The colour actually painted behind an element: its own and its ancestors' backgrounds, composited. */
function backdropColor(element: Element): Rgba {
  const layers: Rgba[] = [];
  let coverage = 0;
  for (let node: Element | null = element; node && coverage < 0.98; node = node.parentElement) {
    const style = getComputedStyle(node);
    const fill = style.backgroundImage.includes("gradient") ? gradientColor(style.backgroundImage) : null;
    const layer = fill ?? parseColor(style.backgroundColor);
    if (layer[3] > 0) {
      layers.push(layer);
      coverage += (1 - coverage) * layer[3];
    }
  }
  // Paint from the back (page) to the front (the element), over the Lot's ink.
  let [red, green, blue] = [8, 9, 13];
  for (const [layerRed, layerGreen, layerBlue, alpha] of layers.reverse()) {
    red = layerRed * alpha + red * (1 - alpha);
    green = layerGreen * alpha + green * (1 - alpha);
    blue = layerBlue * alpha + blue * (1 - alpha);
  }
  return [red, green, blue, 1];
}

function hasOwnText(element: Element) {
  return [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
}

/** What the cursor is over: the kind of content, and whether what's behind it is light or dark (for its label). */
export function sampleUnder(target: Element): CursorSample {
  const field = target.closest(fieldSelector);
  const action = field ? null : target.closest(actionSelector);
  const media = target.closest(mediaSelector) ?? (target.matches(actionSelector) ? target.querySelector(mediaSelector) : null);

  let tone: CursorTone;
  if (media instanceof HTMLImageElement || media?.querySelector?.("img")) {
    const image = media instanceof HTMLImageElement ? media : media.querySelector("img");
    const color = averageImageColor(image);
    tone = color && luminance(color) > lightThreshold ? "light" : "dark";
  } else if (media) {
    tone = "dark"; // video and the 3D gallery canvas can't be read; both are dark screens
  } else {
    tone = luminance(backdropColor(target)) > lightThreshold ? "light" : "dark";
  }

  const kind: CursorKind = field
    ? "field"
    : action
      ? "action"
      : media
        ? "media"
        : hasOwnText(target)
          ? "text"
          : "none";
  return { kind, tone };
}
