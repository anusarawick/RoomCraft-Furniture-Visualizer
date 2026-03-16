import { useEffect, useMemo, useRef, useState } from 'react'
import Layout2D from '../../member 2/Layout2D'
import Plan2D from '../../member 2/Plan2D'
import ThreeViewport from '../../member 3/ThreeViewport'
import { clamp } from '../../member 2/clamp'
import { shadeColor } from '../../member 3/color'
import { cloneDesign } from '../../utils/clone'
import { createId } from '../../utils/ids'
import { isPlacementConflicting } from '../../utils/collision'
import { useNotifications } from '../../member 4/NotificationProvider'
import FurnitureIcon from '../../member 2/FurnitureIcon'
import ColorSwatchField from '../ColorSwatchField'
import {
  ACCENT_COLOR_PRESETS,
  FLOOR_COLOR_PRESETS,
  ITEM_COLOR_PRESETS,
  WALL_COLOR_PRESETS,
} from '../../member 1/constants'
import {
  isOpeningItem,
  isOpeningElementType,
  snapOpeningToRoomWall,
} from '../../utils/openingPlacement'

const ICONS = {
  select: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
      <path d="M4 4l6 16 2-7 7-2z" />
    </svg>
  ),
  move: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <path d="M7 7l-4 4 4 4" />
      <path d="M17 7l4 4-4 4" />
    </svg>
  ),
  rotate: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </svg>
  ),
  rotateLeft: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
      <path d="M7 7H3v4" />
      <path d="M3 11a9 9 0 1 0 3-6.7" />
    </svg>
  ),
  rotateRight: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
      <path d="M17 7h4v4" />
      <path d="M21 11a9 9 0 1 1-3-6.7" />
    </svg>
  ),
  undo: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
      <path d="M9 10H4V5" />
      <path d="M4 10c2-3 6-5 10-4 4 1 6 4 6 8" />
    </svg>
  ),
  redo: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
      <path d="M15 10h5V5" />
      <path d="M20 10c-2-3-6-5-10-4-4 1-6 4-6 8" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M7 7l1 12h8l1-12" />
    </svg>
  ),
}

const SNAP_STEP = 0.1
const ADD_PLACEMENT_STEP = 0.1
const EXPORT_SCALE = 120
const EXPORT_PADDING = 56
const CATALOG_ITEM_MIME = 'application/x-roomcraft-catalog-item'

const sanitizeFileName = (name) =>
  (name || 'roomcraft-plan')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const getPlanBounds = (rooms) =>
  rooms.reduce(
    (acc, room) => {
      const x = Number.isFinite(room.x) ? room.x : 0
      const y = Number.isFinite(room.y) ? room.y : 0
      acc.minX = Math.min(acc.minX, x)
      acc.minY = Math.min(acc.minY, y)
      acc.maxX = Math.max(acc.maxX, x + room.width)
      acc.maxY = Math.max(acc.maxY, y + room.depth)
      return acc
    },
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  )

const roundToStep = (value, step) => Math.round(value / step) * step

const normalizePositionValue = (value) => Number(value.toFixed(4))

const buildPlacementAxis = (max, step) => {
  if (!Number.isFinite(max) || max <= 0) return [0]
  const values = []
  for (let current = 0; current <= max + step * 0.5; current += step) {
    values.push(normalizePositionValue(Math.min(max, current)))
  }
  const last = values[values.length - 1]
  if (Math.abs(last - max) > 0.0001) {
    values.push(normalizePositionValue(max))
  }
  return values
}

const resolveDroppedCatalogId = (dataTransfer) => {
  if (!dataTransfer) return ''
  return (
    dataTransfer.getData(CATALOG_ITEM_MIME) ||
    dataTransfer.getData('text/plain') ||
    ''
  )
}

const findAvailablePosition = ({
  baseItem,
  room,
  existingItems,
  defaultRoomId,
  preferredPosition = null,
  step = ADD_PLACEMENT_STEP,
}) => {
  const maxX = Math.max(0, room.width - baseItem.width)
  const maxY = Math.max(0, room.depth - baseItem.depth)
  const canPlace = (x, y) =>
    !isPlacementConflicting(
      {
        ...baseItem,
        x,
        y,
      },
      existingItems,
      { defaultRoomId },
    )

  const normalizePosition = (position) => {
    if (!position) return null
    const x = normalizePositionValue(
      clamp(roundToStep(position.x, step), 0, maxX),
    )
    const y = normalizePositionValue(
      clamp(roundToStep(position.y, step), 0, maxY),
    )
    return { x, y }
  }

  const preferred = normalizePosition(preferredPosition)
  if (preferred && canPlace(preferred.x, preferred.y)) {
    return preferred
  }

  const xAxis = buildPlacementAxis(maxX, step)
  const yAxis = buildPlacementAxis(maxY, step)

  if (!preferred) {
    for (const y of yAxis) {
      for (const x of xAxis) {
        if (canPlace(x, y)) return { x, y }
      }
    }
    return null
  }

  const candidates = []
  for (const y of yAxis) {
    for (const x of xAxis) {
      candidates.push({ x, y })
    }
  }
  candidates.sort((first, second) => {
    const firstDistance =
      (first.x - preferred.x) * (first.x - preferred.x) +
      (first.y - preferred.y) * (first.y - preferred.y)
    const secondDistance =
      (second.x - preferred.x) * (second.x - preferred.x) +
      (second.y - preferred.y) * (second.y - preferred.y)
    return firstDistance - secondDistance
  })

  for (const candidate of candidates) {
    if (canPlace(candidate.x, candidate.y)) {
      return candidate
    }
  }

  return null
}

