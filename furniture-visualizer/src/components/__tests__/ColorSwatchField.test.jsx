import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ColorSwatchField from '../ColorSwatchField'

const presets = [
  { name: 'Terracotta', value: '#C97C5D' },
  { name: 'Olive', value: '#8A9A76' },
]

describe('ColorSwatchField', () => {
  it('calls preset and custom change handlers', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onPresetSelect = vi.fn()

    render(
      <ColorSwatchField
        label="Accent Colour"
        value="#FFFFFF"
        presets={presets}
        onChange={onChange}
        onPresetSelect={onPresetSelect}
      />,
    )

    await user.click(screen.getByLabelText('Accent Colour: Terracotta'))
    expect(onPresetSelect).toHaveBeenCalledWith('#C97C5D')

    await user.click(screen.getByLabelText('Choose a custom accent colour'))
    fireEvent.change(screen.getByLabelText('Custom accent colour'), {
      target: { value: '#123456' },
    })
    expect(onChange).toHaveBeenCalledWith('#123456')
  })

  it('supports restoring original colours', async () => {
    const user = userEvent.setup()
    const onNoneSelect = vi.fn()

    render(
      <ColorSwatchField
        label="Accent Colour"
        value="#C97C5D"
        presets={presets}
        onChange={vi.fn()}
        onNoneSelect={onNoneSelect}
        showNoneOption
      />,
    )

    await user.click(screen.getByLabelText('Use original accent colour'))

    expect(onNoneSelect).toHaveBeenCalledTimes(1)
  })
})
