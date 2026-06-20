"use client";

import { useEffect, useMemo, useState } from "react";

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
  /** Distance from parent's center, in px (not to scale — ordered only). */
  orbitRadius: number;
  /** Angle around the parent, in degrees (0 = due right, clockwise). */
  orbitAngleDeg: number;
  label: string;
  r: number;
  stroke: string;
  isWaypoint?: boolean;
  /** Dashed ring instead of solid — used for reference orbits (KEO, heliostationary). */
  isReferenceOrbit?: boolean;
}

interface EdgeDef {
  from: string;
  to: string;
  color: string;
  width?: number;
  /** Raw Δv in m/s — scaled at render time by √rescale */
  dv?: number;
  /** 0–1 fraction along the edge where the label sits (default 0.5) */
  labelAt?: number;
  /** Render as a dashed line — used for reference-orbit insertion burns */
  dashed?: boolean;
}

// ── Node definitions (polar, relative to parent) ────────────────────────────
const NODES: Record<string, OrbitNodeDef> = {
  kerbol: { parent: null, orbitRadius: 0, orbitAngleDeg: 0, label: "Kerbol", r: 22, stroke: "#e8c040" },

  // Heliostationary reference orbit — circular orbit around Kerbol whose period
  // matches Kerbol's sidereal rotation (432,000 s). Sits well inside Moho's orbit.
  // See lib/deltav-data.ts for the derivation.
  heliostationary: {
    parent: "kerbol", orbitRadius: 75, orbitAngleDeg: -90,
    label: "Heliostationary", r: 5, stroke: "#e8c040",
    isWaypoint: true, isReferenceOrbit: true,
  },

  moho:   { parent: "kerbol", orbitRadius: 115, orbitAngleDeg: 200, label: "Moho",   r: 13, stroke: "#c8a050" },
  eve:    { parent: "kerbol", orbitRadius: 165, orbitAngleDeg: 140, label: "Eve",    r: 15, stroke: "#8050c0" },
  gilly:  { parent: "eve",    orbitRadius:  26, orbitAngleDeg:  40, label: "Gilly",  r: 7,  stroke: "#a070d0" },

  kerbin: { parent: "kerbol", orbitRadius: 220, orbitAngleDeg:  90, label: "Kerbin", r: 16, stroke: "#4070d0" },
  mun:    { parent: "kerbin", orbitRadius:  32, orbitAngleDeg: 320, label: "Mun",    r: 9,  stroke: "#909090" },
  minmus: { parent: "kerbin", orbitRadius:  46, orbitAngleDeg:  70, label: "Minmus", r: 7,  stroke: "#50a060" },
  keostationary: {
    parent: "kerbin", orbitRadius: 22, orbitAngleDeg: 190,
    label: "Keostationary", r: 4, stroke: "#7090d8",
    isWaypoint: true, isReferenceOrbit: true,
  },

  duna: { parent: "kerbol", orbitRadius: 280, orbitAngleDeg:  50, label: "Duna", r: 13, stroke: "#c04040" },
  ike:  { parent: "duna",   orbitRadius:  26, orbitAngleDeg: 150, label: "Ike",  r: 7,  stroke: "#808080" },

  dres: { parent: "kerbol", orbitRadius: 335, orbitAngleDeg: 165, label: "Dres", r: 10, stroke: "#a0a0a0" },

  jool:   { parent: "kerbol", orbitRadius: 400, orbitAngleDeg: 290, label: "Jool",   r: 17, stroke: "#40a030" },
  laythe: { parent: "jool",   orbitRadius:  30, orbitAngleDeg:  10, label: "Laythe", r: 8,  stroke: "#4080c0" },
  tylo:   { parent: "jool",   orbitRadius:  42, orbitAngleDeg:  90, label: "Tylo",   r: 9,  stroke: "#c0c080" },
  vall:   { parent: "jool",   orbitRadius:  54, orbitAngleDeg: 170, label: "Vall",   r: 7,  stroke: "#60b0b0" },
  bop:    { parent: "jool",   orbitRadius:  66, orbitAngleDeg: 230, label: "Bop",    r: 6,  stroke: "#806040" },
  pol:    { parent: "jool",   orbitRadius:  78, orbitAngleDeg: 300, label: "Pol",    r: 6,  stroke: "#c0a060" },

  eeloo: { parent: "kerbol", orbitRadius: 460, orbitAngleDeg: 235, label: "Eeloo", r: 9, stroke: "#a0c0e0" },
};

// ── OPM-only node positions ──────────────────────────────────────────────────
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

