import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { clamp } from '../member 2/clamp'
import { cloneCanvas } from '../utils/canvasExport'
import { WINDOW_OUTSIDE_VIEW } from './threeViewport/viewportHelpers'
import { isOpeningItem } from '../utils/openingPlacement'
import { clampPointWithinRoom } from '../utils/roomShape'
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
  readOnly,
  controlMode = 'orbit',
  catalogPointerDragItemId,
  onSelect,
  onStartAction,
  onPreviewChange,
  onCommitChange,
  onInvalidPlacement,
  onDropCatalogItem,
  onRenderReady,
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
  const [isCatalogDropActive, setIsCatalogDropActive] = useState(false)

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
    if (isOpeningItem(item)) return false
    const catalogItem = catalog.find((entry) => entry.id === item.type)
    if (!catalogItem?.model) return false
    const info = modelCacheRef.current[catalogItem.model]
    return !info || info.status === 'loading'
  })

  const missingModels = items
    .map((item) => {
      if (isOpeningItem(item)) return null
      const catalogItem = catalog.find((entry) => entry.id === item.type)
      if (!catalogItem?.model) return item.label
      const info = modelCacheRef.current[catalogItem.model]
      if (!info) return null
      return info.status === 'error' ? item.label : null
    })
    .filter(Boolean)

  useEffect(() => {
    if (!onRenderReady || isLoading || !rendererRef.current) return undefined
    let cancelled = false

    const emitSnapshot = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (cancelled || !rendererRef.current) return
          onRenderReady(cloneCanvas(rendererRef.current.domElement))
        })
      })
    }

    emitSnapshot()
    return () => {
      cancelled = true
    }
  }, [onRenderReady, isLoading, modelVersion, items, room, globalShade, selectedId, controlMode])

  useEffect(() => {
    if (
      readOnly ||
      controlMode === 'inside' ||
      !onDropCatalogItem ||
      !catalogPointerDragItemId
    ) {
      setIsCatalogDropActive(false)
      return
    }

    const resolveCatalogDropPlacement = (clientX, clientY) => {
      const renderer = rendererRef.current
      const camera = cameraRef.current
      if (!renderer || !camera || !room) return null

      const rect = renderer.domElement.getBoundingClientRect()
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return null
      }

      pointerRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1
      pointerRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1
      raycasterRef.current.setFromCamera(pointerRef.current, camera)

      const hitPoint = new THREE.Vector3()
      const result = raycasterRef.current.ray.intersectPlane(planeRef.current, hitPoint)
      if (!result) return null

      const roomPoint = clampPointWithinRoom(
        room,
        hitPoint.x + room.width / 2,
        hitPoint.z + room.depth / 2,
        0.05,
      )

      return {
        roomId: room.id,
        centerX: roomPoint.x,
        centerY: roomPoint.y,
      }
    }

    const handlePointerMove = (event) => {
      setIsCatalogDropActive(
        Boolean(resolveCatalogDropPlacement(event.clientX, event.clientY)),
      )
    }

    const handlePointerUp = (event) => {
      const placement = resolveCatalogDropPlacement(event.clientX, event.clientY)
      setIsCatalogDropActive(false)
      if (!placement) return
      onDropCatalogItem(catalogPointerDragItemId, placement)
    }

    const handlePointerCancel = () => {
      setIsCatalogDropActive(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerCancel)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerCancel)
    }
  }, [catalogPointerDragItemId, controlMode, onDropCatalogItem, readOnly, room])

  return (
    <div
      className={`three-stage${isCatalogDropActive ? ' is-catalog-drop-active' : ''}`}
      ref={containerRef}
    >
      {isLoading && <div className="three-loading">Loading 3D models...</div>}
      {missingModels.length > 0 && (
        <div className="three-warning">
          Missing 3D models: {missingModels.join(', ')}
        </div>
      )}
    </div>
  )
}
