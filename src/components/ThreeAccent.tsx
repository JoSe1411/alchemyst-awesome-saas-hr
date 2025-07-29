import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sphere } from '@react-three/drei';

function AnimatedAccents() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[-1, 0, 0]}>
        <Sphere args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[1, 0, 0]}>
        <Sphere args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

export function ThreeAccent() {
  return (
    <Canvas style={{ position: 'absolute', bottom: 0, right: 0, width: '200px', height: '200px', zIndex: 0 }} camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <AnimatedAccents />
    </Canvas>
  );
} 