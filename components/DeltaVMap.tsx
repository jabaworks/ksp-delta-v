"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * A node's position is defined in polar coordinates relative to a parent:
 * - Planets orbit Kerbol (`parent: "kerbol"`).
 * - Moons orbit their planet (`parent: <planet id>`).
 * - Kerbol itself has `parent: null` and sits at the map center.
 *
 * Absolute pixel positions are derived at render time via `resolvePositions`,
 * so moving a planet's ring radius automatically carries its moons with it.
 */
interface OrbitNodeDef {
  parent: string | null;
  /** Distance from parent's center, in px (not to scale — ordered only). For
   *  eccentric orbits this is the semi-major axis. */
  orbitRadius: number;
  /** Angle around the parent, in degrees (0 = due right, clockwise) — where
   *  the body currently sits. */
  orbitAngleDeg: number;
  label: string;
  r: number;
  stroke: string;
  isWaypoint?: boolean;
  /** Lower-opacity, thinner ring — used for reference orbits (KEO, heliostationary). */
  isReferenceOrbit?: boolean;
  /** Orbital eccentricity, 0-1 (0 = perfect circle). When set, the ring is
   *  drawn as an ellipse and the body's distance from its parent varies with
   *  angle via the standard focus-polar equation. Stylized for legibility,
   *  not orbital-mechanics-accurate. */
  eccentricity?: number;
  /** Direction (deg, same convention as orbitAngleDeg) from the parent toward
   *  periapsis - the orbit's closest-approach point. Defines how the ellipse
   *  is rotated. Only used when `eccentricity` is set. */
  periapsisAngleDeg?: number;
}

interface EdgeDef {
  from: string;
  to: string;
  color: string;
  /** Raw dv in m/s, scaled at render time by sqrt(rescale). Rendered as a
   *  label riding along the destination body's own orbit ring. */
  dv?: number;
}

// -- Node definitions (polar, relative to parent) --------------------------
const NODES: Record<string, OrbitNodeDef> = {
  kerbol: { parent: null, orbitRadius: 0, orbitAngleDeg: 0, label: "Kerbol", r: 22, stroke: "#e8c040" },

  // Heliostationary reference orbit -- circular orbit around Kerbol whose
  // period matches Kerbol's sidereal rotation (432,000 s). Sits well inside
  // Moho's orbit. See lib/deltav-data.ts for the derivation.
  heliostationary: {
    parent: "kerbol", orbitRadius: 49, orbitAngleDeg: -90,
    label: "Heliostationary", r: 5, stroke: "#e8c040",
    isWaypoint: true, isReferenceOrbit: true,
  },

  moho:   { parent: "kerbol", orbitRadius:  75, orbitAngleDeg: 200, label: "Moho",   r: 13, stroke: "#c8a050" },
  eve:    { parent: "kerbol", orbitRadius: 107, orbitAngleDeg: 140, label: "Eve",    r: 15, stroke: "#8050c0" },
  gilly:  { parent: "eve",    orbitRadius:  17, orbitAngleDeg:  40, label: "Gilly",  r: 7,  stroke: "#a070d0" },

  kerbin: { parent: "kerbol", orbitRadius: 143, orbitAngleDeg:  90, label: "Kerbin", r: 16, stroke: "#4070d0" },
  mun:    { parent: "kerbin", orbitRadius:  21, orbitAngleDeg: 320, label: "Mun",    r: 9,  stroke: "#909090" },
  minmus: { parent: "kerbin", orbitRadius:  30, orbitAngleDeg:  70, label: "Minmus", r: 7,  stroke: "#50a060" },
  keostationary: {
    parent: "kerbin", orbitRadius: 14, orbitAngleDeg: 190,
    label: "Keostationary", r: 4, stroke: "#7090d8",
    isWaypoint: true, isReferenceOrbit: true,
  },

  duna: { parent: "kerbol", orbitRadius: 182, orbitAngleDeg:  50, label: "Duna", r: 13, stroke: "#c04040" },
  ike:  { parent: "duna",   orbitRadius:  17, orbitAngleDeg: 150, label: "Ike",  r: 7,  stroke: "#808080" },

  dres: { parent: "kerbol", orbitRadius: 218, orbitAngleDeg: 165, label: "Dres", r: 10, stroke: "#a0a0a0" },

  jool:   { parent: "kerbol", orbitRadius: 260, orbitAngleDeg: 290, label: "Jool",   r: 17, stroke: "#40a030" },
  laythe: { parent: "jool",   orbitRadius:  20, orbitAngleDeg:  10, label: "Laythe", r: 8,  stroke: "#4080c0" },
  tylo:   { parent: "jool",   orbitRadius:  27, orbitAngleDeg:  90, label: "Tylo",   r: 9,  stroke: "#c0c080" },
  vall:   { parent: "jool",   orbitRadius:  35, orbitAngleDeg: 170, label: "Vall",   r: 7,  stroke: "#60b0b0" },
  bop:    { parent: "jool",   orbitRadius:  43, orbitAngleDeg: 230, label: "Bop",    r: 6,  stroke: "#806040" },
  pol:    { parent: "jool",   orbitRadius:  51, orbitAngleDeg: 300, label: "Pol",    r: 6,  stroke: "#c0a060" },

  // Eeloo's real orbit is the stock system's most eccentric by far -- drawn
  // as a true ellipse (exaggerated a bit beyond the real ~0.26 for
  // legibility at this scale) with Kerbol sitting at one focus rather than
  // dead center. Periapsis is kept well clear of Jool's ring so the two
  // orbits never visually cross.
  eeloo: {
    parent: "kerbol", orbitRadius: 430, orbitAngleDeg: 235, label: "Eeloo", r: 9, stroke: "#a0c0e0",
    eccentricity: 0.3, periapsisAngleDeg: 120,
  },
};

