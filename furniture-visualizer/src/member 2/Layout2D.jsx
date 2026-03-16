import { useEffect, useRef, useState } from 'react'
import { clamp } from './clamp'
import { shadeColor } from '../member 3/color'
import { isOpeningItem, snapOpeningToRoomWall } from '../utils/openingPlacement'
import { getCollisionMap, hasItemCollision } from '../utils/collision'

export default function Layout2D({
  room,
  items,
  selectedId,
  globalShade,
  activeTool,
  snapToGrid = false,
  snapStep = 0.1,
  readOnly,
  onSelect,
  onStartAction,
  onPreviewChange,
  onCommitChange,
  onDropCatalogItem,
  onInvalidPlacement,
}) {
  const stageRef = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const dragRef = useRef(null)
  const latestItemsRef = useRef(items)

  useEffect(() => {
    latestItemsRef.current = items
  }, [items])

  useEffect(() => {
    const updateSize = () => {
      if (!stageRef.current) return
      setSize({
        width: stageRef.current.clientWidth,
        height: stageRef.current.clientHeight,
      })
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const safeWidth = room.width || 1
  const safeDepth = room.depth || 1
  const scale = Math.min(size.width / safeWidth, size.height / safeDepth) || 1
  const roomWidthPx = room.width * scale
  const roomDepthPx = room.depth * scale
  const offsetX = (size.width - roomWidthPx) / 2
  const offsetY = (size.height - roomDepthPx) / 2
  const labelTop = Math.max(6, offsetY - 22)
  const labelSide = Math.max(6, offsetX - 22)
  const collisionMap = getCollisionMap(items, { defaultRoomId: room?.id || null, room })

  const getPointer = (event) => {
    const rect = stageRef.current.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const getDraggedCatalogItemId = (event) =>
    event.dataTransfer?.getData('application/x-roomcraft-catalog-item') ||
    event.dataTransfer?.getData('text/plain') ||
    ''

  const resolveMode = (mode) => {
    if (mode !== 'move') return mode
    if (activeTool === 'rotate') return 'rotate'
    return 'move'
  }

  const startDrag = (event, item, mode) => {
    event.stopPropagation()
    if (readOnly) {
      onSelect?.(item.id)
      return
    }
    if (event.button !== 0) return
    const pointer = getPointer(event)
    const resolvedMode = resolveMode(mode)
    dragRef.current = {
      id: item.id,
      mode: isOpeningItem(item) && resolvedMode === 'rotate' ? 'move' : resolvedMode,
      startPointer: pointer,
      startItem: item,
      snapshot: latestItemsRef.current,
      moved: false,
    }
    onSelect?.(item.id)
    onStartAction?.()
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  useEffect(() => {
    const handleMove = (event) => {
      if (!dragRef.current) return
      if (!scale) return
      const drag = dragRef.current
      const pointer = getPointer(event)
      const dx = (pointer.x - drag.startPointer.x) / scale
      const dy = (pointer.y - drag.startPointer.y) / scale

      const nextItems = drag.snapshot.map((item) => {
        if (item.id !== drag.id) return item
        if (drag.mode === 'move') {
          if (isOpeningItem(drag.startItem)) {
            const centerX = drag.startItem.x + drag.startItem.width / 2 + dx
            const centerY = drag.startItem.y + drag.startItem.depth / 2 + dy
            const placement = snapOpeningToRoomWall(drag.startItem, room, centerX, centerY)
            return {
              ...item,
              x: placement.x,
              y: placement.y,
              width: placement.width,
              depth: placement.depth,
              openingWall: placement.wall,
              rotation: 0,
            }
          }
          const nextX = clamp(
            drag.startItem.x + dx,
            0,
            room.width - drag.startItem.width,
          )
          const nextY = clamp(
            drag.startItem.y + dy,
            0,
            room.depth - drag.startItem.depth,
          )
          const x = clamp(
            snapToGrid ? Math.round(nextX / snapStep) * snapStep : nextX,
            0,
            room.width - drag.startItem.width,
          )
          const y = clamp(
            snapToGrid ? Math.round(nextY / snapStep) * snapStep : nextY,
            0,
            room.depth - drag.startItem.depth,
          )
          return { ...item, x, y }
        }
        if (drag.mode === 'resize') {
          const minSize = isOpeningItem(drag.startItem) ? 0.2 : 0.3
          const nextWidth = clamp(
            drag.startItem.width + dx,
            minSize,
            room.width - drag.startItem.x,
          )
          const nextDepth = clamp(
            drag.startItem.depth + dy,
            minSize,
            room.depth - drag.startItem.y,
          )
          if (isOpeningItem(drag.startItem)) {
            const candidate = { ...drag.startItem, width: nextWidth, depth: nextDepth }
            const centerX = drag.startItem.x + drag.startItem.width / 2
            const centerY = drag.startItem.y + drag.startItem.depth / 2
            const placement = snapOpeningToRoomWall(candidate, room, centerX, centerY)
            return {
              ...item,
              x: placement.x,
              y: placement.y,
              width: placement.width,
              depth: placement.depth,
              openingWall: placement.wall,
              rotation: 0,
            }
          }
          const width = clamp(
            snapToGrid ? Math.round(nextWidth / snapStep) * snapStep : nextWidth,
            minSize,
            room.width - drag.startItem.x,
          )
          const depth = clamp(
            snapToGrid ? Math.round(nextDepth / snapStep) * snapStep : nextDepth,
            minSize,
            room.depth - drag.startItem.y,
          )
          return { ...item, width, depth }
        }
        if (drag.mode === 'rotate') {
          const centerX =
            offsetX + (drag.startItem.x + drag.startItem.width / 2) * scale
          const centerY =
            offsetY + (drag.startItem.y + drag.startItem.depth / 2) * scale
          const angle = Math.atan2(pointer.y - centerY, pointer.x - centerX)
          const deg = ((angle * 180) / Math.PI + 90 + 360) % 360
          return { ...item, rotation: deg }
        }
        return item
      })

      dragRef.current.moved = true
      dragRef.current.hasConflict = hasItemCollision(drag.id, nextItems, {
        defaultRoomId: room?.id || null,
        room,
      })
      dragRef.current.lastItems = nextItems
      onPreviewChange?.(nextItems)
    }

    const handleUp = () => {
      if (!dragRef.current) return
      const drag = dragRef.current
      if (drag.moved) {
        if (drag.hasConflict) {
          onInvalidPlacement?.(
            'Placement conflict detected. Move the item to a free space.',
            drag.snapshot || latestItemsRef.current,
          )
        } else {
          onCommitChange?.(drag.lastItems || latestItemsRef.current)
        }
      }
      dragRef.current = null
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [
    room,
    scale,
    offsetX,
    offsetY,
    onPreviewChange,
    onCommitChange,
    onInvalidPlacement,
    snapToGrid,
    snapStep,
  ])

  return (
    <div
      className="layout-stage"
      ref={stageRef}
      onPointerDown={() => onSelect?.(null)}
      onDragOver={(event) => {
        if (readOnly || !onDropCatalogItem) return
        if (!getDraggedCatalogItemId(event)) return
        event.preventDefault()
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'copy'
        }
      }}
      onDrop={(event) => {
        if (readOnly || !onDropCatalogItem || !scale) return
        const catalogItemId = getDraggedCatalogItemId(event)
        if (!catalogItemId) return
        event.preventDefault()
        event.stopPropagation()
        const pointer = getPointer(event)
        const centerX = clamp((pointer.x - offsetX) / scale, 0, room.width)
        const centerY = clamp((pointer.y - offsetY) / scale, 0, room.depth)
        onDropCatalogItem(catalogItemId, { roomId: room.id, centerX, centerY })
      }}
    >
      <div
        className="layout-room"
        style={{
          width: roomWidthPx,
          height: roomDepthPx,
          left: offsetX,
          top: offsetY,
          backgroundColor: room.floorColor,
        }}
      >
        {items.map((item) => {
          const isSelected = item.id === selectedId
          const openingType = item.elementType
          const widthPx = item.width * scale
          const heightPx = item.depth * scale
          const left = item.x * scale
          const top = item.y * scale
          const shade = shadeColor(item.color, item.shade + globalShade * 0.6)
          return (
            <div
              key={item.id}
              className={`layout-item ${
                openingType ? `layout-item-${openingType}` : ''
              } ${isSelected ? 'is-selected' : ''} ${
                collisionMap.has(item.id) ? 'is-conflict' : ''
              }`}
              style={{
                width: widthPx,
                height: heightPx,
                left,
                top,
                transform: `rotate(${item.rotation}deg)`,
                ...(openingType ? {} : { background: shade }),
              }}
              onPointerDown={(event) => startDrag(event, item, 'move')}
            >
              {openingType === 'door' && <span className="layout-door-swing" />}
              {openingType === 'window' && <span className="layout-window-bars" />}
              {!openingType && <span className="layout-label">{item.label}</span>}
              {isSelected && !readOnly && (
                <>
                  {!openingType && (
                    <button
                      className="layout-handle rotate"
                      type="button"
                      title="Rotate"
                      onPointerDown={(event) => startDrag(event, item, 'rotate')}
                    />
                  )}
                  <button
                    className="layout-handle resize"
                    type="button"
                    title="Resize"
                    onPointerDown={(event) => startDrag(event, item, 'resize')}
                  />
                </>
              )}
            </div>
          )
        })}
        <div
          className="layout-shade"
          style={{ opacity: clamp(globalShade * 0.4, 0, 0.4) }}
        />
      </div>
      <div className="room-dimension top" style={{ left: offsetX + roomWidthPx / 2, top: labelTop }}>
        {room.width}m
      </div>
      <div className="room-dimension side" style={{ left: labelSide, top: offsetY + roomDepthPx / 2 }}>
        {room.depth}m
      </div>
    </div>
  )
}
