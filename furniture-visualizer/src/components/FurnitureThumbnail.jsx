import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import FurnitureIcon from '../member 2/FurnitureIcon'
import {
  WINDOW_OUTSIDE_VIEW,
  computeTightBounds,
  resolveModelSource,
} from '../member 3/threeViewport/viewportHelpers'

const loader = new GLTFLoader()
const modelCache = new Map()
const thumbnailCache = new Map()
const THUMBNAIL_VERSION = 'front-v2'

const loadModel = (url) => {
  if (!url) return Promise.resolve(null)

  const cached = modelCache.get(url)
  if (cached?.status === 'ready') return Promise.resolve(cached.data)
  if (cached?.status === 'loading') return cached.promise

  const promise = new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const scene = gltf.scene
        const nodes = new Map()
        scene.traverse((child) => {
          if (child.name) nodes.set(child.name, child)
        })
        const data = { scene, nodes }
        modelCache.set(url, { status: 'ready', data })
        resolve(data)
      },
      undefined,
      (error) => {
        modelCache.set(url, { status: 'error', error })
        reject(error)
      },
    )
  })

  modelCache.set(url, { status: 'loading', promise })
  return promise
}

const clonePreviewObject = (source) => {
  const object = source.clone(true)
  object.traverse((child) => {
    if (!child.isMesh) return
    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => material?.clone?.() || material)
    } else if (child.material?.clone) {
      child.material = child.material.clone()
    }
  })
  return object
}

const renderModelThumbnail = async (item) => {
  const thumbnailKey = `${THUMBNAIL_VERSION}:${item.model}:${item.modelNode || item.id}`
  const cachedThumb = thumbnailCache.get(thumbnailKey)
  if (cachedThumb) return cachedThumb

  const modelInfo = await loadModel(item.model)
  const source = resolveModelSource(modelInfo, item)
  if (!source) {
    throw new Error(`Missing preview source for ${item.id}`)
  }

  const width = 88
  const height = 62
  const aspect = width / height
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(width, height, false)
  renderer.setClearColor(0xffffff, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20)
  const ambientLight = new THREE.AmbientLight(0xffffff, 2)
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.15)
  const fillLight = new THREE.DirectionalLight(0xf3e6d6, 0.7)
  keyLight.position.set(2.5, 4, 5.5)
  fillLight.position.set(-2, 2.2, 3)
  scene.add(ambientLight, keyLight, fillLight)

  const object = clonePreviewObject(source)
  object.traverse((child) => {
    if (!child.isMesh) return
    if (item.color && child.material?.color) {
      child.material.color = new THREE.Color(item.color)
    }
  })
  if (item.modelRotation?.length === 3) {
    object.rotation.set(
      THREE.MathUtils.degToRad(item.modelRotation[0] || 0),
      THREE.MathUtils.degToRad(item.modelRotation[1] || 0),
      THREE.MathUtils.degToRad(item.modelRotation[2] || 0),
    )
  }

  const initialBounds = computeTightBounds(object)
  const initialCenter = initialBounds.getCenter(new THREE.Vector3())
  const initialSize = initialBounds.getSize(new THREE.Vector3())
  object.position.sub(initialCenter)

  const fitScale = 1.3 / Math.max(initialSize.x, initialSize.y, initialSize.z, 0.001)
  object.scale.setScalar(fitScale)

  const cameraGroup = new THREE.Group()
  cameraGroup.add(object)
  scene.add(cameraGroup)

  let fittedBounds = new THREE.Box3().setFromObject(cameraGroup)
  let fittedSize = fittedBounds.getSize(new THREE.Vector3())
  const viewFromX = fittedSize.z > fittedSize.x * 1.08
  cameraGroup.rotation.y = viewFromX ? -Math.PI / 2 : 0

  fittedBounds = new THREE.Box3().setFromObject(cameraGroup)
  fittedSize = fittedBounds.getSize(new THREE.Vector3())
  const fittedCenter = fittedBounds.getCenter(new THREE.Vector3())

  cameraGroup.position.x -= fittedCenter.x
  cameraGroup.position.y -= fittedBounds.min.y
  cameraGroup.position.z -= fittedCenter.z

  fittedBounds = new THREE.Box3().setFromObject(cameraGroup)
  fittedSize = fittedBounds.getSize(new THREE.Vector3())

  const frameHeight = Math.max(fittedSize.y * 1.18, (fittedSize.x / aspect) * 1.18, 0.9)
  const frameWidth = frameHeight * aspect
  camera.left = -frameWidth / 2
  camera.right = frameWidth / 2
  camera.top = frameHeight / 2
  camera.bottom = -frameHeight / 2
  camera.position.set(0, fittedSize.y * 0.45, 6)
  camera.lookAt(0, fittedSize.y * 0.42, 0)
  camera.updateProjectionMatrix()

  renderer.render(scene, camera)
  const thumbnail = renderer.domElement.toDataURL('image/png')
  renderer.dispose()
  renderer.forceContextLoss()
  thumbnailCache.set(thumbnailKey, thumbnail)
  return thumbnail
}

function OpeningThumbnail({ item }) {
  if (item.elementType === 'window') {
    return (
      <div className="furniture-opening furniture-opening-window" aria-hidden="true">
        <div
          className="furniture-opening-window-view"
          style={{ backgroundImage: `url(${WINDOW_OUTSIDE_VIEW})` }}
        />
        <span className="furniture-opening-window-frame vertical" />
        <span className="furniture-opening-window-frame horizontal" />
      </div>
    )
  }

  if (item.elementType === 'door') {
    return (
      <div className="furniture-opening furniture-opening-door" aria-hidden="true">
        <span className="furniture-opening-door-panel" />
        <span className="furniture-opening-door-knob" />
      </div>
    )
  }

  return (
    <div className="furniture-preview-fallback" aria-hidden="true">
      <FurnitureIcon name={item.icon} />
    </div>
  )
}

export default function FurnitureThumbnail({ item }) {
  const [thumbnail, setThumbnail] = useState(() => {
    if (!item?.model) return null
    return thumbnailCache.get(`${THUMBNAIL_VERSION}:${item.model}:${item.modelNode || item.id}`) || null
  })
  const [hasError, setHasError] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    setHasError(false)
    if (!item?.model) {
      setThumbnail(null)
      return
    }

    const thumbnailKey = `${THUMBNAIL_VERSION}:${item.model}:${item.modelNode || item.id}`
    const cached = thumbnailCache.get(thumbnailKey)
    if (cached) {
      setThumbnail(cached)
      return
    }

    let cancelled = false
    renderModelThumbnail(item)
      .then((src) => {
        if (cancelled || !mountedRef.current) return
        setThumbnail(src)
      })
      .catch(() => {
        if (cancelled || !mountedRef.current) return
        setHasError(true)
      })

    return () => {
      cancelled = true
    }
  }, [item])

  if (!item?.model || hasError || !thumbnail) {
    return <OpeningThumbnail item={item} />
  }

  return (
    <img
      className="furniture-preview-image"
      src={thumbnail}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  )
}