// -- OPM-only node positions -------------------------------------------------
const OPM_NODES: Record<string, OrbitNodeDef> = {
  sarnus:      { parent: "kerbol", orbitRadius: 540, orbitAngleDeg:  20, label: "Sarnus", r: 16, stroke: "#c8b470" },
  tekto:       { parent: "sarnus", orbitRadius:  72, orbitAngleDeg: 300, label: "Tekto",  r: 7,  stroke: "#5090a8" },
  slate:       { parent: "sarnus", orbitRadius:  60, orbitAngleDeg:  20, label: "Slate",  r: 8,  stroke: "#708090" },
  "eeloo-opm": { parent: "sarnus", orbitRadius:  48, orbitAngleDeg: 100, label: "Eeloo",  r: 8,  stroke: "#a0c0e0" },
  ovok:        { parent: "sarnus", orbitRadius:  36, orbitAngleDeg: 180, label: "Ovok",   r: 6,  stroke: "#c8b080" },
  hale:        { parent: "sarnus", orbitRadius:  24, orbitAngleDeg: 250, label: "Hale",   r: 5,  stroke: "#a08060" },

  plock: { parent: "kerbol", orbitRadius: 600, orbitAngleDeg: 100, label: "Plock", r: 9, stroke: "#c8c0d8" },
  karen: { parent: "plock",  orbitRadius:  22, orbitAngleDeg:  60, label: "Karen", r: 5, stroke: "#d0c0b8" },

  urlum: { parent: "kerbol", orbitRadius: 660, orbitAngleDeg: 170, label: "Urlum", r: 15, stroke: "#60a8c0" },
  polta: { parent: "urlum",  orbitRadius:  34, orbitAngleDeg:  30, label: "Polta", r: 7,  stroke: "#90a8b8" },
  priax: { parent: "urlum",  orbitRadius:  46, orbitAngleDeg: 110, label: "Priax", r: 7,  stroke: "#a0b0c0" },
  wal:   { parent: "urlum",  orbitRadius:  58, orbitAngleDeg: 200, label: "Wal",   r: 9,  stroke: "#7090a8" },
  tal:   { parent: "wal",    orbitRadius:  20, orbitAngleDeg: 320, label: "Tal",   r: 4,  stroke: "#98b0c0" },

  neidon: { parent: "kerbol", orbitRadius: 720, orbitAngleDeg: 260, label: "Neidon", r: 14, stroke: "#4060c0" },
  thatmo: { parent: "neidon", orbitRadius:  32, orbitAngleDeg:  60, label: "Thatmo",  r: 7,  stroke: "#607888" },
  nissee: { parent: "neidon", orbitRadius:  44, orbitAngleDeg: 200, label: "Nissee",  r: 5,  stroke: "#b0b8c8" },
};

