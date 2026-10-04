import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/transactions', label: 'Transactions' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
]

const linkClass = ({ isActive }) =>
  [
    'whitespace-nowrap px-4 py-3 text-xs font-bold tracking-wide transition-colors hover:bg-blue-900',
    isActive ? 'bg-blue-900 text-white' : 'text-blue-100',
  ].join(' ')

const Pages = () => (
  <nav className="flex shrink-0 overflow-x-auto bg-blue-950 md:block md:w-52 md:min-h-dvh">
    {LINKS.map((link) => (
      <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
        {link.label}
      </NavLink>
    ))}
  </nav>
)

export default Pages