const findAvailableOpeningPlacement = ({
  baseItem,
  room,
  existingItems,
  defaultRoomId,
  preferredCenter = null,
  step = ADD_PLACEMENT_STEP,
}) => {
  const preferred = {
    x: clamp(
      Number.isFinite(preferredCenter?.x) ? preferredCenter.x : room.width * 0.5,
      0,
      room.width,
    ),
    y: clamp(
      Number.isFinite(preferredCenter?.y) ? preferredCenter.y : room.depth * 0.18,
      0,
      room.depth,
    ),
  }
  const xAxis = buildPlacementAxis(room.width, step)
  const yAxis = buildPlacementAxis(room.depth, step)

  const centerCandidates = [{ x: preferred.x, y: preferred.y }]
  xAxis.forEach((x) => {
    centerCandidates.push({ x, y: 0 })
    centerCandidates.push({ x, y: room.depth })
  })
  yAxis.forEach((y) => {
    centerCandidates.push({ x: 0, y })
    centerCandidates.push({ x: room.width, y })
  })

  centerCandidates.sort((first, second) => {
    const firstDistance =
      (first.x - preferred.x) * (first.x - preferred.x) +
      (first.y - preferred.y) * (first.y - preferred.y)
    const secondDistance =
      (second.x - preferred.x) * (second.x - preferred.x) +
      (second.y - preferred.y) * (second.y - preferred.y)
    return firstDistance - secondDistance
  })

  const visited = new Set()
  for (const center of centerCandidates) {
    const placement = snapOpeningToRoomWall(baseItem, room, center.x, center.y)
    const key = `${placement.wall}:${placement.x.toFixed(4)}:${placement.y.toFixed(4)}:${placement.width.toFixed(4)}:${placement.depth.toFixed(4)}`
    if (visited.has(key)) continue
    visited.add(key)

    const candidate = {
      ...baseItem,
      x: placement.x,
      y: placement.y,
      width: placement.width,
      depth: placement.depth,
      openingWall: placement.wall,
      rotation: 0,
    }

    if (
      !isPlacementConflicting(candidate, existingItems, {
        defaultRoomId,
      })
    ) {
      return candidate
    }
  }

  return null
}