// -- dv edges ----------------------------------------------------------------
// Each entry's `dv` rides as a label along the *destination* body's own
// orbit ring (see the render loop below). No connecting line is drawn -- the
// orbit ring itself is the visual link back to its parent.
const EDGES: EdgeDef[] = [
  { from: "kerbol", to: "heliostationary", color: "#e8c040", dv: 12030 },

  { from: "kerbol", to: "moho", color: "#c8a050", dv: 3170 },
  { from: "kerbol", to: "eve",  color: "#8050c0", dv: 2380 },
  { from: "eve",    to: "gilly", color: "#a070d0", dv: 90 },

  { from: "kerbol", to: "kerbin",        color: "#4070d0", dv: 3400 },
  { from: "kerbin", to: "mun",           color: "#808080", dv: 1170 },
  { from: "kerbin", to: "minmus",        color: "#50a060", dv: 1090 },
  { from: "kerbin", to: "keostationary", color: "#7090d8", dv: 1150 },

  { from: "kerbol", to: "duna", color: "#c04040", dv: 1440 },
  { from: "duna",   to: "ike",  color: "#808080", dv: 210 },

  { from: "kerbol", to: "dres", color: "#a0a0a0", dv: 1900 },

  { from: "kerbol", to: "jool",   color: "#40a030", dv: 4735 },
  { from: "jool",   to: "laythe", color: "#4080c0", dv: 1510 },
  { from: "jool",   to: "tylo",   color: "#c0c080", dv: 1500 },
  { from: "jool",   to: "vall",   color: "#60b0b0", dv: 1380 },
  { from: "jool",   to: "bop",    color: "#806040", dv: 3100 },
  { from: "jool",   to: "pol",    color: "#c0a060", dv: 3640 },
];

// Stock-only edges (hidden in OPM mode)
const STOCK_EDGES: EdgeDef[] = [
  { from: "kerbol", to: "eeloo", color: "#a0c0e0", dv: 3100 },
];

// OPM-only edges
const OPM_EDGES: EdgeDef[] = [
  { from: "kerbol", to: "sarnus",    color: "#c8b470", dv: 2420 },
  { from: "sarnus", to: "tekto",     color: "#5090a8", dv: 820 },
  { from: "sarnus", to: "slate",     color: "#708090", dv: 1000 },
  { from: "sarnus", to: "eeloo-opm", color: "#a0c0e0", dv: 1480 },
  { from: "sarnus", to: "ovok",      color: "#c8b080", dv: 1160 },
  { from: "sarnus", to: "hale",      color: "#a08060", dv: 1520 },

  { from: "kerbol", to: "plock", color: "#c8c0d8", dv: 3340 },
  { from: "plock",  to: "karen", color: "#d0c0b8", dv: 130 },

  { from: "kerbol", to: "urlum", color: "#60a8c0", dv: 4360 },
  { from: "urlum",  to: "polta", color: "#90a8b8", dv: 780 },
  { from: "urlum",  to: "priax", color: "#a0b0c0", dv: 790 },
  { from: "urlum",  to: "wal",   color: "#7090a8", dv: 1480 },
  { from: "wal",    to: "tal",   color: "#98b0c0", dv: 330 },

  { from: "kerbol", to: "neidon", color: "#4060c0", dv: 4900 },
  { from: "neidon", to: "thatmo", color: "#607888", dv: 1310 },
  { from: "neidon", to: "nissee", color: "#b0b8c8", dv: 1410 },
];

