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

function Loader() {
    return null
}

function SpiderRig({ cursorRef, onReady }) {
    const { scene } = useGLTF(modelPath)
    const { camera } = useThree()

    const rootRef = useRef(null)
    const ikTargetRef = useRef(null)
    const ikTargetParentRef = useRef(null)
    const solverRef = useRef(null)

    const desiredWorldRef = useRef(new THREE.Vector3(-0.16, 0.02, 0.08))
    const smoothWorldRef = useRef(new THREE.Vector3(-0.16, 0.02, 0.08))

    const raycaster = useMemo(() => new THREE.Raycaster(), [])
    const planeHit = useMemo(() => new THREE.Vector3(), [])

    const interactionPlane = useMemo(
        () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.015),
        []
    )

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

        const targetName = 'IKTargetL002_03'
        const effectorName = 'LegSegmentFL002_021'
        const linkNames = [
            'LegSegmentEL002_020',
            'LegSegmentDL002_019',
            'LegSegmentBL002_018',
            'LegSegmentAL002_017',
        ]

        const targetBone = preparedModel.getObjectByName(targetName)

        if (targetBone?.parent) {
            ikTargetRef.current = targetBone
            ikTargetParentRef.current = targetBone.parent
        }

        const targetIndex = boneIndexByName.get(targetName)
        const effectorIndex = boneIndexByName.get(effectorName)
        const linkIndices = linkNames
            .map((name) => boneIndexByName.get(name))
            .filter((index) => typeof index === 'number')

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
                    maxAngle: Math.PI * 0.2,
                    links: linkIndices.map((index, i) => ({
                        index,
                        enabled: true,
                        rotationMin: new THREE.Vector3(
                            i === 0 ? -0.15 : -0.25,
                            -0.55,
                            -0.75
                        ),
                        rotationMax: new THREE.Vector3(
                            i === 0 ? 0.35 : 0.55,
                            0.55,
                            0.75
                        ),
                    })),
                },
            ])
        }

        onReady?.()
    }, [onReady, preparedModel])
    useFrame(() => {
        if (!rootRef.current) return

        rootRef.current.position.x = 0
        rootRef.current.position.y = -0.012
        rootRef.current.position.z = 0.3

        rootRef.current.rotation.x = 0
        rootRef.current.rotation.y = 0
        rootRef.current.rotation.z = 0

        const pointer = cursorRef.current || { x: 0, y: 0 }

        const px = clamp(pointer.x, -0.9, 0.9)
        const py = clamp(pointer.y, -0.85, 0.85)

        desiredWorldRef.current.set(
            clamp(-0.16 + px * 0.22, -0.42, 0.04),
            clamp(0.02 + py * 0.1, -0.04, 0.16),
            clamp(0.16 + (1 - (py + 1) * 0.5) * 0.08 + Math.abs(px) * 0.02, 0.08, 0.3)
        )

        smoothWorldRef.current.lerp(desiredWorldRef.current, 0.2)

        if (ikTargetRef.current && ikTargetParentRef.current) {
            const localTarget = ikTargetParentRef.current.worldToLocal(
                smoothWorldRef.current.clone()
            )

            ikTargetRef.current.position.lerp(localTarget, 0.28)
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