import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useUIStore } from '../../store';

interface ParticleProps {
  count?: number;
  isDark?: boolean;
}

function Particles({ count = 2000, isDark = false }: ParticleProps) {
  const ref = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.getElapsedTime() * 0.05;
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.075;
    }
  });

  return (
    <Points ref={ref} positions={particles} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={isDark ? "#818CF8" : "#6366f1"}
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

interface ConnectionsProps {
  isDark?: boolean;
}

function Connections({ isDark = false }: ConnectionsProps) {
  const ref = useRef<THREE.LineSegments>(null);

  const lines = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const nodeCount = 50;
    const nodes: THREE.Vector3[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8
        )
      );
    }

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 2) {
          points.push(nodes[i], nodes[j]);
        }
      }
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.getElapsedTime() * 0.03;
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <lineSegments ref={ref} geometry={lines}>
      <lineBasicMaterial
        color={isDark ? "#A5B4FC" : "#8b5cf6"}
        transparent
        opacity={isDark ? 0.2 : 0.3}
      />
    </lineSegments>
  );
}

interface NeuralNetworkProps {
  opacity?: number;
  particleCount?: number;
}

export default function NeuralNetwork({ opacity = 1, particleCount = 3000 }: NeuralNetworkProps) {
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity,
      }}
    >
      <ambientLight intensity={0.5} />
      <Particles count={particleCount} isDark={isDark} />
      <Connections isDark={isDark} />
    </Canvas>
  );
}
