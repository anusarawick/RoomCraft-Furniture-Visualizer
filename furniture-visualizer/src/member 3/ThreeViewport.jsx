import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { clamp } from '../member 2/clamp'
import { WINDOW_OUTSIDE_VIEW } from './threeViewport/viewportHelpers'
import { setupSceneRuntime } from './threeViewport/setupSceneRuntime'
import {
  buildFurnitureGroup,
  buildRoomGroup,
  preloadModels,
} from './threeViewport/sceneBuilders'

export default function ThreeViewport({
  room,
  items,
  catalog,
  globalShade,
  selectedId,
  activeTool,
  snapToGrid = false,
  snapStep = 0.1,
  readOnly,
  controlMode = 'orbit',
  onSelect,
  onStartAction,
  onPreviewChange,
  onCommitChange,
  onInvalidPlacement,
}) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)
  const roomGroupRef = useRef(null)
  const furnitureGroupRef = useRef(null)
  const modelCacheRef = useRef({})
  const lightsRef = useRef(null)
  const wallsRef = useRef(null)
  const activeWallRef = useRef(null)
  const raycasterRef = useRef(new THREE.Raycaster())
  const pointerRef = useRef(new THREE.Vector2())
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const dragRef = useRef(null)
  const snapRef = useRef({ enabled: snapToGrid, step: snapStep })
  const latestItemsRef = useRef(items)
  const latestRoomRef = useRef(room)
  const activeToolRef = useRef(activeTool)
  const readOnlyRef = useRef(readOnly)
  const controlModeRef = useRef(controlMode)
  const outsideViewTextureRef = useRef(null)
  const callbacksRef = useRef({
    onSelect,
    onStartAction,
    onPreviewChange,
    onCommitChange,
    onInvalidPlacement,
  })
  const [modelVersion, setModelVersion] = useState(0)

  useEffect(() => {
    latestItemsRef.current = items
  }, [items])

  useEffect(() => {
    latestRoomRef.current = room
  }, [room, controlMode])

  useEffect(() => {
    activeToolRef.current = activeTool
  }, [activeTool])

  useEffect(() => {
    readOnlyRef.current = readOnly
  }, [readOnly])

  useEffect(() => {
    controlModeRef.current = controlMode
  }, [controlMode])

  useEffect(() => {
    snapRef.current = { enabled: snapToGrid, step: snapStep }
  }, [snapToGrid, snapStep])

  useEffect(() => {
    callbacksRef.current = {
      onSelect,
      onStartAction,
      onPreviewChange,
      onCommitChange,
      onInvalidPlacement,
    }
  }, [onSelect, onStartAction, onPreviewChange, onCommitChange, onInvalidPlacement])

  useEffect(() => {
    let cancelled = false
    const loader = new THREE.TextureLoader()
    loader.load(
      WINDOW_OUTSIDE_VIEW,
      (texture) => {
        if (cancelled) {
          texture.dispose()
          return
        }
        texture.colorSpace = THREE.SRGBColorSpace
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        outsideViewTextureRef.current = texture
        setModelVersion((prev) => prev + 1)
      },
      undefined,
      () => {
        outsideViewTextureRef.current = null
      },
    )
    return () => {
      cancelled = true
      if (outsideViewTextureRef.current) {
        outsideViewTextureRef.current.dispose()
        outsideViewTextureRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    return setupSceneRuntime({
      container,
      controlMode,
      refs: {
        sceneRef,
        cameraRef,
        rendererRef,
        controlsRef,
        roomGroupRef,
        furnitureGroupRef,
        lightsRef,
        wallsRef,
        activeWallRef,
        raycasterRef,
        pointerRef,
        planeRef,
        dragRef,
        snapRef,
        latestItemsRef,
        latestRoomRef,
        activeToolRef,
        readOnlyRef,
        controlModeRef,
        callbacksRef,
      },
    })
  }, [controlMode])

  useEffect(() => {
    buildRoomGroup({
      room,
      refs: {
        sceneRef,
        roomGroupRef,
        controlModeRef,
        wallsRef,
        activeWallRef,
        cameraRef,
        controlsRef,
      },
    })
  }, [room, controlMode])

  useEffect(() => {
    if (!lightsRef.current) return
    const intensity = clamp(0.85 - globalShade * 0.5, 0.35, 0.9)
    lightsRef.current.ambient.intensity = intensity
    lightsRef.current.keyLight.intensity = intensity
    lightsRef.current.fillLight.intensity = clamp(intensity - 0.2, 0.15, 0.7)
  }, [globalShade])

  useEffect(() => {
    preloadModels({
      catalog,
      modelCacheRef,
      onVersionChange: () => setModelVersion((prev) => prev + 1),
    })
  }, [catalog])

  useEffect(() => {
    buildFurnitureGroup({
      items,
      catalog,
      room,
      globalShade,
      selectedId,
      modelCacheRef,
      outsideTexture: outsideViewTextureRef.current,
      sceneRef,
      furnitureGroupRef,
    })
  }, [items, catalog, room, globalShade, selectedId, modelVersion])

  const isLoading = items.some((item) => {
    const catalogItem = catalog.find((entry) => entry.id === item.type)
    if (!catalogItem?.model) return false
    const info = modelCacheRef.current[catalogItem.model]
    return !info || info.status === 'loading'
  })

  const missingModels = items
    .map((item) => {
      const catalogItem = catalog.find((entry) => entry.id === item.type)
      if (!catalogItem?.model) return item.label
      const info = modelCacheRef.current[catalogItem.model]
      if (!info) return null
      return info.status === 'error' ? item.label : null
    })
    .filter(Boolean)

  const hintText =
    controlMode === 'inside'
      ? 'Click to enter inside view | WASD to move | Mouse to look | Esc to exit'
      : 'Drag empty space to orbit | Drag item to move | Shift + drag to rotate'

  return (
    <div className="three-stage" ref={containerRef}>
      {isLoading && <div className="three-loading">Loading 3D models...</div>}
      {missingModels.length > 0 && (
        <div className="three-warning">
          Missing 3D models: {missingModels.join(', ')}
        </div>
      )}
      <div className="three-hint">{hintText}</div>
    </div>
  )
}
