import { render, screen, waitFor, within } from '@testing-library/react'
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
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() =>
      expect(onUpdateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jamie Updated',
          role: 'Manager',
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

  it('changes password through the dialog', async () => {
    const user = userEvent.setup()
    const onUpdateUser = vi.fn().mockResolvedValue(undefined)

    render(<Profile user={createTestUser()} designs={[]} onUpdateUser={onUpdateUser} />)

    await user.click(screen.getByRole('button', { name: 'Change Password' }))
    const dialog = screen.getByRole('dialog', { name: 'Change Password' })

    await user.type(within(dialog).getByLabelText('Current Password'), 'old-secret')
    await user.type(within(dialog).getByLabelText('New Password'), 'new-secret1')
    await user.type(within(dialog).getByLabelText('Confirm New Password'), 'new-secret1')
    await user.click(within(dialog).getByRole('button', { name: 'Change Password' }))

    await waitFor(() =>
      expect(onUpdateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPassword: 'old-secret',
          password: 'new-secret1',
        }),
      ),
    )
    expect(notify).toHaveBeenCalledWith(
      'Password updated successfully.',
      'success',
      'Password changed',
    )
  })
})
