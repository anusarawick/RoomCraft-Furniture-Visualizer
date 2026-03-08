import FurnitureIcon from './FurnitureIcon'

export default function Catalog({ catalog }) {
  return (
    <div>
      <div className="dashboard-header">
        <h1>Furniture Catalog</h1>
        <p>Browse available furniture pieces for your designs.</p>
      </div>
      <div className="catalog-grid">
        {catalog.filter((item) => !item.hidden).map((item) => (
          <div key={item.id} className="card catalog-card">
            <div className="catalog-banner">
              <FurnitureIcon name={item.icon} />
            </div>
            <div>
              <strong>{item.name}</strong>
            </div>
            <div className="catalog-info">
              <span>Width: {item.width}m</span>
              <span>Depth: {item.depth}m</span>
              <span>Height: {item.height}m</span>
              <div className="catalog-color">
                <span style={{ background: item.color }} />
                Default color
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


