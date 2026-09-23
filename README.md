# FloodWatch Cebu

> Know before the water does.

A clickable **interface prototype** of a flood alert app for Cebu City, built for
an ES038 Technopreneurship pitch. It is a demo of the UI only: no backend, no
accounts, no live data. Every number, report and warning in it is invented.

The map is real, though — actual Cebu City street geometry exported once from
OpenStreetMap and committed to the repo, so the demo works with the Wi-Fi off.

---

## Run it

```bash
npm install && npm run dev
```

Open the printed URL (usually `http://localhost:5173`). That is all it takes.

To check a production build: `npm run build`.

---

## Demo keyboard shortcuts

| Key | What it does |
| --- | --- |
| **D** | Toggle the presenter panel (city conditions, pause/resume the rain, jump to the alert, reset everything). |
| **S** | Saves a screenshot: a PNG of the phone mockup — frame, shadow and whatever screen is showing — on a transparent background, at 3× resolution, ready to drop into Canva. The file downloads as `floodwatch-<screen>-<time>.png`. |
| **Esc** | Closes the panel. |

The presenter panel and the on-screen hints live *outside* the phone, so they
never appear in a screenshot and never look like part of the app.

If Chrome asks whether the site may **download multiple files**, allow it once
so every press of S saves a file.

---

## The demo story (Tess, a sari-sari store owner)

1. **Splash** → auto-advances after ~2 s.
2. **Onboarding** — choose an alert channel, then pin a place on the map
   (optional — Skip is in the top bar). Drag the map or tap a spot and the pin
   watches the nearest main road. It opens pinned on Tess's store on
   **Manalili Street**, by the downtown market, so one tap on **Save and
   finish** keeps the story moving.
3. **Home** — the map of Cebu City fills the screen, every road green.
4. Press **D** → **Heavy rain**. Over about 27 seconds the water spreads out
   from the low-lying downtown streets: green → amber → red, following roads
   that actually connect to each other.
5. When her store's road turns **amber**, the **Flood Alert** takes over the
   screen by itself — 35 minutes of lead time and where the warning came from.
6. **I'm prepared** → back to Home, or **View street** → the street detail for
   Manalili Street, with reports, history and a focused map.

The whole path is a loop: **Reset everything** in the panel puts it back to the
splash screen with every road green.

> The rain simulation is **accelerated** — 27 seconds stands in for the real
> lead time shown on the countdown. Say so on stage if anyone asks.

---

## Changing the colours

**Every colour in the app lives in [`src/theme.css`](src/theme.css) and nowhere
else.** Edit the values in the `:root` block and the whole app follows —
screens, charts, map roads, pins, the phone frame, everything.

```css
:root {
  --primary: #004a7c;   /* deep blue: headers, primary buttons  */
  --secondary: #54a2e2; /* lighter blue: accents, water, links  */
  --alert: #e8a33d;     /* amber — FLOOD WARNINGS ONLY          */
  --danger: #b3382c;    /* restrained red: flooding now         */
  --safe: #2e8b62;      /* calm green: clear                    */
  /* …neutrals, gradients, shadows, corner radii… */
}
```

Notes:

- The second block in that file (`@theme`) just maps the palette onto Tailwind
  class names (`--color-primary` → `bg-primary`). You do not normally touch it.
- The road colours on the map are **interpolated** from `--safe`, `--alert` and
  `--danger` at runtime (see `src/theme.ts`), which is what gives the smooth
  green → amber → red transition. Change those three variables and the map
  changes with them.
- Amber is reserved for flood warnings. Please keep it that way — the whole
  design is calm blue and white so that amber reads as *urgent*.
- The logo is a placeholder: [`src/components/Logo.tsx`](src/components/Logo.tsx)
  (a pin with a wavy water line). Swap that one file for the real mark.
  `public/logo.svg` is the same shape for the browser tab.

---

## Changing the sample data

**All invented content lives in [`src/data/sample.ts`](src/data/sample.ts).**
That includes the user, saved places and place types, where it is raining,
the warning's lead time, past alerts, the SMS thread, the business locations
and plan, and the rules that generate per-road reports and flood history.

Two house rules that file documents and the app follows everywhere:

- Warnings are attributed to **rainfall data + verified community reports**.
  There is no mention of sensors, devices or hardware anywhere in the app.
- No invented statistics about Cebu City. Everything describes one made-up
  afternoon for one made-up store owner.

### Moving the flood somewhere else

In `sample.ts`:

```ts
export const floodScenario = {
  seedRoadIds: ['colon-street', 'magallanes-street', /* … */],
  depth: 3,        // how many streets out the water reaches
  timeline: [ /* when each ring goes amber, then red */ ],
}
```

`seedRoadIds` are ids from `roads.geojson` (a slug of the street name, e.g.
`osmena-boulevard`). Change them and the water starts somewhere else; the
spreading follows the real road graph from there, so nothing else needs editing.

To make the alert fire for a different place, point a saved place at a road one
or two rings out from the seeds:

```ts
export const savedPlaces: SavedPlace[] = [
  { id: 'store', label: 'My sari-sari store', kind: 'store', roadId: 'manalili-street' },
  { id: 'home',  label: 'Home',               kind: 'home',  roadId: 'salinas-drive' },
]
```

Where the map opens is `cityView` in the same file.

---

## The road data

`src/data/roads.geojson` holds 168 named Cebu City streets (primary, secondary
and tertiary roads inside the city boundary), each with simplified geometry and
a list of the streets it touches. It is **committed** — the app imports it, and
never calls the network for road data.

To refresh it:

```bash
npm run fetch:roads
```

That runs [`scripts/fetch-roads.ts`](scripts/fetch-roads.ts), which queries the
OpenStreetMap Overpass API, groups ways into named streets, simplifies the
geometry, builds the adjacency graph and rewrites the file. It needs internet;
the app does not.

**Offline behaviour:** the light basemap underneath the roads is fetched from
OpenStreetMap's tile servers, so that part needs Wi-Fi. If the tiles cannot
load, the coloured roads, pins, legend and every other screen still render on a
plain background, and the map shows a short "Offline" note. Tested by pointing
the tile URL at an unreachable host — nothing else breaks.

Road geometry © OpenStreetMap contributors, ODbL 1.0. The attribution shown on
the map is required; please leave it in place.

---

## Layout

```
src/
├── theme.css              ← ALL colours, shadows, radii
├── theme.ts               ← reads those variables back for the map
├── index.css              ← Tailwind, base styles, Leaflet chrome, animations
├── data/
│   ├── sample.ts          ← ALL invented content
│   ├── roads.geojson      ← real street geometry (generated, committed)
│   └── roads.ts           ← loads it, indexes it, walks the road graph
├── state/
│   ├── AppState.tsx       ← one store: weather, roads, places, the warning
│   └── floodSim.ts        ← the spreading-water engine
├── components/            ← phone frame, screen scaffold, map, charts, UI bits
└── screens/               ← the twelve screens
```

Screens: Splash · Onboarding · Home · Map · Flood Alert · Street Detail ·
Report a Flood · SMS Preview · Alerts · Business Dashboard · Profile ·
Add a Place.

Built with React + Vite + TypeScript, Tailwind CSS v4, React Router,
lucide-react and Leaflet / react-leaflet. The font (Plus Jakarta Sans) is
installed as an npm package rather than linked from Google Fonts, so it works
offline too.
