# MyAIs - 나만의 AI 도구 모음

> 프로젝트 기획서 v2.0  
> 작성일: 2024.12.18

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [핵심 기능](#2-핵심-기능)
3. [AI 빌더 상세](#3-ai-빌더-상세)
4. [Three.js 구현](#4-threejs-구현)
5. [결제 시스템 (TossPayments)](#5-결제-시스템-tosspayments)
6. [화면 설계](#6-화면-설계)
7. [API 명세서](#7-api-명세서)
8. [데이터 모델](#8-데이터-모델)
9. [인프라 아키텍처](#9-인프라-아키텍처)
10. [개발 TODO](#10-개발-todo)

---

## 1. 프로젝트 개요

### 1.1 서비스 컨셉

> **"프롬프트 없이 원클릭으로 사용하는 나만의 AI 도구 모음"**

매번 AI에게 프롬프트를 작성하는 번거로움을 없애고, 자주 사용하는 AI를 미리 설정해두고 간편하게 사용하는 플랫폼입니다.

### 1.2 핵심 가치

| 가치 | 설명 |
|------|------|
| **프롬프트 프리** | 미리 설정된 프롬프트로 입력만 하면 바로 결과 |
| **멀티 입력** | 텍스트 + 링크 + 이미지를 자유롭게 조합 |
| **커스텀 AI** | UI로 누구나 쉽게 나만의 AI 도구 생성 |
| **AI 성격 설정** | 톤, 말투, 전문 분야 등 세밀한 성격 커스터마이징 |
| **통합 관리** | 모든 AI 도구를 한 곳에서 관리 |

### 1.3 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | React 18, TypeScript, TailwindCSS, **Three.js** |
| **Backend** | Java 17+, Spring Boot 3.x, Spring Security, JPA |
| **Database** | H2 (개발), MariaDB (운영), Redis (캐싱) |
| **AI** | OpenAI API (GPT-4o, GPT-4o-mini, Vision) |
| **Storage** | AWS S3 (이미지 업로드) |
| **Payment** | **TossPayments (토스페이먼츠)** |
| **Infra** | AWS (EC2, RDS, S3, CloudFront), GitHub Actions |

### 1.4 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client                                  │
│       React + TypeScript + TailwindCSS + Three.js               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AWS CloudFront                             │
└─────────────────────────────┬───────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│      AWS S3             │     │      AWS EC2            │
│  (React Build Files)    │     │   (Spring Boot API)     │
└─────────────────────────┘     └────────────┬────────────┘
                                             │
                    ┌────────────────────────┼────────────────────┐
                    │                        │                    │
                    ▼                        ▼                    ▼
          ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
          │   AWS RDS       │    │   AWS S3        │    │   External APIs │
          │   (MariaDB)     │    │   (Images)      │    │                 │
          └─────────────────┘    └─────────────────┘    │ • OpenAI API    │
                                                        │ • TossPayments  │
                                                        └─────────────────┘
```

---

## 2. 핵심 기능

### 2.1 기능 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                           MyAIs                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   AI 사용    │  │  AI 빌더    │  │  히스토리    │          │
│  │              │  │              │  │              │          │
│  │ • 블로그 AI  │  │ • AI 생성   │  │ • 사용 기록  │          │
│  │ • 수학 AI   │  │ • 성격 설정  │  │ • 즐겨찾기   │          │
│  │ • 커스텀 AI │  │ • 필드 설정  │  │ • 검색       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │   구독/결제  │  │  3D 랜딩    │                            │
│  │              │  │              │                            │
│  │ • FREE/PRO  │  │ • Three.js   │                            │
│  │ • 토스결제   │  │ • 파티클    │                            │
│  └──────────────┘  └──────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 입력 타입

| 타입 | 설명 | 처리 방식 |
|------|------|----------|
| **텍스트** | 일반 텍스트 입력 | 그대로 프롬프트에 삽입 |
| **링크** | URL 입력 | 크롤링 → 텍스트 추출 → 프롬프트에 삽입 |
| **이미지** | 이미지 업로드 | S3 업로드 → Vision API로 분석 |

### 2.3 수익 모델

| 구분 | FREE | PRO (월 9,900원) |
|------|------|------------------|
| AI 생성 | 3개 | 무제한 |
| 일일 실행 | 20회 | 무제한 |
| AI 모델 | GPT-4o-mini | GPT-4o 선택 가능 |
| 이미지 분석 | ❌ | ✅ |
| 히스토리 | 7일 | 무제한 |
| 우선 처리 | ❌ | ✅ |

---

## 3. AI 빌더 상세

### 3.1 AI 성격 설정

#### 3.1.1 프리셋 성격

| 프리셋 | 설명 |
|--------|------|
| **전문가** | 전문적이고 정확한 답변 |
| **친절한 선생님** | 쉽고 친절하게 설명 |
| **창의적 작가** | 창의적이고 독창적 |
| **비즈니스 어시스턴트** | 격식있고 효율적 |
| **유머러스 친구** | 재미있고 가벼운 |
| **커스텀** | 직접 설정 |

#### 3.1.2 세부 성격 옵션

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI 성격 설정                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎭 프리셋 선택                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ 전문가  │ │ 선생님  │ │  작가   │ │ 비즈니스│ │ 커스텀  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                                 │
│  📊 말투 (Tone)                                                 │
│  격식체 ●────────────────────○─────────────────── 반말체       │
│                                                                 │
│  🎯 답변 스타일                                                 │
│  간결함 ──────────────●───────────────────────── 상세함        │
│                                                                 │
│  🌡️ 창의성 수준                                                 │
│  보수적 ────────────────────●─────────────────── 창의적        │
│                                                                 │
│  💼 전문 분야 (복수 선택)                                       │
│  [개발] [마케팅] [디자인] [비즈니스] [교육] [글쓰기]            │
│                                                                 │
│  🗣️ 역할 정의                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 10년 경력의 시니어 백엔드 개발자                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ✨ 특수 지시사항                                               │
│  ☑ 이모지 사용    ☐ 마크다운 형식    ☑ 예시 포함              │
│  ☐ 단계별 설명    ☐ 코드 블록 사용   ☐ 표/리스트 선호         │
│                                                                 │
│  🚫 금지 사항                                                   │
│  [정치적 발언 ×] [욕설 ×] [개인정보 요청 ×] [+ 추가]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.1.3 성격 설정 JSON 구조

```json
{
  "personality": {
    "preset": "expert",
    "tone": {
      "formality": 80,
      "friendliness": 40
    },
    "style": {
      "verbosity": 60,
      "creativity": 30
    },
    "expertise": ["development", "backend", "database"],
    "role": "10년 경력의 시니어 백엔드 개발자",
    "instructions": {
      "useEmoji": true,
      "useMarkdown": true,
      "includeExamples": true,
      "stepByStep": false,
      "useCodeBlocks": true,
      "preferTables": false
    },
    "restrictions": ["정치적 발언", "욕설", "개인정보 요청"]
  }
}
```

### 3.2 입력 필드 타입

| 타입 | 아이콘 | 설명 |
|------|--------|------|
| `text` | 📝 | 한 줄 텍스트 |
| `textarea` | 📄 | 여러 줄 텍스트 |
| `select` | 📋 | 드롭다운 선택 |
| `multiselect` | ☑️ | 다중 선택 |
| `tags` | 🏷️ | 태그 입력 |
| `url` | 🔗 | URL 입력 + 크롤링 |
| `image` | 🖼️ | 이미지 업로드 |
| `slider` | ─●─ | 슬라이더 |

### 3.3 고급 설정

```
┌─────────────────────────────────────────────────────────────────┐
│                        고급 설정                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🤖 AI 모델                                                     │
│  ○ GPT-4o          (가장 똑똑함, PRO 전용)                     │
│  ● GPT-4o-mini     (빠르고 저렴함, 일반 용도 추천)             │
│                                                                 │
│  🌡️ Temperature (창의성)                                        │
│  정확함 0 ──────────────●─────────────────────── 2 창의적       │
│                       0.7                                       │
│                                                                 │
│  📊 Max Tokens (최대 출력 길이)                                 │
│  [2048        ] 토큰                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Three.js 구현

### 4.1 Three.js 사용 위치

| 위치 | 효과 | 설명 |
|------|------|------|
| **랜딩 페이지 히어로** | 3D 파티클 애니메이션 | AI/뉴런 네트워크 시각화 |
| **로딩 화면** | 3D 로딩 스피너 | AI 처리 중 애니메이션 |
| **대시보드 배경** | 미묘한 파티클 배경 | 분위기 연출 (선택) |

### 4.2 랜딩 페이지 Three.js 구현

#### 4.2.1 파티클 시스템 (뉴런 네트워크)

```typescript
// components/three/NeuralNetwork.tsx
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface ParticleProps {
  count?: number;
}

function Particles({ count = 2000 }: ParticleProps) {
  const ref = useRef<THREE.Points>(null);
  
  // 파티클 위치 생성
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [count]);

  // 애니메이션
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
        color="#6366f1"
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function Connections() {
  const ref = useRef<THREE.LineSegments>(null);
  
  const lines = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const nodeCount = 50;
    const nodes: THREE.Vector3[] = [];
    
    // 노드 생성
    for (let i = 0; i < nodeCount; i++) {
      nodes.push(new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      ));
    }
    
    // 가까운 노드끼리 연결
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
        color="#8b5cf6" 
        transparent 
        opacity={0.3} 
      />
    </lineSegments>
  );
}

export default function NeuralNetwork() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        pointerEvents: 'none'
      }}
    >
      <ambientLight intensity={0.5} />
      <Particles count={3000} />
      <Connections />
    </Canvas>
  );
}
```

#### 4.2.2 랜딩 페이지 히어로 섹션

```typescript
// pages/Landing.tsx
import NeuralNetwork from '../components/three/NeuralNetwork';

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-gray-950 overflow-hidden">
      {/* Three.js 배경 */}
      <div className="absolute inset-0 z-0">
        <NeuralNetwork />
      </div>
      
      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-950/50 to-gray-950 z-10" />
      
      {/* 콘텐츠 */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4">
        <h1 className="text-5xl md:text-7xl font-bold text-white text-center mb-6">
          프롬프트 없이,
          <br />
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            원클릭으로
          </span>
        </h1>
        
        <p className="text-xl text-gray-400 text-center mb-8 max-w-2xl">
          나만의 AI 도구를 만들고 사용하세요.
          <br />
          매번 프롬프트를 작성할 필요 없이, 미리 설정해둔 AI를 바로 사용합니다.
        </p>
        
        <div className="flex gap-4">
          <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all">
            🚀 무료로 시작하기
          </button>
          <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all backdrop-blur">
            데모 보기
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 4.2.3 로딩 애니메이션 (AI 처리 중)

```typescript
// components/three/AILoadingSpinner.tsx
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
```

### 4.3 Three.js 패키지 설정

```json
// package.json
{
  "dependencies": {
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.92.0",
    "@types/three": "^0.160.0"
  }
}
```

---

## 5. 결제 시스템 (TossPayments)

### 5.1 결제 플로우

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  구독하기    │────▶│  요금제 선택 │────▶│  결제 준비   │
│    클릭      │     │              │     │  API 호출    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
       ┌──────────────────────────────────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ TossPayments │────▶│  결제 완료   │────▶│  결제 승인   │
│   결제 위젯  │     │   콜백       │     │  API 호출    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
       ┌──────────────────────────────────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│  구독 상태   │────▶│  PRO 기능    │
│   업데이트   │     │   활성화     │
└──────────────┘     └──────────────┘
```

### 5.2 요금제

| 플랜 | 가격 | 결제 주기 |
|------|------|----------|
| FREE | ₩0 | - |
| PRO 월간 | ₩9,900/월 | 매월 자동 결제 |
| PRO 연간 | ₩99,000/년 | 매년 자동 결제 (17% 할인) |

### 5.3 TossPayments 연동

#### 5.3.1 Backend - 결제 준비 API

```java
// PaymentController.java
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {
    
    private final PaymentService paymentService;
    
    @PostMapping("/prepare")
    public ApiResponse<PaymentPrepareResponse> preparePayment(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody PaymentPrepareRequest request) {
        
        return ApiResponse.success(
            paymentService.preparePayment(user.getId(), request)
        );
    }
    
    @PostMapping("/confirm")
    public ApiResponse<PaymentConfirmResponse> confirmPayment(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody PaymentConfirmRequest request) {
        
        return ApiResponse.success(
            paymentService.confirmPayment(user.getId(), request)
        );
    }
    
    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("TossPayments-Signature") String signature) {
        
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok().build();
    }
}
```

#### 5.3.2 Backend - 결제 서비스

```java
// PaymentService.java
@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {
    
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final TossPaymentsClient tossPaymentsClient;
    
    @Value("${tosspayments.secret-key}")
    private String secretKey;
    
    public PaymentPrepareResponse preparePayment(Long userId, PaymentPrepareRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        
        String orderId = "ORDER_" + UUID.randomUUID().toString().substring(0, 8);
        
        int amount = switch (request.getPlanType()) {
            case MONTHLY -> 9900;
            case YEARLY -> 99000;
        };
        
        Payment payment = Payment.builder()
            .user(user)
            .orderId(orderId)
            .amount(amount)
            .planType(request.getPlanType())
            .status(PaymentStatus.PENDING)
            .build();
        
        paymentRepository.save(payment);
        
        return PaymentPrepareResponse.builder()
            .orderId(orderId)
            .amount(amount)
            .orderName(request.getPlanType() == PlanType.MONTHLY 
                ? "MyAIs PRO 월간 구독" 
                : "MyAIs PRO 연간 구독")
            .customerName(user.getName())
            .customerEmail(user.getEmail())
            .build();
    }
    
    public PaymentConfirmResponse confirmPayment(Long userId, PaymentConfirmRequest request) {
        Payment payment = paymentRepository.findByOrderId(request.getOrderId())
            .orElseThrow(() -> new CustomException(ErrorCode.PAYMENT_NOT_FOUND));
        
        // 토스페이먼츠 결제 승인 API 호출
        TossPaymentResponse tossResponse = tossPaymentsClient.confirmPayment(
            request.getPaymentKey(),
            request.getOrderId(),
            request.getAmount()
        );
        
        // 결제 정보 업데이트
        payment.confirm(request.getPaymentKey(), tossResponse.getApprovedAt());
        
        // 사용자 구독 상태 업데이트
        User user = payment.getUser();
        LocalDateTime expiresAt = payment.getPlanType() == PlanType.MONTHLY
            ? LocalDateTime.now().plusMonths(1)
            : LocalDateTime.now().plusYears(1);
        
        user.upgradeToPro(expiresAt);
        
        return PaymentConfirmResponse.builder()
            .paymentId(payment.getId())
            .status("SUCCESS")
            .subscriptionExpiresAt(expiresAt)
            .build();
    }
    
    public void handleWebhook(String payload, String signature) {
        // 웹훅 시그니처 검증
        if (!verifyWebhookSignature(payload, signature)) {
            throw new CustomException(ErrorCode.INVALID_WEBHOOK_SIGNATURE);
        }
        
        TossWebhookPayload webhookPayload = parseWebhook(payload);
        
        switch (webhookPayload.getEventType()) {
            case "PAYMENT_STATUS_CHANGED" -> handlePaymentStatusChanged(webhookPayload);
            case "BILLING_KEY_DELETED" -> handleBillingKeyDeleted(webhookPayload);
        }
    }
}
```

#### 5.3.3 Backend - TossPayments 클라이언트

```java
// TossPaymentsClient.java
@Component
@RequiredArgsConstructor
public class TossPaymentsClient {
    
    private final RestTemplate restTemplate;
    
    @Value("${tosspayments.secret-key}")
    private String secretKey;
    
    @Value("${tosspayments.api-url}")
    private String apiUrl;
    
    public TossPaymentResponse confirmPayment(String paymentKey, String orderId, int amount) {
        String url = apiUrl + "/v1/payments/confirm";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Basic " + Base64.getEncoder()
            .encodeToString((secretKey + ":").getBytes()));
        
        Map<String, Object> body = Map.of(
            "paymentKey", paymentKey,
            "orderId", orderId,
            "amount", amount
        );
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        
        ResponseEntity<TossPaymentResponse> response = restTemplate.exchange(
            url,
            HttpMethod.POST,
            request,
            TossPaymentResponse.class
        );
        
        return response.getBody();
    }
    
    public void cancelPayment(String paymentKey, String cancelReason) {
        String url = apiUrl + "/v1/payments/" + paymentKey + "/cancel";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Basic " + Base64.getEncoder()
            .encodeToString((secretKey + ":").getBytes()));
        
        Map<String, Object> body = Map.of("cancelReason", cancelReason);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        
        restTemplate.exchange(url, HttpMethod.POST, request, Void.class);
    }
}
```

#### 5.3.4 Frontend - 결제 페이지

```typescript
// pages/Payment.tsx
import { useEffect, useRef, useState } from 'react';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import { useAuth } from '../hooks/useAuth';
import { paymentApi } from '../api/payment';

const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY;

type PlanType = 'MONTHLY' | 'YEARLY';

interface Plan {
  type: PlanType;
  name: string;
  price: number;
  priceLabel: string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    type: 'MONTHLY',
    name: 'PRO 월간',
    price: 9900,
    priceLabel: '₩9,900/월',
    features: [
      '무제한 AI 생성',
      '무제한 실행',
      'GPT-4o 사용 가능',
      '이미지 분석 기능',
      '무제한 히스토리',
      '우선 처리',
    ],
  },
  {
    type: 'YEARLY',
    name: 'PRO 연간',
    price: 99000,
    priceLabel: '₩99,000/년',
    features: [
      '월간 플랜의 모든 기능',
      '17% 할인 (2개월 무료)',
      '연간 결제 할인',
    ],
    popular: true,
  },
];

export default function Payment() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('MONTHLY');
  const [isLoading, setIsLoading] = useState(false);
  const tossPayments = useRef<any>(null);

  useEffect(() => {
    loadTossPayments(CLIENT_KEY).then((tp) => {
      tossPayments.current = tp;
    });
  }, []);

  const handlePayment = async () => {
    if (!tossPayments.current || !user) return;
    
    setIsLoading(true);
    
    try {
      // 1. 결제 준비 API 호출
      const { orderId, amount, orderName } = await paymentApi.prepare({
        planType: selectedPlan,
      });
      
      // 2. 토스페이먼츠 결제창 호출
      await tossPayments.current.requestPayment('카드', {
        amount,
        orderId,
        orderName,
        customerName: user.name,
        customerEmail: user.email,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error) {
      console.error('Payment error:', error);
      alert('결제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-2">PRO로 업그레이드</h1>
        <p className="text-gray-600 text-center mb-8">
          더 강력한 AI 기능을 무제한으로 사용하세요
        </p>
        
        {/* 요금제 선택 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.type}
              onClick={() => setSelectedPlan(plan.type)}
              className={`relative p-6 rounded-2xl cursor-pointer transition-all ${
                selectedPlan === plan.type
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-300'
                  : 'bg-white text-gray-900 hover:shadow-lg'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded-full">
                  인기
                </span>
              )}
              
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <p className="text-3xl font-bold mb-4">{plan.priceLabel}</p>
              
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span>✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* 결제 버튼 */}
        <button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl font-semibold text-lg transition-all"
        >
          {isLoading ? '처리 중...' : '결제하기'}
        </button>
        
        {/* 안내 문구 */}
        <p className="text-center text-gray-500 text-sm mt-4">
          결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
          <br />
          구독은 언제든지 취소할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
```

#### 5.3.5 Frontend - 결제 성공 페이지

```typescript
// pages/PaymentSuccess.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentApi } from '../api/payment';
import AILoadingSpinner from '../components/three/AILoadingSpinner';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      if (!paymentKey || !orderId || !amount) {
        setStatus('error');
        return;
      }

      try {
        await paymentApi.confirm({
          paymentKey,
          orderId,
          amount: parseInt(amount),
        });
        setStatus('success');
        
        // 3초 후 대시보드로 이동
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } catch (error) {
        console.error('Payment confirmation failed:', error);
        setStatus('error');
      }
    };

    confirmPayment();
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <AILoadingSpinner size={150} />
        <p className="mt-4 text-lg text-gray-600">결제를 확인하고 있습니다...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">결제 실패</h1>
        <p className="text-gray-600 mb-6">결제 처리 중 문제가 발생했습니다.</p>
        <button
          onClick={() => navigate('/payment')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg"
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">결제 완료!</h1>
      <p className="text-gray-600 mb-2">PRO 플랜이 활성화되었습니다.</p>
      <p className="text-gray-500 text-sm">잠시 후 대시보드로 이동합니다...</p>
    </div>
  );
}
```

### 5.4 결제 관련 API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/payments/prepare` | 결제 준비 |
| `POST` | `/api/v1/payments/confirm` | 결제 승인 |
| `GET` | `/api/v1/payments/history` | 결제 내역 조회 |
| `POST` | `/api/v1/payments/cancel` | 구독 취소 |
| `GET` | `/api/v1/subscription` | 구독 상태 조회 |
| `POST` | `/api/v1/payments/webhook` | 토스 웹훅 처리 |

### 5.5 환경 변수

```yaml
# application-prod.yml
tosspayments:
  client-key: ${TOSS_CLIENT_KEY}
  secret-key: ${TOSS_SECRET_KEY}
  api-url: https://api.tosspayments.com
  webhook-secret: ${TOSS_WEBHOOK_SECRET}
```

```env
# Frontend .env
VITE_TOSS_CLIENT_KEY=test_ck_xxx
```

---

## 6. 화면 설계

### 6.1 사이트맵

```
MyAIs
├── / (랜딩 페이지 - Three.js)
├── /login
├── /signup
├── /dashboard
├── /ai/[id] (AI 사용)
├── /ai/new (AI 빌더)
├── /ai/[id]/edit
├── /history
├── /payment (결제 페이지)
├── /payment/success
├── /payment/fail
├── /settings
└── /settings/subscription (구독 관리)
```

### 6.2 랜딩 페이지

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [Logo] MyAIs                              [로그인] [시작하기]  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│           ╔═══════════════════════════════════════╗            │
│           ║                                       ║            │
│           ║     Three.js 3D                       ║            │
│           ║     뉴런 네트워크 파티클 애니메이션   ║            │
│           ║                                       ║            │
│           ╚═══════════════════════════════════════╝            │
│                                                                 │
│              프롬프트 없이, 원클릭으로                          │
│                 나만의 AI를 만들고 사용하세요                   │
│                                                                 │
│                    [ 🚀 무료로 시작하기 ]                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✨ 주요 기능                                                   │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │     🎯      │  │     🛠️      │  │     📊      │             │
│  │  프롬프트   │  │   AI 빌더   │  │  멀티 입력  │             │
│  │    프리     │  │             │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  💰 요금제                                                      │
│                                                                 │
│  ┌──────────────────┐     ┌──────────────────┐                 │
│  │      FREE        │     │     PRO          │                 │
│  │      ₩0          │     │   ₩9,900/월      │                 │
│  │                  │     │                  │                 │
│  │ • AI 3개 생성    │     │ • 무제한 AI 생성 │                 │
│  │ • 일 20회 실행   │     │ • 무제한 실행    │                 │
│  │ • 기본 모델      │     │ • GPT-4o 사용    │                 │
│  │                  │     │ • 이미지 분석    │                 │
│  │   [시작하기]     │     │   [구독하기]     │                 │
│  └──────────────────┘     └──────────────────┘                 │
│                                                                 │
│               TossPayments 안전 결제                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 구독 관리 페이지

```
┌─────────────────────────────────────────────────────────────────┐
│  [← 설정]  구독 관리                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  현재 플랜                                               │   │
│  │                                                         │   │
│  │  🌟 PRO 월간                                            │   │
│  │                                                         │   │
│  │  다음 결제일: 2025년 1월 18일                           │   │
│  │  결제 금액: ₩9,900                                      │   │
│  │                                                         │   │
│  │  [결제 수단 변경]  [구독 취소]                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  📜 결제 내역                                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  2024.12.18   PRO 월간 구독   ₩9,900   완료   [영수증] │   │
│  │  2024.11.18   PRO 월간 구독   ₩9,900   완료   [영수증] │   │
│  │  2024.10.18   PRO 월간 구독   ₩9,900   완료   [영수증] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🔄 플랜 변경                                                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PRO 연간으로 변경하면 17% 할인!                         │  │
│  │  월 ₩9,900 → 연 ₩99,000 (월 ₩8,250)                     │  │
│  │                                           [변경하기]     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. API 명세서

### 7.1 인증 API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/signup` | 회원가입 |
| `POST` | `/api/v1/auth/login` | 로그인 |
| `POST` | `/api/v1/auth/logout` | 로그아웃 |
| `GET` | `/api/v1/auth/me` | 내 정보 |

### 7.2 AI 도구 API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/ai-tools` | AI 도구 목록 |
| `GET` | `/api/v1/ai-tools/:id` | AI 도구 상세 |
| `POST` | `/api/v1/ai-tools` | AI 도구 생성 |
| `PUT` | `/api/v1/ai-tools/:id` | AI 도구 수정 |
| `DELETE` | `/api/v1/ai-tools/:id` | AI 도구 삭제 |

### 7.3 AI 실행 API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/ai-tools/:id/execute` | AI 실행 |
| `POST` | `/api/v1/ai-tools/:id/execute/stream` | AI 실행 (스트리밍) |

### 7.4 결제 API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/payments/prepare` | 결제 준비 |
| `POST` | `/api/v1/payments/confirm` | 결제 승인 |
| `GET` | `/api/v1/payments/history` | 결제 내역 |
| `POST` | `/api/v1/payments/cancel` | 구독 취소 |
| `GET` | `/api/v1/subscription` | 구독 상태 |
| `POST` | `/api/v1/payments/webhook` | 웹훅 |

### 7.5 히스토리 API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/history` | 히스토리 목록 |
| `GET` | `/api/v1/history/:id` | 히스토리 상세 |
| `DELETE` | `/api/v1/history/:id` | 히스토리 삭제 |

---

## 8. 데이터 모델

### 8.1 ERD

```
┌─────────────────┐       ┌─────────────────────────┐
│      User       │       │         AITool          │
├─────────────────┤       ├─────────────────────────┤
│ id (PK)         │──┐    │ id (PK)                 │
│ email           │  │    │ user_id (FK)            │
│ password        │  └───▶│ name                    │
│ name            │       │ description             │
│ subscription    │       │ personality (JSON)      │
│ subscription_   │       │ system_prompt           │
│   expires_at    │       │ input_fields (JSON)     │
│ created_at      │       │ ...                     │
└────────┬────────┘       └─────────────────────────┘
         │
         │
         ▼
┌─────────────────┐       ┌─────────────────────────┐
│    Payment      │       │       Execution         │
├─────────────────┤       ├─────────────────────────┤
│ id (PK)         │       │ id (PK)                 │
│ user_id (FK)    │       │ user_id (FK)            │
│ order_id        │       │ ai_tool_id (FK)         │
│ payment_key     │       │ input_data (JSON)       │
│ amount          │       │ output (TEXT)           │
│ status          │       │ created_at              │
│ plan_type       │       └─────────────────────────┘
│ created_at      │
│ paid_at         │
└─────────────────┘
```

### 8.2 Payment 테이블

```sql
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    order_id VARCHAR(100) NOT NULL UNIQUE,
    payment_key VARCHAR(200),
    amount INT NOT NULL,
    status ENUM('PENDING', 'COMPLETED', 'CANCELLED', 'FAILED') DEFAULT 'PENDING',
    plan_type ENUM('MONTHLY', 'YEARLY') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 9. 인프라 아키텍처

### 9.1 AWS 구성

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Route 53 → CloudFront → S3 (Frontend)                         │
│                       → EC2 (Backend API)                       │
│                                                                 │
│  EC2 ──┬── RDS (MariaDB)                                       │
│        ├── ElastiCache (Redis)                                 │
│        ├── S3 (Images)                                         │
│        ├── OpenAI API                                          │
│        └── TossPayments API                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. 개발 TODO

### Phase 1: 프로젝트 셋업 (4일)

| Task | 시간 |
|------|------|
| Spring Boot + React 프로젝트 생성 | 4h |
| TailwindCSS + Three.js 설정 | 4h |
| MariaDB 설정 | 3h |
| AWS S3 연동 | 3h |
| OpenAI API 클라이언트 | 4h |

### Phase 2: 인증 시스템 (3일)

| Task | 시간 |
|------|------|
| User 엔티티 + JWT 설정 | 6h |
| 로그인/회원가입 API | 4h |
| 로그인/회원가입 UI | 6h |

### Phase 3: 대시보드 (3일)

| Task | 시간 |
|------|------|
| 대시보드 레이아웃 | 4h |
| AI 카드 컴포넌트 | 3h |
| AI 도구 CRUD API | 4h |

### Phase 4: AI 사용 페이지 (5일)

| Task | 시간 |
|------|------|
| 동적 폼 컴포넌트 | 6h |
| URL 크롤링 서비스 | 5h |
| 이미지 업로드 (S3) | 5h |
| AI 실행 API | 6h |
| 결과 표시 + 스트리밍 | 6h |

### Phase 5: AI 빌더 (7일)

| Task | 시간 |
|------|------|
| 스텝 레이아웃 | 4h |
| 기본 정보 폼 | 3h |
| 성격 설정 UI | 8h |
| 프롬프트 에디터 | 5h |
| 입력 필드 빌더 | 10h |
| 고급 설정 + 미리보기 | 6h |

### Phase 6: 히스토리 (3일)

| Task | 시간 |
|------|------|
| 히스토리 API | 3h |
| 히스토리 UI | 4h |
| 필터/검색 기능 | 3h |

### Phase 7: 결제 시스템 (4일)

| Task | 시간 |
|------|------|
| Payment 엔티티 | 2h |
| TossPayments 연동 | 8h |
| 결제 API | 6h |
| 결제 UI | 6h |
| 구독 관리 페이지 | 4h |

### Phase 8: Three.js 랜딩 (3일)

| Task | 시간 |
|------|------|
| 랜딩 레이아웃 | 4h |
| 파티클 애니메이션 | 8h |
| 로딩 스피너 | 4h |

### Phase 9: 배포 (3일)

| Task | 시간 |
|------|------|
| AWS 인프라 구성 | 6h |
| CI/CD 파이프라인 | 4h |
| 도메인 + SSL | 2h |

---

## 일정 요약

| Phase | 내용 | 기간 | 누적 |
|-------|------|------|------|
| Phase 1 | 프로젝트 셋업 | 4일 | 4일 |
| Phase 2 | 인증 시스템 | 3일 | 7일 |
| Phase 3 | 대시보드 | 3일 | 10일 |
| Phase 4 | AI 사용 페이지 | 5일 | 15일 |
| Phase 5 | AI 빌더 | 7일 | 22일 |
| Phase 6 | 히스토리 | 3일 | 25일 |
| Phase 7 | 결제 시스템 | 4일 | 29일 |
| Phase 8 | Three.js 랜딩 | 3일 | 32일 |
| Phase 9 | 배포 | 3일 | **35일** |

**총 예상 기간: 약 5주 (35일)**

---

## 마일스톤

```
Week 2: MVP v1 - 인증 + 대시보드 + AI 사용
    │
    ▼
Week 4: MVP v2 - AI 빌더 + 히스토리
    │
    ▼
Week 5: 🚀 정식 출시 - 결제 + Three.js 랜딩 + 배포
```

---

*문서 끝*
