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
    targetHeight: 0.0048,

    bodyPosition: {
        x: 0,
        y: -0.012,
        z: 0.3,
    },

    targetFollow: {
        smoothing: 0.38,
        snapDistance: 0.0008,
        planeDepthFactor: 0.72,
        planeUpFactor: 0.18,
        maxReachMultiplier: 0.96,
    },

    shoulderAim: {
        enabled: true,

        // HIER TESTEST DU DIE ACHSE:
        // 'x' | 'y' | 'z'
        axis: 'y',

        // 1 oder -1
        sign: 1,

        // wie stark die manuelle Vor-Ausrichtung wirkt
        blend: 0.1,
    },

    solver: {
        iterations: 26,
        minAngle: 0,
        maxAngle: Math.PI * 0.3,
    },

    debug: {
        logEveryFrames: 20,
        showCursorSphere: true,
        showEffectorSphere: true,
        showShoulderSphere: true,
    },
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
}

function dampVector(current, target, factor, maxStep = Infinity) {
    const delta = target.clone().sub(current)
    const scaled = delta.multiplyScalar(factor)

    if (scaled.length() > maxStep) {
        scaled.setLength(maxStep)
    }

    current.add(scaled)
    return current
}

function getLocalAimAxis(axis, sign) {
    if (axis === 'x') return new THREE.Vector3(sign, 0, 0)
    if (axis === 'y') return new THREE.Vector3(0, sign, 0)
    return new THREE.Vector3(0, 0, sign)
}

