import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Editor from '../Editor'
import { createTestCatalog, createTestDesign, createTestUser } from '../../../test/fixtures'

const notify = vi.fn()

vi.mock('../../../member 4/NotificationProvider', () => ({
  useNotifications: () => ({ notify }),
}))

vi.mock('../../../member 2/Layout2D', () => ({
  default: () => <div data-testid="layout-2d">Layout2D</div>,
}))

vi.mock('../../../member 2/Plan2D', () => ({
  default: () => <div data-testid="plan-2d">Plan2D</div>,
}))

vi.mock('../../../member 3/ThreeViewport', () => ({
  default: () => <div data-testid="three-viewport">ThreeViewport</div>,
}))

vi.mock('../../FurnitureThumbnail', () => ({
  default: ({ item }) => <div data-testid={`thumb-${item.id}`}>{item.name}</div>,
}))

function EditorHarness({
  initialDesign = createTestDesign({ items: [] }),
  onUpdateSpy = vi.fn(),
  ...props
}) {
  const [design, setDesign] = useState(initialDesign)

  return (
    <Editor
      user={createTestUser()}
      design={design}
      catalog={createTestCatalog()}
      onUpdateDesign={(nextDesign) => {
        onUpdateSpy(nextDesign)
        setDesign(nextDesign)
      }}
      onSaveDesign={vi.fn()}
      onExit={vi.fn()}
      {...props}
    />
  )
}

describe('Editor', () => {
  beforeEach(() => {
    notify.mockReset()
    window.confirm = vi.fn(() => true)
  })

  it('renders an empty state when no design is selected', async () => {
    const user = userEvent.setup()
    const onExit = vi.fn()

    render(
      <Editor
        user={createTestUser()}
        design={null}
        catalog={createTestCatalog()}
        onUpdateDesign={vi.fn()}
        onSaveDesign={vi.fn()}
        onExit={onExit}
      />,
    )

    expect(screen.getByText('No design selected')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back to dashboard' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('adds furniture, shows the selected item panel, and saves by design id', async () => {
    const user = userEvent.setup()
    const onUpdateSpy = vi.fn()
    const onSaveDesign = vi.fn()

    function SaveHarness() {
      const [design, setDesign] = useState(createTestDesign({ items: [] }))

      return (
        <Editor
          user={createTestUser()}
          design={design}
          catalog={createTestCatalog()}
          onUpdateDesign={(nextDesign) => {
            onUpdateSpy(nextDesign)
            setDesign(nextDesign)
          }}
          onSaveDesign={onSaveDesign}
          onExit={vi.fn()}
        />
      )
    }

    render(<SaveHarness />)

    await user.click(screen.getByRole('button', { name: /bed 1/i }))

    await waitFor(() => expect(onUpdateSpy).toHaveBeenCalled())
    expect(screen.getByText('Furniture Properties')).toBeInTheDocument()
    expect(screen.getByText(/selected:/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSaveDesign).toHaveBeenCalledWith('design-1')
  })

  it('supports undo and redo after adding furniture', async () => {
    const user = userEvent.setup()
    const onUpdateSpy = vi.fn()

    render(<EditorHarness onUpdateSpy={onUpdateSpy} />)

    await user.click(screen.getByRole('button', { name: /bed 1/i }))
    await waitFor(() =>
      expect(onUpdateSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          items: [expect.objectContaining({ label: 'Bed 1' })],
        }),
      ),
    )

    await user.click(screen.getByTitle('Undo'))
    await waitFor(() =>
      expect(onUpdateSpy).toHaveBeenLastCalledWith(expect.objectContaining({ items: [] })),
    )
    expect(screen.getByText('Room Properties')).toBeInTheDocument()

    await user.click(screen.getByTitle('Redo'))
    await waitFor(() =>
      expect(onUpdateSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          items: [expect.objectContaining({ label: 'Bed 1' })],
        }),
      ),
    )
  })

  it('disables editing actions in read-only mode', async () => {
    const user = userEvent.setup()
    const onUpdateSpy = vi.fn()

    render(
      <EditorHarness
        onUpdateSpy={onUpdateSpy}
        initialDesign={createTestDesign()}
        readOnly
        allowViewToggle={false}
      />,
    )

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /bed 1/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    )

    await user.click(screen.getByRole('button', { name: /bed 1/i }))

    expect(onUpdateSpy).not.toHaveBeenCalled()
  })
})
