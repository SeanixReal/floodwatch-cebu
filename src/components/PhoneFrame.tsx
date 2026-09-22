import type { ReactNode } from 'react'

export const SCREEN_W = 390
export const SCREEN_H = 844

/* --------------------------------------------------------------------------
   The 390 x 844 screen, optionally wrapped in a phone bezel.
   In screenshot mode (S) the bezel and shadow disappear so the exported image
   is exactly the screen.
   -------------------------------------------------------------------------- */

export function PhoneFrame({
  children,
  bare = false,
}: {
  children: ReactNode
  bare?: boolean
}) {
  const screen = (
    <div
      style={{ width: SCREEN_W, height: SCREEN_H }}
      className={`relative overflow-hidden bg-canvas ${bare ? '' : 'rounded-[40px]'}`}
    >
      {children}
    </div>
  )

  if (bare) return screen

  return (
    <div className="relative">
      <div className="rounded-[52px] bg-frame p-[11px] shadow-frame">
        <div className="relative rounded-[41px] ring-1 ring-black/20">
          {screen}
          {/* Dynamic island */}
          <div className="pointer-events-none absolute left-1/2 top-[9px] h-[30px] w-[112px] -translate-x-1/2 rounded-full bg-frame" />
        </div>
      </div>
      {/* Side buttons */}
      <div className="pointer-events-none absolute -left-[3px] top-[132px] h-9 w-[3px] rounded-l bg-frame" />
      <div className="pointer-events-none absolute -left-[3px] top-[186px] h-14 w-[3px] rounded-l bg-frame" />
      <div className="pointer-events-none absolute -left-[3px] top-[254px] h-14 w-[3px] rounded-l bg-frame" />
      <div className="pointer-events-none absolute -right-[3px] top-[212px] h-20 w-[3px] rounded-r bg-frame" />
    </div>
  )
}