export default function Editor({
  user,
  design,
  catalog,
  onUpdateDesign,
  onSaveDesign,
  onExit,
  readOnly = false,
  initialViewMode = '2d',
  allowViewToggle = true,
  splitView = false,
}) {
  const [viewMode, setViewMode] = useState(initialViewMode)
  const [selectedId, setSelectedId] = useState(null)
  const [history, setHistory] = useState([])
  const [future, setFuture] = useState([])
  const [panelEditActive, setPanelEditActive] = useState(false)
  const [activeTool, setActiveTool] = useState('select')
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [activeRoomId, setActiveRoomId] = useState(
    () => design?.rooms?.[0]?.id || design?.room?.id || null,
  )
  const statusTimer = useRef(null)
  const { notify } = useNotifications()
  const canEdit = !readOnly
  const rooms = useMemo(() => {
    if (design?.rooms?.length) {
      return design.rooms
    }
    if (design?.room) {
      return [
        {
          ...design.room,
          id: design.room.id || 'room-1',
          x: Number.isFinite(design.room.x) ? design.room.x : 0,
          y: Number.isFinite(design.room.y) ? design.room.y : 0,
        },
      ]
    }
    return []
  }, [design?.room, design?.rooms])

  useEffect(() => {
    setSelectedId(null)
    setHistory([])
    setFuture([])
    setViewMode(initialViewMode)
    setPanelEditActive(false)
  }, [design?.id, initialViewMode])

  useEffect(() => {
    if (selectedId && !design?.items.find((item) => item.id === selectedId)) {
      setSelectedId(null)
    }
  }, [design?.items, selectedId])

  useEffect(() => {
    if (!rooms.length) {
      setActiveRoomId(null)
      return
    }
    setActiveRoomId((prev) =>
      prev && rooms.some((room) => room.id === prev) ? prev : rooms[0].id,
    )
  }, [rooms])

  useEffect(() => {
    if (!selectedId || !activeRoomId) return
    const current = design?.items.find((item) => item.id === selectedId)
    if (current?.roomId && current.roomId !== activeRoomId) {
      setSelectedId(null)
    }
  }, [activeRoomId, design?.items, selectedId])

  if (!design) {
    return (
      <div className="empty-state">
        <p>No design selected</p>
        <button className="btn btn-primary" onClick={onExit}>
          Back to dashboard
        </button>
      </div>
    )
  }

  const isMultiRoom = rooms.length > 1
  const activeRoom = rooms.find((room) => room.id === activeRoomId) || rooms[0] || null
  const activeRoomItems = activeRoom
    ? design.items.filter(
        (item) => item.roomId === activeRoom.id || (!item.roomId && rooms.length === 1),
      )
    : []
  const selectedItem = activeRoomItems.find((item) => item.id === selectedId)
  const selectedIsOpening = isOpeningItem(selectedItem)

  const getRoomItems = (roomId) =>
    design.items.filter(
      (item) => item.roomId === roomId || (!item.roomId && rooms.length === 1),
    )

  const showStatus = (message, type = 'info') => {
    window.clearTimeout(statusTimer.current)
    notify(message, type)
    statusTimer.current = window.setTimeout(() => {}, 1500)
  }

  const syncPrimaryRoom = (nextDesign) => {
    if (!nextDesign?.rooms?.length) return nextDesign
    return nextDesign.room === nextDesign.rooms[0]
      ? nextDesign
      : { ...nextDesign, room: nextDesign.rooms[0] }
  }

  const commitDesign = (nextDesign) => {
    onUpdateDesign(syncPrimaryRoom(nextDesign))
  }

  const pushHistory = (snapshot) => {
    if (!canEdit) return
    setHistory((prev) => [...prev, snapshot])
    setFuture([])
  }

  const beginPanelEdit = () => {
    if (!canEdit) return
    if (!panelEditActive) {
      pushHistory(cloneDesign(design))
      setPanelEditActive(true)
    }
  }

  const endPanelEdit = (message) => {
    if (!canEdit) return
    if (panelEditActive) {
      setPanelEditActive(false)
      if (message) showStatus(message, 'success')
    }
  }

  const applyInstantPanelChange = (applyChange, message) => {
    if (!canEdit) return
    if (panelEditActive) {
      setPanelEditActive(false)
    } else {
      pushHistory(cloneDesign(design))
    }
    applyChange()
    if (message) showStatus(message, 'success')
  }

  const handleUndo = () => {
    if (!canEdit || !history.length) return
    const previous = history[history.length - 1]
    setHistory((prev) => prev.slice(0, -1))
    setFuture((prev) => [cloneDesign(design), ...prev])
    commitDesign(previous)
    showStatus('Undo applied', 'info')
  }

  const handleRedo = () => {
    if (!canEdit || !future.length) return
    const next = future[0]
    setFuture((prev) => prev.slice(1))
    setHistory((prev) => [...prev, cloneDesign(design)])
    commitDesign(next)
    showStatus('Redo applied', 'info')
  }

  const updateDesign = (nextDesign, message) => {
    if (!canEdit) return
    commitDesign(nextDesign)
    if (message) showStatus(message, 'success')
  }

  const handleAddItem = (
    item,
    { roomId = null, centerX = null, centerY = null } = {},
  ) => {
    if (!canEdit) return
    const targetRoom = rooms.find((room) => room.id === roomId) || activeRoom
    if (!targetRoom) return
    const targetRoomItems = getRoomItems(targetRoom.id)
    const isOpening = isOpeningElementType(item.elementType)
    const newItem = {
      id: createId(),
      type: item.id,
      label: item.name,
      width: clamp(item.width, 0.2, targetRoom.width),
      depth: clamp(item.depth, 0.2, targetRoom.depth),
      height: item.height,
      color: item.color,
      shade: isOpening ? 0.02 : 0.1,
      rotation: 0,
      x: 0,
      y: 0,
      roomId: targetRoom.id,
      elementType: item.elementType || null,
      category: item.category || null,
    }

    if (isOpening) {
      const placement = findAvailableOpeningPlacement({
        baseItem: newItem,
        room: targetRoom,
        existingItems: targetRoomItems,
        defaultRoomId: targetRoom.id,
        preferredCenter: {
          x: centerX,
          y: centerY,
        },
      })
      if (!placement) {
        showStatus(`No wall space to add ${item.name}.`, 'warning')
        return
      }
      newItem.x = placement.x
      newItem.y = placement.y
      newItem.width = placement.width
      newItem.depth = placement.depth
      newItem.openingWall = placement.openingWall
    } else {
      const preferredPosition =
        Number.isFinite(centerX) && Number.isFinite(centerY)
          ? {
              x: centerX - newItem.width / 2,
              y: centerY - newItem.depth / 2,
            }
          : null
      const availablePosition = findAvailablePosition({
        baseItem: newItem,
        room: targetRoom,
        existingItems: targetRoomItems,
        defaultRoomId: targetRoom.id,
        preferredPosition,
      })
      if (!availablePosition) {
        showStatus(`No space to add ${item.name}.`, 'warning')
        return
      }
      newItem.x = availablePosition.x
      newItem.y = availablePosition.y
    }

    pushHistory(cloneDesign(design))
    const nextDesign = {
      ...design,
      items: [...design.items, newItem],
    }
    commitDesign(nextDesign)
    setSelectedId(newItem.id)
    setActiveRoomId(targetRoom.id)
    showStatus(`${item.name} added`, 'success')
  }

  const handleCatalogDragStart = (event, catalogItemId) => {
    if (!canEdit) return
    event.dataTransfer?.setData(CATALOG_ITEM_MIME, catalogItemId)
    event.dataTransfer?.setData('text/plain', catalogItemId)
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy'
    }
  }

  const handleDropCatalogItem = (catalogItemId, placement = {}) => {
    if (!canEdit) return
    const catalogItem = catalog.find((entry) => entry.id === catalogItemId)
    if (!catalogItem) return
    handleAddItem(catalogItem, placement)
  }

  const handleCanvasDragOver = (event) => {
    if (!canEdit) return
    if (!resolveDroppedCatalogId(event.dataTransfer)) return
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleCanvasDrop = (event) => {
    if (!canEdit) return
    const catalogItemId = resolveDroppedCatalogId(event.dataTransfer)
    if (!catalogItemId) return
    event.preventDefault()
    handleDropCatalogItem(catalogItemId)
  }

  const handleDeleteItem = () => {
    if (!canEdit || !selectedItem) return
    if (!window.confirm(`Remove ${selectedItem.label}?`)) return
    pushHistory(cloneDesign(design))
    const nextItems = design.items.filter((item) => item.id !== selectedItem.id)
    commitDesign({ ...design, items: nextItems })
    setSelectedId(null)
    showStatus('Item removed', 'warning')
  }

  const handleRotate90 = (direction) => {
    if (!canEdit || !selectedItem) return
    pushHistory(cloneDesign(design))
    const nextRotation = (selectedItem.rotation + 90 * direction + 360) % 360
    const nextItems = design.items.map((item) =>
      item.id === selectedItem.id ? { ...item, rotation: nextRotation } : item,
    )
    commitDesign({ ...design, items: nextItems })
    showStatus('Rotated 90 degrees', 'success')
  }

  const handleRoomChange = (field, value) => {
    if (!canEdit || !activeRoom) return
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return
      if (['width', 'depth', 'height'].includes(field) && value <= 0) return
      if (['x', 'y'].includes(field) && value < 0) return
    }

    const nextRoom = { ...activeRoom, [field]: value }
    let nextItems = design.items
    if (field === 'width' || field === 'depth') {
      nextItems = design.items.map((item) => {
        if (item.roomId !== activeRoom.id) return item
        const width = clamp(item.width, 0.2, nextRoom.width)
        const depth = clamp(item.depth, 0.2, nextRoom.depth)
        const x = clamp(item.x, 0, Math.max(0, nextRoom.width - width))
        const y = clamp(item.y, 0, Math.max(0, nextRoom.depth - depth))
        return { ...item, width, depth, x, y }
      })
    }
    const nextRooms = rooms.map((room) =>
      room.id === activeRoom.id ? nextRoom : room,
    )
    updateDesign({ ...design, rooms: nextRooms, items: nextItems })
  }

  const handleItemChange = (field, value) => {
    if (!canEdit || !selectedItem) return
    const nextItems = design.items.map((item) => {
      if (item.id !== selectedItem.id) return item
      const updated = { ...item, [field]: value }
      if (
        isOpeningItem(updated) &&
        activeRoom &&
        (field === 'width' || field === 'depth')
      ) {
        const centerX = item.x + item.width / 2
        const centerY = item.y + item.depth / 2
        const placement = snapOpeningToRoomWall(updated, activeRoom, centerX, centerY)
        return {
          ...updated,
          x: placement.x,
          y: placement.y,
          width: placement.width,
          depth: placement.depth,
          openingWall: placement.wall,
          rotation: 0,
        }
      }
      return updated
    })
    updateDesign({ ...design, items: nextItems })
  }

  const applyAccentToAll = () => {
    if (!canEdit || !design.items.length) return
    pushHistory(cloneDesign(design))
    const nextItems = design.items.map((item) => ({
      ...item,
      color: design.accentColor,
    }))
    commitDesign({ ...design, items: nextItems })
    showStatus('Accent applied to all items', 'success')
  }

  const applyShadeToAll = () => {
    if (!canEdit || !design.items.length) return
    pushHistory(cloneDesign(design))
    const nextItems = design.items.map((item) => ({
      ...item,
      shade: clamp(design.globalShade, 0, 0.6),
    }))
    commitDesign({ ...design, items: nextItems })
    showStatus('Shade applied to all items', 'success')
  }

  const handleAddRoom = () => {
    if (!canEdit) return
    const baseRoom = activeRoom || rooms[0]
    if (!baseRoom) return
    const bounds = rooms.reduce(
      (acc, room) => {
        const x = Number.isFinite(room.x) ? room.x : 0
        const y = Number.isFinite(room.y) ? room.y : 0
        acc.minX = Math.min(acc.minX, x)
        acc.minY = Math.min(acc.minY, y)
        acc.maxX = Math.max(acc.maxX, x + room.width)
        acc.maxY = Math.max(acc.maxY, y + room.depth)
        return acc
      },
      { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    )
    const gap = 0.8
    const newRoom = {
      ...baseRoom,
      id: createId(),
      name: `Room ${rooms.length + 1}`,
      x: bounds.maxX + gap,
      y: bounds.minY,
    }
    pushHistory(cloneDesign(design))
    const nextRooms = [...rooms, newRoom]
    updateDesign({ ...design, rooms: nextRooms })
    setActiveRoomId(newRoom.id)
    showStatus('Room added', 'success')
  }

  const handleRemoveRoom = (roomId) => {
    if (!canEdit || rooms.length <= 1) return
    const target = rooms.find((room) => room.id === roomId)
    if (!target) return
    const roomItems = design.items.filter((item) => item.roomId === roomId)
    if (
      !window.confirm(
        `Remove ${target.name || 'room'}? ${roomItems.length} items will be removed.`,
      )
    ) {
      return
    }
    pushHistory(cloneDesign(design))
    const nextRooms = rooms.filter((room) => room.id !== roomId)
    const nextItems = design.items.filter((item) => item.roomId !== roomId)
    updateDesign({ ...design, rooms: nextRooms, items: nextItems })
    setActiveRoomId(nextRooms[0]?.id || null)
    setSelectedId(null)
    showStatus('Room removed', 'warning')
  }

  const isSplitView = splitView || viewMode === 'split'

  const viewLabel = isSplitView
    ? '2D + 3D Split View'
    : viewMode === '2d'
      ? isMultiRoom
        ? 'Plan View'
        : '2D View'
      : viewMode === 'inside'
        ? 'Inside View'
        : '3D View'

  const mergeRoomItems = (nextRoomItems) => {
    if (!isMultiRoom || !activeRoom) return nextRoomItems
    const map = new Map(nextRoomItems.map((item) => [item.id, item]))
    return design.items.map((item) => map.get(item.id) || item)
  }

  const handleExportPlan = () => {
    if (!rooms.length) return
    const bounds = getPlanBounds(rooms)
    if (!Number.isFinite(bounds.minX) || !Number.isFinite(bounds.minY)) return

    const widthMeters = Math.max(1, bounds.maxX - bounds.minX)
    const heightMeters = Math.max(1, bounds.maxY - bounds.minY)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(widthMeters * EXPORT_SCALE + EXPORT_PADDING * 2)
    canvas.height = Math.round(heightMeters * EXPORT_SCALE + EXPORT_PADDING * 2)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#f6f1eb'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const toPxX = (meters) => EXPORT_PADDING + (meters - bounds.minX) * EXPORT_SCALE
    const toPxY = (meters) => EXPORT_PADDING + (meters - bounds.minY) * EXPORT_SCALE

    rooms.forEach((room) => {
      const roomX = Number.isFinite(room.x) ? room.x : 0
      const roomY = Number.isFinite(room.y) ? room.y : 0
      const left = toPxX(roomX)
      const top = toPxY(roomY)
      const roomWidth = room.width * EXPORT_SCALE
      const roomDepth = room.depth * EXPORT_SCALE

      ctx.fillStyle = room.floorColor || '#d8c0a8'
      ctx.fillRect(left, top, roomWidth, roomDepth)
      ctx.strokeStyle = '#7d6652'
      ctx.lineWidth = 3
      ctx.strokeRect(left, top, roomWidth, roomDepth)

      ctx.fillStyle = '#4b3a2d'
      ctx.font = '600 13px Manrope, Segoe UI, sans-serif'
      ctx.fillText(
        `${room.name || 'Room'} (${room.width}m x ${room.depth}m)`,
        left + 8,
        top + 20,
      )
    })

    design.items.forEach((item) => {
      const room =
        rooms.find((entry) => entry.id === item.roomId) ||
        (rooms.length === 1 ? rooms[0] : null)
      if (!room) return

      const roomX = Number.isFinite(room.x) ? room.x : 0
      const roomY = Number.isFinite(room.y) ? room.y : 0
      const centerX = toPxX(roomX + item.x + item.width / 2)
      const centerY = toPxY(roomY + item.y + item.depth / 2)
      const widthPx = item.width * EXPORT_SCALE
      const depthPx = item.depth * EXPORT_SCALE
      const shade = shadeColor(item.color, item.shade + design.globalShade * 0.6)

      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(((item.rotation || 0) * Math.PI) / 180)
      if (item.elementType === 'window') {
        ctx.fillStyle = '#e9f1f8'
        ctx.strokeStyle = '#4f6c84'
        ctx.lineWidth = 2
        ctx.fillRect(-widthPx / 2, -depthPx / 2, widthPx, depthPx)
        ctx.strokeRect(-widthPx / 2, -depthPx / 2, widthPx, depthPx)
        ctx.beginPath()
        if (widthPx >= depthPx) {
          ctx.moveTo(0, -depthPx / 2)
          ctx.lineTo(0, depthPx / 2)
        } else {
          ctx.moveTo(-widthPx / 2, 0)
          ctx.lineTo(widthPx / 2, 0)
        }
        ctx.stroke()
      } else if (item.elementType === 'door') {
        ctx.fillStyle = '#f9f9f9'
        ctx.strokeStyle = '#1c1c1c'
        ctx.lineWidth = 1.6
        ctx.fillRect(-widthPx / 2, -depthPx / 2, widthPx, depthPx)
        ctx.strokeRect(-widthPx / 2, -depthPx / 2, widthPx, depthPx)
        const swingRadius = Math.max(widthPx, depthPx)
        ctx.beginPath()
        ctx.arc(-widthPx / 2, -depthPx / 2, swingRadius, 0, Math.PI / 2)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)'
        ctx.lineWidth = 1
        ctx.stroke()
      } else {
        ctx.fillStyle = shade
        ctx.fillRect(-widthPx / 2, -depthPx / 2, widthPx, depthPx)
        ctx.strokeStyle = '#3a2b22'
        ctx.lineWidth = 1
        ctx.strokeRect(-widthPx / 2, -depthPx / 2, widthPx, depthPx)

        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = '700 11px Manrope, Segoe UI, sans-serif'
        ctx.fillText(item.label || 'Item', 0, 0, Math.max(24, widthPx - 8))
      }
      ctx.restore()
    })

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `${sanitizeFileName(design.name)}-plan.png`
    link.click()
    showStatus('2D plan exported as PNG', 'success')
  }

  return (
    <div className="editor-shell">
      <div className="editor-toolbar">
        <div className="tool-group">
          {['select', 'move', 'rotate'].map((tool) => (
            <button
              key={tool}
              className={`tool-button ${activeTool === tool ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveTool(tool)}
              title={tool}
              disabled={!canEdit}
            >
              {ICONS[tool]}
            </button>
          ))}
          <button
            className="tool-button"
            type="button"
            onClick={handleUndo}
            title="Undo"
            disabled={!canEdit || !history.length}
          >
            {ICONS.undo}
          </button>
          <button
            className="tool-button"
            type="button"
            onClick={handleRedo}
            title="Redo"
            disabled={!canEdit || !future.length}
          >
            {ICONS.redo}
          </button>
          <button
            className="tool-button"
            type="button"
            onClick={handleDeleteItem}
            title="Delete"
            disabled={!canEdit || !selectedItem}
          >
            {ICONS.trash}
          </button>
          <button
            className="tool-button"
            type="button"
            onClick={() => handleRotate90(-1)}
            title="Rotate 90 degrees left"
            disabled={!canEdit || !selectedItem || selectedIsOpening}
          >
            {ICONS.rotateLeft}
          </button>
          <button
            className="tool-button"
            type="button"
            onClick={() => handleRotate90(1)}
            title="Rotate 90 degrees right"
            disabled={!canEdit || !selectedItem || selectedIsOpening}
          >
            {ICONS.rotateRight}
          </button>
        </div>

        {splitView ? (
          <div className="tag">2D + 3D</div>
        ) : allowViewToggle ? (
          <div className="view-toggle">
            <button
              className={!isSplitView && viewMode === '2d' ? 'active' : ''}
              onClick={() => setViewMode('2d')}
            >
              2D
            </button>
            <button
              className={!isSplitView && viewMode === '3d' ? 'active' : ''}
              onClick={() => setViewMode('3d')}
            >
              3D
            </button>
            <button
              className={!isSplitView && viewMode === 'inside' ? 'active' : ''}
              onClick={() => setViewMode('inside')}
            >
              Inside
            </button>
            <button
              className={isSplitView ? 'active' : ''}
              onClick={() => setViewMode('split')}
            >
              Split
            </button>
          </div>
        ) : (
          <div className="tag">
            {isSplitView
              ? '2D + 3D'
              : viewMode === '2d'
              ? '2D Layout'
              : viewMode === 'inside'
                ? 'Inside View'
                : '3D View'}
          </div>
        )}

        <div className="tool-group">
          <button className="btn btn-ghost" onClick={onExit}>
            Back
          </button>
          <button className="btn btn-ghost" onClick={handleExportPlan}>
            Export Plan PNG
          </button>
          <button
            className={`btn btn-ghost ${snapToGrid ? 'active' : ''}`}
            onClick={() => setSnapToGrid((prev) => !prev)}
            type="button"
            title="Snap furniture to 0.1m grid"
            disabled={!canEdit}
          >
            Snap {snapToGrid ? 'On' : 'Off'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!canEdit) return
              onSaveDesign(design.id)
            }}
            disabled={!canEdit}
          >
            Save
          </button>
        </div>
      </div>

      <div className="editor-grid">
        <aside className="panel">
          <h3 className="panel-title">Furniture</h3>
          {isMultiRoom && (
            <div className="panel-subtitle">Active: {activeRoom?.name || 'Room'}</div>
          )}
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            Click or drag into the canvas to add
          </p>
          <div className="furniture-list">
            {catalog.filter((item) => !item.hidden).map((item) => (
              <button
                key={item.id}
                className="furniture-item"
                onClick={() => handleAddItem(item)}
                onDragStart={(event) => handleCatalogDragStart(event, item.id)}
                type="button"
                draggable={canEdit}
                disabled={!canEdit}
              >
                <div className="furniture-icon">
                  <FurnitureIcon name={item.icon} />
                </div>
                <div>
                  <strong>{item.name}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {item.width}m x {item.depth}m
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="canvas-panel">
          <div className="canvas-header">
            <span>
              {activeRoom
                ? `${activeRoom.name || 'Room'} · ${activeRoom.width}m x ${activeRoom.depth}m`
                : 'Room'}
              {isMultiRoom ? ` · ${rooms.length} rooms` : ''}
            </span>
            <span>{viewLabel}</span>
          </div>
          <div
            className={`canvas-stage ${isSplitView ? 'split' : ''}`}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
          >
            {isSplitView ? (
              <div className="split-stage">
                <div className="split-pane">
                  <div className="split-label">{isMultiRoom ? '2D Plan' : '2D Layout'}</div>
                  {isMultiRoom ? (
                    <Plan2D
                      rooms={rooms}
                      items={design.items}
                      activeRoomId={activeRoomId}
                      selectedId={selectedId}
                      globalShade={design.globalShade}
                      activeTool={activeTool}
                      snapToGrid={snapToGrid}
                      snapStep={SNAP_STEP}
                      readOnly={readOnly}
                      onSelectRoom={setActiveRoomId}
                      onSelectItem={setSelectedId}
                      onStartAction={() => pushHistory(cloneDesign(design))}
                      onPreviewChange={(items) => updateDesign({ ...design, items })}
                      onCommitChange={(items) => {
                        updateDesign({ ...design, items }, 'Plan updated')
                      }}
                      onDropCatalogItem={handleDropCatalogItem}
                      onInvalidPlacement={(message, fallbackItems) => {
                        if (fallbackItems) {
                          updateDesign({ ...design, items: fallbackItems })
                        }
                        showStatus(message, 'warning')
                      }}
                    />
                  ) : (
                    <Layout2D
                      room={activeRoom}
                      items={activeRoomItems}
                      selectedId={selectedId}
                      globalShade={design.globalShade}
                      activeTool={activeTool}
                      snapToGrid={snapToGrid}
                      snapStep={SNAP_STEP}
                      readOnly={readOnly}
                      onSelect={setSelectedId}
                      onStartAction={() => pushHistory(cloneDesign(design))}
                      onPreviewChange={(items) =>
                        updateDesign({ ...design, items: mergeRoomItems(items) })
                      }
                      onCommitChange={(items) => {
                        updateDesign(
                          { ...design, items: mergeRoomItems(items) },
                          'Layout updated',
                        )
                      }}
                      onDropCatalogItem={handleDropCatalogItem}
                      onInvalidPlacement={(message, fallbackItems) => {
                        if (fallbackItems) {
                          updateDesign({
                            ...design,
                            items: mergeRoomItems(fallbackItems),
                          })
                        }
                        showStatus(message, 'warning')
                      }}
                    />
                  )}
                </div>
                <div className="split-pane">
                  <div className="split-label">3D View</div>
                  {activeRoom && (
                    <ThreeViewport
                      room={activeRoom}
                      items={activeRoomItems}
                      catalog={catalog}
                      globalShade={design.globalShade}
                      selectedId={selectedId}
                      activeTool={activeTool}
                      snapToGrid={snapToGrid}
                      snapStep={SNAP_STEP}
                      readOnly={readOnly}
                      onSelect={setSelectedId}
                      onStartAction={() => pushHistory(cloneDesign(design))}
                      onPreviewChange={(items) =>
                        updateDesign({ ...design, items: mergeRoomItems(items) })
                      }
                      onCommitChange={(items, message) =>
                        updateDesign(
                          { ...design, items: mergeRoomItems(items) },
                          message || '3D layout updated',
                        )
                      }
                      onInvalidPlacement={(message, fallbackItems) => {
                        if (fallbackItems) {
                          updateDesign({
                            ...design,
                            items: mergeRoomItems(fallbackItems),
                          })
                        }
                        showStatus(message, 'warning')
                      }}
                    />
                  )}
                </div>
              </div>
            ) : viewMode === '2d' ? (
              isMultiRoom ? (
                <Plan2D
                  rooms={rooms}
                  items={design.items}
                  activeRoomId={activeRoomId}
                  selectedId={selectedId}
                  globalShade={design.globalShade}
                  activeTool={activeTool}
                  snapToGrid={snapToGrid}
                  snapStep={SNAP_STEP}
                  readOnly={readOnly}
                  onSelectRoom={setActiveRoomId}
                  onSelectItem={setSelectedId}
                  onStartAction={() => pushHistory(cloneDesign(design))}
                  onPreviewChange={(items) => updateDesign({ ...design, items })}
                  onCommitChange={(items) => {
                    updateDesign({ ...design, items }, 'Plan updated')
                  }}
                  onDropCatalogItem={handleDropCatalogItem}
                  onInvalidPlacement={(message, fallbackItems) => {
                    if (fallbackItems) {
                      updateDesign({ ...design, items: fallbackItems })
                    }
                    showStatus(message, 'warning')
                  }}
                />
              ) : (
                <Layout2D
                  room={activeRoom}
                  items={activeRoomItems}
                  selectedId={selectedId}
                  globalShade={design.globalShade}
                  activeTool={activeTool}
                  snapToGrid={snapToGrid}
                  snapStep={SNAP_STEP}
                  readOnly={readOnly}
                  onSelect={setSelectedId}
                  onStartAction={() => pushHistory(cloneDesign(design))}
                  onPreviewChange={(items) =>
                    updateDesign({ ...design, items: mergeRoomItems(items) })
                  }
                  onCommitChange={(items) => {
                    updateDesign(
                      { ...design, items: mergeRoomItems(items) },
                      'Layout updated',
                    )
                  }}
                  onDropCatalogItem={handleDropCatalogItem}
                  onInvalidPlacement={(message, fallbackItems) => {
                    if (fallbackItems) {
                      updateDesign({
                        ...design,
                        items: mergeRoomItems(fallbackItems),
                      })
                    }
                    showStatus(message, 'warning')
                  }}
                />
              )
            ) : viewMode === 'inside' ? (
              activeRoom && (
                <ThreeViewport
                  room={activeRoom}
                  items={activeRoomItems}
                  catalog={catalog}
                  globalShade={design.globalShade}
                  selectedId={selectedId}
                  activeTool={activeTool}
                  snapToGrid={snapToGrid}
                  snapStep={SNAP_STEP}
                  readOnly={readOnly}
                  controlMode="inside"
                  onSelect={setSelectedId}
                  onStartAction={() => pushHistory(cloneDesign(design))}
                  onPreviewChange={(items) =>
                    updateDesign({ ...design, items: mergeRoomItems(items) })
                  }
                  onCommitChange={(items, message) =>
                    updateDesign(
                      { ...design, items: mergeRoomItems(items) },
                      message || '3D layout updated',
                    )
                  }
                  onInvalidPlacement={(message, fallbackItems) => {
                    if (fallbackItems) {
                      updateDesign({
                        ...design,
                        items: mergeRoomItems(fallbackItems),
                      })
                    }
                    showStatus(message, 'warning')
                  }}
                />
              )
            ) : (
              activeRoom && (
                <ThreeViewport
                  room={activeRoom}
                  items={activeRoomItems}
                  catalog={catalog}
                  globalShade={design.globalShade}
                  selectedId={selectedId}
                  activeTool={activeTool}
                  snapToGrid={snapToGrid}
                  snapStep={SNAP_STEP}
                  readOnly={readOnly}
                  onSelect={setSelectedId}
                  onStartAction={() => pushHistory(cloneDesign(design))}
                  onPreviewChange={(items) =>
                    updateDesign({ ...design, items: mergeRoomItems(items) })
                  }
                  onCommitChange={(items, message) =>
                    updateDesign(
                      { ...design, items: mergeRoomItems(items) },
                      message || '3D layout updated',
                    )
                  }
                  onInvalidPlacement={(message, fallbackItems) => {
                    if (fallbackItems) {
                      updateDesign({
                        ...design,
                        items: mergeRoomItems(fallbackItems),
                      })
                    }
                    showStatus(message, 'warning')
                  }}
                />
              )
            )}
          </div>
          <div className="canvas-footer">
            <span>Designer: {user?.name || 'Designer'}</span>
            <span>
              {isMultiRoom
                ? `${activeRoomItems.length} items in room · ${design.items.length} total`
                : `${design.items.length} items`}
            </span>
            <span>
              {selectedItem
                ? `Selected: ${selectedItem.width.toFixed(2)}m x ${selectedItem.depth.toFixed(
                    2,
                  )}m @ (${selectedItem.x.toFixed(2)}, ${selectedItem.y.toFixed(2)})`
                : 'No item selected'}
            </span>
          </div>
        </main>

        <aside className="panel">
          {selectedItem ? (
            <>
              <h3 className="panel-title">Furniture Properties</h3>
              <div className="properties-list">
                <div className="properties-section">
                  <label className="field">
                    Label
                    <input
                      type="text"
                      value={selectedItem.label}
                      onFocus={beginPanelEdit}
                      onChange={(event) => handleItemChange('label', event.target.value)}
                      onBlur={() => endPanelEdit('Label updated')}
                      disabled={!canEdit}
                    />
                  </label>
                  <label className="field">
                    Width (m)
                    <input
                      type="number"
                      min="0.2"
                      step="0.05"
                      value={selectedItem.width}
                      onFocus={beginPanelEdit}
                      onChange={(event) =>
                        handleItemChange('width', Number(event.target.value))
                      }
                      onBlur={() => endPanelEdit('Width updated')}
                      disabled={!canEdit}
                    />
                  </label>
                  <label className="field">
                    Depth (m)
                    <input
                      type="number"
                      min="0.2"
                      step="0.05"
                      value={selectedItem.depth}
                      onFocus={beginPanelEdit}
                      onChange={(event) =>
                        handleItemChange('depth', Number(event.target.value))
                      }
                      onBlur={() => endPanelEdit('Depth updated')}
                      disabled={!canEdit}
                    />
                  </label>
                  {!selectedIsOpening && (
                    <>
                      <label className="field">
                        Rotation (deg)
                        <input
                          type="number"
                          step="5"
                          value={Math.round(selectedItem.rotation)}
                          onFocus={beginPanelEdit}
                          onChange={(event) =>
                            handleItemChange('rotation', Number(event.target.value))
                          }
                          onBlur={() => endPanelEdit('Rotation updated')}
                          disabled={!canEdit}
                        />
                      </label>
                      <div className="inline-actions">
                        <button
                          className="btn btn-ghost"
                          type="button"
                          onClick={() => handleRotate90(-1)}
                          disabled={!canEdit}
                        >
                          Rotate -90
                        </button>
                        <button
                          className="btn btn-ghost"
                          type="button"
                          onClick={() => handleRotate90(1)}
                          disabled={!canEdit}
                        >
                          Rotate +90
                        </button>
                      </div>
                    </>
                  )}
                  <ColorSwatchField
                    label="Colour"
                    value={selectedItem.color}
                    presets={ITEM_COLOR_PRESETS}
                    onChange={(nextColor) => handleItemChange('color', nextColor)}
                    onPresetSelect={(nextColor) =>
                      applyInstantPanelChange(
                        () => handleItemChange('color', nextColor),
                        'Colour updated',
                      )
                    }
                    onCustomFocus={beginPanelEdit}
                    onCustomBlur={() => endPanelEdit('Colour updated')}
                    disabled={!canEdit}
                  />
                  <label className="field">
                    Shade
                    <input
                      type="range"
                      min="0"
                      max="0.6"
                      step="0.02"
                      value={selectedItem.shade}
                      onFocus={beginPanelEdit}
                      onChange={(event) =>
                        handleItemChange('shade', Number(event.target.value))
                      }
                      onBlur={() => endPanelEdit('Shade updated')}
                      disabled={!canEdit}
                    />
                  </label>
                  <button className="btn btn-ghost" onClick={handleDeleteItem} disabled={!canEdit}>
                    Delete selected item
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 className="panel-title">Room Properties</h3>
              <div className="properties-list">
                {isMultiRoom && (
                  <div className="properties-section">
                    <h4>Rooms</h4>
                    <div className="room-list">
                      {rooms.map((room, index) => (
                        <button
                          key={room.id}
                          type="button"
                          className={`room-chip ${
                            room.id === activeRoomId ? 'active' : ''
                          }`}
                          onClick={() => setActiveRoomId(room.id)}
                        >
                          {room.name || `Room ${index + 1}`}
                        </button>
                      ))}
                    </div>
                    <div className="inline-actions">
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={handleAddRoom}
                        disabled={!canEdit}
                      >
                        Add room
                      </button>
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => handleRemoveRoom(activeRoomId)}
                        disabled={!canEdit || rooms.length <= 1}
                      >
                        Remove room
                      </button>
                    </div>
                  </div>
                )}
                <div className="properties-section">
                  <label className="field">
                    Room Name
                    <input
                      type="text"
                      value={activeRoom?.name || ''}
                      onFocus={beginPanelEdit}
                      onChange={(event) => handleRoomChange('name', event.target.value)}
                      onBlur={() => endPanelEdit('Room name updated')}
                      disabled={!canEdit}
                    />
                  </label>
                  <div className="form-row">
                    <label className="field">
                      Width (m)
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={activeRoom?.width || 0}
                        onFocus={beginPanelEdit}
                        onChange={(event) =>
                          handleRoomChange('width', Number(event.target.value))
                        }
                        onBlur={() => endPanelEdit('Room width updated')}
                        disabled={!canEdit}
                      />
                    </label>
                    <label className="field">
                      Length (m)
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={activeRoom?.depth || 0}
                        onFocus={beginPanelEdit}
                        onChange={(event) =>
                          handleRoomChange('depth', Number(event.target.value))
                        }
                        onBlur={() => endPanelEdit('Room length updated')}
                        disabled={!canEdit}
                      />
                    </label>
                    <label className="field">
                      Height (m)
                      <input
                        type="number"
                        min="2"
                        step="0.1"
                        value={activeRoom?.height || 0}
                        onFocus={beginPanelEdit}
                        onChange={(event) =>
                          handleRoomChange('height', Number(event.target.value))
                        }
                        onBlur={() => endPanelEdit('Room height updated')}
                        disabled={!canEdit}
                      />
                    </label>
                  </div>
                  {isMultiRoom && (
                    <div className="form-row">
                      <label className="field">
                        Plan X (m)
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={activeRoom?.x ?? 0}
                          onFocus={beginPanelEdit}
                          onChange={(event) =>
                            handleRoomChange('x', Number(event.target.value))
                          }
                          onBlur={() => endPanelEdit('Room position updated')}
                          disabled={!canEdit}
                        />
                      </label>
                      <label className="field">
                        Plan Y (m)
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={activeRoom?.y ?? 0}
                          onFocus={beginPanelEdit}
                          onChange={(event) =>
                            handleRoomChange('y', Number(event.target.value))
                          }
                          onBlur={() => endPanelEdit('Room position updated')}
                          disabled={!canEdit}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="properties-section">
                  <div className="color-row">
                    <ColorSwatchField
                      label="Wall Color"
                      value={activeRoom?.wallColor || '#FFFFFF'}
                      presets={WALL_COLOR_PRESETS}
                      onChange={(nextColor) => handleRoomChange('wallColor', nextColor)}
                      onPresetSelect={(nextColor) =>
                        applyInstantPanelChange(
                          () => handleRoomChange('wallColor', nextColor),
                          'Wall color updated',
                        )
                      }
                      onCustomFocus={beginPanelEdit}
                      onCustomBlur={() => endPanelEdit('Wall color updated')}
                      disabled={!canEdit}
                    />
                    <ColorSwatchField
                      label="Floor Color"
                      value={activeRoom?.floorColor || '#FFFFFF'}
                      presets={FLOOR_COLOR_PRESETS}
                      onChange={(nextColor) => handleRoomChange('floorColor', nextColor)}
                      onPresetSelect={(nextColor) =>
                        applyInstantPanelChange(
                          () => handleRoomChange('floorColor', nextColor),
                          'Floor color updated',
                        )
                      }
                      onCustomFocus={beginPanelEdit}
                      onCustomBlur={() => endPanelEdit('Floor color updated')}
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <details className="properties-section" open={!readOnly}>
                  <summary>Design Styling</summary>
                  <ColorSwatchField
                    label="Accent Colour"
                    value={design.accentColor}
                    presets={ACCENT_COLOR_PRESETS}
                    onChange={(nextColor) => updateDesign({ ...design, accentColor: nextColor })}
                    onPresetSelect={(nextColor) =>
                      applyInstantPanelChange(
                        () => updateDesign({ ...design, accentColor: nextColor }),
                        'Accent colour updated',
                      )
                    }
                    onCustomFocus={beginPanelEdit}
                    onCustomBlur={() => endPanelEdit('Accent colour updated')}
                    disabled={!canEdit}
                  />
                  <button className="btn btn-ghost" onClick={applyAccentToAll} disabled={!canEdit}>
                    Apply to all items
                  </button>
                  <label className="field">
                    Global Shade
                    <input
                      type="range"
                      min="0"
                      max="0.6"
                      step="0.02"
                      value={design.globalShade}
                      onFocus={beginPanelEdit}
                      onChange={(event) =>
                        updateDesign({
                          ...design,
                          globalShade: Number(event.target.value),
                        })
                      }
                      onBlur={() => endPanelEdit('Global shade updated')}
                      disabled={!canEdit}
                    />
                  </label>
                  <button className="btn btn-ghost" onClick={applyShadeToAll} disabled={!canEdit}>
                    Apply shade to all
                  </button>
                </details>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}

