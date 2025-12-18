# Phase 4: AI 사용 페이지 학습 문서

## 📋 개요
Phase 4에서는 AI 사용 페이지와 관련 컴포넌트들을 확인하고 테스트했습니다. 동적 폼 생성, AI 실행 API, 스트리밍 결과 표시 기능이 구현되어 있습니다.

## 🏗️ 컴포넌트 구조

### AIUse 페이지 (`pages/AIUse.tsx`)

```
AIUse
├── Header (AI 도구 정보 + 설정 버튼)
├── AIForm (동적 입력 폼)
└── AIResult / AILoadingSpinner (결과 표시)
```

### 핵심 기능

1. **동적 폼 생성**: AI 도구의 `inputFields` 설정에 따라 자동으로 폼 필드 생성
2. **AI 실행**: 입력 데이터를 백엔드 API로 전송하여 AI 응답 받기
3. **스트리밍 지원**: SSE를 통한 실시간 응답 스트리밍
4. **결과 다양한 형식 지원**: text, markdown, json, list 등

## 🔧 AIForm 컴포넌트

### 지원되는 필드 타입

| 타입 | 설명 | 특수 기능 |
|------|------|----------|
| `text` | 단일 텍스트 입력 | - |
| `textarea` | 여러 줄 텍스트 | - |
| `select` | 선택 드롭다운 | options 배열 사용 |
| `image` | 이미지 업로드 | S3 업로드 통합 |
| `url` | URL 입력 | 크롤링 버튼 포함 |

### 코드 예시

```typescript
const renderField = (field: InputField) => {
  switch (field.type) {
    case 'text':
      return <input type="text" {...register(field.name)} />;
    case 'textarea':
      return <textarea {...register(field.name)} rows={4} />;
    case 'select':
      return (
        <select {...register(field.name)}>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case 'image':
      return <ImageUploader onChange={(url) => setValue(field.name, url)} />;
    case 'url':
      return <UrlInput onCrawl={handleUrlCrawl} />;
  }
};
```

## 🔧 AIResult 컴포넌트

### 출력 형식별 렌더링

```typescript
const renderResult = () => {
  switch (outputConfig?.format) {
    case 'markdown':
      return <div dangerouslySetInnerHTML={{ __html: parseMarkdown(result) }} />;
    case 'json':
      return <pre>{JSON.stringify(JSON.parse(result), null, 2)}</pre>;
    case 'list':
      const items = result.split('\n').filter(Boolean);
      return <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>;
    default:
      return <div>{result}</div>;
  }
};
```

### 기능 버튼
- 복사 (Clipboard API)
- 다운로드 (Blob 생성)
- 다시 실행

## 🔧 백엔드 ExecutionService

### AI 실행 플로우

```
1. 사용자 인증 확인
2. AI 도구 조회
3. 입력 데이터 → 사용자 메시지 변환
4. OpenAI API 호출
5. 실행 기록 저장
6. 결과 반환
```

### 입력 필드 처리

```java
private String buildUserMessage(AITool aiTool, Map<String, Object> inputs) {
    for (InputField field : fields) {
        Object value = inputs.get(field.getName());
        switch (field.getType()) {
            case "url" -> {
                String content = crawlerService.crawl(value.toString());
                message.append("## ").append(field.getLabel()).append("\n");
                message.append(content);
            }
            default -> {
                message.append("## ").append(field.getLabel()).append("\n");
                message.append(value.toString());
            }
        }
    }
    return message.toString();
}
```

### 스트리밍 실행

```java
@PostMapping(value = "/ai-tools/{id}/execute/stream",
             produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter executeStream(@PathVariable UUID id, @RequestBody ExecuteRequest request) {
    SseEmitter emitter = new SseEmitter(300000L); // 5분 타임아웃

    new Thread(() -> {
        openAIClient.chatStream(systemPrompt, userMessage, model, temperature, maxTokens, emitter);
    }).start();

    return emitter;
}
```

## 🧪 테스트 결과

### API 테스트

| API | Method | Status | 결과 |
|-----|--------|--------|------|
| `/api/v1/ai-tools/:id/execute` | POST | ⚠️ 401 | OpenAI API 키 필요 |
| `/api/v1/ai-tools/:id/execute/stream` | POST | ⚠️ 예상됨 | SSE 스트리밍 |
| `/api/v1/history` | GET | ✅ 성공 | 페이지네이션 지원 |
| `/api/v1/history/:id` | GET | ✅ 예상됨 | 상세 조회 |
| `/api/v1/history/:id` | DELETE | ✅ 예상됨 | 삭제 |
| `/api/v1/history/:id/favorite` | POST | ✅ 예상됨 | 즐겨찾기 토글 |

### 테스트 명령어

```powershell
# AI 실행 (OpenAI API 키 필요)
Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/ai-tools/{toolId}/execute' `
  -Method Post -ContentType 'application/json' `
  -Headers @{'Authorization'='Bearer <token>'} `
  -Body '{"inputs":{"topic":"AI technology"}}'

# 히스토리 조회
Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/history?page=0&size=20' `
  -Method Get `
  -Headers @{'Authorization'='Bearer <token>'}
```

## 🔑 핵심 학습 포인트

### 1. React Hook Form 동적 폼

```typescript
const { register, handleSubmit, setValue, watch } = useForm();

// 동적 필드 등록
<input {...register(field.name, { required: field.required })} />

// 프로그래매틱 값 설정
const handleFileUpload = async (file: File) => {
  const url = await uploadFile(file);
  setValue(fieldName, url);  // 폼 값 직접 설정
};
```

### 2. SSE (Server-Sent Events) 스트리밍

```typescript
const handleStream = async () => {
  const response = await fetch('/api/v1/ai-tools/id/execute/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    // SSE 형식: "data: {...}\n\n"
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const data = JSON.parse(line.slice(5));
        setResult(prev => prev + data.content);
      }
    }
  }
};
```

### 3. SseEmitter (Spring)

```java
SseEmitter emitter = new SseEmitter(300000L);

emitter.onCompletion(() -> log.info("SSE completed"));
emitter.onTimeout(() -> emitter.complete());

new Thread(() -> {
    try {
        for (String chunk : streamData) {
            emitter.send(SseEmitter.event()
                .data(Map.of("content", chunk))
                .id(String.valueOf(id++)));
        }
        emitter.complete();
    } catch (IOException e) {
        emitter.completeWithError(e);
    }
}).start();

return emitter;
```

### 4. 파일 업로드 처리

```typescript
const handleFileUpload = async (fieldName: string, file: File) => {
  setUploadingField(fieldName);
  try {
    const response = await utilsApi.uploadImage(file);
    setValue(fieldName, response.url);  // S3 URL 저장
  } finally {
    setUploadingField(null);
  }
};
```

## ✅ Phase 4 완료 항목

- [x] AIUse 페이지 레이아웃
- [x] AIForm 동적 폼 컴포넌트
- [x] AIResult 결과 표시 컴포넌트
- [x] AILoadingSpinner Three.js 애니메이션
- [x] 이미지 업로드 기능
- [x] URL 크롤링 기능
- [x] 스트리밍 지원
- [x] 백엔드 ExecutionService
- [x] ExecutionController API

## ⚠️ 알려진 제한사항

- OpenAI API 키가 설정되지 않으면 AI 실행 실패 (401 Unauthorized)
- application.yml에서 `openai.api-key` 설정 필요

## 📝 다음 단계 (Phase 5)
- AI 빌더 페이지 구현
- 입력 필드 에디터
- 프롬프트 에디터
- 성격 설정 에디터

---
작성일: 2024-12-18
