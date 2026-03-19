import { useEffect, useState } from 'react'

export default function PurchaseModal({
  template,
  isSubmitting = false,
  onClose,
  onConfirm,
}) {
  const [name, setName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setName('')
    setCardNumber('')
    setExpiry('')
    setCvv('')
    setError('')
  }, [template?.id])

  if (!template) return null

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!name.trim() || !cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
      setError('Complete the payment form to continue.')
      return
    }

    await onConfirm({
      name: name.trim(),
      cardNumber: cardNumber.trim(),
      expiry: expiry.trim(),
      cvv: cvv.trim(),
    })
  }

  return (
    <div className="export-dialog-backdrop" onClick={() => !isSubmitting && onClose()}>
      <div
        className="export-dialog card purchase-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-template-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="export-dialog-header">
          <div>
            <h3 id="purchase-template-title">Purchase Template</h3>
            <p>
              Unlock 3D access for <strong>{template.name}</strong>.
            </p>
          </div>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Close
          </button>
        </div>

        <div className="purchase-summary">
          <span>Total</span>
          <strong>${(template.price || 0).toFixed(0)}</strong>
        </div>

        <form className="purchase-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Name on Card</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Customer Name"
            />
          </label>
          <label className="field">
            <span>Card Number</span>
            <input
              type="text"
              value={cardNumber}
              onChange={(event) => setCardNumber(event.target.value)}
              placeholder="4111 1111 1111 1111"
              inputMode="numeric"
            />
          </label>
          <div className="form-row">
            <label className="field">
              <span>Expiry</span>
              <input
                type="text"
                value={expiry}
                onChange={(event) => setExpiry(event.target.value)}
                placeholder="12/28"
              />
            </label>
            <label className="field">
              <span>CVV</span>
              <input
                type="password"
                value={cvv}
                onChange={(event) => setCvv(event.target.value)}
                placeholder="123"
                inputMode="numeric"
              />
            </label>
          </div>

          {error ? <div className="login-form-error">{error}</div> : null}

          <div className="export-dialog-actions">
            <button className="btn btn-ghost" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Complete Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
