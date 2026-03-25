import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { CCDIKSolver } from 'three/examples/jsm/animation/CCDIKSolver.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'

const modelPath = `${import.meta.env.BASE_URL}models/spider.glb`

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

function findFirstExistingObject(root, names) {
    for (const name of names) {
        const obj = root.getObjectByName(name)
        if (obj) return obj
    }
    return null
}

function findFirstExistingIndex(indexMap, names) {
    for (const name of names) {
        const index = indexMap.get(name)
        if (typeof index === 'number') return index
    }
    return undefined
}

function Loader() {
    return null
}

function SpiderRig({ cursorRef, onReady }) {
    const { scene } = useGLTF(modelPath)
    const { camera } = useThree()

    const rootRef = useRef(null)
    const ikTargetRef = useRef(null)
    const ikTargetParentRef = useRef(null)
    const effectorBoneRef = useRef(null)
    const shoulderBoneRef = useRef(null)
    const solverRef = useRef(null)

    const desiredWorldRef = useRef(new THREE.Vector3())
    const smoothWorldRef = useRef(new THREE.Vector3())
    const sideSignRef = useRef(-1)
    const maxReachRef = useRef(0.22)
    const isRigReadyRef = useRef(false)

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
    const shoulderToCursor = useMemo(() => new THREE.Vector3(), [])
    const clampedTarget = useMemo(() => new THREE.Vector3(), [])
    const tempVec = useMemo(() => new THREE.Vector3(), [])

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
        if (!rootRef.current) return

        preparedModel.rotation.set(0, Math.PI, 0)

        const firstBox = new THREE.Box3().setFromObject(rootRef.current)
        const firstSize = new THREE.Vector3()
        firstBox.getSize(firstSize)

        if (firstSize.y > 0) {
            const targetHeight = 0.0048
            const scaleFactor = targetHeight / firstSize.y
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

        const bones = skinnedMesh.skeleton.bones
        const boneIndexByName = new Map(bones.map((bone, index) => [bone.name, index]))

        const targetCandidates = [
            'IKTargetL001_03',
            'IKTargetFL001_03',
            'IKTargetL002_03',
            'IKTargetFL002_03',
        ]

        const effectorCandidates = [
            'LegSegmentFL001_021',
            'LegSegmentL001_021',
            'LegSegmentFL002_021',
            'LegSegmentL002_021',
        ]

        const linkCandidateChains = [
            [
                'LegSegmentEL001_020',
                'LegSegmentDL001_019',
                'LegSegmentBL001_018',
                'LegSegmentAL001_017',
            ],
            [
                'LegSegmentEL002_020',
                'LegSegmentDL002_019',
                'LegSegmentBL002_018',
                'LegSegmentAL002_017',
            ],
        ]

        const targetBone = findFirstExistingObject(preparedModel, targetCandidates)
        const effectorBone = findFirstExistingObject(preparedModel, effectorCandidates)

        let chosenLinkNames = null
        for (const chain of linkCandidateChains) {
            const allExist = chain.every((name) => preparedModel.getObjectByName(name))
            if (allExist) {
                chosenLinkNames = chain
                break
            }
        }

        if (targetBone?.parent) {
            ikTargetRef.current = targetBone
            ikTargetParentRef.current = targetBone.parent
        }

        if (effectorBone) {
            effectorBoneRef.current = effectorBone
        }

        if (chosenLinkNames?.length) {
            const shoulderBone = preparedModel.getObjectByName(
                chosenLinkNames[chosenLinkNames.length - 1]
            )
            if (shoulderBone) {
                shoulderBoneRef.current = shoulderBone
            }
        }

        const targetIndex = findFirstExistingIndex(boneIndexByName, targetCandidates)
        const effectorIndex = findFirstExistingIndex(boneIndexByName, effectorCandidates)

        let linkIndices = []
        if (chosenLinkNames?.length) {
            linkIndices = chosenLinkNames
                .map((name) => boneIndexByName.get(name))
                .filter((index) => typeof index === 'number')
        }

        if (
            typeof targetIndex === 'number' &&
            typeof effectorIndex === 'number' &&
            linkIndices.length > 0
        ) {
            solverRef.current = new CCDIKSolver(skinnedMesh, [
                {
                    target: targetIndex,
                    effector: effectorIndex,
                    iteration: 24,
                    minAngle: 0,
                    maxAngle: Math.PI * 0.28,
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
        }

        rootRef.current.updateMatrixWorld(true)
        preparedModel.updateMatrixWorld(true)

        if (shoulderBoneRef.current) {
            shoulderBoneRef.current.getWorldPosition(shoulderWorld)
        }

        if (effectorBoneRef.current) {
            effectorBoneRef.current.getWorldPosition(effectorWorld)
            desiredWorldRef.current.copy(effectorWorld)
            smoothWorldRef.current.copy(effectorWorld)
        }

        if (shoulderBoneRef.current && effectorBoneRef.current) {
            const legLength = shoulderWorld.distanceTo(effectorWorld)
            maxReachRef.current = legLength * 1.02

            const dx = effectorWorld.x - shoulderWorld.x
            sideSignRef.current = dx <= 0 ? -1 : 1
        }

        isRigReadyRef.current = true
        onReady?.()
    }, [onReady, preparedModel])

    useFrame(() => {
        if (!rootRef.current || !isRigReadyRef.current) return

        rootRef.current.position.x = 0
        rootRef.current.position.y = -0.012
        rootRef.current.position.z = 0.3

        rootRef.current.rotation.x = 0
        rootRef.current.rotation.y = 0
        rootRef.current.rotation.z = 0

        rootRef.current.updateMatrixWorld(true)

        if (!shoulderBoneRef.current || !effectorBoneRef.current) return

        shoulderBoneRef.current.getWorldPosition(shoulderWorld)
        effectorBoneRef.current.getWorldPosition(effectorWorld)
        rootRef.current.getWorldPosition(bodyWorld)

        const pointer = cursorRef.current || { x: 0, y: 0 }
        const px = clamp(pointer.x, -1, 1)
        const py = clamp(pointer.y, -1, 1)

        camera.getWorldDirection(planeNormal).normalize()
        planeUp.copy(camera.up).normalize()
        planeRight.crossVectors(planeNormal, planeUp).normalize()
        planeUp.crossVectors(planeRight, planeNormal).normalize()

        planeCenter
            .copy(shoulderWorld)
            .addScaledVector(planeNormal, -maxReachRef.current * 0.72)
            .addScaledVector(planeUp, maxReachRef.current * 0.18)

        interactionPlane.setFromNormalAndCoplanarPoint(planeNormal, planeCenter)

        raycaster.setFromCamera({ x: px, y: py }, camera)

        if (raycaster.ray.intersectPlane(interactionPlane, planeHit)) {
            const sideSign = sideSignRef.current
            const bodyGap = 0.01

            if (sideSign < 0) {
                planeHit.x = Math.min(planeHit.x, bodyWorld.x - bodyGap)
            } else {
                planeHit.x = Math.max(planeHit.x, bodyWorld.x + bodyGap)
            }

            shoulderToCursor.copy(planeHit).sub(shoulderWorld)

            const distanceToCursor = shoulderToCursor.length()
            const maxReach = maxReachRef.current

            if (distanceToCursor <= maxReach) {
                clampedTarget.copy(planeHit)
            } else {
                shoulderToCursor.normalize()
                clampedTarget
                    .copy(shoulderWorld)
                    .addScaledVector(shoulderToCursor, maxReach)
            }

            desiredWorldRef.current.copy(clampedTarget)
        }

        const distanceToDesired = smoothWorldRef.current.distanceTo(desiredWorldRef.current)
        const maxReach = maxReachRef.current

        if (distanceToDesired < maxReach * 0.08) {
            smoothWorldRef.current.copy(desiredWorldRef.current)
        } else {
            dampVector(
                smoothWorldRef.current,
                desiredWorldRef.current,
                0.18,
                maxReach * 0.085
            )
        }

        if (ikTargetRef.current && ikTargetParentRef.current) {
            const localTarget = ikTargetParentRef.current.worldToLocal(
                smoothWorldRef.current.clone()
            )

            ikTargetRef.current.position.copy(localTarget)
            ikTargetRef.current.updateMatrixWorld(true)
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