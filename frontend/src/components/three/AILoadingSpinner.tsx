import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Torus, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function SpinningRings() {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);
  const sphere = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (ring1.current) {
      ring1.current.rotation.x = t * 1.5;
      ring1.current.rotation.y = t * 0.5;
    }
    if (ring2.current) {
      ring2.current.rotation.x = t * 0.5;
      ring2.current.rotation.z = t * 1.5;
    }
    if (ring3.current) {
      ring3.current.rotation.y = t * 1.5;
      ring3.current.rotation.z = t * 0.5;
    }
    if (sphere.current) {
      sphere.current.scale.setScalar(1 + Math.sin(t * 3) * 0.1);
    }
  });

  return (
    <>
      <Torus ref={ring1} args={[1, 0.02, 16, 100]}>
        <meshBasicMaterial color="#6366f1" />
      </Torus>
      <Torus ref={ring2} args={[0.8, 0.02, 16, 100]}>
        <meshBasicMaterial color="#8b5cf6" />
      </Torus>
      <Torus ref={ring3} args={[0.6, 0.02, 16, 100]}>
        <meshBasicMaterial color="#a78bfa" />
      </Torus>
      <Sphere ref={sphere} args={[0.2, 32, 32]}>
        <meshBasicMaterial color="#c4b5fd" />
      </Sphere>
    </>
  );
}

interface AILoadingSpinnerProps {
  size?: number;
}

export default function AILoadingSpinner({ size = 200 }: AILoadingSpinnerProps) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.5} />
        <SpinningRings />
      </Canvas>
    </div>
  );
}
