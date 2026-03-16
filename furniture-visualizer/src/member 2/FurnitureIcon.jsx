const ICONS = {
  chair: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="6" y="9" width="12" height="6" rx="2" />
      <path d="M8 9V6h8v3" />
      <path d="M8 15v3" />
      <path d="M16 15v3" />
    </svg>
  ),
  'dining-table': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="9" width="16" height="4" rx="1" />
      <path d="M7 13v5" />
      <path d="M17 13v5" />
    </svg>
  ),
  'side-table': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="7" y="9" width="10" height="4" rx="1" />
      <path d="M9 13v5" />
      <path d="M15 13v5" />
    </svg>
  ),
  sofa: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 12v-2a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v2" />
      <rect x="4" y="12" width="16" height="5" rx="2" />
      <path d="M6 17v2" />
      <path d="M18 17v2" />
    </svg>
  ),
  bed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="11" width="16" height="5" rx="2" />
      <path d="M4 11V9a2 2 0 0 1 2-2h4v4" />
      <path d="M4 16v3" />
      <path d="M20 16v3" />
    </svg>
  ),
  bookshelf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="6" y="5" width="12" height="14" rx="2" />
      <path d="M6 9h12" />
      <path d="M6 13h12" />
    </svg>
  ),
  desk: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="5" y="9" width="14" height="4" rx="1" />
      <path d="M7 13v5" />
      <path d="M17 13v5" />
    </svg>
  ),
  door: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 4h10v16H6z" />
      <path d="M9.5 12.5h.01" />
      <path d="M16 20h2" />
    </svg>
  ),
  window: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="5" width="16" height="14" rx="1.8" />
      <path d="M12 5v14" />
      <path d="M4 12h16" />
    </svg>
  ),
  default: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="5" y="6" width="14" height="12" rx="2" />
    </svg>
  ),
}

export default function FurnitureIcon({ name }) {
  return ICONS[name] || ICONS.default
}

