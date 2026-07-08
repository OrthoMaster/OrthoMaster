// ============================================================
// Physics-based layout — planets bounce around like billiard balls.
// Sun is a static obstacle at canvas center.
//
// Each planet has position (cx,cy), velocity (vx,vy), and radius.
// On each tick:
//   1. Integrate position by velocity * dt
//   2. Reflect off canvas edges
//   3. Reflect off the sun (circle obstacle)
//   4. Resolve pairwise collisions between planets (elastic-ish)
// ============================================================

import { MainNode } from './Logic';

export type PlanetLayout = {
  nodeId: string;
  cx: number;
  cy: number;
  vx: number;             // velocity x in px/sec
  vy: number;             // velocity y in px/sec
  baseSize: number;
  size: number;           // current diameter
  zDepth: number;         // kept for API compatibility — always 0.5 (no perspective)
};

export type SolarLayout = {
  sunX: number;
  sunY: number;
  sunRadius: number;
  width: number;
  height: number;
  planets: Map<string, PlanetLayout>;
};

export type LayoutInput = {
  nodes: MainNode[];      // root nodes only
  width: number;
  height: number;
};

// Stable pseudo-random seeded by node id.
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 10000) / 10000;
}

export function computeOrbitLayout({ nodes, width, height }: LayoutInput): SolarLayout {
  const sunX = width / 2;
  const sunY = height / 2;

  const dim = Math.min(width, height);
  const sunRadius = dim * 0.17;
  const planetSize = dim * 0.45;

  const planets = new Map<string, PlanetLayout>();

  // Spawn planets on a circle around the sun (so they don't overlap initially)
  // and give each a random velocity.
  const spawnRadius = sunRadius + planetSize + 24;
  const N = nodes.length || 1;

  // Speed: scale with canvas size. ~ 4-7% of canvas dim per second feels lively
  // but not chaotic.
  const baseSpeed = dim * 0.04;

  nodes.forEach((node, i) => {
    const seed = hashSeed(node.id);
    // Spread spawn angles so initial layout looks balanced
    const spawnAngle = (i / N) * Math.PI * 2 + seed * 0.5;

    // Outward spawn radius slightly varies so planets don't all start
    // on the exact same circle (avoids initial pile-up after first collisions).
    const r = spawnRadius + seed * planetSize * 1.5;

    const cx = sunX + Math.cos(spawnAngle) * r;
    const cy = sunY + Math.sin(spawnAngle) * r;

    // Velocity direction: random per seed, magnitude same for all so motion
    // looks coherent.
    const dirAngle = seed * Math.PI * 2;
    // Speed varies ±25% per planet for organic feel
    const speed = baseSpeed * (0.85 + seed * 0.3);
    const vx = Math.cos(dirAngle) * speed;
    const vy = Math.sin(dirAngle) * speed;

    planets.set(node.id, {
      nodeId: node.id,
      cx, cy,
      vx, vy,
      baseSize: planetSize,
      size: planetSize,
      zDepth: 0.5,
    });
  });

  return { sunX, sunY, sunRadius, width, height, planets };
}

// Update all planet positions for one frame.
// `dt` is seconds since last frame (clamp to avoid huge jumps after
// background/foreground or hot-reload).
export function tickOrbits(layout: SolarLayout, _elapsed: number, dt: number = 1 / 60) {
  const safeDt = Math.min(dt, 1 / 30);  // never bigger than ~33ms

  const planetArr = [...layout.planets.values()];

  // 1. Integrate
  for (const p of planetArr) {
    p.cx += p.vx * safeDt;
    p.cy += p.vy * safeDt;
  }

  // 2. Edge reflection — each planet has its own radius (size/2)
  for (const p of planetArr) {
    const r = p.size / 2;
    if (p.cx - r < 0) {
      p.cx = r;
      p.vx = Math.abs(p.vx);
    } else if (p.cx + r > layout.width) {
      p.cx = layout.width - r;
      p.vx = -Math.abs(p.vx);
    }
    if (p.cy - r < 0) {
      p.cy = r;
      p.vy = Math.abs(p.vy);
    } else if (p.cy + r > layout.height) {
      p.cy = layout.height - r;
      p.vy = -Math.abs(p.vy);
    }
  }

  // 3. Sun collision — push planet out along the radial vector and reflect
  //    its velocity around the radial normal.
  for (const p of planetArr) {
    const dx = p.cx - layout.sunX;
    const dy = p.cy - layout.sunY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = layout.sunRadius + p.size / 2;
    if (dist < minDist && dist > 0.0001) {
      // Normal vector (planet relative to sun)
      const nx = dx / dist;
      const ny = dy / dist;
      // Push planet to the boundary
      p.cx = layout.sunX + nx * minDist;
      p.cy = layout.sunY + ny * minDist;
      // Reflect velocity around normal: v' = v - 2(v·n)n
      const dot = p.vx * nx + p.vy * ny;
      if (dot < 0) {  // only if heading INTO the sun
        p.vx = p.vx - 2 * dot * nx;
        p.vy = p.vy - 2 * dot * ny;
      }
    }
  }

  // 4. Pairwise planet-planet collision.
  //    Equal-mass elastic collision: swap velocity components along the
  //    collision normal. Position correction prevents sticking.
  for (let i = 0; i < planetArr.length; i++) {
    for (let j = i + 1; j < planetArr.length; j++) {
      const a = planetArr[i];
      const b = planetArr[j];
      const dx = b.cx - a.cx;
      const dy = b.cy - a.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = (a.size + b.size) / 2;
      if (dist < minDist && dist > 0.0001) {
        const nx = dx / dist;
        const ny = dy / dist;

        // Position correction: separate them along the normal
        const overlap = minDist - dist;
        const halfOverlap = overlap / 2;
        a.cx -= nx * halfOverlap;
        a.cy -= ny * halfOverlap;
        b.cx += nx * halfOverlap;
        b.cy += ny * halfOverlap;

        // Velocity exchange along normal (equal mass elastic)
        const aDot = a.vx * nx + a.vy * ny;
        const bDot = b.vx * nx + b.vy * ny;
        // Only resolve if they're approaching (aDot - bDot > 0)
        if (aDot - bDot > 0) {
          // Swap normal components
          a.vx += (bDot - aDot) * nx;
          a.vy += (bDot - aDot) * ny;
          b.vx += (aDot - bDot) * nx;
          b.vy += (aDot - bDot) * ny;
        }
      }
    }
  }
}