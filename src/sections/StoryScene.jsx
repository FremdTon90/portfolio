import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls, RoundedBox, Text } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const moods = {
  frontend: {
    glow: '#67e8f9',
    accent: '#60a5fa',
    text: 'UI + Code',
    panel: '#0f1b2e',
  },
  creative: {
    glow: '#a78bfa',
    accent: '#f472b6',
    text: '3D + Motion',
    panel: '#1a132e',
  },
  engineering: {
    glow: '#34d399',
    accent: '#f59e0b',
    text: 'Systems',
    panel: '#10221f',
  },
}

function Avatar({ activeIndex }) {
  const rootRef = useRef()
  const headRef = useRef()
  const bodyRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const leftForearmRef = useRef()
  const rightForearmRef = useRef()
  const pointerRef = useRef()
  const badgeRef = useRef()

  const targets = useMemo(
    () => [
      {
        bodyY: 0.04,
        headX: 0.12,
        headY: -0.1,
        rightArmZ: -0.9,
        rightForearmZ: -0.4,
        leftArmZ: 0.35,
        leftForearmZ: 0.18,
        pointerX: 1.18,
        pointerY: 0.62,
      },
      {
        bodyY: 0.12,
        headX: -0.06,
        headY: 0.18,
        rightArmZ: -0.62,
        rightForearmZ: -1.05,
        leftArmZ: 0.72,
        leftForearmZ: 0.5,
        pointerX: 1.2,
        pointerY: 0.12,
      },
      {
        bodyY: -0.02,
        headX: 0.04,
        headY: -0.12,
        rightArmZ: -1.18,
        rightForearmZ: -0.35,
        leftArmZ: 0.2,
        leftForearmZ: 0.82,
        pointerX: 1.18,
        pointerY: -0.38,
      },
    ],
    []
  )

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const target = targets[activeIndex] || targets[0]
    const smooth = 1 - Math.exp(-delta * 4)

    if (rootRef.current) {
      rootRef.current.position.y = THREE.MathUtils.lerp(
        rootRef.current.position.y,
        Math.sin(t * 1.2) * 0.06,
        smooth
      )
      rootRef.current.rotation.y = THREE.MathUtils.lerp(
        rootRef.current.rotation.y,
        Math.sin(t * 0.55) * 0.08,
        smooth
      )
    }

    if (bodyRef.current) {
      bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, target.bodyY, smooth)
    }

    if (headRef.current) {
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, target.headX, smooth)
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, target.headY, smooth)
    }

    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, target.rightArmZ, smooth)
    }

    if (rightForearmRef.current) {
      rightForearmRef.current.rotation.z = THREE.MathUtils.lerp(
        rightForearmRef.current.rotation.z,
        target.rightForearmZ,
        smooth
      )
    }

    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, target.leftArmZ, smooth)
    }

    if (leftForearmRef.current) {
      leftForearmRef.current.rotation.z = THREE.MathUtils.lerp(
        leftForearmRef.current.rotation.z,
        target.leftForearmZ,
        smooth
      )
    }

    if (pointerRef.current) {
      pointerRef.current.position.x = THREE.MathUtils.lerp(pointerRef.current.position.x, target.pointerX, smooth)
      pointerRef.current.position.y = THREE.MathUtils.lerp(pointerRef.current.position.y, target.pointerY, smooth)
      pointerRef.current.rotation.z = Math.sin(t * 2.4) * 0.06
    }

    if (badgeRef.current) {
      badgeRef.current.rotation.z += delta * 0.45
    }
  })

  return (
    <group ref={rootRef} position={[-0.55, -0.2, 0]}>
      <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.18}>
        <mesh position={[0, -1.5, -0.35]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.05, 48]} />
          <meshBasicMaterial color="#67e8f9" transparent opacity={0.12} />
        </mesh>

        <group ref={bodyRef} position={[0, 0, 0]}>
          <group ref={headRef} position={[0, 0.92, 0.02]}>
            <RoundedBox args={[0.82, 0.86, 0.68]} radius={0.18} smoothness={4}>
              <meshStandardMaterial color="#dde8ff" metalness={0.5} roughness={0.22} />
            </RoundedBox>
            <mesh position={[0, -0.03, 0.35]}>
              <boxGeometry args={[0.48, 0.16, 0.06]} />
              <meshStandardMaterial color="#67e8f9" emissive="#67e8f9" emissiveIntensity={1.8} />
            </mesh>
            <mesh position={[0, -0.3, 0.35]}>
              <boxGeometry args={[0.24, 0.03, 0.04]} />
              <meshStandardMaterial color="#dbeafe" emissive="#dbeafe" emissiveIntensity={0.5} />
            </mesh>
          </group>

          <RoundedBox args={[1.05, 1.2, 0.72]} radius={0.22} smoothness={4} position={[0, 0, 0]}>
            <meshStandardMaterial color="#111827" metalness={0.35} roughness={0.4} />
          </RoundedBox>

          <mesh ref={badgeRef} position={[0.36, 0.1, 0.4]}>
            <torusGeometry args={[0.12, 0.028, 14, 40]} />
            <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={1.2} />
          </mesh>

          <group ref={leftArmRef} position={[-0.68, 0.26, 0]}>
            <mesh position={[0, -0.34, 0]}>
              <capsuleGeometry args={[0.12, 0.58, 8, 16]} />
              <meshStandardMaterial color="#d6e4ff" metalness={0.5} roughness={0.28} />
            </mesh>
            <group ref={leftForearmRef} position={[0, -0.68, 0]}>
              <mesh position={[0, -0.28, 0]}>
                <capsuleGeometry args={[0.1, 0.5, 8, 16]} />
                <meshStandardMaterial color="#9fb8ff" metalness={0.45} roughness={0.32} />
              </mesh>
            </group>
          </group>

          <group ref={rightArmRef} position={[0.7, 0.28, 0]}>
            <mesh position={[0, -0.36, 0]}>
              <capsuleGeometry args={[0.12, 0.62, 8, 16]} />
              <meshStandardMaterial color="#d6e4ff" metalness={0.5} roughness={0.28} />
            </mesh>
            <group ref={rightForearmRef} position={[0, -0.72, 0]}>
              <mesh position={[0, -0.3, 0]}>
                <capsuleGeometry args={[0.1, 0.56, 8, 16]} />
                <meshStandardMaterial color="#9fb8ff" metalness={0.45} roughness={0.32} />
              </mesh>
              <mesh position={[0.02, -0.62, 0.04]}>
                <sphereGeometry args={[0.1, 20, 20]} />
                <meshStandardMaterial color="#67e8f9" emissive="#67e8f9" emissiveIntensity={0.8} />
              </mesh>
            </group>
          </group>
        </group>
      </Float>

      <group ref={pointerRef} position={[1.18, 0.62, 0.1]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.06, 18, 18]} />
          <meshBasicMaterial color="#f8fbff" />
        </mesh>
        <mesh position={[-0.15, 0, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.09, 0.24, 24]} />
          <meshBasicMaterial color="#67e8f9" />
        </mesh>
      </group>
    </group>
  )
}

