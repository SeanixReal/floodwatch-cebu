import { Bell, House, Map, Plus, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/home', label: 'Home', Icon: House },
  { to: '/map', label: 'Map', Icon: Map },
  { to: '/report', label: 'Report', Icon: Plus, accent: true },
  { to: '/alerts', label: 'Alerts', Icon: Bell },
  { to: '/profile', label: 'Profile', Icon: User },
]

export function BottomNav() {
  return (
    <nav className="shrink-0 border-t border-line bg-card/95 px-2 pt-1.5 backdrop-blur">
      <ul className="flex items-stretch justify-between">
        {items.map(({ to, label, Icon, accent }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className="tappable flex flex-col items-center gap-[3px] rounded-md py-1"
            >
              {({ isActive }) =>
                accent ? (
                  <>
                    <span
                      className={`flex h-[30px] w-[30px] items-center justify-center rounded-full ${
                        isActive ? 'bg-primary' : 'bg-secondary'
                      } text-on-primary shadow-card`}
                    >
                      <Icon size={19} strokeWidth={2.6} />
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${
                        isActive ? 'text-primary' : 'text-ink-faint'
                      }`}
                    >
                      {label}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex h-[30px] items-center">
                      <Icon
                        size={22}
                        strokeWidth={isActive ? 2.4 : 1.9}
                        className={isActive ? 'text-primary' : 'text-ink-faint'}
                      />
                    </span>
                    <span
                      className={`text-[11px] ${
                        isActive
                          ? 'font-bold text-primary'
                          : 'font-medium text-ink-faint'
                      }`}
                    >
                      {label}
                    </span>
                  </>
                )
              }
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
