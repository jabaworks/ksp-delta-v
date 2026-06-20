# KSP Δv Planner

A delta-v mission planner for Kerbal Space Program — pick a destination, see the legs, plan the burns.

Forked from [donlion/ksp-delta-v](https://github.com/donlion/ksp-delta-v).

## This fork

- **Orbital map layout** — the destination map is now drawn as concentric orbits (Kerbol at center, planets ringed around it, moons ringed around their planet) instead of the original spine/tree layout. See `components/DeltaVMap.tsx`.
- **Reference orbits** — added Keostationary and Heliostationary as non-selectable waypoint rings on the map, with delta-v derivations documented in `lib/deltav-data.ts`.

## Development

```
npm install
npm run dev
```

## Build for GitHub Pages

```
GITHUB_PAGES=true npm run build
```

Static export goes to `./out`. Deployed automatically via `.github/workflows/deploy.yml` on push to `main`.
