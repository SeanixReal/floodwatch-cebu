/* ==========================================================================
   Bridge between theme.css and the places that need a colour as a value
   (Leaflet strokes, canvas, interpolated gradients).

   Nothing here defines a colour. Everything is read back out of the CSS
   custom properties in src/theme.css, so that file stays the single place to
   change the palette.
   ========================================================================== */

type RGB = [number, number, number]

const cache = new Map<string, RGB>()

/** Reads a CSS custom property off :root and parses it to RGB. */
export function themeRGB(variable: string): RGB {
  const cached = cache.get(variable)
  if (cached) return cached

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim()
  const rgb = parseColor(raw)
  cache.set(variable, rgb)
  return rgb
}

/** Call after changing the theme at runtime so colours are re-read. */
export function clearThemeCache() {
  cache.clear()
}

export function themeColor(variable: string): string {
  const [r, g, b] = themeRGB(variable)
  return `rgb(${r} ${g} ${b})`
}

function parseColor(value: string): RGB {
  if (value.startsWith('#')) {
    const hex = value.slice(1)
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ]
  }
  const nums = value.match(/[\d.]+/g)
  if (nums && nums.length >= 3) {
    return [Number(nums[0]), Number(nums[1]), Number(nums[2])]
  }
  /* Unparseable: fall back to mid grey rather than throwing mid-render. */
  return [128, 128, 128]
}

const mix = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
]

/**
 * Risk 0 -> 1 mapped onto safe -> alert -> danger, so a road eases through
 * green, yellow-amber and red as the water rises instead of snapping between
 * three flat colours.
 */
export function riskColor(risk: number): string {
  const r = Math.max(0, Math.min(1, risk))
  const safe = themeRGB('--safe')
  const alert = themeRGB('--alert')
  const danger = themeRGB('--danger')
  const rgb = r <= 0.5 ? mix(safe, alert, r / 0.5) : mix(alert, danger, (r - 0.5) / 0.5)
  return `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`
}
