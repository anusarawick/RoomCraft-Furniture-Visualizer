import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Catalog from '../Catalog'

vi.mock('../../components/FurnitureThumbnail', () => ({
  default: ({ item }) => <div data-testid={`thumb-${item.id}`}>{item.name}</div>,
}))

describe('Catalog', () => {
  const catalog = [
    {
      id: 'furniture-12',
      name: 'Chair',
      width: 0.6,
      depth: 0.67,
      height: 0.52,
      color: '#8B7763',
    },
  ]

  it('opens the editor and saves valid changes', async () => {
    const user = userEvent.setup()
    const onUpdateItem = vi.fn()

    render(<Catalog catalog={catalog} onUpdateItem={onUpdateItem} />)

    await user.click(screen.getByRole('button', { name: /chair/i }))
    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Chair Deluxe')
    await user.clear(screen.getByLabelText('Width (m)'))
    await user.type(screen.getByLabelText('Width (m)'), '0.75')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(onUpdateItem).toHaveBeenCalledWith('furniture-12', {
      name: 'Chair Deluxe',
      width: 0.75,
      depth: 0.67,
      height: 0.52,
      color: '#8B7763',
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not save invalid values', async () => {
    const user = userEvent.setup()
    const onUpdateItem = vi.fn()

    render(<Catalog catalog={catalog} onUpdateItem={onUpdateItem} />)

    await user.click(screen.getByRole('button', { name: /chair/i }))
    await user.clear(screen.getByLabelText('Name'))
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(onUpdateItem).not.toHaveBeenCalled()
  })
})
