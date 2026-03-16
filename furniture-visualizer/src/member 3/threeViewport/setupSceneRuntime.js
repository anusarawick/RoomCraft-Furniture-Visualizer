import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { clamp } from '../../member 2/clamp'
import { isOpeningItem, snapOpeningToRoomWall } from '../../utils/openingPlacement'
import { hasItemCollision } from '../../utils/collision'
import { clampItemWithinRoom, normalizeRotation } from '../../utils/rotationBounds'
import { DEFAULT_WALL_OPACITY, OPEN_WALL_OPACITY } from './viewportHelpers'
import { clampPointWithinRoom } from '../../utils/roomShape'

export const setupSceneRuntime = ({ container, controlMode, refs }) => {
  const roomData = refs.latestRoomRef.current

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#f7f1e8')

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  )
  const isInside = controlMode === 'inside'
  if (isInside) {
    camera.position.set(0, 0, 0)
  } else {
    camera.position.set(roomData.width * 0.6, roomData.height * 1.1, roomData.depth * 1.2)
  }

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  })
  renderer.setPixelRatio(window.devicePixelRatio || 1)
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  const controls = isInside
    ? new PointerLockControls(camera, renderer.domElement)
    : new OrbitControls(camera, renderer.domElement)
  if (isInside) {
    const eyeHeight = Math.min(1.6, roomData.height * 0.85)
    controls.getObject().position.set(0, eyeHeight, 0)
    scene.add(controls.getObject())
  } else {
    controls.enableDamping = true
    controls.target.set(0, roomData.height * 0.4, 0)
  }

  const ambient = new THREE.AmbientLight(0xffffff, 0.85)
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.85)
  keyLight.position.set(6, 10, 6)
  keyLight.castShadow = true
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.45)
  fillLight.position.set(-4, 6, 2)

  scene.add(ambient, keyLight, fillLight)

  refs.sceneRef.current = scene
  refs.cameraRef.current = camera
  refs.rendererRef.current = renderer
  refs.controlsRef.current = controls
  refs.lightsRef.current = { ambient, keyLight, fillLight }
  const wallRaycaster = new THREE.Raycaster()

  const handleResize = () => {
    const width = container.clientWidth
    const height = container.clientHeight
    renderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  const updateWallTransparency = () => {
    const walls = refs.wallsRef.current
    if (!walls) return
    if (refs.controlModeRef.current === 'inside') return
    const target = controls.target?.clone?.() || new THREE.Vector3(0, 0, 0)
    const direction = target.clone().sub(camera.position)
    const maxDistance = direction.length()
    if (maxDistance <= 0.001) return

    wallRaycaster.set(camera.position, direction.normalize())
    const wallMeshes = Object.values(walls).filter(Boolean)
    const openWalls = new Set(
      wallRaycaster
        .intersectObjects(wallMeshes, false)
        .filter((hit) => hit.distance < maxDistance - 0.05)
        .map((hit) => hit.object?.userData?.wallKey)
        .filter(Boolean),
    )

    const openWallSignature = [...openWalls].sort().join('|')
    if (refs.activeWallRef.current === openWallSignature) return
    refs.activeWallRef.current = openWallSignature
    Object.entries(walls).forEach(([key, wall]) => {
      if (!wall?.material) return
      wall.material.opacity = openWalls.has(key) ? OPEN_WALL_OPACITY : DEFAULT_WALL_OPACITY
    })
  }

  const clock = new THREE.Clock()
  const moveState = { forward: false, backward: false, left: false, right: false }
  const velocity = new THREE.Vector3()
  const direction = new THREE.Vector3()

  const updateInsideMovement = (delta) => {
    if (!controls.isLocked) return
    velocity.x -= velocity.x * 10.0 * delta
    velocity.z -= velocity.z * 10.0 * delta
    direction.z = Number(moveState.forward) - Number(moveState.backward)
    direction.x = Number(moveState.right) - Number(moveState.left)
    direction.normalize()
    const speed = 3.0
    if (moveState.forward || moveState.backward) {
      velocity.z -= direction.z * speed * delta
    }
    if (moveState.left || moveState.right) {
      velocity.x -= direction.x * speed * delta
    }
    controls.moveRight(-velocity.x * delta)
    controls.moveForward(-velocity.z * delta)

    const roomData = refs.latestRoomRef.current
    const padding = 0.3
    const position = controls.getObject().position
    const roomPoint = clampPointWithinRoom(
      roomData,
      position.x + roomData.width / 2,
      position.z + roomData.depth / 2,
      padding,
    )
    position.x = roomPoint.x - roomData.width / 2
    position.z = roomPoint.y - roomData.depth / 2
    position.y = clamp(position.y, 1.3, Math.max(1.4, roomData.height - 0.3))
  }

  const animate = () => {
    if (isInside) {
      updateInsideMovement(clock.getDelta())
    } else {
      controls.update()
    }
    updateWallTransparency()
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
  }
  animate()

  window.addEventListener('resize', handleResize)

  const updatePointer = (event) => {
    const rect = renderer.domElement.getBoundingClientRect()
    refs.pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    refs.pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  const getHitItemId = (event) => {
    if (!refs.furnitureGroupRef.current) return null
    updatePointer(event)
    refs.raycasterRef.current.setFromCamera(refs.pointerRef.current, camera)
    const intersects = refs.raycasterRef.current.intersectObjects(
      refs.furnitureGroupRef.current.children,
      true,
    )
    if (!intersects.length) return null
    let node = intersects[0].object
    while (node && !node.userData.itemId) {
      node = node.parent
    }
    return node?.userData.itemId || null
  }

  const getPlaneIntersection = (event) => {
    updatePointer(event)
    refs.raycasterRef.current.setFromCamera(refs.pointerRef.current, camera)
    const hitPoint = new THREE.Vector3()
    const result = refs.raycasterRef.current.ray.intersectPlane(refs.planeRef.current, hitPoint)
    return result ? hitPoint : null
  }

  const handleKeyDown = (event) => {
    if (!isInside) return
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        event.preventDefault()
        moveState.forward = true
        break
      case 'ArrowLeft':
      case 'KeyA':
        event.preventDefault()
        moveState.left = true
        break
      case 'ArrowDown':
      case 'KeyS':
        event.preventDefault()
        moveState.backward = true
        break
      case 'ArrowRight':
      case 'KeyD':
        event.preventDefault()
        moveState.right = true
        break
      default:
        break
    }
  }

  const handleKeyUp = (event) => {
    if (!isInside) return
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        event.preventDefault()
        moveState.forward = false
        break
      case 'ArrowLeft':
      case 'KeyA':
        event.preventDefault()
        moveState.left = false
        break
      case 'ArrowDown':
      case 'KeyS':
        event.preventDefault()
        moveState.backward = false
        break
      case 'ArrowRight':
      case 'KeyD':
        event.preventDefault()
        moveState.right = false
        break
      default:
        break
    }
  }

  const handlePointerLock = () => {
    if (!isInside) return
    if (!controls.isLocked) {
      controls.lock()
    }
  }

  const handlePointerDown = (event) => {
    if (event.button !== 0) return
    const itemId = getHitItemId(event)

    if (refs.readOnlyRef.current) {
      refs.callbacksRef.current.onSelect?.(itemId)
      return
    }

    if (!itemId) {
      refs.callbacksRef.current.onSelect?.(null)
      return
    }

    const target = refs.latestItemsRef.current.find((item) => item.id === itemId)
    if (!target) return

    event.stopPropagation()
    event.preventDefault()

    const tool = refs.activeToolRef.current
    const dragMode = tool === 'rotate' || event.shiftKey ? 'rotate' : 'move'
    const dragState = {
      id: itemId,
      mode: dragMode,
      moved: false,
      startPointer: { x: event.clientX, y: event.clientY },
      startRotation: target.rotation,
      snapshot: refs.latestItemsRef.current,
      hasConflict: false,
      offset: { x: 0, z: 0 },
    }

    if (dragMode === 'move') {
      const hit = getPlaneIntersection(event)
      if (!hit) return
      const roomData = refs.latestRoomRef.current
      const centerX = -roomData.width / 2 + target.x + target.width / 2
      const centerZ = -roomData.depth / 2 + target.y + target.depth / 2
      dragState.offset = { x: hit.x - centerX, z: hit.z - centerZ }
    }

    refs.dragRef.current = dragState
    refs.callbacksRef.current.onSelect?.(itemId)
    refs.callbacksRef.current.onStartAction?.()
    controls.enabled = false
    renderer.domElement.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!refs.dragRef.current) return
    const drag = refs.dragRef.current
    const roomData = refs.latestRoomRef.current
    const currentItems = refs.latestItemsRef.current
    const target = currentItems.find((item) => item.id === drag.id)
    if (!target) return

    let nextItems
    if (drag.mode === 'rotate') {
      const hit = getPlaneIntersection(event)
      let rotation = drag.startRotation
      if (hit) {
        const centerX = -roomData.width / 2 + target.x + target.width / 2
        const centerZ = -roomData.depth / 2 + target.y + target.depth / 2
        const angle = Math.atan2(hit.z - centerZ, hit.x - centerX)
        rotation = ((angle * 180) / Math.PI + 90 + 360) % 360
      } else {
        const deltaX = event.clientX - drag.startPointer.x
        rotation = drag.startRotation + deltaX * 0.5
      }
      nextItems = currentItems.map((item) =>
        item.id === drag.id
          ? clampItemWithinRoom({ ...item, rotation: normalizeRotation(rotation) }, roomData)
          : item,
      )
    } else {
      const hit = getPlaneIntersection(event)
      if (!hit) return
      const centerX = hit.x - drag.offset.x
      const centerZ = hit.z - drag.offset.z
      if (isOpeningItem(target)) {
        const centerRoomX = centerX + roomData.width / 2
        const centerRoomY = centerZ + roomData.depth / 2
        const placement = snapOpeningToRoomWall(target, roomData, centerRoomX, centerRoomY)
        nextItems = currentItems.map((item) =>
          item.id === drag.id
            ? {
                ...item,
                x: placement.x,
                y: placement.y,
                width: placement.width,
                depth: placement.depth,
                openingWall: placement.wall,
                rotation: 0,
              }
            : item,
        )
      } else {
        const x = clamp(
          centerX + roomData.width / 2 - target.width / 2,
          0,
          Math.max(0, roomData.width - target.width),
        )
        const y = clamp(
          centerZ + roomData.depth / 2 - target.depth / 2,
          0,
          Math.max(0, roomData.depth - target.depth),
        )
        nextItems = currentItems.map((item) =>
          item.id === drag.id
            ? {
                ...item,
                ...clampItemWithinRoom({ ...item, x, y }, roomData),
              }
            : item,
        )
      }
      drag.hasConflict = hasItemCollision(drag.id, nextItems, {
        defaultRoomId: target.roomId || roomData?.id || null,
        room: roomData,
      })
    }

    drag.moved = true
    drag.lastItems = nextItems
    refs.callbacksRef.current.onPreviewChange?.(nextItems)
  }

  const handlePointerUp = (event) => {
    if (!refs.dragRef.current) return
    const drag = refs.dragRef.current
    if (drag.moved) {
      if (drag.hasConflict) {
        refs.callbacksRef.current.onInvalidPlacement?.(
          'Placement conflict detected. Move the item to a free space.',
          drag.snapshot || refs.latestItemsRef.current,
        )
      } else {
        const message = drag.mode === 'rotate' ? 'Rotation updated' : 'Position updated'
        refs.callbacksRef.current.onCommitChange?.(
          drag.lastItems || refs.latestItemsRef.current,
          message,
        )
      }
    }
    refs.dragRef.current = null
    controls.enabled = true
    try {
      renderer.domElement.releasePointerCapture(event.pointerId)
    } catch {
      // no-op
    }
  }

  if (isInside) {
    renderer.domElement.addEventListener('click', handlePointerLock)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  } else {
    renderer.domElement.addEventListener('pointerdown', handlePointerDown, { capture: true })
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  return () => {
    if (isInside) {
      renderer.domElement.removeEventListener('click', handlePointerLock)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      scene.remove(controls.getObject())
    } else {
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown, { capture: true })
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
    window.removeEventListener('resize', handleResize)
    controls.dispose?.()
    renderer.dispose()
    container.removeChild(renderer.domElement)
  }
}
