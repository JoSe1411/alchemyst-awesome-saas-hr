import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Sphere, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

type IconType = 'users' | 'clock' | 'workflow' | 'zap' | 'message' | 'barchart';

function AnimatedIcon({ type }: { type: IconType }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += hovered ? 0.02 : 0.005;
    }
  });

  let geometry;
  switch (type) {
    case 'users':
      geometry = <Sphere args={[1, 32, 32]} />;
      break;
    case 'clock':
      geometry = <Cylinder args={[1, 1, 0.2, 32]} />;
      break;
    case 'workflow':
      geometry = <Box args={[1, 1, 1]} />;
      break;
    case 'zap':
      geometry = <Cylinder args={[0.5, 1.5, 0.2, 3]} />;
      break;
    case 'message':
      geometry = <Sphere args={[1, 32, 32]} />;
      break;
    case 'barchart':
      geometry = <Box args={[0.5, 1.5, 0.5]} />;
      break;
  }

  return (
    <mesh ref={meshRef} scale={hovered ? 1.1 : 1} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      {geometry}
      <meshStandardMaterial color="#3b82f6" />
    </mesh>
  );
}

export function ThreeIcon({ type }: { type: IconType }) {
  return (
    <Canvas style={{ width: '24px', height: '24px' }} camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <AnimatedIcon type={type} />
    </Canvas>
  );
} 