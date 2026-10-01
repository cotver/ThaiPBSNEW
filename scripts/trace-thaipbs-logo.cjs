/**
 * Traces public/LOGO/thaipbs-logo.png into vector outlines for the 3D gallery.
 *
 *   node scripts/trace-thaipbs-logo.cjs
 *
 * Writes src/app/(prototype)/prototype/studio-lot/_engine/thaipbsLogo.ts — one entry per shape
 * (outer outline + holes), coloured orange or grey, normalised so the logo is 1 unit tall,
 * centred horizontally with its base at y = 0 (y up). Re-run whenever the source PNG changes.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SOURCE = path.join(__dirname, "../public/LOGO/thaipbs-logo.png");
const OUTPUT = path.join(__dirname, "../src/app/(prototype)/prototype/studio-lot/_engine/thaipbsLogo.ts");
const MIN_AREA = 40; // px² — drops anti-aliasing specks
const SMOOTHING_PASSES = 4;
const SIMPLIFY_EPSILON = 0.3; // px — small enough that the long swoosh curves stay smooth at wall scale

function classify(r, g, b, a) {
  if (a < 128) return 0;
  return r - g > 60 ? 1 : 2; // 1 = orange, 2 = grey
}

/** Pixel-edge boundary tracing. Outer loops run clockwise on screen (y down), holes the other way. */
function traceLoops(mask, width, height) {
  const inside = (x, y) => x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x];
  const edges = new Map(); // "x,y" -> list of [x2, y2]
  const add = (x1, y1, x2, y2) => {
    const key = `${x1},${y1}`;
    if (!edges.has(key)) edges.set(key, []);
    edges.get(key).push([x2, y2]);
  };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!inside(x, y)) continue;
      if (!inside(x, y - 1)) add(x, y, x + 1, y);
      if (!inside(x + 1, y)) add(x + 1, y, x + 1, y + 1);
      if (!inside(x, y + 1)) add(x + 1, y + 1, x, y + 1);
      if (!inside(x - 1, y)) add(x, y + 1, x, y);
    }
  }

  const loops = [];
  for (const [startKey, list] of edges) {
    while (list.length) {
      const [sx, sy] = startKey.split(",").map(Number);
      const loop = [[sx, sy]];
      let [px, py] = [sx, sy];
      let [cx, cy] = list.pop();
      while (!(cx === sx && cy === sy)) {
        loop.push([cx, cy]);
        const next = edges.get(`${cx},${cy}`);
        // At a pinch point two edges leave the same corner: take the right-hand turn so
        // diagonally touching regions stay separate loops.
        const dx = cx - px;
        const dy = cy - py;
        let pick = 0;
        if (next.length > 1) {
          const rightTurn = [-dy, dx];
          const found = next.findIndex(([nx, ny]) => nx - cx === rightTurn[0] && ny - cy === rightTurn[1]);
          pick = found >= 0 ? found : 0;
        }
        const [nx, ny] = next.splice(pick, 1)[0];
        [px, py, cx, cy] = [cx, cy, nx, ny];
      }
      loops.push(loop);
    }
  }
  return loops;
}

function signedArea(loop) {
  let area = 0;
  for (let i = 0; i < loop.length; i += 1) {
    const [x1, y1] = loop[i];
    const [x2, y2] = loop[(i + 1) % loop.length];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

/** Laplacian smoothing on a closed loop — turns the pixel staircase into the curve it samples. */
function smooth(loop, passes) {
  let points = loop;
  for (let pass = 0; pass < passes; pass += 1) {
    points = points.map((point, i) => {
      const prev = points[(i - 1 + points.length) % points.length];
      const next = points[(i + 1) % points.length];
      return [(prev[0] + 2 * point[0] + next[0]) / 4, (prev[1] + 2 * point[1] + next[1]) / 4];
    });
  }
  return points;
}

function simplifyOpen(points, epsilon) {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const length = Math.hypot(bx - ax, by - ay) || 1;
  let maxDistance = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i];
    const distance = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length;
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }
  if (maxDistance <= epsilon) return [points[0], points[points.length - 1]];
  const left = simplifyOpen(points.slice(0, index + 1), epsilon);
  const right = simplifyOpen(points.slice(index), epsilon);
  return [...left.slice(0, -1), ...right];
}

