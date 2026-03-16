const encoder = new TextEncoder()

const toBytes = (value) => (typeof value === 'string' ? encoder.encode(value) : value)

const dataUrlToBytes = (dataUrl) => {
  const [, base64 = ''] = dataUrl.split(',')
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const downloadCanvasAsPng = (canvas, filename) => {
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = filename
  link.click()
}

export const downloadCanvasAsPdf = (canvas, filename) => {
  const pageMaxWidth = canvas.width >= canvas.height ? 842 : 595
  const pageMaxHeight = canvas.width >= canvas.height ? 595 : 842
  const pageScale = Math.min(pageMaxWidth / canvas.width, pageMaxHeight / canvas.height)
  const pageWidth = Number((canvas.width * pageScale).toFixed(2))
  const pageHeight = Number((canvas.height * pageScale).toFixed(2))

  const imageBytes = dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.92))
  const contentStream = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ`

  const parts = []
  const offsets = [0]
  let offset = 0

  const push = (value) => {
    const bytes = toBytes(value)
    parts.push(bytes)
    offset += bytes.length
  }

  const pushObject = (id, content) => {
    offsets[id] = offset
    push(`${id} 0 obj\n`)
    push(content)
    push(`\nendobj\n`)
  }

  push('%PDF-1.4\n')
  pushObject(1, '<< /Type /Catalog /Pages 2 0 R >>')
  pushObject(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  pushObject(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
  )
  offsets[4] = offset
  push(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,
  )
  push(imageBytes)
  push('\nendstream\nendobj\n')
  pushObject(5, `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`)

  const xrefOffset = offset
  push(`xref\n0 6\n0000000000 65535 f \n`)
  for (let id = 1; id <= 5; id += 1) {
    push(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`)
  }
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`)

  downloadBlob(new Blob(parts, { type: 'application/pdf' }), filename)
}

export const cloneCanvas = (source) => {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const context = canvas.getContext('2d')
  context?.drawImage(source, 0, 0)
  return canvas
}

export const drawCanvasContained = (context, source, frame) => {
  const scale = Math.min(frame.width / source.width, frame.height / source.height)
  const width = source.width * scale
  const height = source.height * scale
  const x = frame.x + (frame.width - width) / 2
  const y = frame.y + (frame.height - height) / 2
  context.drawImage(source, x, y, width, height)
}

export const createSplitExportCanvas = ({
  leftCanvas,
  rightCanvas,
  leftLabel = '2D View',
  rightLabel = '3D View',
}) => {
  const canvas = document.createElement('canvas')
  canvas.width = 1800
  canvas.height = 980
  const context = canvas.getContext('2d')
  if (!context) return canvas

  context.fillStyle = '#f6f1eb'
  context.fillRect(0, 0, canvas.width, canvas.height)

  const panelWidth = (canvas.width - 72) / 2
  const panelHeight = canvas.height - 64
  const panels = [
    { x: 24, y: 24, width: panelWidth, height: panelHeight, label: leftLabel, source: leftCanvas },
    {
      x: 48 + panelWidth,
      y: 24,
      width: panelWidth,
      height: panelHeight,
      label: rightLabel,
      source: rightCanvas,
    },
  ]

  panels.forEach((panel) => {
    context.fillStyle = '#fbf8f4'
    context.strokeStyle = '#ddcfbf'
    context.lineWidth = 2
    context.beginPath()
    context.roundRect(panel.x, panel.y, panel.width, panel.height, 28)
    context.fill()
    context.stroke()

    context.fillStyle = '#3f3328'
    context.font = '700 30px Georgia, "Times New Roman", serif'
    context.fillText(panel.label, panel.x + 28, panel.y + 46)

    drawCanvasContained(context, panel.source, {
      x: panel.x + 22,
      y: panel.y + 74,
      width: panel.width - 44,
      height: panel.height - 96,
    })
  })

  return canvas
}
