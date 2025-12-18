# Phase 1: 프로젝트 셋업 학습 문서

## 📋 개요
MyAIs 프로젝트의 기본 구조를 구축하는 Phase 1을 완료했습니다. Spring Boot 백엔드와 React + TypeScript 프론트엔드를 설정하고, TailwindCSS와 Three.js를 통합했습니다.

## 🛠 기술 스택

### Backend
- **Spring Boot 3.5.0**: 최신 안정 버전의 Spring Boot 사용
- **Java 17+**: LTS 버전
- **Spring Security + JWT**: 인증 시스템
- **Spring Data JPA**: 데이터베이스 접근 계층
- **H2 Database**: 개발용 인메모리 데이터베이스
- **Lombok**: 보일러플레이트 코드 감소

### Frontend
- **React 18**: 최신 React 버전
- **TypeScript**: 타입 안정성
- **Vite**: 빠른 개발 서버 및 빌드
- **TailwindCSS v4**: 유틸리티 기반 CSS (새로운 문법 적용)
- **Three.js + React Three Fiber**: 3D 그래픽
- **Zustand**: 상태 관리
- **React Router DOM v6**: 라우팅
- **React Hook Form + Zod**: 폼 관리 및 유효성 검사

## 📁 프로젝트 구조

### Backend 구조
```
backend/
├── src/main/java/com/myais/
│   ├── domain/
│   │   ├── user/           # 사용자 도메인
│   │   │   ├── entity/
│   │   │   ├── repository/
│   │   │   ├── service/
│   │   │   ├── controller/
│   │   │   └── dto/
│   │   ├── aitool/         # AI 도구 도메인
│   │   ├── execution/      # 실행 이력 도메인
│   │   ├── favorite/       # 즐겨찾기 도메인
│   │   └── payment/        # 결제 도메인
│   ├── global/
│   │   ├── config/         # 설정 클래스
│   │   ├── security/       # 보안 설정
│   │   └── exception/      # 예외 처리
│   └── infra/
│       ├── openai/         # OpenAI API 클라이언트
│       ├── s3/             # AWS S3 서비스
│       └── crawler/        # URL 크롤러
└── src/main/resources/
    └── application.yml     # 설정 파일
```

### Frontend 구조
```
frontend/
├── src/
│   ├── api/                # API 클라이언트
│   ├── components/
│   │   ├── layout/         # 레이아웃 컴포넌트
│   │   ├── ai/             # AI 관련 컴포넌트
│   │   ├── builder/        # AI 빌더 컴포넌트
│   │   └── three/          # Three.js 컴포넌트
│   ├── pages/              # 페이지 컴포넌트
│   ├── store/              # Zustand 스토어
│   ├── types/              # TypeScript 타입
│   └── App.tsx             # 앱 진입점
└── index.html
```

## 🔑 핵심 학습 내용

### 1. TailwindCSS v4 마이그레이션
TailwindCSS v4에서는 설정 방식이 크게 변경되었습니다.

**변경 전 (v3)**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**변경 후 (v4)**
```css
@import "tailwindcss";

@theme {
  --color-primary-600: #4F46E5;
}
```

PostCSS 설정도 변경됨:
```js
// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

### 2. JWT 인증 구현
Spring Security와 JWT를 사용한 인증 시스템:

```java
// JwtTokenProvider.java
public String createAccessToken(String email) {
    Date now = new Date();
    Date expiry = new Date(now.getTime() + accessTokenValidity);

    return Jwts.builder()
            .setSubject(email)
            .setIssuedAt(now)
            .setExpiration(expiry)
            .signWith(secretKey, SignatureAlgorithm.HS256)
            .compact();
}
```

### 3. Three.js + React Three Fiber
3D 파티클 애니메이션 구현:

```tsx
function Particles({ count = 2000 }) {
  const mesh = useRef<Points>(null);

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
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#6366F1" />
    </points>
  );
}
```

### 4. Zustand 상태 관리
간단하고 효율적인 상태 관리:

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        set({ user, accessToken, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    { name: 'auth-storage' }
  )
);
```

### 5. OpenAI API 스트리밍
SSE(Server-Sent Events)를 사용한 스트리밍 응답:

```java
public Flux<String> streamChat(String systemPrompt, String userMessage) {
    return WebClient.create(apiUrl)
        .post()
        .uri("/chat/completions")
        .header("Authorization", "Bearer " + apiKey)
        .bodyValue(requestBody)
        .retrieve()
        .bodyToFlux(String.class)
        .filter(data -> !data.equals("[DONE]"))
        .map(this::extractContent);
}
```

## 🐛 해결한 문제들

### 1. AWS S3Client 클래스명 충돌
- **문제**: `S3Client` 클래스명이 AWS SDK의 `software.amazon.awssdk.services.s3.S3Client`와 충돌
- **해결**: 클래스명을 `S3Service`로 변경

### 2. TypeScript 빌드 에러
- **문제**: `verbatimModuleSyntax` 옵션으로 인한 타입 import 에러
- **해결**: tsconfig에서 `isolatedModules: true`로 변경

### 3. TailwindCSS v4 호환성
- **문제**: v3 문법이 v4에서 동작하지 않음
- **해결**: 새로운 `@import "tailwindcss"` 및 `@theme` 문법 적용

### 4. React Router 경로 우선순위
- **문제**: `/ai/:id`가 `/ai/new`보다 먼저 매칭됨
- **해결**: `/ai/new` 경로를 `/ai/:id` 위에 배치

## ✅ 완료된 항목

- [x] Spring Boot 프로젝트 구조 생성
- [x] React + Vite + TypeScript 프로젝트 구조 생성
- [x] TailwindCSS v4 설정
- [x] Three.js + React Three Fiber 통합
- [x] JWT 인증 시스템 구현
- [x] 전역 예외 처리
- [x] OpenAI API 클라이언트
- [x] AWS S3 업로드 서비스
- [x] URL 크롤러 서비스
- [x] Zustand 상태 관리 설정
- [x] API 클라이언트 (Axios)
- [x] 레이아웃 컴포넌트 (Header, Sidebar, MainLayout)
- [x] 모든 페이지 컴포넌트 구현
- [x] AI 컴포넌트 (AICard, AIForm, AIResult)
- [x] Builder 컴포넌트 (FieldEditor, PersonalityEditor, PromptEditor)
- [x] TossPayments 결제 시스템 기본 구현

## 📝 다음 단계 (Phase 2)
- 인증 시스템 테스트 및 디버깅
- 로그인/회원가입 플로우 완성
- 토큰 리프레시 로직 구현
- 사용자 프로필 관리

---
작성일: 2024-12-18
