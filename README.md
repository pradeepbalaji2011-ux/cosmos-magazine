# Cosmos Magazine: 3D Scroll Journey

A single-page, scroll-driven 3D website for Cosmos Magazine. As you scroll, the camera flies through space, stopping at a different 3D object for each section of the site.

Live page: https://claude.ai/artifact/1gpfH4SCLibMxxfiiV23PZ

## Files

| File | Purpose |
|---|---|
| `cosmos-3d.html` | The whole site: HTML, CSS and JavaScript in one file |
| `README.md` | This file |

## Run it

No build step and no Node.js needed.

1. Download `cosmos-3d.html`.
2. Double-click it to open it in a modern browser (Chrome, Edge, Firefox or Safari). An internet connection is required, because Three.js, GSAP and the fonts load from CDNs.

If your browser blocks anything when opening the file directly, serve the folder locally instead:

```
python -m http.server 8000
```

Then open `http://localhost:8000/cosmos-3d.html`.

## Sections and scenes

| Section | 3D scene |
|---|---|
| Home: *The Cosmos After Dark* | Star field |
| News | Spiral galaxy (about 7,000 particles) |
| Observing | Moon with a soft halo |
| Space Exploration | Mars and ringed Saturn |
| Learn | Glowing nebula clouds |
| Cosmos Atlas | Cosmic web of connected nodes |

## Interaction

- **Scroll:** the camera moves along a smooth spline path, with easing so it glides rather than snaps.
- **Mouse:** the view shifts slightly toward the pointer (parallax).
- **Hover:** hovering a text card scales up its matching 3D object. This is desktop only.
- **Scroll animation:** GSAP and ScrollTrigger fade each card in as it enters view.
- **Navigation:** the top bar links to each section, highlights the current one and shows scroll progress.

## Tech

- Three.js r128 (UMD build from cdnjs)
- GSAP 3.12.5 and ScrollTrigger (cdnjs)
- Google Fonts: Bodoni Moda and DM Mono
- No models or image assets. Planet textures and glow sprites are drawn procedurally on canvas.

## Customising

Everything is in `cosmos-3d.html`.

- **Colours:** edit the CSS variables at the top of the `<style>` block (`--ac` accent, `--cy` cyan, `--vi` violet, `--bg` background).
- **Copy and sections:** edit the `<section>` blocks inside `<main>`. Add `class="r"` to put a card on the right.
- **Camera path:** edit the `K` array in the script. Each row is one camera stop as `[x, y, z]`, in section order.
- **Object placement:** the `put(object, stopIndex, side, distance)` calls place each object near its camera stop. `side` is `1` or `-1` for right or left.
- **Linking a card to an object:** the `data-o` attribute on a card (`galaxy`, `moon`, `planets`, `nebula`, `web`, `stars`) must match a key in the `O` object so hover scaling works.
- **Using your own `.glb` models:** add Three.js's `GLTFLoader` (a pinned cdnjs or jsDelivr script) and replace a procedural object with the loaded model, keeping the same `O` key.

## Performance and responsiveness

- Mobile (screens under 760px or mobile user agents) gets fewer particles, a pixel ratio capped at 1 and no hover scaling.
- Desktop pixel ratio is capped at 1.75.
- If WebGL isn't available, the 3D canvas is hidden and a static gradient background is shown instead.
- Users with "reduce motion" enabled get no continuous rotation and no smoothing delay on the camera.
- To go lighter, lower the particle counts passed to `pts(...)`, or reduce the number of nebula sprites and web nodes.

## Known limits

- The "Open the Cosmos Atlas" buttons scroll to the Atlas section of this page. They don't open the full interactive Atlas from the magazine file.
- Hover scaling is by text card, not by clicking the 3D objects themselves.
- Layout and object positions have not been tuned across every screen size, so adjust the `put(...)` offsets if an object sits behind a card on your display.
