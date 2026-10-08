import * as THREE from "three";
import type { MarketLogo } from "@/lib/market-logos";
import { seeded } from "./math";

/** Canvas-drawn textures: every letter in the gallery is real typography, not baked art. */

const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace";
const INK = "#1b1a18";

function canvas(width: number, height: number) {
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  const context = element.getContext("2d");
  if (!context) throw new Error("2D canvas unavailable");
  return [element, context] as const;
}

function toTexture(element: HTMLCanvasElement, srgb = true) {
  const texture = new THREE.CanvasTexture(element);
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function fitFont(context: CanvasRenderingContext2D, text: string, family: string, weight: number, maxSize: number, maxWidth: number) {
  let size = maxSize;
  context.font = `${weight} ${size}px ${family}`;
  while (context.measureText(text).width > maxWidth && size > 12) {
    size -= 4;
    context.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number, font: string) {
  context.font = font;
  // Thai has no spaces between words, so break per character when needed.
  const tokens = /\s/.test(text) ? text.split(/(\s+)/) : text.split("");
  let line = "";
  let lines = 0;
  for (const token of tokens) {
    const candidate = line + token;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines += 1;
      if (lines === maxLines) {
        context.fillText(`${line.trimEnd()}…`, x, y);
        return y;
      }
      context.fillText(line.trimEnd(), x, y);
      y += lineHeight;
      line = token.trimStart();
    } else {
      line = candidate;
    }
  }
  if (line) context.fillText(line, x, y);
  return y;
}

/** Cut-vinyl wall lettering: gallery number, room title and a Thai subtitle. */
export function vinylTexture(options: { kicker: string; title: string; sub?: string; font: string; ink?: string }) {
  const [element, context] = canvas(1024, 384);
  const ink = options.ink ?? INK;
  context.fillStyle = ink;
  context.textBaseline = "alphabetic";
  context.font = `600 30px ${MONO}`;
  if (options.kicker) {
    context.globalAlpha = 0.7;
    context.fillText(options.kicker.toUpperCase().split("").join(" "), 8, 52);
    context.globalAlpha = 1;
  }
  const size = fitFont(context, options.title, options.font, 700, 150, 1000);
  context.fillText(options.title, 2, 70 + size);
  if (options.sub) {
    context.font = `600 44px ${options.font}`;
    context.globalAlpha = 0.75;
    context.fillText(options.sub, 6, 110 + size + 30);
  }
  return toTexture(element);
}

/** Museum wall label: small card with title, credit line and a short note. */
export function labelTexture(options: { title: string; meta: string; note: string; font: string }) {
  const [element, context] = canvas(512, 340);
  context.fillStyle = "#f6f3ec";
  context.fillRect(0, 0, 512, 340);
  context.fillStyle = INK;
  wrapText(context, options.title, 28, 62, 456, 40, 2, `700 32px ${options.font}`);
  context.font = `500 18px ${MONO}`;
  context.globalAlpha = 0.6;
  context.fillText(options.meta.toUpperCase(), 28, 150);
  context.globalAlpha = 0.85;
  wrapText(context, options.note, 28, 200, 456, 30, 4, `400 22px ${options.font}`);
  return toTexture(element);
}

/** A printed story pinned in a frame: paper, headline, rule, caption. */
export function printTexture(options: { kicker: string; title: string; meta: string; font: string }) {
  const [element, context] = canvas(768, 512);
  context.fillStyle = "#efeae0";
  context.fillRect(0, 0, 768, 512);
  const random = seeded(options.title.length * 17 + 3);
  for (let i = 0; i < 1800; i += 1) {
    context.fillStyle = `rgba(80,60,40,${random() * 0.05})`;
    context.fillRect(random() * 768, random() * 512, 2, 2);
  }
  context.fillStyle = "#b5462f";
  context.font = `600 22px ${MONO}`;
  context.fillText(options.kicker.toUpperCase(), 48, 72);
  context.fillStyle = INK;
  const end = wrapText(context, options.title, 48, 140, 672, 54, 4, `700 46px ${options.font}`);
  context.fillRect(48, Math.min(430, end + 40), 672, 2);
  context.globalAlpha = 0.6;
  context.font = `500 20px ${MONO}`;
  context.fillText(options.meta.toUpperCase(), 48, 470);
  return toTexture(element);
}

/** Lime-plaster wall: near-white with a soft trowel texture. */
export function plasterTexture(seed: number) {
  const [element, context] = canvas(512, 512);
  context.fillStyle = "#ece7dd";
  context.fillRect(0, 0, 512, 512);
  const random = seeded(seed);
  for (let i = 0; i < 420; i += 1) {
    const shade = 200 + random() * 40;
    context.fillStyle = `rgba(${shade},${shade - 4},${shade - 12},${random() * 0.12})`;
    context.beginPath();
    context.ellipse(random() * 512, random() * 512, 20 + random() * 60, 6 + random() * 18, random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }
  const texture = toTexture(element);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Polished concrete floor with saw-cut joints. */
export function concreteTexture() {
  const size = 512;
  const random = seeded(77);
  const [element, context] = canvas(size, size);
  // Pale, polished concrete: light enough that the floor reads bright by day.
  context.fillStyle = "#d6d1c8";
  context.fillRect(0, 0, size, size);
  for (let i = 0; i < 16000; i += 1) {
    const shade = 195 + random() * 30;
    context.fillStyle = `rgba(${shade},${shade - 2},${shade - 5},0.5)`;
    context.fillRect(random() * size, random() * size, 1.5, 1.5);
  }
  for (let i = 0; i < 30; i += 1) {
    context.fillStyle = `rgba(150,144,135,${random() * 0.15})`;
    context.beginPath();
    context.ellipse(random() * size, random() * size, 40 + random() * 120, 20 + random() * 60, random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }
  const texture = toTexture(element);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 18);
  return texture;
}

/** Radial falloff sprite for dust motes and light pools. */
export function radialTexture() {
  const [element, context] = canvas(128, 128);
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.25, "rgba(255,255,255,.55)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return toTexture(element, false);
}

/** SMPTE-style colour bars: what the premiere screen shows when nothing is scheduled. */
export function testCardTexture(font: string) {
  const [element, context] = canvas(1280, 720);
  const bars = ["#c0c0c0", "#c0c000", "#00c0c0", "#00c000", "#c000c0", "#c00000", "#0000c0"];
  bars.forEach((colour, index) => {
    context.fillStyle = colour;
    context.fillRect((index * 1280) / 7, 0, 1280 / 7 + 1, 480);
  });
  ["#0000c0", "#131313", "#c000c0", "#131313", "#00c0c0", "#131313", "#c0c0c0"].forEach((colour, index) => {
    context.fillStyle = colour;
    context.fillRect((index * 1280) / 7, 480, 1280 / 7 + 1, 60);
  });
  context.fillStyle = "#08090d";
  context.fillRect(0, 540, 1280, 180);
  context.fillStyle = "#f2ede4";
  context.font = `700 72px ${font}`;
  context.textBaseline = "middle";
  context.fillText("THAI PBS · STAND BY", 60, 630);
  return toTexture(element);
}

/** Stand-in artwork when an image is missing or fails to load. */
export function posterFallback(title: string, font: string, index: number) {
  const [element, context] = canvas(400, 600);
  const hues = [28, 192, 350, 46, 210, 160];
  const hue = hues[index % hues.length];
  const gradient = context.createLinearGradient(0, 0, 400, 600);
  gradient.addColorStop(0, `hsl(${hue} 35% 30%)`);
  gradient.addColorStop(1, "#15130f");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 400, 600);
  context.fillStyle = "#f2ede4";
  wrapText(context, title, 28, 470, 344, 44, 3, `700 38px ${font}`);
  return toTexture(element);
}

/**
 * Content Distribution card, as the /home showcase draws it: black 16:9, the logo contained in a
 * centred box (68% × 46% by default). Official logos are painted in once they load from the
 * same-origin logo route; wordmarks use the brand colour, face, italics, tracking and border.
 */
export function partnerLogoTexture(logo: MarketLogo & { frame: { width: number; height: number } }, font: string) {
  const W = 1280;
  const H = 720;
  const [element, context] = canvas(W, H);
  const boxW = W * logo.frame.width;
  const boxH = H * logo.frame.height;
  const paintBackground = () => {
    context.fillStyle = "#0a0a0a";
    context.fillRect(0, 0, W, H);
  };
  paintBackground();
  const texture = toTexture(element);

  if (logo.kind === "image") {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const iw = image.naturalWidth || boxW;
      const ih = image.naturalHeight || boxH;
      const scale = Math.min(boxW / iw, boxH / ih);
      paintBackground();
      context.drawImage(image, (W - iw * scale) / 2, (H - ih * scale) / 2, iw * scale, ih * scale);
      texture.needsUpdate = true;
    };
    image.src = `/home/studio/logo/${encodeURIComponent(logo.brand)}`;
    return texture;
  }

  const { style } = logo;
  const label = style.uppercase ? logo.label.toUpperCase() : logo.label;
  const family = style.family === "serif" ? "Georgia, \"Times New Roman\", serif" : font;
  const weight = style.family === "serif" ? 700 : 900;
  const italic = style.italic ? "italic " : "";
  const padX = style.border ? 0.28 : 0;
  // Largest size that fits the box, letter spacing included.
  let size = boxH * 0.9;
  const measure = () => {
    context.font = `${italic}${weight} ${size}px ${family}`;
    context.letterSpacing = `${style.tracking * size}px`;
    return context.measureText(label).width + padX * 2 * size;
  };
  while (measure() > boxW && size > 16) size -= 4;
  context.fillStyle = style.color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, W / 2, H / 2);
  if (style.border) {
    const textWidth = context.measureText(label).width;
    const width = textWidth + padX * 2 * size;
    const height = size * 1.06;
    context.strokeStyle = style.border;
    context.lineWidth = Math.max(6, size * 0.06);
    context.beginPath();
    context.roundRect(W / 2 - width / 2, H / 2 - height / 2, width, height, size * 0.15);
    context.stroke();
  }
  return texture;
}

