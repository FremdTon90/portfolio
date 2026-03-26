import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { CCDIKSolver } from 'three/examples/jsm/animation/CCDIKSolver.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'

const modelPath = `${import.meta.env.BASE_URL}models/spider.glb`

const LEG_CONFIG = {
  targetName: 'IKTargetR001_071',
  effectorName: 'LegSegmentFR001_043',
  linkNames: [
    'LegSegmentER001_042',
    'LegSegmentDR001_041',
    'LegSegmentBR001_040',
    'LegSegmentAR001_039',
  ],
}

const DEBUG_SETTINGS = {
  targetHeight: 0.00385,

  bodyPosition: {
    x: -0.58,
    y: -0.0145,
    z: 0.2,
  },

  bodyRotation: {
    x: 0,
    y: -0.28,
    z: 0,
  },

  abdomenMotion: {
    enabled: true,
    positionYAmplitude: 0.00135,
    positionYSpeed: 1.15,
    rotationXAmplitude: 0.075,
    rotationXSpeed: 1.05,
    rotationZAmplitude: 0.03,
    rotationZSpeed: 0.8,
    scalePulseAmplitude: 0.018,
    scalePulseSpeed: 1.2,
  },

  targetFollow: {
    idleDamping: 6.8,
    hoverDamping: 5.6,
    moveDamping: 5.0,
    pressDamping: 4.2,
    returnDamping: 5.6,
    planeDepthFactor: 0.36,
    planeUpFactor: 58,
    maxReachMultiplier: 0.98,
    targetWorldYOffsetTop: 0.11,
    targetWorldYOffsetBottom: 0.03,
    pressWorldYOffset: -0.014,
    targetDeadzone: 0.0009,
  },

  shoulderAim: {
    enabled: true,
    axis: 'x',
    sign: -1,
    blend: 0.045,
    maxTurnRadians: 0.42,
    forwardOffsetEuler: {
      x: 0,
      y: 0,
      z: 0,
    },
  },

  solver: {
    iterations: 18,
    minAngle: 0,
    maxAngle: Math.PI * 0.28,
  },
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getLocalAimAxis(axis, sign) {
  if (axis === 'x') return new THREE.Vector3(sign, 0, 0)
  if (axis === 'y') return new THREE.Vector3(0, sign, 0)
  return new THREE.Vector3(0, 0, sign)
}

function Loader() {
  return null
}

function dampFactor(lambda, delta) {
  return 1 - Math.exp(-lambda * delta)
}

function getChainReach(shoulderBone, linkBones, effectorBone) {
  const points = []
  const temp = new THREE.Vector3()

  shoulderBone.getWorldPosition(temp)
  points.push(temp.clone())

  for (let i = 0; i < linkBones.length; i += 1) {
    linkBones[i].getWorldPosition(temp)
    points.push(temp.clone())
  }

  effectorBone.getWorldPosition(temp)
  points.push(temp.clone())

  let total = 0

  for (let i = 0; i < points.length - 1; i += 1) {
    const segmentLength = points[i].distanceTo(points[i + 1])

    if (segmentLength > 0.000001) {
      total += segmentLength
    }
  }

  return total
}

function SpiderRig({ interactionRef, onReady }) {
  const { scene } = useGLTF(modelPath)
  const { camera, clock } = useThree()

  const rootRef = useRef(null)
  const ikTargetRef = useRef(null)
  const ikTargetParentRef = useRef(null)
  const effectorBoneRef = useRef(null)
  const shoulderBoneRef = useRef(null)
  const linkBonesRef = useRef([])
  const solverRef = useRef(null)

  const rawTargetWorldRef = useRef(new THREE.Vector3())
  const desiredWorldRef = useRef(new THREE.Vector3())
  const smoothWorldRef = useRef(new THREE.Vector3())
  const previousModeRef = useRef('idle')

  const maxReachRef = useRef(0.22)
  const isRigReadyRef = useRef(false)
  const modelPreparedRef = useRef(false)

  const abdomenNodeRef = useRef(null)
  const abdomenBasePositionRef = useRef(null)
  const abdomenBaseQuaternionRef = useRef(null)
  const abdomenBaseScaleRef = useRef(null)

  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const planeHit = useMemo(() => new THREE.Vector3(), [])
  const shoulderWorld = useMemo(() => new THREE.Vector3(), [])
  const effectorWorld = useMemo(() => new THREE.Vector3(), [])
  const planeNormal = useMemo(() => new THREE.Vector3(), [])
  const planeUp = useMemo(() => new THREE.Vector3(), [])
  const planeRight = useMemo(() => new THREE.Vector3(), [])
  const planeCenter = useMemo(() => new THREE.Vector3(), [])
  const interactionPlane = useMemo(() => new THREE.Plane(), [])
  const localTarget = useMemo(() => new THREE.Vector3(), [])
  const clampedDirectionWorld = useMemo(() => new THREE.Vector3(), [])

  const shoulderWorldQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const shoulderParentWorldQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const desiredWorldQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const desiredLocalQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const invParentWorldQuaternion = useMemo(() => new THREE.Quaternion(), [])

  const abdomenOffsetQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const abdomenOffsetEuler = useMemo(() => new THREE.Euler(), [])

  const shoulderOffsetQuaternion = useMemo(
    () =>
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          DEBUG_SETTINGS.shoulderAim.forwardOffsetEuler.x,
          DEBUG_SETTINGS.shoulderAim.forwardOffsetEuler.y,
          DEBUG_SETTINGS.shoulderAim.forwardOffsetEuler.z
        )
      ),
    []
  )

  const aimAxisLocal = useMemo(
    () =>
      getLocalAimAxis(
        DEBUG_SETTINGS.shoulderAim.axis,
        DEBUG_SETTINGS.shoulderAim.sign
      ),
    []
  )
  const aimAxisWorld = useMemo(() => new THREE.Vector3(), [])
  const desiredDirectionWorld = useMemo(() => new THREE.Vector3(), [])
  const currentDirectionWorld = useMemo(() => new THREE.Vector3(), [])

  const preparedModel = useMemo(() => {
    const cloned = clone(scene)

    cloned.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.castShadow = true
        child.receiveShadow = true

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map((material) => material.clone())
            child.material.forEach((material) => {
              material.side = THREE.DoubleSide
              material.needsUpdate = true
            })
          } else {
            child.material = child.material.clone()
            child.material.side = THREE.DoubleSide
            child.material.needsUpdate = true
          }
        }
      }
    })

    return cloned
  }, [scene])

  useLayoutEffect(() => {
    if (!rootRef.current || modelPreparedRef.current) return

    preparedModel.rotation.set(0, Math.PI, 0)

    const firstBox = new THREE.Box3().setFromObject(rootRef.current)
    const firstSize = new THREE.Vector3()
    firstBox.getSize(firstSize)

    if (firstSize.y > 0) {
      const scaleFactor = DEBUG_SETTINGS.targetHeight / firstSize.y
      preparedModel.scale.setScalar(scaleFactor)
      preparedModel.updateMatrixWorld(true)
    }

    const fittedBox = new THREE.Box3().setFromObject(rootRef.current)
    const fittedCenter = new THREE.Vector3()
    fittedBox.getCenter(fittedCenter)

    preparedModel.position.x -= fittedCenter.x
    preparedModel.position.z -= fittedCenter.z
    preparedModel.position.y -= fittedBox.min.y
    preparedModel.updateMatrixWorld(true)

    let abdomenCandidate = null

    preparedModel.traverse((child) => {
      const name = child.name?.toLowerCase?.() || ''

      if (
        !abdomenCandidate &&
        !name.includes('leg') &&
        !name.includes('ik') &&
        !name.includes('target') &&
        (name.includes('abdomen') ||
          name.includes('rear') ||
          name.includes('backbody') ||
          name.includes('opisthosoma'))
      ) {
        abdomenCandidate = child
      }
    })

    abdomenNodeRef.current = abdomenCandidate || null

    if (abdomenNodeRef.current) {
      abdomenBasePositionRef.current = abdomenNodeRef.current.position.clone()
      abdomenBaseQuaternionRef.current = abdomenNodeRef.current.quaternion.clone()
      abdomenBaseScaleRef.current = abdomenNodeRef.current.scale.clone()
    }

    modelPreparedRef.current = true
  }, [preparedModel])

  useLayoutEffect(() => {
    if (!rootRef.current) return

    isRigReadyRef.current = false
    solverRef.current = null
    ikTargetRef.current = null
    ikTargetParentRef.current = null
    effectorBoneRef.current = null
    shoulderBoneRef.current = null
    linkBonesRef.current = []

    let skinnedMesh = null

    preparedModel.traverse((child) => {
      if (!skinnedMesh && child.isSkinnedMesh && child.skeleton) {
        skinnedMesh = child
      }
    })

    if (!skinnedMesh?.skeleton) {
      onReady?.()
      return
    }

    rootRef.current.updateMatrixWorld(true)
    preparedModel.updateMatrixWorld(true)

    const ikTarget = preparedModel.getObjectByName(LEG_CONFIG.targetName)
    const effectorBone = preparedModel.getObjectByName(LEG_CONFIG.effectorName)
    const shoulderBone = preparedModel.getObjectByName(
      LEG_CONFIG.linkNames[LEG_CONFIG.linkNames.length - 1]
    )
    const linkBones = LEG_CONFIG.linkNames
      .map((name) => preparedModel.getObjectByName(name))
      .filter(Boolean)

    const bones = skinnedMesh.skeleton.bones
    const boneIndexByName = new Map(bones.map((bone, index) => [bone.name, index]))

    const targetIndex = boneIndexByName.get(LEG_CONFIG.targetName)
    const effectorIndex = boneIndexByName.get(LEG_CONFIG.effectorName)
    const linkIndices = LEG_CONFIG.linkNames
      .map((name) => boneIndexByName.get(name))
      .filter((index) => typeof index === 'number')

    if (
      !ikTarget ||
      !ikTarget.parent ||
      !effectorBone ||
      !shoulderBone ||
      typeof targetIndex !== 'number' ||
      typeof effectorIndex !== 'number' ||
      linkIndices.length !== LEG_CONFIG.linkNames.length ||
      linkBones.length !== LEG_CONFIG.linkNames.length
    ) {
      onReady?.()
      return
    }

    ikTargetRef.current = ikTarget
    ikTargetParentRef.current = ikTarget.parent
    effectorBoneRef.current = effectorBone
    shoulderBoneRef.current = shoulderBone
    linkBonesRef.current = linkBones

    solverRef.current = new CCDIKSolver(skinnedMesh, [
      {
        target: targetIndex,
        effector: effectorIndex,
        iteration: DEBUG_SETTINGS.solver.iterations,
        minAngle: DEBUG_SETTINGS.solver.minAngle,
        maxAngle: DEBUG_SETTINGS.solver.maxAngle,
        links: linkIndices.map((index, i) => ({
          index,
          enabled: true,
          rotationMin: new THREE.Vector3(
            i === 0 ? -0.3 : -0.5,
            -0.78,
            -0.82
          ),
          rotationMax: new THREE.Vector3(
            i === 0 ? 0.62 : 0.68,
            0.78,
            0.82
          ),
        })),
      },
    ])

    shoulderBoneRef.current.getWorldPosition(shoulderWorld)
    effectorBoneRef.current.getWorldPosition(effectorWorld)

    rawTargetWorldRef.current.copy(effectorWorld)
    desiredWorldRef.current.copy(effectorWorld)
    smoothWorldRef.current.copy(effectorWorld)

    const chainReach = getChainReach(
      shoulderBoneRef.current,
      linkBonesRef.current,
      effectorBoneRef.current
    )

    if (chainReach > 0.0001) {
      maxReachRef.current = chainReach * DEBUG_SETTINGS.targetFollow.maxReachMultiplier
    }

    isRigReadyRef.current = true
    onReady?.()
  }, [onReady, preparedModel])

  useFrame((_, delta) => {
    if (!rootRef.current) return

    rootRef.current.position.set(
      DEBUG_SETTINGS.bodyPosition.x,
      DEBUG_SETTINGS.bodyPosition.y,
      DEBUG_SETTINGS.bodyPosition.z
    )
    rootRef.current.rotation.set(
      DEBUG_SETTINGS.bodyRotation.x,
      DEBUG_SETTINGS.bodyRotation.y,
      DEBUG_SETTINGS.bodyRotation.z
    )
    rootRef.current.visible = true
    rootRef.current.updateMatrixWorld(true)

    if (
      DEBUG_SETTINGS.abdomenMotion.enabled &&
      abdomenNodeRef.current &&
      abdomenBasePositionRef.current &&
      abdomenBaseQuaternionRef.current &&
      abdomenBaseScaleRef.current
    ) {
      const elapsed = clock.getElapsedTime()
      const pulse =
        Math.sin(elapsed * DEBUG_SETTINGS.abdomenMotion.scalePulseSpeed) *
        DEBUG_SETTINGS.abdomenMotion.scalePulseAmplitude

      abdomenNodeRef.current.position.copy(abdomenBasePositionRef.current)
      abdomenNodeRef.current.position.y +=
        Math.sin(elapsed * DEBUG_SETTINGS.abdomenMotion.positionYSpeed) *
        DEBUG_SETTINGS.abdomenMotion.positionYAmplitude

      abdomenOffsetEuler.set(
        Math.sin(elapsed * DEBUG_SETTINGS.abdomenMotion.rotationXSpeed) *
          DEBUG_SETTINGS.abdomenMotion.rotationXAmplitude,
        0,
        Math.sin(elapsed * DEBUG_SETTINGS.abdomenMotion.rotationZSpeed) *
          DEBUG_SETTINGS.abdomenMotion.rotationZAmplitude
      )

      abdomenOffsetQuaternion.setFromEuler(abdomenOffsetEuler)

      abdomenNodeRef.current.quaternion.copy(abdomenBaseQuaternionRef.current)
      abdomenNodeRef.current.quaternion.multiply(abdomenOffsetQuaternion)

      abdomenNodeRef.current.scale.copy(abdomenBaseScaleRef.current)
      abdomenNodeRef.current.scale.multiplyScalar(1 + pulse)

      abdomenNodeRef.current.updateMatrixWorld(true)
    }

    if (!isRigReadyRef.current) return
    if (!ikTargetRef.current || !ikTargetParentRef.current) return
    if (!shoulderBoneRef.current || !effectorBoneRef.current) return

    shoulderBoneRef.current.getWorldPosition(shoulderWorld)

    const interaction = interactionRef?.current || {
      mode: 'idle',
      x: 0,
      y: 0,
      press: 0,
    }

    const px = clamp(interaction.x ?? 0, -1, 1)
    const py = clamp(interaction.y ?? 0, -1, 1)
    const pressAmount = clamp(interaction.press ?? 0, 0, 1)

    camera.getWorldDirection(planeNormal).normalize()
    planeUp.copy(camera.up).normalize()
    planeRight.crossVectors(planeNormal, planeUp).normalize()
    planeUp.crossVectors(planeRight, planeNormal).normalize()

    planeCenter
      .copy(shoulderWorld)
      .addScaledVector(
        planeNormal,
        -maxReachRef.current * DEBUG_SETTINGS.targetFollow.planeDepthFactor
      )
      .addScaledVector(
        planeUp,
        maxReachRef.current * DEBUG_SETTINGS.targetFollow.planeUpFactor
      )

    interactionPlane.setFromNormalAndCoplanarPoint(planeNormal, planeCenter)
    raycaster.setFromCamera({ x: px, y: py }, camera)

    if (raycaster.ray.intersectPlane(interactionPlane, planeHit)) {
      const normalizedScreenY = (py + 1) * 0.5
      const dynamicYOffset = THREE.MathUtils.lerp(
        DEBUG_SETTINGS.targetFollow.targetWorldYOffsetBottom,
        DEBUG_SETTINGS.targetFollow.targetWorldYOffsetTop,
        normalizedScreenY
      )

      rawTargetWorldRef.current.copy(planeHit)
      rawTargetWorldRef.current.y +=
        dynamicYOffset + DEBUG_SETTINGS.targetFollow.pressWorldYOffset * pressAmount
    }

    previousModeRef.current = interaction.mode
    desiredWorldRef.current.copy(rawTargetWorldRef.current)

    let damping = DEBUG_SETTINGS.targetFollow.idleDamping

    if (interaction.mode === 'hovering') {
      damping = DEBUG_SETTINGS.targetFollow.hoverDamping
    } else if (interaction.mode === 'moving') {
      damping = DEBUG_SETTINGS.targetFollow.moveDamping
    } else if (interaction.mode === 'pressing') {
      damping = DEBUG_SETTINGS.targetFollow.pressDamping
    } else if (interaction.mode === 'returning') {
      damping = DEBUG_SETTINGS.targetFollow.returnDamping
    }

    smoothWorldRef.current.lerp(
      desiredWorldRef.current,
      dampFactor(damping, delta)
    )

    localTarget.copy(smoothWorldRef.current)
    ikTargetParentRef.current.worldToLocal(localTarget)
    ikTargetRef.current.position.copy(localTarget)
    ikTargetRef.current.updateMatrixWorld(true)

    const shouldAimShoulder =
      DEBUG_SETTINGS.shoulderAim.enabled && interaction.mode !== 'idle'

    if (shouldAimShoulder && shoulderBoneRef.current.parent) {
      shoulderBoneRef.current.parent.updateWorldMatrix(true, false)

      desiredDirectionWorld.copy(smoothWorldRef.current).sub(shoulderWorld)
      const desiredDirectionLength = desiredDirectionWorld.length()

      if (desiredDirectionLength > 0.000001) {
        desiredDirectionWorld.normalize()

        shoulderBoneRef.current.getWorldQuaternion(shoulderWorldQuaternion)
        aimAxisWorld.copy(aimAxisLocal).applyQuaternion(shoulderWorldQuaternion).normalize()
        currentDirectionWorld.copy(aimAxisWorld)

        const angleToDesired = currentDirectionWorld.angleTo(desiredDirectionWorld)
        const maxTurn = DEBUG_SETTINGS.shoulderAim.maxTurnRadians
        const blendToClamped =
          angleToDesired > 0.0001 ? Math.min(1, maxTurn / angleToDesired) : 1

        clampedDirectionWorld
          .copy(currentDirectionWorld)
          .lerp(desiredDirectionWorld, blendToClamped)
          .normalize()

        desiredWorldQuaternion.setFromUnitVectors(
          currentDirectionWorld,
          clampedDirectionWorld
        )

        const currentWorldQuaternion = shoulderWorldQuaternion.clone()
        const targetWorldQuaternion = desiredWorldQuaternion.multiply(currentWorldQuaternion)

        shoulderBoneRef.current.parent.getWorldQuaternion(shoulderParentWorldQuaternion)
        invParentWorldQuaternion.copy(shoulderParentWorldQuaternion).invert()

        desiredLocalQuaternion
          .copy(invParentWorldQuaternion)
          .multiply(targetWorldQuaternion)
          .multiply(shoulderOffsetQuaternion)

        shoulderBoneRef.current.quaternion.slerp(
          desiredLocalQuaternion,
          dampFactor(DEBUG_SETTINGS.shoulderAim.blend * 60, delta)
        )

        shoulderBoneRef.current.updateMatrixWorld(true)
      }
    }

    if (solverRef.current) {
      solverRef.current.update()
    }
  })

  return (
    <group ref={rootRef}>
      <primitive object={preparedModel} />
    </group>
  )
}

function SceneCamera() {
  const { camera } = useThree()

  useLayoutEffect(() => {
    camera.position.set(0, 0.64, 3.18)
    camera.lookAt(-0.22, 0.02, 0.08)
    camera.near = 0.01
    camera.far = 100
    camera.updateProjectionMatrix()
  }, [camera])

  return null
}

export default function SpiderHeroScene({ interactionRef, onReady }) {
  return (
    <Canvas
      camera={{ position: [0, 0.64, 3.18], fov: 20 }}
      shadows
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true }}
      style={{ overflow: 'visible' }}
    >
      <SceneCamera />

      <ambientLight intensity={1.3} />
      <directionalLight
        position={[4.8, 6, 4]}
        intensity={1.9}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-2.2, 1.4, 1.4]} intensity={0.3} />
      <pointLight position={[2.2, 1.3, -1.4]} intensity={0.22} />

      <Suspense fallback={<Loader />}>
        <SpiderRig interactionRef={interactionRef} onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload(modelPath)