import { createContext, useContext, useRef, useState } from 'react'
import { createId } from '../utils/ids'

const NotificationContext = createContext({ notify: () => {} })

export function NotificationProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const clearToast = () => setToast(null)

  const notify = (message, type = 'info', title = 'Notification') => {
    const id = createId()
    setToast({ id, message, type, title })
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }
    timerRef.current = window.setTimeout(() => clearToast(), 4000)
  }

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toast && (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <div className="toast-title">{toast.title}</div>
            <div className="toast-message">{toast.message}</div>
          </div>
        )}
      </div>
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)

