import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshWobbleMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.0005;
      meshRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[3, 0.5, 16, 100]} />
      <MeshWobbleMaterial
        factor={0.2}
        speed={0.6}
        color="#ffffff"
        transparent
        opacity={0.25}
        roughness={0.15}
        metalness={0.05}
        envMapIntensity={1.2}
      />
    </mesh>
  );
}

export function ThreeBackground() {
  return (
    <Canvas style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} />
      {/* Environment map for realistic glass reflections */}
      <Environment preset="city" />
      <AnimatedMesh />
    </Canvas>
  );
} 