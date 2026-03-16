import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { shadeColor } from '../color'
import { getCollisionMap } from '../../utils/collision'
import { isOpeningItem } from '../../utils/openingPlacement'
import {
  alignObjectToFloor,
  computeTightBounds,
  createOpeningObject,
  createWallMaterial,
  getObjectMetrics,
  resolveModelSource,
} from './viewportHelpers'

export const preloadModels = ({ catalog, modelCacheRef, onVersionChange }) => {
  const loader = new GLTFLoader()
  catalog
    .filter((item) => item.model)
    .forEach((item) => {
      const url = item.model
      if (modelCacheRef.current[url]) return
      modelCacheRef.current[url] = { status: 'loading' }
      loader.load(
        url,
        (gltf) => {
          const scene = gltf.scene
          const box = computeTightBounds(scene)
          const size = new THREE.Vector3()
          box.getSize(size)
          const nodes = new Map()
          scene.traverse((child) => {
            if (child.name) nodes.set(child.name, child)
          })
          modelCacheRef.current[url] = {
            status: 'ready',
            scene,
            box,
            size,
            nodes,
          }
          onVersionChange()
        },
        undefined,
        () => {
          modelCacheRef.current[url] = { status: 'error' }
          onVersionChange()
        },
      )
    })
}

export const buildRoomGroup = ({ room, refs }) => {
  if (!refs.sceneRef.current) return
  if (refs.roomGroupRef.current) {
    refs.sceneRef.current.remove(refs.roomGroupRef.current)
  }

  const isInside = refs.controlModeRef.current === 'inside'
  const group = new THREE.Group()

  if (isInside) {
    const shellGeometry = new THREE.BoxGeometry(room.width, room.height, room.depth)
    const shellMaterial = new THREE.MeshStandardMaterial({
      color: room.wallColor,
      roughness: 0.8,
      side: THREE.BackSide,
    })
    const shell = new THREE.Mesh(shellGeometry, shellMaterial)
    shell.position.set(0, room.height / 2, 0)
    group.add(shell)

    const floorGeometry = new THREE.PlaneGeometry(room.width, room.depth)
    const floorColor = shadeColor(room.floorColor, 0.08)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: floorColor,
      roughness: 0.95,
      side: THREE.DoubleSide,
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0.01
    floor.receiveShadow = true
    group.add(floor)

    const gridSize = Math.max(room.width, room.depth)
    const grid = new THREE.GridHelper(
      gridSize,
      Math.round(gridSize),
      0xa08f7b,
      0xd7c7b5,
    )
    grid.scale.set(room.width / gridSize, 1, room.depth / gridSize)
    grid.position.y = 0.02
    group.add(grid)

    const edgeGeometry = new THREE.EdgesGeometry(shellGeometry)
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xa08f7b,
      transparent: true,
      opacity: 0.5,
    })
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
    edges.position.set(0, room.height / 2, 0)
    group.add(edges)

    refs.wallsRef.current = null
    refs.activeWallRef.current = null
  } else {
    const floorGeometry = new THREE.PlaneGeometry(room.width, room.depth)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: room.floorColor,
      roughness: 0.85,
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    group.add(floor)

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(room.width, room.height),
      createWallMaterial(room.wallColor),
    )
    backWall.position.set(0, room.height / 2, -room.depth / 2)
    group.add(backWall)

    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(room.depth, room.height),
      createWallMaterial(room.wallColor),
    )
    leftWall.position.set(-room.width / 2, room.height / 2, 0)
    leftWall.rotation.y = Math.PI / 2
    group.add(leftWall)

    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(room.depth, room.height),
      createWallMaterial(room.wallColor),
    )
    rightWall.position.set(room.width / 2, room.height / 2, 0)
    rightWall.rotation.y = -Math.PI / 2
    group.add(rightWall)

    const frontWall = new THREE.Mesh(
      new THREE.PlaneGeometry(room.width, room.height),
      createWallMaterial(room.wallColor),
    )
    frontWall.position.set(0, room.height / 2, room.depth / 2)
    frontWall.rotation.y = Math.PI
    group.add(frontWall)

    const gridSize = Math.max(room.width, room.depth)
    const grid = new THREE.GridHelper(gridSize, Math.round(gridSize))
    grid.scale.set(room.width / gridSize, 1, room.depth / gridSize)
    grid.position.y = 0.01
    group.add(grid)

    const borderGeometry = new THREE.EdgesGeometry(new THREE.PlaneGeometry(room.width, room.depth))
    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0xa08f7b,
      transparent: true,
      opacity: 0.45,
    })
    const border = new THREE.LineSegments(borderGeometry, borderMaterial)
    border.rotation.x = -Math.PI / 2
    border.position.y = 0.02
    group.add(border)

    refs.wallsRef.current = { back: backWall, front: frontWall, left: leftWall, right: rightWall }
    refs.activeWallRef.current = null
  }

  refs.roomGroupRef.current = group
  refs.sceneRef.current.add(group)

  if (refs.cameraRef.current && refs.controlsRef.current) {
    if (refs.controlModeRef.current === 'inside') {
      const eyeHeight = Math.min(1.6, room.height * 0.85)
      refs.cameraRef.current.position.set(0, 0, 0)
      const controlObject = refs.controlsRef.current.getObject?.()
      controlObject?.position.set(0, eyeHeight, 0)
    } else {
      refs.cameraRef.current.position.set(room.width * 0.6, room.height * 1.1, room.depth * 1.2)
      refs.controlsRef.current.target?.set(0, room.height * 0.4, 0)
      refs.controlsRef.current.update?.()
    }
  }
}