/** Centred wall caption under a piece (Market & Events group names). */
/**
 * The "ThaiPBS Studio" lettering for the portal beside the doorway: paper-white on transparent, "ThaiPBS"
 * bold and "Studio" regular (the Lot font's 700 and 400), sized to fill the canvas width.
 */
export function studioSignTexture(font: string, ink = "#f2ede4") {
  const [element, context] = canvas(2048, 512);
  const bold = "ThaiPBS";
  const light = " Studio";
  const size = fitFont(context, `${bold}${light}`, font, 700, 300, 1960);
  context.font = `700 ${size}px ${font}`;
  const boldWidth = context.measureText(bold).width;
  context.font = `400 ${size}px ${font}`;
  const total = boldWidth + context.measureText(light).width;
  const x = (2048 - total) / 2;
  context.fillStyle = ink;
  context.textBaseline = "middle";
  context.font = `700 ${size}px ${font}`;
  context.fillText(bold, x, 256);
  context.font = `400 ${size}px ${font}`;
  context.fillText(light, x + boldWidth, 256);
  return toTexture(element);
}

export function captionTexture(text: string, font: string) {
  const [element, context] = canvas(1024, 160);
  context.fillStyle = INK;
  context.textAlign = "center";
  context.textBaseline = "middle";
  fitFont(context, text, font, 700, 76, 980);
  context.fillText(text, 512, 84);
  return toTexture(element);
}

