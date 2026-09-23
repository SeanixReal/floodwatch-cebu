/* ==========================================================================
   Brand export for Canva / slides.

     npm run export:brand

   Reads the palette from src/theme.css and writes ready-to-upload files to
   brand/: the logo mark (SVG + PNG, light and dark versions), the horizontal
   wordmark, an app icon, a colour palette sheet and a plain list of hex codes.

   Because the colours come from theme.css, re-run this after the design team
   changes the palette and every brand file updates with it.

   PNGs are rendered with a local Chrome or Edge in headless mode. Set
   CHROME_PATH to point at a different browser binary if needed.
   ========================================================================== */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'brand')
const SCALE = 2 // PNGs are rendered at 2x for crisp slides

/* --- Palette, read from theme.css ------------------------------------------ */

const themeCss = readFileSync(join(ROOT, 'src', 'theme.css'), 'utf8')
/* Only the :root block - the file's header comment also mentions @theme, so
   search for the end marker after :root, not from the top of the file. */
const rootStart = themeCss.indexOf(':root {')
const rootBlock = themeCss.slice(rootStart, themeCss.indexOf('@theme', rootStart))
const vars = Object.fromEntries(
  [...rootBlock.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]),
)
const v = (name) => {
  if (!vars[name]) throw new Error(`--${name} not found in theme.css`)
  return vars[name].toUpperCase()
}

/* The colours worth putting in a Canva Brand Kit, in the order they matter. */
const palette = [
  { group: 'Brand blues', items: [
    { name: 'Deep Blue', token: 'primary', role: 'Main brand colour. Headers, buttons, logo.' },
    { name: 'Sky Blue', token: 'secondary', role: 'Accents, water, links, "Cebu" in the wordmark.' },
    { name: 'Midnight Blue', token: 'primary-deep', role: 'Darkest blue. Dark backgrounds.' },
    { name: 'Water Blue', token: 'water', role: 'Water in the logo, water visuals.' },
    { name: 'Mist Blue', token: 'primary-soft', role: 'Pale blue panels and highlights.' },
  ]},
  { group: 'Status - use only for their meaning', items: [
    { name: 'Warning Amber', token: 'alert', role: 'FLOOD WARNINGS ONLY. Never decoration.' },
    { name: 'Flood Red', token: 'danger', role: '"Flooding now". Use sparingly.' },
    { name: 'Clear Green', token: 'safe', role: '"Clear" status.' },
  ]},
  { group: 'Neutrals', items: [
    { name: 'Slate Ink', token: 'ink', role: 'Body text.' },
    { name: 'Muted Slate', token: 'ink-muted', role: 'Secondary text.' },
    { name: 'Cloud', token: 'surface', role: 'Soft background panels.' },
    { name: 'White', token: 'canvas', role: 'Main background.' },
  ]},
].map((g) => ({ ...g, items: g.items.map((c) => ({ ...c, hex: v(c.token) })) }))