function StoryEnvironment({ moodKey }) {
  const config = moods[moodKey] || moods.frontend

  return (
    <>
      <color attach="background" args={['#070b14']} />
      <fog attach="fog" args={['#070b14', 5.2, 10.5]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 4, 3]} intensity={1.6} color={config.glow} />
      <pointLight position={[-3, 2, 3]} intensity={1.2} color={config.accent} />
      <pointLight position={[0, -2, 2]} intensity={0.6} color="#ffffff" />

      <mesh position={[1.2, 0.15, -0.35]}>
        <RoundedBox args={[2.25, 2.25, 0.22]} radius={0.14} smoothness={4}>
          <meshStandardMaterial color={config.panel} metalness={0.22} roughness={0.48} />
        </RoundedBox>
      </mesh>

      <mesh position={[1.2, 0.15, -0.18]}>
        <planeGeometry args={[2.12, 2.12]} />
        <meshBasicMaterial color={config.glow} transparent opacity={0.06} />
      </mesh>

      <Text
        position={[1.2, 0.82, -0.05]}
        fontSize={0.18}
        maxWidth={1.55}
        anchorX="center"
        color="#f8fbff"
      >
        {config.text}
      </Text>

      <Text position={[1.2, 0.38, -0.05]} fontSize={0.1} anchorX="center" color={config.glow}>
        Story Module
      </Text>

      <mesh position={[1.2, -0.05, -0.04]}>
        <boxGeometry args={[1.48, 0.08, 0.04]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>
      <mesh position={[1.2, -0.38, -0.04]}>
        <boxGeometry args={[1.3, 0.08, 0.04]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.45} />
      </mesh>
      <mesh position={[1.02, -0.72, -0.04]}>
        <boxGeometry args={[0.62, 0.28, 0.04]} />
        <meshBasicMaterial color={config.accent} transparent opacity={0.55} />
      </mesh>
      <mesh position={[1.62, -0.72, -0.04]}>
        <boxGeometry args={[0.56, 0.28, 0.04]} />
        <meshBasicMaterial color={config.glow} transparent opacity={0.45} />
      </mesh>
    </>
  )
}

export default function StoryScene({ activeIndex = 0, mood = 'frontend' }) {
  return (
    <Canvas camera={{ position: [0, 0.55, 5], fov: 34 }} dpr={[1, 1.6]}>
      <StoryEnvironment moodKey={mood} />
      <Avatar activeIndex={activeIndex} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.35}
        maxPolarAngle={1.9}
        minPolarAngle={1.1}
      />
    </Canvas>
  )
}