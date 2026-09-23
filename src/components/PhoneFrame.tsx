import { forwardRef, type ReactNode } from 'react'

export const SCREEN_W = 390
export const SCREEN_H = 844

/* --------------------------------------------------------------------------
   The 390 x 844 screen inside a phone bezel.

   The outer element is what a screenshot (S) captures. It carries extra
   padding for the phone's shadow and side buttons, cancelled out by negative
   margins so the phone still sits exactly centred on the stage.
   -------------------------------------------------------------------------- */

export const PhoneFrame = forwardRef<HTMLDivElement, { children: ReactNode }>(
  function PhoneFrame({ children }, ref) {
    return (
      <div
        ref={ref}
        className="-mx-[64px] -mb-[104px] -mt-[24px] px-[64px] pb-[104px] pt-[24px]"
      >
        <div className="relative">
          <div className="rounded-[52px] bg-frame p-[11px] shadow-frame">
            <div className="relative rounded-[41px] ring-1 ring-black/20">
              <div
                style={{ width: SCREEN_W, height: SCREEN_H }}
                className="relative overflow-hidden rounded-[40px] bg-canvas"
              >
                {children}
              </div>
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
      </div>
    )
  },
)
