# hazemmohashim.github.io

Portfolio of Hazem M. Hashim — Electronics & Communication Engineer.

Single-page site: React + Vite + Three.js (react-three-fiber) + GSAP + Lenis.
Deploys to GitHub Pages as a user site (repository `HazemMoHashim.github.io`).

## Develop

```
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
```

## Structure

- `src/data/profile.ts` — all content (CV facts). Edit here, not in components.
- `src/three/` — the 3D board scene + Gerber parser (drop-in real-copper loader).
- `src/components/` — page sections.
- `src/styles/global.css` — design tokens (PCB noir palette, type system).
