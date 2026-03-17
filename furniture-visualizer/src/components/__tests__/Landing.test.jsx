import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Landing from '../Landing'

describe('Landing navigation', () => {
  it('scrolls to sections from the navigation bar and keeps login separate', async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn()
    const onStart = vi.fn()
    const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

    render(<Landing onLogin={onLogin} onStart={onStart} />)

    await user.click(screen.getByRole('button', { name: 'PRODUCTS' }))
    expect(scrollSpy).toHaveBeenCalled()
    expect(onStart).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Login' }))
    expect(onLogin).toHaveBeenCalledTimes(1)
  })
})
