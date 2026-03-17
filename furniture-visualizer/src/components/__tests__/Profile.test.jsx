import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Profile from '../Profile'
import { createTestDesign, createTestUser } from '../../test/fixtures'

const notify = vi.fn()

vi.mock('../../member 4/NotificationProvider', () => ({
  useNotifications: () => ({ notify }),
}))

describe('Profile', () => {
  beforeEach(() => {
    notify.mockReset()
  })

  it('submits profile updates and notifies on success', async () => {
    const user = userEvent.setup()
    const onUpdateUser = vi.fn().mockResolvedValue(undefined)

    render(
      <Profile
        user={createTestUser()}
        designs={[createTestDesign()]}
        onUpdateUser={onUpdateUser}
      />,
    )

    await user.clear(screen.getByLabelText('Full Name'))
    await user.type(screen.getByLabelText('Full Name'), 'Jamie Updated')
    await user.selectOptions(screen.getByLabelText('Role'), 'Manager')
    await user.type(screen.getByLabelText('New Password'), 'new-password')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() =>
      expect(onUpdateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jamie Updated',
          role: 'Manager',
          password: 'new-password',
        }),
      ),
    )
    expect(notify).toHaveBeenCalledWith(
      'Profile updated successfully.',
      'success',
      'Profile saved',
    )
  })

  it('renders submit errors from failed updates', async () => {
    const user = userEvent.setup()
    const onUpdateUser = vi.fn().mockRejectedValue(new Error('Update failed'))

    render(<Profile user={createTestUser()} designs={[]} onUpdateUser={onUpdateUser} />)

    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText('Update failed')).toBeInTheDocument()
    expect(notify).not.toHaveBeenCalled()
  })
})