function Loader() {
    return null
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

function DebugMarker({ positionRef, color = 'red', size = 0.004, visible = true }) {
    const meshRef = useRef(null)

    useFrame(() => {
        if (!meshRef.current || !positionRef.current) return
        meshRef.current.visible = visible
        meshRef.current.position.copy(positionRef.current)
    })

    return (
        <mesh ref={meshRef} visible={visible}>
            <sphereGeometry args={[size, 16, 16]} />
            <meshBasicMaterial color={color} depthTest={false} />
        </mesh>
    )
}

function SpiderRig({ cursorRef, onReady }) {
    const { scene } = useGLTF(modelPath)
    const { camera } = useThree()

    const rootRef = useRef(null)
    const ikTargetRef = useRef(null)
    const ikTargetParentRef = useRef(null)
    const effectorBoneRef = useRef(null)
    const shoulderBoneRef = useRef(null)
    const linkBonesRef = useRef([])
    const solverRef = useRef(null)

    const desiredWorldRef = useRef(new THREE.Vector3())
    const smoothWorldRef = useRef(new THREE.Vector3())
    const shoulderWorldRef = useRef(new THREE.Vector3())
    const effectorWorldRef = useRef(new THREE.Vector3())
    const debugCursorWorldRef = useRef(new THREE.Vector3())

    const sideSignRef = useRef(1)
    const maxReachRef = useRef(0.22)
    const isRigReadyRef = useRef(false)
    const modelPreparedRef = useRef(false)
    const frameCountRef = useRef(0)

    const shoulderBaseQuaternionRef = useRef(null)

    const raycaster = useMemo(() => new THREE.Raycaster(), [])
    const planeHit = useMemo(() => new THREE.Vector3(), [])
    const shoulderWorld = useMemo(() => new THREE.Vector3(), [])
    const effectorWorld = useMemo(() => new THREE.Vector3(), [])
    const bodyWorld = useMemo(() => new THREE.Vector3(), [])
    const planeNormal = useMemo(() => new THREE.Vector3(), [])
    const planeUp = useMemo(() => new THREE.Vector3(), [])
    const planeRight = useMemo(() => new THREE.Vector3(), [])
    const planeCenter = useMemo(() => new THREE.Vector3(), [])
    const interactionPlane = useMemo(() => new THREE.Plane(), [])
    const shoulderToTarget = useMemo(() => new THREE.Vector3(), [])
    const clampedTarget = useMemo(() => new THREE.Vector3(), [])
    const localTarget = useMemo(() => new THREE.Vector3(), [])

    const shoulderWorldQuaternion = useMemo(() => new THREE.Quaternion(), [])
    const shoulderParentWorldQuaternion = useMemo(() => new THREE.Quaternion(), [])
    const desiredWorldQuaternion = useMemo(() => new THREE.Quaternion(), [])
    const desiredLocalQuaternion = useMemo(() => new THREE.Quaternion(), [])
    const invParentWorldQuaternion = useMemo(() => new THREE.Quaternion(), [])
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
    const shoulderParentWorldPosition = useMemo(() => new THREE.Vector3(), [])
    const shoulderLocalPosition = useMemo(() => new THREE.Vector3(), [])

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
        shoulderBaseQuaternionRef.current = null

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

        console.log('[Spider debug init]', {
            targetName: LEG_CONFIG.targetName,
            effectorName: LEG_CONFIG.effectorName,
            shoulderName: LEG_CONFIG.linkNames[LEG_CONFIG.linkNames.length - 1],
            axisUnderTest: DEBUG_SETTINGS.shoulderAim.axis,
            signUnderTest: DEBUG_SETTINGS.shoulderAim.sign,
            hasTarget: !!ikTarget,
            hasEffector: !!effectorBone,
            hasShoulder: !!shoulderBone,
            linkBones: linkBones.map((bone) => bone.name),
            targetIndex,
            effectorIndex,
            linkIndices,
        })

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
        shoulderBaseQuaternionRef.current = shoulderBone.quaternion.clone()

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
                        i === 0 ? -0.35 : -0.55,
                        -0.8,
                        -0.85
                    ),
                    rotationMax: new THREE.Vector3(
                        i === 0 ? 0.55 : 0.75,
                        0.8,
                        0.85
                    ),
                })),
            },
        ])

        shoulderBoneRef.current.getWorldPosition(shoulderWorld)
        effectorBoneRef.current.getWorldPosition(effectorWorld)

        desiredWorldRef.current.copy(effectorWorld)
        smoothWorldRef.current.copy(effectorWorld)
        shoulderWorldRef.current.copy(shoulderWorld)
        effectorWorldRef.current.copy(effectorWorld)
        debugCursorWorldRef.current.copy(effectorWorld)

        const chainReach = getChainReach(
            shoulderBoneRef.current,
            linkBonesRef.current,
            effectorBoneRef.current
        )

        if (chainReach > 0.0001) {
            maxReachRef.current =
                chainReach * DEBUG_SETTINGS.targetFollow.maxReachMultiplier
        }

        const dx = effectorWorld.x - shoulderWorld.x
        sideSignRef.current = dx <= 0 ? -1 : 1

        isRigReadyRef.current = true
        onReady?.()
    }, [onReady, preparedModel, shoulderWorld, effectorWorld, aimAxisLocal])

    useFrame(() => {
        if (!rootRef.current) return

        frameCountRef.current += 1

        rootRef.current.position.set(
            DEBUG_SETTINGS.bodyPosition.x,
            DEBUG_SETTINGS.bodyPosition.y,
            DEBUG_SETTINGS.bodyPosition.z
        )
        rootRef.current.rotation.set(0, 0, 0)
        rootRef.current.visible = true
        rootRef.current.updateMatrixWorld(true)

        if (!isRigReadyRef.current) return
        if (!ikTargetRef.current || !ikTargetParentRef.current) return
        if (!shoulderBoneRef.current || !effectorBoneRef.current) return

        shoulderBoneRef.current.getWorldPosition(shoulderWorld)
        effectorBoneRef.current.getWorldPosition(effectorWorld)
        rootRef.current.getWorldPosition(bodyWorld)

        shoulderWorldRef.current.copy(shoulderWorld)
        effectorWorldRef.current.copy(effectorWorld)

        const pointer = cursorRef.current || { x: 0, y: 0 }
        const px = clamp(pointer.x, -1, 1)
        const py = clamp(pointer.y, -1, 1)

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
            debugCursorWorldRef.current.copy(planeHit)

            shoulderToTarget.copy(planeHit).sub(shoulderWorld)
            const distance = shoulderToTarget.length()
            const maxReach = maxReachRef.current

            if (distance > maxReach) {
                shoulderToTarget.normalize()
                clampedTarget.copy(shoulderWorld).addScaledVector(shoulderToTarget, maxReach)
            } else {
                clampedTarget.copy(planeHit)
            }

            desiredWorldRef.current.copy(clampedTarget)
        }

        const distanceToDesired = smoothWorldRef.current.distanceTo(desiredWorldRef.current)

        if (distanceToDesired < DEBUG_SETTINGS.targetFollow.snapDistance) {
            smoothWorldRef.current.copy(desiredWorldRef.current)
        } else {
            dampVector(
                smoothWorldRef.current,
                desiredWorldRef.current,
                DEBUG_SETTINGS.targetFollow.smoothing,
                maxReachRef.current * 0.18
            )
        }

        localTarget.copy(smoothWorldRef.current)
        ikTargetParentRef.current.worldToLocal(localTarget)
        ikTargetRef.current.position.copy(localTarget)
        ikTargetRef.current.updateMatrixWorld(true)

        if (
            DEBUG_SETTINGS.shoulderAim.enabled &&
            shoulderBaseQuaternionRef.current &&
            shoulderBoneRef.current.parent
        ) {
            shoulderBoneRef.current.parent.updateWorldMatrix(true, false)

            desiredDirectionWorld.copy(smoothWorldRef.current).sub(shoulderWorld)
            const desiredDirectionLength = desiredDirectionWorld.length()

            if (desiredDirectionLength > 0.000001) {
                desiredDirectionWorld.normalize()

                shoulderBoneRef.current.getWorldQuaternion(shoulderWorldQuaternion)
                aimAxisWorld.copy(aimAxisLocal).applyQuaternion(shoulderWorldQuaternion).normalize()
                currentDirectionWorld.copy(aimAxisWorld)

                desiredWorldQuaternion.setFromUnitVectors(
                    currentDirectionWorld,
                    desiredDirectionWorld
                )

                const currentWorldQuaternion = shoulderWorldQuaternion.clone()
                const targetWorldQuaternion = desiredWorldQuaternion.multiply(currentWorldQuaternion)

                shoulderBoneRef.current.parent.getWorldQuaternion(shoulderParentWorldQuaternion)
                invParentWorldQuaternion.copy(shoulderParentWorldQuaternion).invert()

                desiredLocalQuaternion.copy(invParentWorldQuaternion).multiply(targetWorldQuaternion)

                shoulderBoneRef.current.quaternion.slerp(
                    desiredLocalQuaternion,
                    DEBUG_SETTINGS.shoulderAim.blend
                )

                shoulderBoneRef.current.updateMatrixWorld(true)
            }
        }

        if (solverRef.current) {
            solverRef.current.update()
        }

        if (frameCountRef.current % DEBUG_SETTINGS.debug.logEveryFrames === 0) {
            const targetWorld = new THREE.Vector3()
            ikTargetRef.current.getWorldPosition(targetWorld)

            const targetToCursor = targetWorld.distanceTo(debugCursorWorldRef.current)
            const effectorToTarget = effectorWorld.distanceTo(targetWorld)

            console.log('[Spider debug frame]', {
                axisUnderTest: DEBUG_SETTINGS.shoulderAim.axis,
                signUnderTest: DEBUG_SETTINGS.shoulderAim.sign,
                pointer: { x: px, y: py },
                cursorWorld: {
                    x: Number(debugCursorWorldRef.current.x.toFixed(4)),
                    y: Number(debugCursorWorldRef.current.y.toFixed(4)),
                    z: Number(debugCursorWorldRef.current.z.toFixed(4)),
                },
                ikTargetWorld: {
                    x: Number(targetWorld.x.toFixed(4)),
                    y: Number(targetWorld.y.toFixed(4)),
                    z: Number(targetWorld.z.toFixed(4)),
                },
                shoulderWorld: {
                    x: Number(shoulderWorld.x.toFixed(4)),
                    y: Number(shoulderWorld.y.toFixed(4)),
                    z: Number(shoulderWorld.z.toFixed(4)),
                },
                effectorWorld: {
                    x: Number(effectorWorld.x.toFixed(4)),
                    y: Number(effectorWorld.y.toFixed(4)),
                    z: Number(effectorWorld.z.toFixed(4)),
                },
                targetToCursor: Number(targetToCursor.toFixed(5)),
                effectorToTarget: Number(effectorToTarget.toFixed(5)),
            })
        }
    })

    return (
        <>
            <group ref={rootRef}>
                <primitive object={preparedModel} />
            </group>

            <DebugMarker
                positionRef={debugCursorWorldRef}
                color="red"
                size={0.0042}
                visible={DEBUG_SETTINGS.debug.showCursorSphere}
            />
            <DebugMarker
                positionRef={effectorWorldRef}
                color="lime"
                size={0.0038}
                visible={DEBUG_SETTINGS.debug.showEffectorSphere}
            />
            <DebugMarker
                positionRef={shoulderWorldRef}
                color="cyan"
                size={0.0038}
                visible={DEBUG_SETTINGS.debug.showShoulderSphere}
            />
        </>
    )
}

function SceneCamera() {
    const { camera } = useThree()

    useLayoutEffect(() => {
        camera.position.set(0, 0.62, 2.85)
        camera.lookAt(0, 0.02, 0.1)
        camera.near = 0.01
        camera.far = 100
        camera.updateProjectionMatrix()
    }, [camera])

    return null
}

export default function SpiderHeroScene({ cursorRef, onReady }) {
    return (
        <Canvas
            camera={{ position: [0, 0.62, 2.85], fov: 18 }}
            shadows
            dpr={[1, 1.75]}
            gl={{ alpha: true, antialias: true }}
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
                <SpiderRig cursorRef={cursorRef} onReady={onReady} />
            </Suspense>
        </Canvas>
    )
}

useGLTF.preload(modelPath)