// ── Edge connections ──────────────────────────────────────────────────────────
// Each planet connects straight to Kerbol (its transfer leg); moons connect to
// their parent planet; reference orbits connect to the body they orbit.
const EDGES: EdgeDef[] = [
  { from: "kerbol", to: "heliostationary", color: "#e8c040", width: 1.5, dv: 12030, dashed: true, labelAt: 0.6 },

  { from: "kerbol", to: "moho", color: "#c8a050", width: 2,   dv: 3170, labelAt: 0.55 },
  { from: "kerbol", to: "eve",  color: "#8050c0", width: 2,   dv: 2380, labelAt: 0.55 },
  { from: "eve",    to: "gilly", color: "#a070d0", width: 1.5, dv: 90 },

  { from: "kerbol", to: "kerbin",        color: "#4070d0", width: 2.5, dv: 3400, labelAt: 0.55 },
  { from: "kerbin", to: "mun",           color: "#808080", width: 1.5, dv: 1170 },
  { from: "kerbin", to: "minmus",        color: "#50a060", width: 1.5, dv: 1090 },
  { from: "kerbin", to: "keostationary", color: "#7090d8", width: 1.5, dv: 1150, dashed: true },

  { from: "kerbol", to: "duna", color: "#c04040", width: 2,   dv: 1440, labelAt: 0.55 },
  { from: "duna",   to: "ike",  color: "#808080", width: 1.5, dv: 210 },

  { from: "kerbol", to: "dres", color: "#a0a0a0", width: 2, dv: 1900, labelAt: 0.55 },

  { from: "kerbol", to: "jool",   color: "#40a030", width: 2.5, dv: 4735, labelAt: 0.55 },
  { from: "jool",   to: "laythe", color: "#4080c0", width: 1.5, dv: 1510 },
  { from: "jool",   to: "tylo",   color: "#c0c080", width: 1.5, dv: 1500 },
  { from: "jool",   to: "vall",   color: "#60b0b0", width: 1.5, dv: 1380 },
  { from: "jool",   to: "bop",    color: "#806040", width: 1.5, dv: 3100 },
  { from: "jool",   to: "pol",    color: "#c0a060", width: 1.5, dv: 3640 },
];

// Stock-only edges (hidden in OPM mode)
const STOCK_EDGES: EdgeDef[] = [
  { from: "kerbol", to: "eeloo", color: "#a0c0e0", width: 2, dv: 3100, labelAt: 0.55 },
];

// OPM-only edges
const OPM_EDGES: EdgeDef[] = [
  { from: "kerbol", to: "sarnus",    color: "#c8b470", width: 2.5, dv: 2420, labelAt: 0.6 },
  { from: "sarnus", to: "tekto",     color: "#5090a8", width: 1.5, dv: 820 },
  { from: "sarnus", to: "slate",     color: "#708090", width: 1.5, dv: 1000 },
  { from: "sarnus", to: "eeloo-opm", color: "#a0c0e0", width: 1.5, dv: 1480 },
  { from: "sarnus", to: "ovok",      color: "#c8b080", width: 1.5, dv: 1160 },
  { from: "sarnus", to: "hale",      color: "#a08060", width: 1.5, dv: 1520 },

  { from: "kerbol", to: "plock", color: "#c8c0d8", width: 2, dv: 3340, labelAt: 0.6 },
  { from: "plock",  to: "karen", color: "#d0c0b8", width: 1.5, dv: 130 },

  { from: "kerbol", to: "urlum", color: "#60a8c0", width: 2.5, dv: 4360, labelAt: 0.6 },
  { from: "urlum",  to: "polta", color: "#90a8b8", width: 1.5, dv: 780 },
  { from: "urlum",  to: "priax", color: "#a0b0c0", width: 1.5, dv: 790 },
  { from: "urlum",  to: "wal",   color: "#7090a8", width: 1.5, dv: 1480 },
  { from: "wal",    to: "tal",   color: "#98b0c0", width: 1.5, dv: 330 },

  { from: "kerbol", to: "neidon", color: "#4060c0", width: 2.5, dv: 4900, labelAt: 0.6 },
  { from: "neidon", to: "thatmo", color: "#607888", width: 1.5, dv: 1310 },
  { from: "neidon", to: "nissee", color: "#b0b8c8", width: 1.5, dv: 1410 },
];

// Selectable destinations (stock)
const STOCK_DESTINATIONS = new Set([
  "kerbin",
  "mun", "minmus", "moho", "eve", "gilly", "duna", "ike",
  "dres", "jool", "laythe", "tylo", "vall", "bop", "pol", "eeloo",
]);

