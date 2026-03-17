import { act, fireEvent, render, screen } from '@testing-library/react'
import { NotificationProvider, useNotifications } from '../NotificationProvider'

function NotificationHarness() {
  const { notify } = useNotifications()

  return (
    <button type="button" onClick={() => notify('Saved successfully', 'success', 'Saved')}>
      Trigger
    </button>
  )
}

describe('NotificationProvider', () => {
  it('renders and clears notifications after the timeout', () => {
    vi.useFakeTimers()

    render(
      <NotificationProvider>
        <NotificationHarness />
      </NotificationProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Trigger' }))

    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('Saved successfully')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(screen.queryByText('Saved successfully')).not.toBeInTheDocument()
  })
})
