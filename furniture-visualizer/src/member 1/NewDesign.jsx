import { useState } from 'react'
import ColorSwatchField from '../components/ColorSwatchField'
import { FLOOR_COLOR_PRESETS, ROOM_SHAPES, WALL_COLOR_PRESETS } from './constants'
import { getRoomClipPath, isLShapedRoom } from '../utils/roomShape'

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
              {ROOM_SHAPES.map((option) => (
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
          <div
            className={`preview-box ${planType === 'single' && isLShapedRoom({ shape }) ? 'is-l-shaped' : ''}`}
            style={
              planType === 'single'
                ? {
                    clipPath: getRoomClipPath({
                      shape,
                      width: Number(width) || 5,
                      depth: Number(depth) || 4,
                    }),
                  }
                : undefined
            }
          >
            {planType === 'multi' ? `${roomCount} rooms` : `${width}m x ${depth}m`}
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
            <ColorSwatchField
              label="Wall Color"
              value={wallColor}
              presets={WALL_COLOR_PRESETS}
              onChange={setWallColor}
            />
            <ColorSwatchField
              label="Floor Color"
              value={floorColor}
              presets={FLOOR_COLOR_PRESETS}
              onChange={setFloorColor}
            />
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
