import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewDesign from '../NewDesign'

describe('NewDesign', () => {
  it('submits a multi-room design payload', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(undefined)

    render(<NewDesign onCreate={onCreate} />)

    await user.clear(screen.getByLabelText('Room Name'))
    await user.type(screen.getByLabelText('Room Name'), 'Studio')
    await user.click(screen.getByLabelText('L-shaped'))
    await user.click(screen.getByLabelText('Multi-room Plan'))
    await user.clear(screen.getByLabelText('Number of Rooms'))
    await user.type(screen.getByLabelText('Number of Rooms'), '4')
    await user.clear(screen.getByLabelText('Width (m)'))
    await user.type(screen.getByLabelText('Width (m)'), '6')
    await user.clear(screen.getByLabelText('Length (m)'))
    await user.type(screen.getByLabelText('Length (m)'), '5')
    await user.clear(screen.getByLabelText('Height (m)'))
    await user.type(screen.getByLabelText('Height (m)'), '3')
    await user.click(screen.getByRole('button', { name: 'Create Design' }))

    expect(onCreate).toHaveBeenCalledWith({
      name: 'Studio Design',
      room: {
        name: 'Studio',
        shape: 'L-shaped',
        width: 6,
        depth: 5,
        height: 3,
        wallColor: '#F5F0EB',
        floorColor: '#C8A882',
      },
      planType: 'multi',
      roomCount: 4,
    })
  })

  it('updates the preview text for multi-room plans', async () => {
    const user = userEvent.setup()

    render(<NewDesign onCreate={vi.fn()} />)

    await user.click(screen.getByLabelText('Multi-room Plan'))

    expect(screen.getByText('3 rooms')).toBeInTheDocument()
  })
})
