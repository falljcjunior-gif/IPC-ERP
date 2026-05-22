import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

const MODULE_POSITIONS = [
  { pos: [0, 0, 0],      label: 'ERP',        color: '#064E3B', scale: 1.4 },
  { pos: [3, 1.2, -1],   label: 'CRM',        color: '#10B981', scale: 0.9 },
  { pos: [-3, 1, -0.5],  label: 'Finance',    color: '#059669', scale: 0.9 },
  { pos: [2.5, -1.5, 0], label: 'RH',         color: '#34D399', scale: 0.85 },
  { pos: [-2.5, -1.4, 0.5],'label': 'Stock',  color: '#6EE7B7', scale: 0.85 },
  { pos: [0.2, 2.4, 0.5], label: 'Production',color: '#A7F3D0', scale: 0.8 },
];

const CONNECTIONS = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
  [1, 3], [2, 4], [3, 5],
];

function ModuleNode({ position, color, scale, label }) {
  const meshRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.3;
      meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    }
    if (glowRef.current) {
      glowRef.current.intensity = 1.5 + Math.sin(t * 2) * 0.5;
    }
  });

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh ref={meshRef} scale={scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={color}
            metalness={0.4}
            roughness={0.2}
            emissive={color}
            emissiveIntensity={0.15}
          />
        </mesh>
        <pointLight ref={glowRef} color={color} intensity={1.5} distance={3} />
      </Float>
    </group>
  );
}

function DataFlow({ start, end }) {
  const lineRef = useRef();
  const particleRef = useRef();

  const points = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = s.clone().lerp(e, 0.5).add(new THREE.Vector3(0, 0.5, 0));
    const curve = new THREE.QuadraticBezierCurve3(s, mid, e);
    return curve.getPoints(30);
  }, [start, end]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  useFrame((state) => {
    if (particleRef.current) {
      const t = (state.clock.elapsedTime * 0.4) % 1;
      const idx = Math.floor(t * (points.length - 1));
      const pt = points[Math.min(idx, points.length - 1)];
      particleRef.current.position.set(pt.x, pt.y, pt.z);
    }
  });

  return (
    <group>
      <line geometry={geometry}>
        <lineBasicMaterial color="#10B981" opacity={0.25} transparent linewidth={1} />
      </line>
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

function Scene({ scrollProgress = 0 }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.rotation.y = t * 0.08 + scrollProgress * Math.PI * 0.3;
      groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.05 + scrollProgress * 0.2;
      const zoom = 1 + scrollProgress * 0.4;
      groupRef.current.scale.setScalar(zoom);
    }
  });

  return (
    <group ref={groupRef}>
      {MODULE_POSITIONS.map((m, i) => (
        <ModuleNode key={i} position={m.pos} color={m.color} scale={m.scale} label={m.label} />
      ))}
      {CONNECTIONS.map(([a, b], i) => (
        <DataFlow key={i} start={MODULE_POSITIONS[a].pos} end={MODULE_POSITIONS[b].pos} />
      ))}
    </group>
  );
}

export default function ERPOrbitalScene({ scrollProgress = 0, style = {} }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent', ...style }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-4, -3, -3]} intensity={0.3} color="#10B981" />
      <pointLight position={[0, 0, 6]} intensity={0.8} color="#064E3B" />
      <Scene scrollProgress={scrollProgress} />
    </Canvas>
  );
}
