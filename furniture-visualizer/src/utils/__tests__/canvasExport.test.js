import {
  cloneCanvas,
  createSplitExportCanvas,
  downloadCanvasAsPdf,
  downloadCanvasAsPng,
  drawCanvasContained,
} from '../canvasExport'

const createCanvasContext = () => ({
  drawImage: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  roundRect: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  set fillStyle(value) {
    this._fillStyle = value
  },
  set strokeStyle(value) {
    this._strokeStyle = value
  },
  set lineWidth(value) {
    this._lineWidth = value
  },
  set font(value) {
    this._font = value
  },
})

describe('canvasExport', () => {
  it('downloads a canvas as PNG through an anchor element', () => {
    const click = vi.fn()
    const realCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return {
          click,
          set href(value) {
            this._href = value
          },
          set download(value) {
            this._download = value
          },
        }
      }
      return realCreateElement(tagName)
    })

    downloadCanvasAsPng(
      {
        toDataURL: vi.fn(() => 'data:image/png;base64,Zm9v'),
      },
      'plan.png',
    )

    expect(click).toHaveBeenCalledTimes(1)
    createElementSpy.mockRestore()
  })

  it('downloads a canvas as PDF through a blob url', () => {
    const click = vi.fn()
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pdf')
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const realCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return {
          click,
          set href(value) {
            this._href = value
          },
          set download(value) {
            this._download = value
          },
        }
      }
      return realCreateElement(tagName)
    })

    vi.useFakeTimers()
    downloadCanvasAsPdf(
      {
        width: 1200,
        height: 800,
        toDataURL: vi.fn(() => 'data:image/jpeg;base64,Zm9v'),
      },
      'plan.pdf',
    )
    vi.runAllTimers()

    expect(createObjectUrl).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:pdf')
    createElementSpy.mockRestore()
  })

  it('clones canvases and draws contained frames', () => {
    const context = createCanvasContext()
    const realCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => context),
        }
      }
      return realCreateElement(tagName)
    })

    const cloned = cloneCanvas({ width: 400, height: 200 })
    drawCanvasContained(context, { width: 400, height: 200 }, { x: 0, y: 0, width: 100, height: 100 })

    expect(cloned.width).toBe(400)
    expect(cloned.height).toBe(200)
    expect(context.drawImage).toHaveBeenCalled()
    createElementSpy.mockRestore()
  })

  it('creates a split export canvas with both panels', () => {
    const context = createCanvasContext()
    const realCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => context),
        }
      }
      return realCreateElement(tagName)
    })

    const canvas = createSplitExportCanvas({
      leftCanvas: { width: 400, height: 300 },
      rightCanvas: { width: 500, height: 300 },
    })

    expect(canvas.width).toBe(1800)
    expect(canvas.height).toBe(980)
    expect(context.fillText).toHaveBeenCalledWith('2D View', expect.any(Number), expect.any(Number))
    expect(context.fillText).toHaveBeenCalledWith('3D View', expect.any(Number), expect.any(Number))
    createElementSpy.mockRestore()
  })
})
