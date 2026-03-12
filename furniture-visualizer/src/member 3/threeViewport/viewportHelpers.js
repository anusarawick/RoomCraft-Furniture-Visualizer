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
  const insideSign = openingWall === 'top' || openingWall === 'left' ? 1 : -1
  const fallbackColor = isConflict ? '#ef4444' : item.color || '#d7c7b2'
  const baseColor = shadeColor(fallbackColor, (item.shade || 0) + globalShade * 0.35)
  const frameColor = new THREE.Color(baseColor)
  const accentColor = new THREE.Color(shadeColor(baseColor, 0.12))
  const group = new THREE.Group()

  if (item.elementType === 'door') {
    const doorHeight = clamp(item.height || 2.1, 1.8, Math.max(2.1, room.height - 0.08))
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(width, doorHeight, depth),
      new THREE.MeshStandardMaterial({
        color: frameColor,
        roughness: 0.45,
        metalness: 0.08,
      }),
    )
    panel.castShadow = true
    panel.receiveShadow = true
    panel.position.y = doorHeight / 2
    group.add(panel)

    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xb79567,
        roughness: 0.25,
        metalness: 0.45,
      }),
    )
    const knobOffset = 0.06
    const knobInset = 0.012
    knob.position.set(
      isHorizontalWall
        ? width / 2 - knobOffset
        : insideSign * Math.max(0.01, width / 2 - knobInset),
      doorHeight * 0.45,
      isHorizontalWall
        ? insideSign * Math.max(0.01, depth / 2 - knobInset)
        : depth / 2 - knobOffset,
    )
    group.add(knob)
    return group
  }

  const windowHeight = clamp(item.height || 1.2, 0.65, Math.max(0.85, room.height - 0.5))
  const frameDepth = Math.max(0.08, Math.min(width, depth) * 0.8)
  const sillHeight = clamp(room.height * 0.34, 0.72, 1.2)
  const centerY = clamp(
    sillHeight + windowHeight / 2,
    windowHeight / 2 + 0.2,
    room.height - windowHeight / 2 - 0.15,
  )

  const frameGeometry = isHorizontalWall
    ? new THREE.BoxGeometry(width, windowHeight, frameDepth)
    : new THREE.BoxGeometry(frameDepth, windowHeight, depth)
  const frame = new THREE.Mesh(
    frameGeometry,
    new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.55,
      metalness: 0.08,
    }),
  )
  frame.castShadow = true
  frame.receiveShadow = true
  frame.position.y = centerY
  group.add(frame)

  const paneWidth = Math.max(0.12, (isHorizontalWall ? width : depth) - 0.12)
  const paneHeight = Math.max(0.2, windowHeight - 0.12)
  const paneMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: outsideTexture || null,
    transparent: true,
    opacity: outsideTexture ? 0.96 : 0.72,
    roughness: 0.08,
    metalness: 0,
    side: THREE.FrontSide,
  })
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(paneWidth, paneHeight), paneMaterial)
  pane.position.y = centerY
  const paneOffset = frameDepth / 2 + 0.001
  const insideRotationY =
    openingWall === 'top'
      ? 0
      : openingWall === 'bottom'
        ? Math.PI
        : openingWall === 'left'
          ? Math.PI / 2
          : -Math.PI / 2
  pane.rotation.y = insideRotationY
  if (isHorizontalWall) {
    pane.position.z = insideSign * paneOffset
  } else {
    pane.position.x = insideSign * paneOffset
  }
  group.add(pane)

  const mullion = new THREE.Mesh(
    isHorizontalWall
      ? new THREE.BoxGeometry(0.03, paneHeight, frameDepth * 0.96)
      : new THREE.BoxGeometry(frameDepth * 0.96, paneHeight, 0.03),
    new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.5,
      metalness: 0.08,
    }),
  )
  mullion.position.y = centerY
  group.add(mullion)
  return group
}
