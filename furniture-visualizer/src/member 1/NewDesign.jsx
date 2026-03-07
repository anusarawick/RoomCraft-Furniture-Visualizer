import { useState } from 'react'

export default function NewDesign({ onCreate }) {
  const [name, setName] = useState('Living')
  const [shape, setShape] = useState('Rectangle')
  const [planType, setPlanType] = useState('single')
  const [roomCount, setRoomCount] = useState(3)
  const [width, setWidth] = useState(5)
  const [depth, setDepth] = useState(4)
  const [height, setHeight] = useState(2.8)
  const [wallColor, setWallColor] = useState('#F5F0EB')
  const [floorColor, setFloorColor] = useState('#C8A882')

  const handleSubmit = (event) => {
    event.preventDefault()
    onCreate({
      name: name ? `${name} Design` : 'New Design',
      room: {
        name,
        shape,
        width: Number(width),
        depth: Number(depth),
        height: Number(height),
        wallColor,
        floorColor,
      },
      planType,
      roomCount: planType === 'multi' ? Number(roomCount) : 1,
    })
  }

  return (
    <div>
      <div className="dashboard-header" style={{ textAlign: 'center' }}>
        <h1>New Design</h1>
        <p>Set up your room specifications to get started.</p>
      </div>

      <form className="new-design-grid" onSubmit={handleSubmit}>
        <div className="form-card card">
          <h3>Room Details</h3>
          <label className="field">
            Room Name
            <input
              type="text"
              placeholder="e.g. Living Room"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <div className="field">
            Room Shape
            <div className="tool-group">
              {['Rectangle', 'L-shaped'].map((option) => (
                <label key={option} className="tool-group">
                  <input
                    type="radio"
                    name="shape"
                    value={option}
                    checked={shape === option}
                    onChange={(event) => setShape(event.target.value)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="field">
            Plan Type
            <div className="tool-group">
              {[
                { value: 'single', label: 'Single Room' },
                { value: 'multi', label: 'Multi-room Plan' },
              ].map((option) => (
                <label key={option.value} className="tool-group">
                  <input
                    type="radio"
                    name="planType"
                    value={option.value}
                    checked={planType === option.value}
                    onChange={(event) => setPlanType(event.target.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          {planType === 'multi' && (
            <label className="field">
              Number of Rooms
              <input
                type="number"
                min="2"
                max="8"
                step="1"
                value={roomCount}
                onChange={(event) => setRoomCount(event.target.value)}
                required
              />
            </label>
          )}
        </div>

        <div className="form-card card">
          <h3>Room Preview</h3>
          <div className="preview-box">
            {planType === 'multi'
              ? `${roomCount} rooms`
              : `${width}m x ${depth}m`}
          </div>
        </div>

        <div className="form-card card">
          <h3>Dimensions</h3>
          <div className="form-row">
            <label className="field">
              Width (m)
              <input
                type="number"
                min="1"
                step="0.1"
                value={width}
                onChange={(event) => setWidth(event.target.value)}
                required
              />
            </label>
            <label className="field">
              Length (m)
              <input
                type="number"
                min="1"
                step="0.1"
                value={depth}
                onChange={(event) => setDepth(event.target.value)}
                required
              />
            </label>
            <label className="field">
              Height (m)
              <input
                type="number"
                min="2"
                step="0.1"
                value={height}
                onChange={(event) => setHeight(event.target.value)}
                required
              />
            </label>
          </div>
        </div>

        <div className="form-card card">
          <h3>Colors</h3>
          <div className="form-row">
            <label className="field">
              Wall Color
              <div className="color-input">
                <input
                  type="color"
                  value={wallColor}
                  onChange={(event) => setWallColor(event.target.value)}
                />
                <input type="text" value={wallColor} readOnly />
              </div>
            </label>
            <label className="field">
              Floor Color
              <div className="color-input">
                <input
                  type="color"
                  value={floorColor}
                  onChange={(event) => setFloorColor(event.target.value)}
                />
                <input type="text" value={floorColor} readOnly />
              </div>
            </label>
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-primary" type="submit">
            Create Design
          </button>
        </div>
      </form>
    </div>
  )
}
