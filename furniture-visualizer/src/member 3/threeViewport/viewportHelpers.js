import * as THREE from 'three'
import { clamp } from '../../member 2/clamp'
import { shadeColor } from '../color'
import { isOpeningItem } from '../../utils/openingPlacement'

export const DEFAULT_WALL_OPACITY = 0.85
export const OPEN_WALL_OPACITY = 0.12
export const WINDOW_OUTSIDE_VIEW = '/assets/WindowOutside.jpg'

export const computeTightBounds = (root) => {
  root.updateMatrixWorld(true)
  const box = new THREE.Box3()
  let hasMesh = false

  root.traverse((child) => {
    if (!child.isMesh || !child.geometry) return
    if (!child.geometry.boundingBox) {
      child.geometry.computeBoundingBox()
    }
    const childBox = child.geometry.boundingBox.clone()
    childBox.applyMatrix4(child.matrixWorld)
    box.union(childBox)
    hasMesh = true
  })

  if (!hasMesh) {
    return new THREE.Box3().setFromObject(root)
  }
  return box
}

export const createWallMaterial = (color, isInside = false) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    side: isInside ? THREE.BackSide : THREE.DoubleSide,
    transparent: !isInside,
    opacity: isInside ? 1 : DEFAULT_WALL_OPACITY,
    depthWrite: isInside,
  })

export const alignObjectToFloor = (object) => {
  const bounds = new THREE.Box3().setFromObject(object)
  if (!Number.isFinite(bounds.min.y)) return
  object.position.y += -bounds.min.y
}

export const getObjectMetrics = (object) => {
  const bounds = new THREE.Box3().setFromObject(object)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  bounds.getSize(size)
  bounds.getCenter(center)
  return { bounds, size, center }
}

export const resolveModelSource = (modelInfo, catalogItem) => {
  if (!modelInfo) return null
  const nodeName = catalogItem?.modelNode
  if (nodeName) {
    const found = modelInfo.nodes?.get(nodeName) || modelInfo.scene.getObjectByName(nodeName)
    if (found) return found
  }
  return modelInfo.scene
}

const OPENING_WALLS = new Set(['top', 'bottom', 'left', 'right'])
const OPENING_SURFACE_INSET = 0.01

const resolveOpeningWall = (item, room) => {
  if (OPENING_WALLS.has(item?.openingWall)) return item.openingWall

  const roomWidth = Math.max(1, Number(room?.width) || 1)
  const roomDepth = Math.max(1, Number(room?.depth) || 1)
  const width = Math.max(0.12, Number(item?.width) || 0.2)
  const depth = Math.max(0.12, Number(item?.depth) || 0.2)
  const x = Number.isFinite(item?.x) ? item.x : 0
  const y = Number.isFinite(item?.y) ? item.y : 0

  const distances = [
    { wall: 'top', value: Math.abs(y) },
    { wall: 'bottom', value: Math.abs(roomDepth - (y + depth)) },
    { wall: 'left', value: Math.abs(x) },
    { wall: 'right', value: Math.abs(roomWidth - (x + width)) },
  ]

  return distances.reduce((closest, candidate) =>
    candidate.value < closest.value ? candidate : closest,
  ).wall
}

