# Phase 2: 인증 시스템 테스트 및 디버깅 학습 문서

## 📋 개요
Phase 2에서는 Spring Security와 JWT를 사용한 인증 시스템을 테스트하고 디버깅했습니다. 백엔드 API와 프론트엔드 통합을 검증하고, 발견된 문제들을 수정했습니다.

## 🔧 수정된 이슈들

### 1. ExecutionRepository JPQL 쿼리 오류

**문제**: H2 데이터베이스에서 TEXT 컬럼에 `LOWER()` 함수를 사용할 수 없음

**에러 메시지**:
```
Parameter 1 of function 'lower()' has type 'STRING',
but argument is of type 'java.lang.String' mapped to '3001'
```

**해결**:
```java
// 변경 전 (JPQL)
@Query("SELECT e FROM Execution e WHERE e.user.id = :userId " +
       "AND (LOWER(e.output) LIKE LOWER(CONCAT('%', :keyword, '%')))")

// 변경 후 (Native Query)
@Query(value = "SELECT * FROM executions e WHERE e.user_id = :userId " +
       "AND (LOWER(CAST(e.output AS VARCHAR)) LIKE LOWER(CONCAT('%', :keyword, '%')))",
       nativeQuery = true)
```

### 2. Spring Security 경로 불일치

**문제**: SecurityConfig에서 `/api/auth/**`만 허용했지만, Controller는 `/api/v1/auth/**` 사용

**해결**:
```java
// SecurityConfig.java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/v1/auth/**").permitAll()  // v1 추가
    .requestMatchers("/h2-console/**").permitAll()
    .anyRequest().authenticated()
)
```

### 3. 프론트엔드 API 경로 불일치

**문제**: 프론트엔드가 `/auth/login`으로 호출하지만, 백엔드는 `/v1/auth/login` 필요

**해결**:
```typescript
// api/auth.ts
login: async (data: LoginRequest) => {
  const response = await apiClient.post('/v1/auth/login', data);  // v1 추가
  return response.data;
},
```

### 4. API 응답 래퍼 처리

**문제**: 백엔드가 `{ success, data, message }` 형태로 응답하지만, 프론트엔드가 직접 데이터를 기대

**해결**:
```typescript
// api/client.ts
apiClient.interceptors.response.use(
  (response) => {
    // ApiResponse 래퍼 제거
    if (response.data && 'success' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  // ... error handler
);
```

## 🧪 테스트 결과

### 백엔드 API 테스트

| API | Method | Status | 결과 |
|-----|--------|--------|------|
| `/api/v1/auth/signup` | POST | ✅ 성공 | 사용자 생성 + 토큰 발급 |
| `/api/v1/auth/login` | POST | ✅ 성공 | 토큰 발급 |
| `/api/v1/auth/me` | GET | ✅ 성공 | 사용자 정보 반환 |
| `/api/v1/auth/refresh` | POST | ✅ 성공 | 새 토큰 발급 |
| `/api/v1/auth/logout` | POST | ✅ 성공 | 로그아웃 메시지 |
| 중복 이메일 가입 | POST | ✅ 409 Conflict | 에러 처리 정상 |

### PowerShell 테스트 명령어

```powershell
# 회원가입
Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/auth/signup' `
  -Method Post -ContentType 'application/json' `
  -Body '{"email":"test@example.com","password":"Password123","name":"TestUser"}'

# 로그인
Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/auth/login' `
  -Method Post -ContentType 'application/json' `
  -Body '{"email":"test@example.com","password":"Password123"}'

# 사용자 정보 조회
Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/auth/me' `
  -Method Get -Headers @{'Authorization'='Bearer <token>'}

# 토큰 갱신
Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/auth/refresh' `
  -Method Post -ContentType 'application/json' `
  -Body '{"refreshToken":"<refresh_token>"}'
```

## 📁 수정된 파일

1. **ExecutionRepository.java**: Native Query로 변경
2. **SecurityConfig.java**: 경로 패턴 수정
3. **api/auth.ts**: API 경로에 `/v1` 추가
4. **api/client.ts**: 응답 래퍼 처리 인터셉터 추가

## 🔑 핵심 학습 포인트

### 1. JPQL vs Native Query
- JPQL은 엔티티 기반이므로 필드명 사용
- Native Query는 테이블 기반이므로 컬럼명 사용
- TEXT/CLOB 컬럼에 문자열 함수 적용 시 CAST 필요

### 2. Spring Security 경로 매칭
- `requestMatchers`는 정확한 경로 패턴 필요
- API 버전 관리 시 SecurityConfig도 함께 업데이트

### 3. API 응답 일관성
- 백엔드 ApiResponse 래퍼와 프론트엔드 기대값 일치 필요
- Axios 인터셉터로 응답 정규화 처리

### 4. JWT 토큰 구조
```
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1766028429,
  "exp": 1766114829  // 24시간 후
}
```

## ✅ Phase 2 완료 항목

- [x] 백엔드 서버 시작 오류 수정
- [x] 인증 API 엔드포인트 테스트
- [x] 토큰 발급 및 검증 확인
- [x] 토큰 갱신 기능 확인
- [x] 프론트엔드 API 클라이언트 수정
- [x] 프론트엔드 빌드 성공
- [x] 프론트엔드 개발 서버 실행

## 📝 다음 단계 (Phase 3)
- 대시보드 페이지 구현
- AI 도구 카드 컴포넌트
- AI 도구 CRUD API 연동
- 즐겨찾기 기능

---
작성일: 2024-12-18