export const buildFurnitureGroup = ({
  items,
  catalog,
  room,
  globalShade,
  selectedId,
  modelCacheRef,
  outsideTexture,
  sceneRef,
  furnitureGroupRef,
}) => {
  if (!sceneRef.current) return
  if (furnitureGroupRef.current) {
    sceneRef.current.remove(furnitureGroupRef.current)
  }

  const group = new THREE.Group()
  furnitureGroupRef.current = group
  const collisionMap = getCollisionMap(items, { defaultRoomId: room?.id || null, room })

  items.forEach((item) => {
    const catalogItem = catalog.find((entry) => entry.id === item.type)
    const isConflict = collisionMap.has(item.id)
    if (isOpeningItem(item)) {
      const openingObject = createOpeningObject({
        item,
        room,
        globalShade,
        outsideTexture,
        isConflict,
        isSelected: item.id === selectedId,
      })
      if (!openingObject) return

      const groupItem = new THREE.Group()
      groupItem.userData.itemId = item.id
      groupItem.position.set(
        -room.width / 2 + item.x + item.width / 2,
        0,
        -room.depth / 2 + item.y + item.depth / 2,
      )
      groupItem.rotation.y = THREE.MathUtils.degToRad(item.rotation || 0)
      groupItem.add(openingObject)

      group.add(groupItem)
      return
    }
    const url = catalogItem?.model || null
    const modelInfo = url ? modelCacheRef.current[url] : null

    if (!modelInfo || modelInfo.status !== 'ready') {
      return
    }

    const source = resolveModelSource(modelInfo, catalogItem)
    if (!source) return
    const object = source.clone(true)
    const isSelected = item.id === selectedId
    object.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone()
        const baseColor = isConflict ? '#ef4444' : item.color
        const shaded = shadeColor(baseColor, item.shade + globalShade * 0.6)
        child.material.color = new THREE.Color(shaded)
        if ('emissive' in child.material) {
          child.material.emissive = new THREE.Color(isSelected ? '#2f4f42' : '#000000')
          child.material.emissiveIntensity = isSelected ? 0.22 : 0
        }
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    const modelScale = catalogItem?.modelScale ?? 1
    const { size, center } = getObjectMetrics(object)
    const safeX = Math.max(size.x, 0.01)
    const safeZ = Math.max(size.z, 0.01)
    const scaleFactor = Math.min(item.width / safeX, item.depth / safeZ) * modelScale
    const scaledCenter = center.clone().multiplyScalar(scaleFactor)
    object.scale.setScalar(scaleFactor)
    object.position.set(-scaledCenter.x, 0, -scaledCenter.z)

    if (catalogItem?.modelRotation?.length === 3) {
      object.rotation.set(
        THREE.MathUtils.degToRad(catalogItem.modelRotation[0] || 0),
        THREE.MathUtils.degToRad(catalogItem.modelRotation[1] || 0),
        THREE.MathUtils.degToRad(catalogItem.modelRotation[2] || 0),
      )
    }

    alignObjectToFloor(object)
    if (catalogItem?.modelOffset) {
      object.position.x += (catalogItem.modelOffset.x || 0) * scaleFactor
      object.position.y += (catalogItem.modelOffset.y || 0) * scaleFactor
      object.position.z += (catalogItem.modelOffset.z || 0) * scaleFactor
    }

    const groupItem = new THREE.Group()
    groupItem.userData.itemId = item.id
    const position = {
      x: -room.width / 2 + item.x + item.width / 2,
      z: -room.depth / 2 + item.y + item.depth / 2,
    }
    groupItem.position.set(position.x, 0, position.z)
    groupItem.rotation.y = THREE.MathUtils.degToRad(item.rotation)
    groupItem.add(object)

    group.add(groupItem)
  })

  sceneRef.current.add(group)
}
