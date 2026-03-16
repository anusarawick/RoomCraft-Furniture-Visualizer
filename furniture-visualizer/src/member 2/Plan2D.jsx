import { useEffect, useMemo, useRef, useState } from 'react'
import { clamp } from './clamp'
import { shadeColor } from '../member 3/color'
import { isOpeningItem, snapOpeningToRoomWall } from '../utils/openingPlacement'
import { getCollisionMap, hasItemCollision } from '../utils/collision'

const PLAN_PADDING = 0.92

const getRoomBounds = (rooms) => {
  if (!rooms?.length) {
    return { minX: 0, minY: 0, maxX: 1, maxY: 1 }
  }
  return rooms.reduce(
    (acc, room) => {
      const x = Number.isFinite(room.x) ? room.x : 0
      const y = Number.isFinite(room.y) ? room.y : 0
      const width = Number.isFinite(room.width) ? room.width : 1
      const depth = Number.isFinite(room.depth) ? room.depth : 1
      acc.minX = Math.min(acc.minX, x)
      acc.minY = Math.min(acc.minY, y)
      acc.maxX = Math.max(acc.maxX, x + width)
      acc.maxY = Math.max(acc.maxY, y + depth)
      return acc
    },
    { minX: Number.POSITIVE_INFINITY, minY: Number.POSITIVE_INFINITY, maxX: 0, maxY: 0 },
  )
}

export default function Plan2D({
  rooms,
  items,
  activeRoomId,
  selectedId,
  globalShade,
  activeTool,
  snapToGrid = false,
  snapStep = 0.1,
  readOnly,
  onSelectRoom,
  onSelectItem,
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

  const bounds = useMemo(() => getRoomBounds(rooms), [rooms])
  const collisionMap = useMemo(() => getCollisionMap(items, { rooms }), [items, rooms])
  const totalWidth = Math.max(1, bounds.maxX - bounds.minX)
  const totalDepth = Math.max(1, bounds.maxY - bounds.minY)
  const scale =
    Math.min(size.width / totalWidth, size.height / totalDepth) * PLAN_PADDING || 1
  const offsetX = (size.width - totalWidth * scale) / 2 - bounds.minX * scale
  const offsetY = (size.height - totalDepth * scale) / 2 - bounds.minY * scale

  const getPointer = (event) => {
    const rect = stageRef.current.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const getDraggedCatalogItemId = (event) =>
    event.dataTransfer?.getData('application/x-roomcraft-catalog-item') ||
    event.dataTransfer?.getData('text/plain') ||
    ''

  const resolveRoomDropTarget = (pointer) => {
    for (const room of rooms) {
      const roomX = Number.isFinite(room.x) ? room.x : 0
      const roomY = Number.isFinite(room.y) ? room.y : 0
      const left = offsetX + roomX * scale
      const top = offsetY + roomY * scale
      const width = room.width * scale
      const depth = room.depth * scale
      if (
        pointer.x >= left &&
        pointer.x <= left + width &&
        pointer.y >= top &&
        pointer.y <= top + depth
      ) {
        const centerX = clamp((pointer.x - left) / scale, 0, room.width)
        const centerY = clamp((pointer.y - top) / scale, 0, room.depth)
        return { room, centerX, centerY }
      }
    }
    return null
  }

  const resolveMode = (mode) => {
    if (mode !== 'move') return mode
    if (activeTool === 'rotate') return 'rotate'
    return 'move'
  }

  const startDrag = (event, item, mode, room) => {
    event.stopPropagation()
    onSelectRoom?.(room.id)
    if (readOnly) {
      onSelectItem?.(item.id)
      return
    }
    if (event.button !== 0) return
    const pointer = getPointer(event)
    const resolvedMode = resolveMode(mode)
    dragRef.current = {
      id: item.id,
      room,
      mode: isOpeningItem(item) && resolvedMode === 'rotate' ? 'move' : resolvedMode,
      startPointer: pointer,
      startItem: item,
      snapshot: latestItemsRef.current,
      moved: false,
    }
    onSelectItem?.(item.id)
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
      const room = drag.room

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
            offsetX + (room.x + drag.startItem.x + drag.startItem.width / 2) * scale
          const centerY =
            offsetY + (room.y + drag.startItem.y + drag.startItem.depth / 2) * scale
          const angle = Math.atan2(pointer.y - centerY, pointer.x - centerX)
          const deg = ((angle * 180) / Math.PI + 90 + 360) % 360
          return { ...item, rotation: deg }
        }
        return item
      })

      dragRef.current.moved = true
      dragRef.current.hasConflict = hasItemCollision(drag.id, nextItems, {
        defaultRoomId: drag.room?.id || null,
        room: drag.room || null,
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
      className="plan-stage"
      ref={stageRef}
      onPointerDown={() => onSelectItem?.(null)}
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
        const dropTarget = resolveRoomDropTarget(pointer)
        const fallbackRoom =
          rooms.find((room) => room.id === activeRoomId) || rooms[0] || null
        const targetRoom = dropTarget?.room || fallbackRoom
        if (!targetRoom) return
        onSelectRoom?.(targetRoom.id)
        onDropCatalogItem(catalogItemId, {
          roomId: targetRoom.id,
          centerX: dropTarget?.centerX ?? targetRoom.width / 2,
          centerY: dropTarget?.centerY ?? targetRoom.depth / 2,
        })
      }}
    >
      {rooms.map((room) => {
        const x = Number.isFinite(room.x) ? room.x : 0
        const y = Number.isFinite(room.y) ? room.y : 0
        const left = offsetX + x * scale
        const top = offsetY + y * scale
        const widthPx = room.width * scale
        const heightPx = room.depth * scale
        const isActive = room.id === activeRoomId
        const roomItems = items.filter(
          (item) => item.roomId === room.id || (!item.roomId && rooms.length === 1),
        )

        return (
          <div key={room.id}>
            <div
              className={`plan-room ${isActive ? 'active' : ''}`}
              style={{
                width: widthPx,
                height: heightPx,
                left,
                top,
                backgroundColor: room.floorColor,
              }}
              onPointerDown={(event) => {
                event.stopPropagation()
                onSelectRoom?.(room.id)
                onSelectItem?.(null)
              }}
            >
              <div className="plan-room-label">
                {room.name || 'Room'} | {room.width}m x {room.depth}m
              </div>
            </div>

            {roomItems.map((item) => {
              const widthPx = item.width * scale
              const heightPx = item.depth * scale
              const itemLeft = offsetX + (x + item.x) * scale
              const itemTop = offsetY + (y + item.y) * scale
              const shade = shadeColor(item.color, item.shade + globalShade * 0.6)
              const isSelected = item.id === selectedId
              const openingType = item.elementType
              return (
                <div
                  key={item.id}
                  className={`layout-item plan-item ${
                    openingType ? `layout-item-${openingType}` : ''
                  } ${isSelected ? 'is-selected' : ''} ${
                    collisionMap.has(item.id) ? 'is-conflict' : ''
                  }`}
                  style={{
                    width: widthPx,
                    height: heightPx,
                    left: itemLeft,
                    top: itemTop,
                    transform: `rotate(${item.rotation}deg)`,
                    ...(openingType ? {} : { background: shade }),
                  }}
                  onPointerDown={(event) => startDrag(event, item, 'move', room)}
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
                          onPointerDown={(event) => startDrag(event, item, 'rotate', room)}
                        />
                      )}
                      <button
                        className="layout-handle resize"
                        type="button"
                        title="Resize"
                        onPointerDown={(event) => startDrag(event, item, 'resize', room)}
                      />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