// Selectable destinations (stock)
const STOCK_DESTINATIONS = new Set([
  "kerbin",
  "mun", "minmus", "moho", "eve", "gilly", "duna", "ike",
  "dres", "jool", "laythe", "tylo", "vall", "bop", "pol", "eeloo",
]);

// Selectable destinations (OPM -- replaces eeloo with eeloo-opm, adds rest)
const OPM_DESTINATIONS = new Set([
  "kerbin",
  "mun", "minmus", "moho", "eve", "gilly", "duna", "ike",
  "dres", "jool", "laythe", "tylo", "vall", "bop", "pol",
  "sarnus", "slate", "tekto", "ovok", "hale", "eeloo-opm",
  "plock", "karen",
  "urlum", "polta", "priax", "wal", "tal",
  "neidon", "thatmo", "nissee",
]);

interface ResolvedNode extends OrbitNodeDef {
  x: number;
  y: number;
}

/**
 * Distance from the parent/focus at a given angle around it. For circular
 * orbits this is just `orbitRadius`. For eccentric orbits it's the standard
 * focus-polar form of an ellipse: r(v) = a(1-e^2) / (1 + e*cos(v)), where v
 * is measured from the periapsis direction.
 *
 * `spread` (>=1) uniformly widens every orbit -- planets and moons alike --
 * as the camera zooms in, so the whole system gently opens up around
 * whatever you're zoomed toward instead of just sitting under a closer
 * camera. Tightly-packed moon clusters (Jool's five) benefit the most, but
 * everything moves together rather than moons stretching against a static
 * backdrop.
 */
function isMoonNode(def: OrbitNodeDef): boolean {
  return def.parent !== null && def.parent !== "kerbol";
}

function effectiveSemiMajor(def: OrbitNodeDef, spread: number): number {
  return def.orbitRadius * spread;
}

function orbitRadiusAtAngle(def: OrbitNodeDef, angleDeg: number, spread = 1): number {
  const a = effectiveSemiMajor(def, spread);
  if (!def.eccentricity) return a;
  const e = def.eccentricity;
  const peri = def.periapsisAngleDeg ?? def.orbitAngleDeg;
  const trueAnomaly = ((angleDeg - peri) * Math.PI) / 180;
  return (a * (1 - e * e)) / (1 + e * Math.cos(trueAnomaly));
}

/**
 * Resolves every node's absolute (x, y) by walking the parent chain outward
 * from Kerbol. Parents are always resolved before their children because
 * every orbit table lists Kerbol's direct children first -- but we still
 * guard with a small retry pass in case of future reordering.
 */
function resolvePositions(
  nodes: Record<string, OrbitNodeDef>,
  centerX: number,
  centerY: number,
  spread = 1
): Record<string, ResolvedNode> {
  const resolved: Record<string, ResolvedNode> = {};
  const ids = Object.keys(nodes);
  const remaining = new Set(ids);
  let guard = 0;

  while (remaining.size > 0 && guard < ids.length + 1) {
    guard++;
    for (const id of Array.from(remaining)) {
      const def = nodes[id];
      const parentPos = def.parent === null
        ? { x: centerX, y: centerY }
        : resolved[def.parent];

      if (!parentPos) continue; // parent not resolved yet -- try next pass

      const rad = (def.orbitAngleDeg * Math.PI) / 180;
      const dist = orbitRadiusAtAngle(def, def.orbitAngleDeg, spread);
      resolved[id] = {
        ...def,
        x: parentPos.x + dist * Math.cos(rad),
        y: parentPos.y + dist * Math.sin(rad),
      };
      remaining.delete(id);
    }
  }
  return resolved;
}

/**
 * Every orbit -- planets and moons alike -- widens together as the camera
 * zooms in, capped at +200% extra spacing by zoom ~6x. Shared by both the
 * render path and the wheel handler so the latter can predict where a body
 * will land *after* a zoom step, not just where it sits right now.
 */
