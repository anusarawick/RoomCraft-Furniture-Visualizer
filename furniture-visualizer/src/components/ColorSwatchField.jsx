import { useEffect, useState } from 'react'

const normalizeHex = (value) => (value || '').trim().toUpperCase()

export default function ColorSwatchField({
  label,
  value,
  presets,
  onChange,
  onPresetSelect,
  onNoneSelect,
  onCustomFocus,
  onCustomBlur,
  showNoneOption = false,
  noneActive = false,
  disabled = false,
}) {
  const normalizedValue = normalizeHex(value)
  const isPresetValue = presets.some((preset) => normalizeHex(preset.value) === normalizedValue)
  const [showCustomPicker, setShowCustomPicker] = useState(() => !isPresetValue)

  useEffect(() => {
    if (!isPresetValue) {
      setShowCustomPicker(true)
    }
  }, [isPresetValue])

  const handlePresetClick = (nextValue) => {
    if (disabled) return
    setShowCustomPicker(false)
    if (onPresetSelect) {
      onPresetSelect(nextValue)
      return
    }
    onChange(nextValue)
  }

  const handleNoneClick = () => {
    if (disabled || !onNoneSelect) return
    setShowCustomPicker(false)
    onNoneSelect()
  }

  return (
    <div className="field color-picker-field">
      <div className="color-picker-label">{label}</div>
      <div className="color-swatch-list" role="list" aria-label={`${label} presets`}>
        {presets.map((preset) => {
          const isActive = !noneActive && normalizeHex(preset.value) === normalizedValue
          return (
            <button
              key={preset.value}
              type="button"
              className={`color-swatch${isActive ? ' active' : ''}`}
              style={{ '--swatch-color': preset.value }}
              onClick={() => handlePresetClick(preset.value)}
              disabled={disabled}
              aria-label={`${label}: ${preset.name}`}
              title={preset.name}
            />
          )
        })}
        {showNoneOption ? (
          <button
            type="button"
            className={`color-swatch color-swatch-none${noneActive ? ' active' : ''}`}
            onClick={handleNoneClick}
            disabled={disabled}
            aria-label={`Use original ${label.toLowerCase()}`}
            title="Original colours"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="7" />
              <path d="M7 17 17 7" />
            </svg>
          </button>
        ) : null}
        <button
          type="button"
          className={`color-swatch color-swatch-custom${
            !noneActive && (showCustomPicker || !isPresetValue) ? ' active' : ''
          }`}
          onClick={() => !disabled && setShowCustomPicker(true)}
          disabled={disabled}
          aria-label={`Choose a custom ${label.toLowerCase()}`}
          title="Custom colour"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      {showCustomPicker && !noneActive ? (
        <div className="custom-color-panel">
          <div
            className="custom-color-preview"
            style={{ '--swatch-color': value || '#FFFFFF' }}
            aria-hidden="true"
          />
          <input
            type="color"
            className="custom-color-input"
            value={value || '#FFFFFF'}
            onFocus={onCustomFocus}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onCustomBlur}
            disabled={disabled}
            aria-label={`Custom ${label.toLowerCase()}`}
          />
        </div>
      ) : null}
    </div>
  )
}
