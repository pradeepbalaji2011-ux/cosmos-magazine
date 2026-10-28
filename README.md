# Cosmos Magazine — The Cosmos After Dark

A high-performance, dark-themed astronomical web magazine and interactive 3D universe atlas built for GitHub Pages with pure static files (no build tools or Node.js required).

**Live Site:** [https://pradeepbalaji2011-ux.github.io/cosmos-magazine/](https://pradeepbalaji2011-ux.github.io/cosmos-magazine/)

---

## 🌑 Cinematic Gargantua Black Hole Home Page

`index.html` is a full-screen, cinematic WebGL experience powered by a **ray-marched Schwarzschild black hole shader** (Three.js r128). The black hole fills the entire viewport and *is* the navigation.

### The Visuals (Gargantua & Light Strands)
| View | Description |
|---|---|
| **Home (Gargantua)** | Matches the iconic look of Gargantua (*Interstellar*). Large central shadow with a razor-sharp, blinding white photon ring. Accretion disk seen nearly edge-on (~83.5° inclination) extending past both screen edges, with the rear of the disk gravitationally lensed into a luminous arch over the shadow and a secondary arch under the bottom. Turbulent gas clouds, multi-frequency FBM wisps, differential Keplerian rotation, and dark dust lanes with copper/cream/rust color grading. |
| **Light Strands** | Zooming into the disk fills the screen with hundreds of fine, straight vertical gold-yellow light filaments (dense center, softly fading at edges) crossed by faint horizontal threads. Interactive article strands have glowing tips and reveal titles on hover. |
| **Horizon Dive** | Clicking the shadow initiates a 1-second gravitational dive (light bends, stars streak, fades to black) and transitions seamlessly into the Cosmos Atlas. |

### 3-State Navigation
1. **Home (State 0)** — Cinematic Gargantua in 3D motion with gentle camera drift. Interactive labels: *"Enter the light ↓"* and *"Dive into the shadow →"*.
2. **Light Strands (State 1)** — One click/scroll tick rushes into the glowing disk, presenting article strands. Hovering a strand widens and illuminates it with a title tooltip. Clicking opens a frosted-glass Info Panel with category, title, summary, hero image, and direct links.
3. **Horizon (State 2)** — One click on the black shadow plunges into the event horizon and opens `atlas.html?v=7&ref=index.html#sgr-a-star` (or `#m87-star`).

### Controls & Navigation
| Input | Action |
|---|---|
| **Scroll wheel** | One tick jumps a full level (Home ↔ Light Strands) |
| **Touch swipe** | Swipe up/down jumps between Home and Light Strands |
| **Click on disk** | Enter Light Strands (State 1) |
| **Click on shadow** | Dive into Black Hole / Open Cosmos Atlas (State 2) |
| **Hover strand** | Glows and shows article title |
| **Click strand** | Slides open the frosted-glass Info Panel |
| **Home / Light / Horizon** | Jump directly using bottom pill navigation |
| **Sgr A* / M87*** | Switch between black holes (adjusts disk inclination & Doppler balance) |
| **Quality button** | Cycle Low / Med / High render resolution and ray steps |
| **Esc / ← Back** | Close Info Panel / return to previous state |
| **Browser Back** | Supported via HTML5 history pushState |

### Adding an Article or Observation Strand
Edit the `ARTICLES` array in `js/home-bh.js`:
```javascript
{
  slug: 'your-article',
  title: 'Your Article Title',
  cat: 'News',           // 'News' (#c8a96e), 'Observing' (#a0c8d8), 'Exploration' (#c87050), 'Learn' (#9080c8)
  catColor: '#c8a96e',
  summary: 'A short one-sentence summary.',
  atlasId: null          // Optional: matching Cosmos Atlas object id (e.g. 'mars', 'earth', 'orion-nebula')
}
```

### Fallbacks
- **Classic View**: `index-classic.html` preserves the original scrolling 3D magazine.
- **WebGL Failure**: Automatic silent redirect to `index-classic.html`.
- **Accessibility**: Screen readers and search engines access the hidden semantic `<nav>` with full article hierarchy and one `<h1>`.

---

## 📁 Repository Structure

```
├── index.html                   # Immersive WebGL black hole home page (Three.js r128 ray-marched)
├── index-classic.html           # Original 3D scroll magazine (preserved, linked from home page)
├── css/home.css                 # Styles for the immersive home page
├── js/home-bh.js                # WebGL black hole scene, nodes, threads, UI, navigation
├── atlas.html                   # Interactive 3D universe (Three.js r128) with dynamic 4K textures & photo lightbox
├── og-preview.html              # Template used to generate social preview image (1200x630)
├── README.md                    # Project documentation, sources, and licences
├── .gitignore                   # Ignores large raw datasets (*.gitignored)
├── articles/                    # 10 comprehensive scientific articles
│   ├── article.css              # Shared dark-theme stylesheet
│   ├── atmosphere-glows.html
│   ├── dark-adapt.html
│   ├── galaxies-filaments.html
│   ├── gas-giants-ice-giants.html
│   ├── life-on-mars.html
│   ├── milky-way.html
│   ├── moon-phase.html
│   ├── nebulae.html
│   ├── saturns-rings.html
│   └── solar-cycles.html
├── textures/                    # 4K planetary maps (4096x2048 / 4096px width, quality 85)
│   ├── mercury.jpg, venus.jpg, earth.jpg, moon.jpg, mars.jpg
│   ├── jupiter.jpg, saturn.jpg, uranus.jpg, neptune.jpg
│   ├── saturn_ring.png (transparent)
│   ├── earth_night.jpg, earth_clouds.jpg, earth_normal.jpg
│   ├── mercury_bump.jpg, moon_bump.jpg, mars_bump.jpg
│   └── 2k/                      # 2048px baseline textures loaded first for all bodies
├── images/
│   ├── og-cosmos.png            # Open Graph social preview image (1200x630)
│   ├── README.md                # Guide for generating social preview images
│   ├── objects/                 # 4K (~3840px) photography for Atlas info panel & lightbox
│   │   ├── <id>.jpg & .webp     # Modern dual-format imagery (WebP + fallback JPG)
│   │   └── credits.json         # Structured metadata, licence, and citation sources
│   └── articles/                # Responsive 4K-ready hero images (1600w, 2400w, 3840w)
│       └── <slug>-<width>.jpg & .webp
└── data/
    └── hyg.csv                  # Optimized HYG star catalogue (brighter than mag 8, 3.26 MB)
```

---

## 🌟 Features

### 1. 3D Scroll Magazine (`index.html`)
- **Immersive 3D Flight**: Camera animates smoothly along a custom spline path through procedural scenes as you scroll.
- **Dynamic "Sky This Week"**: Browser-calculated astronomical data for the user's device date:
  - Moon phase name and illumination percentage
  - Dates for the next Full Moon and New Moon
  - Planetary visibility (Mercury, Venus, Mars, Jupiter, Saturn) after dusk and before dawn using Keplerian orbital elements without external API calls.
- **Functional Newsletter**: Real email subscription form supporting Formspree or Buttondown with email validation, spam honeypot field, and clear status feedback.
- **Open Graph Metadata**: Complete Open Graph and Twitter Card tags pointing to `images/og-cosmos.png`.

### 2. Cosmos Atlas (`atlas.html`)
- **GPU Memory Optimization & On-Demand 4K Loading**: All bodies start with lightweight 2K base maps (`textures/2k/`) on every quality level. When focusing Earth, Moon, Mercury, or Mars, 4K maps dynamically load and swap in on medium/high quality. When focus moves or is cleared (polled every 3s), 2K textures are restored and 4K textures are disposed to keep VRAM consumption minimal. Quality "low" remains 2K-only. Bodies without additional 4K detail (Jupiter, Saturn, Venus, Uranus, Neptune) remain strictly on 2K. Saturn's ring texture is maintained at 4K on non-low.
- **Accurate Linear Color Decoding in Custom Shaders**: Custom ShaderMaterials (Earth night-side city lights and Saturn's ring shadow) explicitly decode sRGB textures to linear space (`sRGBToLinear`) before performing lighting calculations and re-encoding with `#include <encodings_fragment>`, eliminating washed-out or over-bright artifacts in Three.js r128.
- **Object Photo Panel & Lightbox**: Selecting an object presents real imagery (loading WebP with automatic JPG error fallback) with credit lines and an option to expand to a full-screen glass modal.
- **Deep Linking & Sharing**: Hash deep-linking for all celestial bodies (`#saturn`, `#m31`, `#star-sirius`, `#con-ori`). Native Web Share API with clipboard fallback.
- **Dynamic Back-Links**: Opened from an article page via `?ref=articles/...`, displaying a responsive **`← Back to article`** button in the header.
- **Auto-Generated Credits**: All photo and texture attributions are parsed directly from `credits.json` and populated into the Credits dialog.

### 3. Scientific Article Pages (`/articles/`)
- 10 static articles (400–600 words each) covering astronomy, space exploration, and observing techniques.
- Responsive 4K hero images with `srcset` (1600px, 2400px, 3840px) in WebP and JPG formats.
- Structured with Key Facts cards, reputable source citations (NASA, ESA, ESO, NOIRLab), and previous/next article navigation.
- Linked directly into the Cosmos Atlas with preselected object hashes and return tracking.

---

## 📜 Sources and Licences

### Planetary Maps (`textures/`)
All base planetary surface maps are provided under **Creative Commons Attribution 4.0 International (CC BY 4.0)** by **Solar System Scope** ([solarsystemscope.com/textures](https://www.solarsystemscope.com/textures/)), derived from NASA elevation, imagery, and orbital missions:
- **Mercury**: NASA / MESSENGER MDIS global mosaic
- **Venus**: NASA / Magellan radar & Pioneer atmosphere
- **Earth**: NASA Visible Earth Blue Marble (Day, Night lights, and Clouds)
- **Moon**: NASA / LRO (Lunar Reconnaissance Orbiter) Camera albedo map
- **Mars**: NASA / Viking & Mars Global Surveyor MOLA elevation
- **Jupiter**: NASA / Cassini & Hubble Space Telescope
- **Saturn & Rings**: NASA / Cassini imaging science subsystem
- **Uranus & Neptune**: NASA / Voyager 2 narrow-angle camera (2K base maps; Solar System Scope only publishes 2K due to Voyager 2 camera limits; not described as 4K)
- **Lunar Topography**: NASA SVS Lunar Reconnaissance Orbiter LOLA digital elevation model (`ldem_4.tif`, Public Domain)

### Deep-Sky & Astronomical Photography (`images/objects/`)
Every image was sourced from official public archives of NASA, ESA/Hubble, ESA/Webb, ESO, NOIRLab, and SDO:

| Object ID | Subject | Source & Telescope / Mission | Licence |
|---|---|---|---|
| `orion-nebula` | Orion Nebula (M42) | NASA, ESA, M. Robberto / Hubble Space Telescope | Public Domain |
| `crab-nebula` | Crab Nebula (M1) | NASA, ESA, J. Hester & A. Loll / Hubble Space Telescope | Public Domain |
| `eagle-nebula` | Pillars of Creation (M16) | NASA, ESA, CSA, STScI / James Webb Space Telescope | CC BY 4.0 |
| `ring-nebula` | Ring Nebula (M57) | ESA/Webb, NASA, CSA, M. Barlow et al. / JWST | CC BY 4.0 |
| `helix-nebula` | Helix Nebula (NGC 7293) | ESO / VISTA (J. Emerson, CASU) | CC BY 4.0 |
| `horsehead-nebula` | Horsehead Nebula (B33) | ESA/Webb, NASA, CSA, K. Misselt, A. Abergel / JWST | CC BY 4.0 |
| `carina-nebula` | Cosmic Cliffs (NGC 3372) | NASA, ESA, CSA, STScI / James Webb Space Telescope | CC BY 4.0 |
| `pleiades` | Pleiades Cluster (M45) | NASA, ESA, AURA/Caltech, Palomar Observatory | Public Domain |
| `hyades` | Hyades Cluster (Mel 25) | NOIRLab / NSF / AURA / Digitized Sky Survey 2 | CC BY 4.0 |
| `omega-centauri` | Omega Centauri (NGC 5139) | ESO / INAF-VST / OmegaCAM | CC BY 4.0 |
| `m31` | Andromeda Galaxy | ESO / G. Beccari | CC BY 4.0 |
| `m33` | Triangulum Galaxy | ESO / VPHAS+ Team | CC BY 4.0 |
| `m51` | Whirlpool Galaxy | NASA, ESA, S. Beckwith / Hubble Heritage Team | Public Domain |
| `m104` | Sombrero Galaxy | ESA/Webb, NASA, CSA, STScI / JWST | CC BY 4.0 |
| `milky-way` | Milky Way Panorama | ESO / Serge Brunier | CC BY 4.0 |
| `m87-star` | M87* Black Hole | Event Horizon Telescope (EHT) Collaboration | CC BY 4.0 |
| `sgr-a-star` | Sagittarius A* Black Hole | Event Horizon Telescope (EHT) Collaboration | CC BY 4.0 |
| `trappist-1` | TRAPPIST-1 System | ESO / M. Kornmesser (*Artist Concept / Illustration*) | CC BY 4.0 |
| `sun` | The Sun in Ultra-HD | NASA / SDO (Solar Dynamics Observatory) AIA Team | Public Domain |

---

## ⚡ Asset & Performance Summary

- **`textures/` Size**: **23.67 MB** (32 files total)
  - `textures/` (4K maps root): **18.95 MB** (16 files)
  - `textures/2k/` (2K baseline set): **4.72 MB** (16 files)
- **`images/` Size**: **106.71 MB** (119 files across objects, responsive article heroes, and OG image)
- **`data/hyg.csv`**: Trimmed to **3.26 MB** (from 32.36 MB, stars mag ≤ 8.0), reducing initial load time by ~90%.
- **Resolution Notes**: 
  - All 18 deep-sky photos and the Sun are provided in true **3840px (4K)** resolution in both `.webp` and `.jpg`.
  - Uranus and Neptune: Solar System Scope publishes base maps in 2048px (Voyager 2 coverage limits). They are strictly 2K base maps and are not described or treated as 4K anywhere.
