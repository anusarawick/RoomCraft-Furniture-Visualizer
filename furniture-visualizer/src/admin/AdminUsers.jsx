import { useMemo, useState } from 'react'
import { formatDate } from '../member 4/format'

export default function AdminUsers({ users }) {
  const [search, setSearch] = useState('')

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term),
    )
  }, [search, users])

  return (
    <div>
      <div className="dashboard-header">
        <h1>Registered Users</h1>
        <p>{users.length} customer accounts</p>
      </div>

      <div className="search-bar">
        <input
          type="search"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <p>No matching users found</p>
        </div>
      ) : (
        <div className="template-grid">
          {filteredUsers.map((customer) => (
            <article key={customer.id} className="card template-card">
              <div className="template-card-head">
                <span className="tag">Customer</span>
                <span className="template-price">{customer.role || 'Designer'}</span>
              </div>
              <h3>{customer.name}</h3>
              <p className="template-copy">{customer.email}</p>
              <div className="template-meta-list">
                <div>
                  <span>Joined</span>
                  <strong>{formatDate(customer.createdAt)}</strong>
                </div>
                <div>
                  <span>Saved Designs</span>
                  <strong>{customer.stats?.designCount || 0}</strong>
                </div>
                <div>
                  <span>Purchased Templates</span>
                  <strong>{customer.stats?.purchasedTemplateCount || 0}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
