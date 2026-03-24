import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const THEMES = [
  {
    id: "frontend",
    label: "Frontend",
    color: "#74f7ff",
    position: [0.72, 0.38, 1.05],
    rotation: [-0.25, 0.45, 0.18],
    scale: [0.7, 0.42, 0.16],
  },
  {
    id: "fullstack",
    label: "Fullstack",
    color: "#a78bfa",
    position: [-0.8, 0.18, 0.96],
    rotation: [0.16, -0.7, -0.22],
    scale: [0.72, 0.4, 0.16],
  },
  {
    id: "cad",
    label: "CAD / 3D",
    color: "#f7c86b",
    position: [0.42, -0.78, 0.98],
    rotation: [0.72, 0.18, -0.15],
    scale: [0.78, 0.44, 0.16],
  },
  {
    id: "audio",
    label: "Audio",
    color: "#59f0bb",
    position: [-0.48, -0.72, 1.02],
    rotation: [0.55, -0.35, 0.26],
    scale: [0.66, 0.38, 0.16],
  },
  {
    id: "creative",
    label: "Creative Tech",
    color: "#ff89c6",
    position: [0.04, 0.95, 0.92],
    rotation: [-0.9, 0.08, 0.12],
    scale: [0.62, 0.34, 0.16],
  },
];

function StarField() {
  const stars = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 220; i += 1) {
      pts.push([
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 18,
      ]);
    }
    return pts;
  }, []);

  return (
    <group>
      {stars.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshBasicMaterial color="#d7fbff" transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Continent({
  id,
  label,
  color,
  position,
  rotation,
  scale,
  active,
  onSelect,
}) {
  const groupRef = useRef(null);

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;
    const pulse = active ? 1 + Math.sin(t * 2.4) * 0.045 : 1;

    groupRef.current.scale.set(
      scale[0] * pulse,
      scale[1] * pulse,
      scale[2] * pulse
    );
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      onPointerEnter={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={() => {
        document.body.style.cursor = "default";
      }}
    >
      {/* sichtbare Fläche */}
      <mesh>
        <sphereGeometry args={[0.34, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 2.2 : 1.0}
          metalness={0.45}
          roughness={0.22}
          transparent
          opacity={0.96}
        />
      </mesh>

      {/* Glow */}
      <mesh scale={1.28}>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={active ? 0.18 : 0.08}
        />
      </mesh>

      {/* größere unsichtbare Klickfläche */}
      <mesh visible={false}>
        <sphereGeometry args={[0.48, 24, 24]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

function Globe({ activeTheme, onSelect }) {
  const globeRef = useRef(null);
  const shellRef = useRef(null);
  const atmosphereRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    return () => {
      document.body.style.cursor = "default";
    };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    pointer.current.x = THREE.MathUtils.lerp(pointer.current.x, state.pointer.x, 0.04);
    pointer.current.y = THREE.MathUtils.lerp(pointer.current.y, state.pointer.y, 0.04);

    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.18;
      globeRef.current.rotation.y += pointer.current.x * 0.01;

      globeRef.current.rotation.x = THREE.MathUtils.lerp(
        globeRef.current.rotation.x,
        pointer.current.y * 0.16,
        0.04
      );
    }

    if (shellRef.current) {
      shellRef.current.rotation.y += delta * 0.03;
    }

    if (atmosphereRef.current) {
      const s = 1 + Math.sin(t * 1.6) * 0.015;
      atmosphereRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={globeRef}>
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[1.62, 64, 64]} />
        <meshBasicMaterial color="#4fe4ff" transparent opacity={0.06} />
      </mesh>

      <mesh ref={shellRef}>
        <sphereGeometry args={[1.35, 64, 64]} />
        <meshStandardMaterial
          color="#081120"
          emissive="#0a2540"
          emissiveIntensity={0.55}
          metalness={0.28}
          roughness={0.24}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[1.38, 48, 48]} />
        <meshBasicMaterial color="#86f7ff" transparent opacity={0.07} wireframe />
      </mesh>

      <mesh rotation={[0.55, 0.55, 0.12]}>
        <torusGeometry args={[1.65, 0.014, 20, 180]} />
        <meshStandardMaterial
          color="#7ef9ff"
          emissive="#37dcff"
          emissiveIntensity={1.1}
          metalness={0.8}
          roughness={0.18}
        />
      </mesh>

      <mesh rotation={[-0.78, 0.2, 1.05]}>
        <torusGeometry args={[1.86, 0.01, 20, 180]} />
        <meshStandardMaterial
          color="#a78bfa"
          emissive="#7b61ff"
          emissiveIntensity={0.95}
          metalness={0.82}
          roughness={0.2}
        />
      </mesh>

      {THEMES.map((theme) => (
        <Continent
          key={theme.id}
          {...theme}
          active={activeTheme === theme.id}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

export default function ShowcaseScene({ activeTheme, onSelect }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 5.6], fov: 42 }}>
      <color attach="background" args={["#040816"]} />
      <fog attach="fog" args={["#040816", 6, 14]} />

      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 4, 3]} intensity={2.2} color="#7ef9ff" />
      <directionalLight position={[-4, -2, 3]} intensity={1.5} color="#a78bfa" />
      <pointLight position={[0, 0, 3]} intensity={2.3} color="#ffffff" />
      <pointLight position={[2, 1, -1]} intensity={1.5} color="#59dfff" />
      <pointLight position={[-2, -1, -1]} intensity={1.3} color="#8d72ff" />

      <StarField />
      <Globe activeTheme={activeTheme} onSelect={onSelect} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        rotateSpeed={0.55}
        minPolarAngle={Math.PI / 2.25}
        maxPolarAngle={Math.PI / 1.8}
      />
    </Canvas>
  );
}