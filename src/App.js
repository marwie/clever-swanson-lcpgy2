import { useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'

import { REVISION } from 'three'

let DEFAULT_DRACO_DECODER_LOCATION = 'https://www.gstatic.com/draco/versioned/decoders/1.4.1/'
let DEFAULT_KTX2_TRANSCODER_LOCATION = 'https://www.gstatic.com/basis-universal/versioned/2021-04-15-ba1c3e4/'

function Test() {
  const { gl } = useThree()
  const url = 'https://needle-cloud-preview-02-r26roub2hq-lz.a.run.app/api/v1/public/1204a96/26b423147/'
  const { scene } = useGLTF(url, false, false, (loader) => {
    const THREE_PATH = `https://unpkg.com/three@0.${REVISION}.x`
    const ktx2Loader = new KTX2Loader().setTranscoderPath(`${THREE_PATH}/examples/jsm/libs/basis/`)
    loader.setKTX2Loader(ktx2Loader.detectSupport(gl))

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(DEFAULT_DRACO_DECODER_LOCATION)
    dracoLoader.setDecoderConfig({ type: 'js' })
    loader.setDRACOLoader(dracoLoader)
  })
  return <primitive object={scene} />
}

function Box(props) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef()
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => (ref.current.rotation.x += delta))
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => (event.stopPropagation(), hover(true))}
      onPointerOut={(event) => hover(false)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
}

export default function App() {
  return (
    <Canvas>
      <ambientLight intensity={Math.PI / 2} />
      <Test />
      <OrbitControls />
    </Canvas>
  )
}

const fitCameraToObject = function (camera, object, offset, controls) {
  offset = offset || 1.25

  const boundingBox = new THREE.Box3()

  // get bounding box of object - this will be used to setup controls and camera
  boundingBox.setFromObject(object)

  const center = boundingBox.getCenter()

  const size = boundingBox.getSize()

  // get the max side of the bounding box (fits to width OR height as needed )
  const maxDim = Math.max(size.x, size.y, size.z)
  const fov = camera.fov * (Math.PI / 180)
  let cameraZ = Math.abs((maxDim / 4) * Math.tan(fov * 2))

  cameraZ *= offset // zoom out a little so that objects don't fill the screen

  camera.position.z = cameraZ

  const minZ = boundingBox.min.z
  const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ

  camera.far = cameraToFarEdge * 3
  camera.updateProjectionMatrix()

  if (controls) {
    // set camera to rotate around center of loaded object
    controls.target = center

    // prevent camera from zooming out far enough to create far plane cutoff
    controls.maxDistance = cameraToFarEdge * 2

    controls.saveState()
  } else {
    camera.lookAt(center)
  }
}
