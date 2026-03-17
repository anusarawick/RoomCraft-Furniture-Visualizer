import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../Login'

describe('Login', () => {
  it('blocks registration when passwords do not match', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<Login onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Register' }))
    await user.type(screen.getByLabelText('Full Name'), ' Jamie Designer ')
    await user.type(screen.getByLabelText('Email Address'), ' jamie@example.com ')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'different123')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
  })

  it('submits trimmed credentials and remember preference', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(<Login onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Email Address'), ' jamie@example.com ')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByLabelText('Remember me'))
    await user.click(screen.getByText('Sign In', { selector: 'button[type="submit"]' }))

    expect(onSubmit).toHaveBeenCalledWith({
      mode: 'login',
      name: '',
      email: 'jamie@example.com',
      password: 'secret123',
      remember: false,
    })
  })
})
