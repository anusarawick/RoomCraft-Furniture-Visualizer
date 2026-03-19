import { formatDate } from '../member 4/format'

export default function AdminDashboard({
  user,
  templates,
  registeredUsers,
  onNewTemplate,
  onNavigate,
}) {
  const totalTemplates = templates.length
  const totalUsers = registeredUsers.length
  const totalPurchases = registeredUsers.reduce(
    (sum, customer) => sum + (customer.stats?.purchasedTemplateCount || 0),
    0,
  )

  return (
    <div>
      <div className="dashboard-header">
        <span className="tag" style={{ justifySelf: 'start' }}>Admin</span>
        <h1>Welcome back, {user?.name || 'Administrator'}</h1>
        <p>Manage templates, review registered customers, and monitor purchases.</p>
      </div>

      <div className="dashboard-actions">
        <button className="card action-card" onClick={onNewTemplate}>
          <div className="action-icon">＋</div>
          <div>
            <strong>New Template</strong>
            <p>Create a purchasable room template</p>
          </div>
        </button>
        <button className="card action-card" onClick={() => onNavigate('admin-templates')}>
          <div className="action-icon">▦</div>
          <div>
            <strong>Manage Templates</strong>
            <p>{totalTemplates} saved templates</p>
          </div>
        </button>
        <button className="card action-card" onClick={() => onNavigate('admin-users')}>
          <div className="action-icon">◎</div>
          <div>
            <strong>Registered Users</strong>
            <p>{totalUsers} customer accounts</p>
          </div>
        </button>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <h4>Templates</h4>
          <div className="stat-value">{totalTemplates}</div>
        </div>
        <div className="card stat-card">
          <h4>Registered Users</h4>
          <div className="stat-value">{totalUsers}</div>
        </div>
        <div className="card stat-card">
          <h4>Total Purchases</h4>
          <div className="stat-value">{totalPurchases}</div>
        </div>
      </div>

      <div className="section-header">
        <h2>Latest Templates</h2>
      </div>
      {templates.length === 0 ? (
        <div className="empty-state">
          <p>No templates yet</p>
          <p>Create the first design template for customers.</p>
          <button className="btn btn-primary" onClick={onNewTemplate}>
            New Template
          </button>
        </div>
      ) : (
        <div className="design-list">
          {templates.slice(0, 4).map((template) => (
            <div key={template.id} className="card design-row">
              <div>
                <strong>{template.name}</strong>
                <div className="design-meta">
                  ${(template.price || 0).toFixed(0)} · {template.items.length} items
                </div>
                <div className="design-meta">Updated {formatDate(template.updatedAt)}</div>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => onNavigate('admin-template-editor', template.id)}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
