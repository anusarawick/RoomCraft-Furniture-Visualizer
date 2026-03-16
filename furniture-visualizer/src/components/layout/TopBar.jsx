export default function TopBar({ breadcrumbs = [] }) {
  return (
    <div className="topbar">
      <div className="breadcrumbs">
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb}-${index}`}>
            {index > 0 && <span>/</span>}
            {index === breadcrumbs.length - 1 ? <strong>{crumb}</strong> : crumb}
          </span>
        ))}
      </div>
    </div>
  )
}