/** Ramer–Douglas–Peucker on a closed loop, split at the point farthest from the first. */
function simplifyClosed(loop, epsilon) {
  let far = 0;
  let best = 0;
  loop.forEach(([x, y], i) => {
    const d = Math.hypot(x - loop[0][0], y - loop[0][1]);
    if (d > best) {
      best = d;
      far = i;
    }
  });
  const a = simplifyOpen(loop.slice(0, far + 1), epsilon);
  const b = simplifyOpen([...loop.slice(far), loop[0]], epsilon);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

function pointInPolygon([x, y], polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

async function main() {
  const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const parts = [];

  for (const [colour, id] of [["orange", 1], ["grey", 2]]) {
    const mask = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i += 1) {
      mask[i] = classify(data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3]) === id ? 1 : 0;
    }
    const loops = traceLoops(mask, width, height)
      .map((loop) => ({ points: simplifyClosed(smooth(loop, SMOOTHING_PASSES), SIMPLIFY_EPSILON), area: signedArea(loop) }))
      .filter((loop) => Math.abs(loop.area) >= MIN_AREA && loop.points.length >= 3);
    // Outer loops are clockwise on screen (positive area with y down); holes are negative.
    const outers = loops.filter((loop) => loop.area > 0).sort((a, b) => a.area - b.area);
    const holes = loops.filter((loop) => loop.area < 0);
    const shapes = outers.map((outer) => ({ colour, outer: outer.points, holes: [] }));
    for (const hole of holes) {
      const owner = outers.findIndex((outer) => pointInPolygon(hole.points[0], outer.points));
      if (owner >= 0) shapes[owner].holes.push(hole.points);
    }
    parts.push(...shapes);
  }

  // Normalise: 1 unit tall, centred on x, base at y = 0, y up.
  const all = parts.flatMap((part) => part.outer);
  const minX = Math.min(...all.map((p) => p[0]));
  const maxX = Math.max(...all.map((p) => p[0]));
  const minY = Math.min(...all.map((p) => p[1]));
  const maxY = Math.max(...all.map((p) => p[1]));
  const size = maxY - minY;
  const cx = (minX + maxX) / 2;
  const toUnit = (points) => points.flatMap(([x, y]) => [+((x - cx) / size).toFixed(4), +((maxY - y) / size).toFixed(4)]);

  const out = parts.map((part) => ({ colour: part.colour, outer: toUnit(part.outer), holes: part.holes.map(toUnit) }));
  const pointCount = out.reduce((sum, part) => sum + part.outer.length / 2 + part.holes.reduce((s, h) => s + h.length / 2, 0), 0);

  const source = `// Generated by scripts/trace-thaipbs-logo.cjs from public/LOGO/thaipbs-logo.png — do not edit by hand.
// ${out.length} shapes, ${pointCount} points. Units: logo height = 1, base at y = 0, centred on x, y up.

export type LogoPart = { colour: "orange" | "grey"; outer: number[]; holes: number[][] };

export const THAI_PBS_LOGO_ASPECT = ${((maxX - minX) / size).toFixed(4)};

export const THAI_PBS_LOGO: LogoPart[] = ${JSON.stringify(out)};
`;
  fs.writeFileSync(OUTPUT, source);
  console.log(`${out.length} shapes (${out.filter((p) => p.colour === "orange").length} orange, ${out.filter((p) => p.colour === "grey").length} grey), ${pointCount} points, holes: ${out.reduce((s, p) => s + p.holes.length, 0)}, aspect ${((maxX - minX) / size).toFixed(3)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