export const createOpeningObject = ({
  item,
  room,
  globalShade,
  outsideTexture,
  isConflict = false,
}) => {
  if (!isOpeningItem(item)) return null

  const width = Math.max(0.12, item.width || 0.2)
  const depth = Math.max(0.12, item.depth || 0.2)
  const openingWall = resolveOpeningWall(item, room)
  const isHorizontalWall = openingWall === 'top' || openingWall === 'bottom'
  const openingSpan = isHorizontalWall ? width : depth
  const wallThickness = isHorizontalWall ? depth : width
  const fallbackColor = isConflict ? '#ef4444' : item.color || '#d7c7b2'
  const baseColor = shadeColor(fallbackColor, (item.shade || 0) + globalShade * 0.35)
  const frameColor = new THREE.Color(baseColor)
  const accentColor = new THREE.Color(shadeColor(fallbackColor, (item.shade || 0) + globalShade * 0.52))
  const revealColor = new THREE.Color(shadeColor(room?.wallColor || '#d7c7b2', 0.28))
  const group = new THREE.Group()
  const wallMount = new THREE.Group()

  if (openingWall === 'top') {
    wallMount.position.z = -depth / 2 + OPENING_SURFACE_INSET
  } else if (openingWall === 'bottom') {
    wallMount.position.z = depth / 2 - OPENING_SURFACE_INSET
    wallMount.rotation.y = Math.PI
  } else if (openingWall === 'left') {
    wallMount.position.x = -width / 2 + OPENING_SURFACE_INSET
    wallMount.rotation.y = Math.PI / 2
  } else {
    wallMount.position.x = width / 2 - OPENING_SURFACE_INSET
    wallMount.rotation.y = -Math.PI / 2
  }

  group.add(wallMount)

  if (item.elementType === 'door') {
    const doorHeight = clamp(item.height || 2.1, 1.8, Math.max(2.1, room.height - 0.08))
    const frameThickness = Math.min(0.08, Math.max(0.045, openingSpan * 0.06))
    const frameDepth = Math.max(0.03, wallThickness * 0.32)
    const revealPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(openingSpan, doorHeight),
      new THREE.MeshStandardMaterial({
        color: revealColor,
        roughness: 0.9,
        side: THREE.DoubleSide,
      }),
    )
    revealPanel.position.set(0, doorHeight / 2, 0.004)
    wallMount.add(revealPanel)

    const leftFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, doorHeight, frameDepth),
      new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.56,
        metalness: 0.08,
      }),
    )
    leftFrame.position.set(-openingSpan / 2 + frameThickness / 2, doorHeight / 2, 0.016)
    wallMount.add(leftFrame)

    const rightFrame = leftFrame.clone()
    rightFrame.position.x *= -1
    wallMount.add(rightFrame)

    const topFrame = new THREE.Mesh(
      new THREE.BoxGeometry(openingSpan, frameThickness, frameDepth),
      new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.56,
        metalness: 0.08,
      }),
    )
    topFrame.position.set(0, doorHeight - frameThickness / 2, 0.016)
    wallMount.add(topFrame)

    const panelWidth = Math.max(0.18, openingSpan - frameThickness * 2.2)
    const panelHeight = Math.max(0.5, doorHeight - frameThickness * 0.9)
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(panelWidth, panelHeight, frameDepth * 0.7),
      new THREE.MeshStandardMaterial({
        color: frameColor,
        roughness: 0.45,
        metalness: 0.08,
      }),
    )
    panel.castShadow = true
    panel.receiveShadow = true
    panel.position.set(0, panelHeight / 2, 0.028)
    wallMount.add(panel)

    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xb79567,
        roughness: 0.25,
        metalness: 0.45,
      }),
    )
    knob.position.set(panelWidth / 2 - 0.08, doorHeight * 0.45, 0.06)
    wallMount.add(knob)
    return group
  }

  const windowHeight = clamp(item.height || 1.2, 0.65, Math.max(0.85, room.height - 0.5))
  const frameThickness = Math.min(0.08, Math.max(0.04, openingSpan * 0.05))
  const frameDepth = Math.max(0.028, wallThickness * 0.3)
  const sillHeight = clamp(room.height * 0.34, 0.72, 1.2)
  const centerY = clamp(
    sillHeight + windowHeight / 2,
    windowHeight / 2 + 0.2,
    room.height - windowHeight / 2 - 0.15,
  )
  const revealPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(openingSpan, windowHeight),
    new THREE.MeshStandardMaterial({
      color: revealColor,
      roughness: 0.92,
      side: THREE.DoubleSide,
    }),
  )
  revealPanel.position.set(0, centerY, 0.004)
  wallMount.add(revealPanel)

  const leftFrame = new THREE.Mesh(
    new THREE.BoxGeometry(frameThickness, windowHeight, frameDepth),
    new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.55,
      metalness: 0.08,
    }),
  )
  leftFrame.position.set(-openingSpan / 2 + frameThickness / 2, centerY, 0.016)
  wallMount.add(leftFrame)

  const rightFrame = leftFrame.clone()
  rightFrame.position.x *= -1
  wallMount.add(rightFrame)

  const topFrame = new THREE.Mesh(
    new THREE.BoxGeometry(openingSpan, frameThickness, frameDepth),
    new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.55,
      metalness: 0.08,
    }),
  )
  topFrame.position.set(0, centerY + windowHeight / 2 - frameThickness / 2, 0.016)
  wallMount.add(topFrame)

  const bottomFrame = topFrame.clone()
  bottomFrame.position.y = centerY - windowHeight / 2 + frameThickness / 2
  wallMount.add(bottomFrame)

  const paneWidth = Math.max(0.12, openingSpan - frameThickness * 2.2)
  const paneHeight = Math.max(0.2, windowHeight - frameThickness * 2.2)
  const paneMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: outsideTexture || null,
    transparent: true,
    opacity: outsideTexture ? 0.96 : 0.72,
    roughness: 0.08,
    metalness: 0,
    side: THREE.DoubleSide,
  })
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(paneWidth, paneHeight), paneMaterial)
  pane.position.y = centerY
  pane.position.z = 0.01
  wallMount.add(pane)

  const mullion = new THREE.Mesh(
    new THREE.BoxGeometry(frameThickness * 0.7, paneHeight, frameDepth * 0.92),
    new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.5,
      metalness: 0.08,
    }),
  )
  mullion.position.set(0, centerY, 0.016)
  wallMount.add(mullion)
  return group
}