// Selectable destinations (OPM — replaces eeloo with eeloo-opm, adds rest)
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
 * Resolves every node's absolute (x, y) by walking the parent chain outward
 * from Kerbol. Parents are always resolved before their children because
 * every orbit table lists Kerbol's direct children first — but we still
 * guard with a small retry pass in case of future reordering.
 */
function resolvePositions(
  nodes: Record<string, OrbitNodeDef>,
  centerX: number,
  centerY: number
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

      if (!parentPos) continue; // parent not resolved yet — try next pass

      const rad = (def.orbitAngleDeg * Math.PI) / 180;
      resolved[id] = {
        ...def,
        x: parentPos.x + def.orbitRadius * Math.cos(rad),
        y: parentPos.y + def.orbitRadius * Math.sin(rad),
      };
      remaining.delete(id);
    }
  }
  return resolved;
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

  const opmEnabled = scaleMode === "opm";
  const scaleFactor = Math.sqrt(rescale);
  const rawNodes = opmEnabled ? { ...NODES, ...OPM_NODES } : NODES;
  const activeEdges = opmEnabled
    ? [...EDGES, ...OPM_EDGES]
    : [...EDGES, ...STOCK_EDGES];
  const selectableIds = opmEnabled ? OPM_DESTINATIONS : STOCK_DESTINATIONS;

  const viewSize = opmEnabled ? 1460 : 980;
  const center = viewSize / 2;

  const allNodes = useMemo(
    () => resolvePositions(rawNodes, center, center),
    [rawNodes, center]
  );

  // Staggered colour bloom on mount — systems coming online
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
        [ Δv map not available for this planet pack · switch to List view ]
      </div>
    );
  }

  const viewBox = `0 0 ${viewSize} ${viewSize}`;

  return (
    <svg
      viewBox={viewBox}
      className="select-none"
      style={{ width: "100%", minWidth: opmEnabled ? 1100 : 820 }}
      aria-label="KSP Delta-V solar system map"
    >
      <defs>
        <pattern id="dot-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="0" cy="0" r="0.8" fill="var(--c-text3)" opacity="0.35" />
        </pattern>
      </defs>

      {/* Dot grid background */}
      <rect width="100%" height="100%" fill="url(#dot-grid)" />

      {/* ── Orbit rings ── */}
      {Object.entries(allNodes).map(([id, node]) => {
        if (node.parent === null) return null;
        const parentPos = allNodes[node.parent];
        if (!parentPos) return null;
        return (
          <circle
            key={`ring-${id}`}
            cx={parentPos.x} cy={parentPos.y} r={node.orbitRadius}
            fill="none"
            stroke={node.isReferenceOrbit ? node.stroke : "var(--c-text3)"}
            strokeWidth={node.isReferenceOrbit ? 1 : 0.75}
            strokeDasharray={node.isReferenceOrbit ? "3 4" : "1 5"}
            opacity={node.isReferenceOrbit ? 0.4 : 0.25}
          />
        );
      })}

      {/* ── Edges ── */}
      {activeEdges.map((edge, i) => {
        const f = allNodes[edge.from];
        const t = allNodes[edge.to];
        if (!f || !t) return null;

        const p = edge.labelAt ?? 0.5;
        const lx = f.x + p * (t.x - f.x);
        const ly = f.y + p * (t.y - f.y);
        const scaledLabel = edge.dv != null
          ? Math.round(edge.dv * scaleFactor).toLocaleString()
          : null;
        const labelW = scaledLabel ? Math.max(28, scaledLabel.length * 6 + 10) : 0;

        return (
          <g key={i}>
            <line
              x1={f.x} y1={f.y} x2={t.x} y2={t.y}
              stroke={edge.color}
              strokeWidth={edge.width ?? 2}
              strokeLinecap="round"
              strokeDasharray={edge.dashed ? "5 4" : undefined}
              opacity={0.75}
            />
            {scaledLabel && (
              <>
                <rect
                  x={lx - labelW / 2} y={ly - 9}
                  width={labelW} height={13}
                  rx={2}
                  style={{ fill: "var(--c-surface)" }}
                  opacity={0.95}
                />
                <text
                  x={lx} y={ly}
                  textAnchor="middle" dominantBaseline="middle"
                  style={{ fill: edge.color }}
                  fontSize={11}
                  fontFamily="var(--font-space-mono), 'Courier New', monospace"
                  opacity={0.9}
                >
                  {scaledLabel}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* ── Nodes ── */}
      {Object.entries(allNodes).map(([id, node]) => {
        const isDest    = selectableIds.has(id);
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
  );
}