/**
 * Super-graphics for the nave walls facing each room. Only the name, "public media" and the year
 * broadcasting began — no claims beyond that, and no imitation of the official logo.
 */
export function muralTexture(variant: number, font: string, accent: string) {
  const [element, context] = canvas(2048, 820);
  context.textBaseline = "alphabetic";
  const kind = variant % 3;
  if (kind === 0) {
    // Outlined name across the wall.
    context.strokeStyle = INK;
    context.lineWidth = 6;
    const size = fitFont(context, "THAI PBS", font, 700, 560, 1960);
    context.font = `700 ${size}px ${font}`;
    context.strokeText("THAI PBS", 30, 470 + size * 0.1);
    context.fillStyle = accent;
    context.font = `700 96px ${font}`;
    context.fillText("ไทยพีบีเอส", 40, 760);
  } else if (kind === 1) {
    context.fillStyle = INK;
    const size = fitFont(context, "สื่อสาธารณะ", font, 700, 380, 1960);
    context.font = `700 ${size}px ${font}`;
    context.fillText("สื่อสาธารณะ", 30, 470);
    context.font = `600 64px ${MONO}`;
    context.fillStyle = accent;
    context.fillText("P U B L I C   M E D I A  ·  T H A I   P B S", 40, 680);
  } else {
    context.fillStyle = INK;
    context.font = `600 64px ${MONO}`;
    context.fillText("T H A I   P B S  ·  O N   A I R   S I N C E", 40, 150);
    const size = fitFont(context, "2008", font, 700, 640, 1960);
    context.font = `700 ${size}px ${font}`;
    context.fillStyle = accent;
    context.fillText("2008", 20, 760);
  }
  return toTexture(element);
}

/** Broadcast "ON AIR" light box face; brightness is driven by the material colour. */
export function onAirTexture() {
  const [element, context] = canvas(512, 160);
  context.fillStyle = "#2a0705";
  context.fillRect(0, 0, 512, 160);
  context.strokeStyle = "#ff5a4a";
  context.lineWidth = 6;
  context.strokeRect(10, 10, 492, 140);
  context.fillStyle = "#ff6a5a";
  context.font = `700 92px ${MONO}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("ON AIR", 256, 84);
  return toTexture(element);
}

/** Hanging fabric banner: accent cloth with the name set vertically in both scripts. */
export function bannerTexture(accent: string, font: string) {
  const [element, context] = canvas(320, 900);
  context.fillStyle = accent;
  context.fillRect(0, 0, 320, 900);
  context.fillStyle = "rgba(255,255,255,0.92)";
  context.save();
  context.translate(250, 860);
  context.rotate(-Math.PI / 2);
  context.font = `700 150px ${font}`;
  context.fillText("Thai PBS", 0, 0);
  context.restore();
  context.font = `700 48px ${font}`;
  context.fillText("ไทยพีบีเอส", 34, 150);
  return toTexture(element);
}

/** Small printed brand plate (mic flag, desk front, tape spines). */
export function brandPlateTexture(text: string, font: string, background = "#f2ede4", ink = INK) {
  const [element, context] = canvas(512, 256);
  context.fillStyle = background;
  context.fillRect(0, 0, 512, 256);
  context.fillStyle = ink;
  context.textAlign = "center";
  context.textBaseline = "middle";
  fitFont(context, text, font, 700, 120, 460);
  context.fillText(text, 256, 132);
  return toTexture(element);
}
