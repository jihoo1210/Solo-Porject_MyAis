# Phase 8: Three.js 랜딩 페이지 학습 문서

## 📋 개요
Phase 8에서는 Three.js와 React Three Fiber를 사용한 인터랙티브 랜딩 페이지를 확인했습니다. 3D 뉴럴 네트워크 애니메이션이 배경으로 표시됩니다.

## 🏗️ 랜딩 페이지 구조

```
Landing.tsx
├── NeuralNetwork (3D 배경 애니메이션)
│   └── Canvas (React Three Fiber)
│       ├── PerspectiveCamera
│       ├── Particles (포인트 클라우드)
│       ├── Connections (라인 연결)
│       └── OrbitControls
├── Hero Section
│   ├── 타이틀 + 설명
│   └── CTA 버튼
├── Features Section
│   └── Feature Cards (3개)
├── How It Works Section
│   └── Step Cards (3개)
├── Pricing Section
│   └── Plan Cards (FREE/PRO)
└── Footer CTA
```

## 🔧 NeuralNetwork 컴포넌트

### React Three Fiber 설정
```typescript
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

const NeuralNetwork: React.FC = () => {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ambientLight intensity={0.5} />
        <Particles />
        <Connections />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};
```

### 파티클 시스템
```typescript
const Particles: React.FC = () => {
  const points = useRef<THREE.Points>(null);
  const particleCount = 200;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;     // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10; // z
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#6366f1" transparent opacity={0.8} />
    </points>
  );
};
```

### 연결선 렌더링
```typescript
const Connections: React.FC = () => {
  const lines = useRef<THREE.LineSegments>(null);

  const linePositions = useMemo(() => {
    const pos: number[] = [];
    // 가까운 파티클들 사이에 선 연결
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const distance = calculateDistance(particles[i], particles[j]);
        if (distance < threshold) {
          pos.push(...particles[i], ...particles[j]);
        }
      }
    }
    return new Float32Array(pos);
  }, []);

  return (
    <lineSegments ref={lines}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={linePositions.length / 3}
          array={linePositions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#6366f1" transparent opacity={0.2} />
    </lineSegments>
  );
};
```

## 🔧 애니메이션 기법

### useFrame 훅
```typescript
useFrame((state, delta) => {
  // state.clock.elapsedTime - 경과 시간
  // delta - 프레임 간 시간 차이

  // 회전 애니메이션
  mesh.current.rotation.x += delta * 0.5;

  // 사인파 움직임
  mesh.current.position.y = Math.sin(state.clock.elapsedTime) * 0.5;
});
```

### OrbitControls 설정
```typescript
<OrbitControls
  enableZoom={false}      // 줌 비활성화
  enablePan={false}       // 패닝 비활성화
  autoRotate              // 자동 회전
  autoRotateSpeed={0.5}   // 회전 속도
  maxPolarAngle={Math.PI / 2}  // 수직 회전 제한
/>
```

## 🔧 반응형 디자인

### 그라데이션 배경
```typescript
<div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900">
  <NeuralNetwork />
  {/* 콘텐츠 */}
</div>
```

### 글래스모피즘 카드
```typescript
<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
  {/* 카드 내용 */}
</div>
```

### 텍스트 그라데이션
```typescript
<h1 className="text-5xl font-bold bg-gradient-to-r from-white to-primary-300 bg-clip-text text-transparent">
  나만의 AI를 만들어보세요
</h1>
```

## 🔧 Feature 섹션

```typescript
const features = [
  {
    icon: '🤖',
    title: '커스텀 AI 생성',
    description: '코딩 없이 나만의 AI 도구를 만들 수 있습니다.',
  },
  {
    icon: '⚡',
    title: '빠른 실행',
    description: 'GPT-4o 기반의 빠르고 정확한 응답을 받아보세요.',
  },
  {
    icon: '🔒',
    title: '안전한 보안',
    description: '모든 데이터는 암호화되어 안전하게 보관됩니다.',
  },
];

{features.map((feature, index) => (
  <motion.div
    key={index}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <FeatureCard {...feature} />
  </motion.div>
))}
```

## 🔧 Pricing 섹션

```typescript
const plans = [
  {
    name: 'Free',
    price: '₩0',
    features: ['AI 3개 생성', '일 20회 실행', 'GPT-4o-mini', '7일 히스토리'],
    cta: '무료로 시작하기',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '₩9,900',
    period: '/월',
    features: ['무제한 AI 생성', '무제한 실행', 'GPT-4o', '이미지 분석', '무제한 히스토리'],
    cta: '프로 시작하기',
    highlighted: true,
  },
];
```

## 🔑 핵심 학습 포인트

### 1. React Three Fiber 기본 구조
```typescript
import { Canvas } from '@react-three/fiber';

// Canvas 컴포넌트가 Three.js 씬을 생성
<Canvas>
  {/* 모든 3D 요소는 Canvas 안에 */}
  <mesh>
    <boxGeometry />
    <meshStandardMaterial color="orange" />
  </mesh>
</Canvas>
```

### 2. BufferGeometry로 대량 파티클 처리
```typescript
// Float32Array로 위치 데이터 생성
const positions = new Float32Array(count * 3);

<bufferGeometry>
  <bufferAttribute
    attach="attributes-position"
    count={count}
    array={positions}
    itemSize={3}  // x, y, z
  />
</bufferGeometry>
```

### 3. 성능 최적화
```typescript
// useMemo로 계산 캐싱
const positions = useMemo(() => generatePositions(), []);

// instancing으로 동일 메시 대량 렌더링
<instancedMesh args={[geometry, material, count]}>
  {/* ... */}
</instancedMesh>
```

### 4. drei 헬퍼 라이브러리
```typescript
import {
  OrbitControls,    // 마우스 컨트롤
  PerspectiveCamera, // 카메라
  Environment,      // 환경맵
  Float,           // 떠다니는 애니메이션
  Text3D,          // 3D 텍스트
} from '@react-three/drei';
```

## ✅ Phase 8 완료 항목

- [x] Landing 페이지 레이아웃
- [x] NeuralNetwork 3D 배경 컴포넌트
- [x] React Three Fiber 통합
- [x] 파티클 시스템 구현
- [x] 연결선 렌더링
- [x] 자동 회전 애니메이션
- [x] Hero 섹션 + CTA
- [x] Features 섹션
- [x] How It Works 섹션
- [x] Pricing 섹션
- [x] 반응형 디자인
- [x] 글래스모피즘 스타일

## 📝 다음 단계 (Phase 9)
- 프로덕션 배포
- 환경 변수 설정
- CI/CD 파이프라인
- 도메인 연결

---
작성일: 2024-12-18