const gradients = [
  { name: 'Header gradient', token: 'grad-header', role: 'App headers, title slides.' },
  { name: 'Splash gradient', token: 'grad-splash', role: 'Full-bleed covers.' },
  { name: 'Warning gradient', token: 'grad-alert', role: 'Flood warning moments only.' },
].map((g) => ({
  ...g,
  css: vars[g.token],
  stops: [...vars[g.token].matchAll(/#[0-9a-f]{6}/gi)].map((m) => m[0].toUpperCase()),
}))

/* --- Logo ------------------------------------------------------------------- */

/* Same shape as src/components/Logo.tsx: a pin with a wavy water line across
   its lower third. viewBox is cropped tight to the pin. */
const PIN =
  'M24 3.5c-8.6 0-15.6 6.9-15.6 15.4 0 10.9 13.1 22.3 14.6 23.6a1.5 1.5 0 0 0 2 0c1.5-1.3 14.6-12.7 14.6-23.6C39.6 10.4 32.6 3.5 24 3.5z'
const MARK_BOX = { x: 7.4, y: 2.5, w: 33.2, h: 41.5 }

function markSvg({ pin, water, id }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_BOX.x} ${MARK_BOX.y} ${MARK_BOX.w} ${MARK_BOX.h}" width="${MARK_BOX.w * 10}" height="${MARK_BOX.h * 10}">
  <title>FloodWatch Cebu</title>
  <defs><clipPath id="${id}"><path d="${PIN}"/></clipPath></defs>
  <path d="${PIN}" fill="${pin}"/>
  <g clip-path="url(#${id})">
    <path d="M2 31.5c3.7 0 3.7-3.2 7.3-3.2 3.7 0 3.7 3.2 7.3 3.2 3.7 0 3.7-3.2 7.4-3.2s3.7 3.2 7.3 3.2c3.7 0 3.7-3.2 7.4-3.2 3.6 0 3.6 3.2 7.3 3.2V48H2z" fill="${water}"/>
    <path d="M2 26.4c3.7 0 3.7-3.1 7.3-3.1 3.7 0 3.7 3.1 7.3 3.1 3.7 0 3.7-3.1 7.4-3.1s3.7 3.1 7.3 3.1c3.7 0 3.7-3.1 7.4-3.1 3.6 0 3.6 3.1 7.3 3.1" stroke="${water}" stroke-width="2" stroke-linecap="round" opacity="0.55" fill="none"/>
  </g>
</svg>
`
}

/* Light backgrounds: blue pin. Dark / blue backgrounds: white pin. */
const markLight = markSvg({ pin: v('primary'), water: v('water'), id: 'fw-l' })
const markDark = markSvg({ pin: v('canvas'), water: v('secondary'), id: 'fw-d' })

/* --- Headless browser -------------------------------------------------------- */

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean)
  const found = candidates.find((p) => existsSync(p))
  if (!found) throw new Error('No Chrome or Edge found. Set CHROME_PATH.')
  return found
}

const BROWSER = findBrowser()
const WORK = mkdtempSync(join(tmpdir(), 'fw-brand-'))

/* A throwaway profile, so this never touches a Chrome window already open. */
const baseArgs = [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=${join(WORK, 'profile')}`,
  '--virtual-time-budget=4000',
]

let pageCount = 0
function writePage(html) {
  const file = join(WORK, `page-${++pageCount}.html`)
  writeFileSync(file, html)
  return pathToFileURL(file).href
}

/** Renders the page's #art element and returns its size in CSS px. */
function measure(html) {
  const dom = execFileSync(BROWSER, [...baseArgs, '--dump-dom', writePage(html)], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  const m = dom.match(/data-size="(\d+)x(\d+)"/)
  if (!m) throw new Error('Could not measure artwork')
  return { w: Number(m[1]), h: Number(m[2]) }
}

function screenshot(html, file, w, h, transparent = true) {
  execFileSync(
    BROWSER,
    [
      ...baseArgs,
      `--force-device-scale-factor=${SCALE}`,
      `--window-size=${w},${h}`,
      ...(transparent ? ['--default-background-color=00000000'] : []),
      `--screenshot=${join(OUT, file)}`,
      writePage(html),
    ],
    { stdio: 'ignore' },
  )
  console.log(`  ${file}  (${w * SCALE}x${h * SCALE})`)
}

/* The app font, embedded so rendering never depends on the network. */
const fontB64 = readFileSync(
  join(ROOT, 'node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2'),
).toString('base64')

const page = (body, extraCss = '') => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Jakarta'; src: url(data:font/woff2;base64,${fontB64}) format('woff2'); font-weight: 200 800; font-display: block; }
html, body { margin: 0; background: transparent; }
body { font-family: 'Jakarta', sans-serif; -webkit-font-smoothing: antialiased; }
${extraCss}
</style></head><body>${body}
<script>
  document.fonts.ready.then(() => {
    const r = document.getElementById('art').getBoundingClientRect();
    document.body.setAttribute('data-size', Math.ceil(r.width) + 'x' + Math.ceil(r.height));
  });
</script></body></html>`

/* --- Build ----------------------------------------------------------------- */

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
console.log(`Exporting brand files to ${OUT}\n`)

/* Logo mark: SVG for crisp scaling, PNG for anywhere SVG is awkward. */
writeFileSync(join(OUT, 'logo-mark.svg'), markLight)
writeFileSync(join(OUT, 'logo-mark-white.svg'), markDark)
console.log('  logo-mark.svg\n  logo-mark-white.svg')

const markPage = (svg) =>
  page(`<div id="art" style="width:${MARK_BOX.w * 12.5}px;height:${MARK_BOX.h * 12.5}px">${svg.replace(/width="[^"]*" height="[^"]*"/, 'width="100%" height="100%"')}</div>`)
const markW = Math.round(MARK_BOX.w * 12.5)
const markH = Math.round(MARK_BOX.h * 12.5)
screenshot(markPage(markLight), 'logo-mark.png', markW, markH)
screenshot(markPage(markDark), 'logo-mark-white.png', markW, markH)

/* Horizontal wordmark, as it appears in the app header. */
const wordmark = (svg, nameColor, suffixColor) =>
  page(
    `<div id="art" class="lockup">
      <div class="mark">${svg.replace(/width="[^"]*" height="[^"]*"/, 'width="100%" height="100%"')}</div>
      <div class="name">FloodWatch<span>Cebu</span></div>
    </div>`,
    `.lockup { display: inline-flex; align-items: center; gap: 34px; padding: 10px 14px; }
     .mark { width: ${(MARK_BOX.w / MARK_BOX.h) * 150}px; height: 150px; }
     .name { font-size: 118px; font-weight: 800; letter-spacing: -0.035em; line-height: 1; color: ${nameColor}; white-space: nowrap; }
     .name span { font-weight: 600; color: ${suffixColor}; margin-left: 0.28em; }`,
  )

for (const [file, html] of [
  ['logo-wordmark.png', wordmark(markLight, v('primary'), v('secondary'))],
  ['logo-wordmark-white.png', wordmark(markDark, v('canvas'), v('secondary'))],
]) {
  const { w, h } = measure(html)
  screenshot(html, file, w, h)
}

/* App icon: the mark on the splash gradient, in a rounded square. */
screenshot(
  page(
    `<div id="art" class="icon">${markDark.replace(/width="[^"]*" height="[^"]*"/, 'width="46%" height="60%"')}</div>`,
    `.icon { width: 512px; height: 512px; border-radius: 114px; background: ${vars['grad-splash']};
             display: flex; align-items: center; justify-content: center; }`,
  ),
  'app-icon.png',
  512,
  512,
)

/* Palette sheet: one image to drop into a slide or eyedrop from in Canva. */
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
const inkOn = (hex) => (lum(hex) > 0.4 ? v('ink') : v('canvas'))

const swatch = (c) => `
  <div class="sw">
    <div class="chip" style="background:${c.hex};color:${inkOn(c.hex)};${c.hex === v('canvas') ? `box-shadow: inset 0 0 0 2px ${v('line')};` : ''}">
      <b>${c.hex}</b>
    </div>
    <div class="meta"><div class="n">${c.name}</div><div class="r">${c.role}</div></div>
  </div>`

const sheet = page(
    `<div id="art" class="sheet">
      <header>
        <div class="mark">${markLight.replace(/width="[^"]*" height="[^"]*"/, 'width="100%" height="100%"')}</div>
        <div><h1>FloodWatch Cebu</h1><p>Colour palette &middot; typeface: Plus Jakarta Sans</p></div>
      </header>
      ${palette
        .map((g) => `<h2>${g.group}</h2><div class="row">${g.items.map(swatch).join('')}</div>`)
        .join('')}
      <h2>Gradients</h2>
      <div class="row">${gradients
        .map(
          (g) => `<div class="sw grad"><div class="chip" style="background:${g.css};color:${inkOn(g.stops[1])}"><b>${g.stops.join(' &rarr; ')}</b></div>
            <div class="meta"><div class="n">${g.name}</div><div class="r">${g.role}</div></div></div>`,
        )
        .join('')}</div>
      <footer>Provisional palette - generated from src/theme.css. Blue and white stay calm so that amber reads as urgent.</footer>
    </div>`,
    `.sheet { width: 1440px; box-sizing: border-box; padding: 56px 60px 44px; background: ${v('canvas')}; color: ${v('ink')}; }
     header { display: flex; align-items: center; gap: 22px; margin-bottom: 18px; }
     header .mark { width: 50px; height: 62px; }
     h1 { margin: 0; font-size: 40px; font-weight: 800; letter-spacing: -0.03em; color: ${v('primary')}; }
     header p { margin: 4px 0 0; font-size: 17px; font-weight: 600; color: ${v('ink-muted')}; }
     h2 { margin: 30px 0 12px; font-size: 15px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: ${v('ink-muted')}; }
     .row { display: flex; flex-wrap: wrap; gap: 18px; }
     .sw { width: 244px; }
     .sw.grad { width: 426px; }
     .chip { height: 118px; border-radius: 18px; display: flex; align-items: flex-end; padding: 14px 16px; box-sizing: border-box; }
     .chip b { font-size: 19px; font-weight: 800; letter-spacing: 0.02em; }
     .meta { padding: 10px 2px 0; }
     .n { font-size: 18px; font-weight: 800; }
     .r { margin-top: 3px; font-size: 14px; font-weight: 500; line-height: 1.35; color: ${v('ink-muted')}; }
     footer { margin-top: 36px; font-size: 14px; font-weight: 600; color: ${v('ink-muted')}; }`,
  )

screenshot(sheet, 'color-palette.png', 1440, measure(sheet).h, false)

/* Plain hex list, for typing into a Canva Brand Kit. */
const lines = [
  'FloodWatch Cebu - colour palette (provisional, from src/theme.css)',
  'Typeface: Plus Jakarta Sans (ExtraBold for headings, SemiBold/Medium for body)',
  '',
  ...palette.flatMap((g) => [
    g.group.toUpperCase(),
    ...g.items.map((c) => `  ${c.hex}  ${c.name.padEnd(14)} ${c.role}`),
    '',
  ]),
  'GRADIENTS',
  ...gradients.map((g) => `  ${g.stops.join(' -> ')}  ${g.name} - ${g.role}`),
  '',
  'Rule: amber is for flood warnings only. Keep everything else calm blue and white',
  'so the warning reads as urgent the moment it appears.',
  '',
]
writeFileSync(join(OUT, 'colors.txt'), lines.join('\n'))
console.log('  colors.txt')

rmSync(WORK, { recursive: true, force: true })
console.log('\nDone.')
