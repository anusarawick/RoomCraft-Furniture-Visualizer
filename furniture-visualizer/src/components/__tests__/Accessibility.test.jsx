import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Accessibility from '../Accessibility'

const notify = vi.fn()

vi.mock('../../member 4/NotificationProvider', () => ({
  useNotifications: () => ({ notify }),
}))

describe('Accessibility', () => {
  it('updates settings and notifies on toggle', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()

    render(
      <Accessibility
        settings={{ highContrast: false, largeText: false, reducedMotion: false }}
        onUpdate={onUpdate}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: /high-contrast mode/i }))

    expect(onUpdate).toHaveBeenCalledWith({
      highContrast: true,
      largeText: false,
      reducedMotion: false,
    })
    expect(notify).toHaveBeenCalledWith(
      'Accessibility preferences updated.',
      'success',
      'Settings saved',
    )
  })
})
