# images/

This folder holds the Open Graph preview image used by social media previews.

## Required file: og-cosmos.png (1200 × 630 px)

### How to create it

1. Open `og-preview.html` (in the root of the repository) in Google Chrome.
2. Open DevTools (F12) → Device Toolbar (Ctrl+Shift+M).
3. Set a **custom size**: Width = **1200**, Height = **630**.
4. Wait for the Google Fonts to load (a few seconds).
5. Right-click anywhere on the page → **Capture screenshot** (or use the DevTools menu ⋮ → Capture screenshot).
6. Save the file as **og-cosmos.png** and place it in this `images/` folder.
7. Commit and push both `og-preview.html` and `images/og-cosmos.png` to GitHub Pages.

### Alternatively: use a headless screenshot tool

If you have Node.js installed you can run:
```
npx capture-website og-preview.html --output images/og-cosmos.png --width 1200 --height 630 --launch-options '{"args":["--no-sandbox"]}'
```

### Why it matters
The og-cosmos.png image appears when someone shares a link to the magazine on Twitter/X, Facebook, WhatsApp, Slack, Discord, iMessage, and other social platforms that support Open Graph.
All article pages and the main index.html already reference this image at:
`https://pradeepbalaji2011-ux.github.io/cosmos-magazine/images/og-cosmos.png`