function spreadFactorForZoom(zoomLevel: number): number {
  return 1 + Math.min(1, Math.max(0, (zoomLevel - 1) / 5)) * 2.0;
}

/** Label sits radially outward from the parent body, away from the center. */
function labelPos(node: ResolvedNode, centerX: number, centerY: number): { x: number; y: number; anchor: "middle" | "start" | "end" } {
  const dx = node.x - centerX;
  const dy = node.y - centerY;
  const dist = Math.hypot(dx, dy) || 1;
  const pad = node.r + 13;
  const ux = dx / dist;
  const uy = dy / dist;
  const lx = node.x + ux * pad;
  const ly = node.y + uy * pad;
  const anchor: "middle" | "start" | "end" = ux > 0.35 ? "start" : ux < -0.35 ? "end" : "middle";
  return { x: lx, y: ly, anchor };
}

interface Props {
  selected: string | null;
  onSelect: (id: string) => void;
  scaleMode: "stock" | "opm" | "quarter" | "rss";
  rescale: number;
}

export default function DeltaVMap({ selected, onSelect, scaleMode, rescale }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [bloomed, setBloomed] = useState<Set<string>>(new Set());
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    clientX: number; clientY: number;
    view: { x: number; y: number; span: number };
    pointerId: number;
    captured: boolean;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const opmEnabled = scaleMode === "opm";
  const scaleFactor = Math.sqrt(rescale);
  const rawNodes = opmEnabled ? { ...NODES, ...OPM_NODES } : NODES;
  const activeEdges = opmEnabled
    ? [...EDGES, ...OPM_EDGES]
    : [...EDGES, ...STOCK_EDGES];
  const selectableIds = opmEnabled ? OPM_DESTINATIONS : STOCK_DESTINATIONS;

  // dv label per node, keyed by the node it lands on (its own orbit ring).
  const dvByNode = useMemo(
    () => new Map(activeEdges.filter((e) => e.dv != null).map((e) => [e.to, e])),
    [activeEdges]
  );

  const viewSize = opmEnabled ? 1460 : 1180;
  const center = viewSize / 2;

  // -- Zoom / pan --------------------------------------------------------
  // view = the visible window into SVG-coordinate space (top-left x/y + a
  // square span). Default (no zoom) covers the whole system: x=0, y=0,
  // span=viewSize. Wheel zooms toward the cursor; pointer-drag pans.
  const [view, setView] = useState({ x: 0, y: 0, span: viewSize });

  useEffect(() => {
    setView({ x: 0, y: 0, span: viewSize });
  }, [viewSize]);

  const minSpan = viewSize / 10; // ~10x max zoom -- enough to read tiny moons
  const maxSpan = viewSize;

  // React's onWheel is passive by default, so e.preventDefault() inside it
  // silently no-ops in most browsers and the page scrolls along with the
  // zoom. A native listener registered with passive:false actually stops it.
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // Latest render's values, for the wheel handler below (a plain DOM
  // listener set up once -- it can't see fresh props/state via closure).
  const paramsRef = useRef({ rawNodes, center, viewSize, minSpan, maxSpan });
  useEffect(() => {
    paramsRef.current = { rawNodes, center, viewSize, minSpan, maxSpan };
  }, [rawNodes, center, viewSize, minSpan, maxSpan]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = svg!.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const cur = viewRef.current;
      const { rawNodes: curRawNodes, center: curCenter, viewSize: curViewSize, minSpan: curMinSpan, maxSpan: curMaxSpan } = paramsRef.current;

      // Where the cursor sits right now, under the current spread.
      const oldSpread = spreadFactorForZoom(curViewSize / cur.span);
      const cursorX = cur.x + px * cur.span;
      const cursorY = cur.y + py * cur.span;

      // Zooming also changes `spreadFactor`, which moves every body. A
      // fixed coordinate isn't a stable zoom target here -- whatever body
      // is nearest the cursor is. Find it, then track *that body's* new
      // position once the spread updates, instead of the raw coordinate.
      const oldNodes = resolvePositions(curRawNodes, curCenter, curCenter, oldSpread);
      let anchorId: string | null = null;
      let bestDist = Infinity;
      for (const [id, n] of Object.entries(oldNodes)) {
        const d = Math.hypot(n.x - cursorX, n.y - cursorY);
        if (d < bestDist) { bestDist = d; anchorId = id; }
      }
      const anchorThreshold = cur.span * 0.18; // only snap if reasonably close
      const useAnchor = anchorId !== null && bestDist <= anchorThreshold;

      const factor = e.deltaY < 0 ? 0.87 : 1 / 0.87;
      const newSpan = Math.min(curMaxSpan, Math.max(curMinSpan, cur.span * factor));
      const newSpread = spreadFactorForZoom(curViewSize / newSpan);

      let targetX = cursorX;
      let targetY = cursorY;
      if (useAnchor) {
        const newNodes = resolvePositions(curRawNodes, curCenter, curCenter, newSpread);
        const newPos = newNodes[anchorId!];
        if (newPos) {
          targetX = newPos.x;
          targetY = newPos.y;
        }
      }

      setView({
        x: targetX - px * newSpan,
        y: targetY - py * newSpan,
        span: newSpan,
      });
    }

    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  function clientToFraction(clientX: number, clientY: number) {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      px: (clientX - rect.left) / rect.width,
      py: (clientY - rect.top) / rect.height,
    };
  }

  // setPointerCapture immediately on every pointerdown would also swallow
  // plain clicks on a node (the browser routes the click to whatever holds
  // capture, not the element under the cursor) -- so capture is deferred
  // until the pointer has actually moved a few pixels, distinguishing a
  // click from the start of a drag.
  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    dragRef.current = { clientX: e.clientX, clientY: e.clientY, view, pointerId: e.pointerId, captured: false };
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragRef.current) return;
    const dxPx = e.clientX - dragRef.current.clientX;
    const dyPx = e.clientY - dragRef.current.clientY;

    if (!dragRef.current.captured) {
      if (Math.hypot(dxPx, dyPx) < 4) return; // still within click tolerance
      (e.currentTarget as Element).setPointerCapture(dragRef.current.pointerId);
      dragRef.current.captured = true;
      setIsDragging(true);
    }

    const rect = svgRef.current!.getBoundingClientRect();
    const dx = (dxPx / rect.width) * dragRef.current.view.span;
    const dy = (dyPx / rect.height) * dragRef.current.view.span;
    setView({ x: dragRef.current.view.x - dx, y: dragRef.current.view.y - dy, span: dragRef.current.view.span });
  }

  function handlePointerUp(e: React.PointerEvent<SVGSVGElement>) {
    if (dragRef.current?.captured) {
      try { (e.currentTarget as Element).releasePointerCapture(dragRef.current.pointerId); } catch { /* already released */ }
    }
    dragRef.current = null;
    setIsDragging(false);
  }

  function resetView() {
    setView({ x: 0, y: 0, span: viewSize });
  }

  const zoomLevel = viewSize / view.span;

  // Every orbit -- planets and moons alike -- widens together as you zoom
  // in, capped at +200% extra spacing by zoom ~6x, so the whole system
  // visibly unfolds and pulls apart around wherever you're zoomed instead
  // of just sitting under a closer camera. (Shared formula -- see
  // `spreadFactorForZoom` -- so the wheel handler can predict it too.)
  const spreadFactor = spreadFactorForZoom(zoomLevel);

  // Moons stay hidden well into the zoom -- they only start fading in once
  // you're zoomed in close (2.5x) and are fully visible by 4.5x, so the
  // early/mid zoom stays focused on the planets opening up first.
  const MOON_REVEAL_START = 2.5;
  const MOON_REVEAL_FULL = 4.5;
  function moonReveal(def: OrbitNodeDef): number {
    if (!isMoonNode(def)) return 1;
    return Math.max(0, Math.min(1, (zoomLevel - MOON_REVEAL_START) / (MOON_REVEAL_FULL - MOON_REVEAL_START)));
  }

  const allNodes = useMemo(
    () => resolvePositions(rawNodes, center, center, spreadFactor),
    [rawNodes, center, spreadFactor]
  );

  // Staggered colour bloom on mount -- systems coming online
  useEffect(() => {
    const ids = Object.keys(rawNodes);
    ids.forEach((id, i) => {
      setTimeout(() => setBloomed((prev) => new Set([...prev, id])), i * 110);
    });
  }, [scaleMode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (scaleMode === "rss" || scaleMode === "quarter") {
    return (
      <div
        className="flex items-center justify-center font-mono text-xs uppercase tracking-widest"
        style={{ minHeight: 200, color: "var(--c-text3)" }}
      >
        [ dv map not available for this planet pack - switch to List view ]
      </div>
    );
  }

  const viewBox = `${view.x} ${view.y} ${view.span} ${view.span}`;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="select-none"
        style={{
          width: "100%",
          minWidth: opmEnabled ? 1100 : 640,
          touchAction: "none",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        aria-label="KSP Delta-V solar system map"
      >
      <defs>
        <pattern id="dot-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="0" cy="0" r="0.8" fill="var(--c-text3)" opacity="0.35" />
        </pattern>
      </defs>

      {/* Dot grid background */}
      <rect width="100%" height="100%" fill="url(#dot-grid)" />

      {/* -- Orbit rings (solid, body-coloured) + dv labels riding on them -- */}
      {Object.entries(allNodes).map(([id, node]) => {
        if (node.parent === null) return null;
        const parentPos = allNodes[node.parent];
        if (!parentPos) return null;

        const reveal = moonReveal(node);
        if (reveal <= 0) return null; // not zoomed in enough yet -- skip entirely

        const ringOpacity = (node.isReferenceOrbit ? 0.3 : 0.55) * reveal;
        const ringWidth = node.isReferenceOrbit ? 0.75 : 1.25;

        // Label sits a little further around the ring from the body itself
        // so the number reads clearly instead of overlapping the planet dot.
        const labelAngle = node.orbitAngleDeg + 20;
        const labelRad = (labelAngle * Math.PI) / 180;
        const labelR = orbitRadiusAtAngle(node, labelAngle, spreadFactor);
        const lx = parentPos.x + labelR * Math.cos(labelRad);
        const ly = parentPos.y + labelR * Math.sin(labelRad);

        const edge = dvByNode.get(id);
        const scaledLabel = edge?.dv != null
          ? Math.round(edge.dv * scaleFactor).toLocaleString()
          : null;
        const labelW = scaledLabel ? Math.max(28, scaledLabel.length * 6 + 10) : 0;
        const labelColor = edge?.color ?? node.stroke;

        let ring: React.ReactNode;
        if (node.eccentricity) {
          const e = node.eccentricity;
          const a = effectiveSemiMajor(node, spreadFactor);
          const b = a * Math.sqrt(1 - e * e);
          const c = a * e;
          const peri = node.periapsisAngleDeg ?? node.orbitAngleDeg;
          const periRad = (peri * Math.PI) / 180;
          const ecx = parentPos.x - c * Math.cos(periRad);
          const ecy = parentPos.y - c * Math.sin(periRad);
          ring = (
            <ellipse
              cx={ecx} cy={ecy} rx={a} ry={b}
              transform={`rotate(${peri} ${ecx} ${ecy})`}
              fill="none"
              stroke={node.stroke}
              strokeWidth={ringWidth}
              opacity={ringOpacity}
            />
          );
        } else {
          ring = (
            <circle
              cx={parentPos.x} cy={parentPos.y} r={effectiveSemiMajor(node, spreadFactor)}
              fill="none"
              stroke={node.stroke}
              strokeWidth={ringWidth}
              opacity={ringOpacity}
            />
          );
        }

        return (
          <g key={`ring-${id}`}>
            {ring}
            {scaledLabel && (
              <>
                <rect
                  x={lx - labelW / 2} y={ly - 9}
                  width={labelW} height={13}
                  rx={2}
                  style={{ fill: "var(--c-surface)" }}
                  opacity={0.95 * reveal}
                />
                <text
                  x={lx} y={ly}
                  textAnchor="middle" dominantBaseline="middle"
                  style={{ fill: labelColor }}
                  fontSize={11}
                  fontFamily="var(--font-space-mono), 'Courier New', monospace"
                  opacity={0.9 * reveal}
                >
                  {scaledLabel}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* -- Nodes -- */}
      {Object.entries(allNodes).map(([id, node]) => {
        const reveal = moonReveal(node);
        if (reveal <= 0) return null; // moon not zoomed in enough yet -- skip entirely

        const isDest    = selectableIds.has(id) && reveal > 0.3;
        const isSel     = selected === id;
        const isHov     = hovered  === id;
        const lp        = labelPos(node, center, center);
        const isBloomed = bloomed.has(id);
        const nodeColor = isBloomed ? node.stroke : "#3a3d46";

        const labelFill = isSel
          ? "var(--c-text)"
          : isHov
          ? "var(--c-text)"
          : node.isWaypoint
          ? "var(--c-text3)"
          : "var(--c-text2)";

        return (
          <g
            key={id}
            onClick={() => isDest && onSelect(id)}
            onMouseEnter={() => isDest && setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: isDest ? "pointer" : "default" }}
            opacity={reveal}
          >
            {/* Selection glow rings */}
            {isSel && (
              <>
                <circle cx={node.x} cy={node.y} r={node.r + 12} fill="none" stroke={nodeColor} strokeWidth={1} opacity={0.12} />
                <circle cx={node.x} cy={node.y} r={node.r + 7}  fill="none" stroke={nodeColor} strokeWidth={1.5} opacity={0.4} />
              </>
            )}

            {/* Hover ring */}
            {isHov && !isSel && (
              <circle
                cx={node.x} cy={node.y} r={node.r + 4}
                fill="none"
                stroke={nodeColor}
                strokeWidth={1.5}
                opacity={0.45}
              />
            )}

            {/* Body circle */}
            <circle
              cx={node.x} cy={node.y} r={node.r}
              style={{
                fill: isSel ? nodeColor + "28" : "var(--c-bg)",
                stroke: nodeColor,
                transition: "stroke 0.6s ease",
              }}
              strokeWidth={isSel ? 2.5 : 1.5}
              opacity={node.isWaypoint ? 0.55 : 1}
            />

            {/* Inner dot */}
            {!node.isWaypoint && (
              <circle
                cx={node.x} cy={node.y}
                r={node.r * 0.32}
                style={{ fill: isSel ? "#fff" : nodeColor, transition: "fill 0.6s ease" }}
                opacity={0.7}
              />
            )}

            {/* Label */}
            {node.label && (
              <text
                x={lp.x} y={lp.y}
                textAnchor={lp.anchor}
                dominantBaseline="middle"
                style={{ fill: labelFill }}
                fontSize={isSel ? 13 : node.isWaypoint ? 10 : 12}
                fontWeight={isSel ? "700" : "400"}
                fontFamily="var(--font-space-grotesk), system-ui, sans-serif"
              >
                {node.label}
              </text>
            )}
          </g>
        );
      })}
      </svg>

      {/* Zoom indicator + reset button -- only shown once zoomed/panned */}
      {zoomLevel > 1.02 && (
        <button
          type="button"
          onClick={resetView}
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            padding: "4px 8px",
            borderRadius: 4,
            background: "var(--c-surface)",
            color: "var(--c-text2)",
            border: "1px solid var(--c-border)",
            cursor: "pointer",
          }}
        >
          {zoomLevel.toFixed(1)}x &middot; reset
        </button>
      )}
    </div>
  );
}
