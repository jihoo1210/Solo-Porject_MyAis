# Phase 5: AI 빌더 학습 문서

## 📋 개요
Phase 5에서는 AI 빌더 페이지와 관련 컴포넌트들을 확인했습니다. 사용자가 코드 없이 AI 도구를 만들 수 있는 노코드 빌더가 구현되어 있습니다.

## 🏗️ 컴포넌트 구조

```
AIBuilder
├── Header (타이틀 + 뒤로가기)
├── Progress Steps (5단계)
├── Step Content
│   ├── Basic (아이콘, 이름, 설명)
│   ├── Fields (FieldEditor)
│   ├── Personality (PersonalityEditor)
│   ├── Prompt (PromptEditor)
│   └── Preview (BuilderPreview)
└── Navigation Buttons
```

## 🔧 빌더 단계별 구성

### Step 1: Basic (기본 정보)
- 아이콘 선택 (이모지 12종)
- AI 도구 이름
- 설명

### Step 2: Fields (입력 필드)
- 필드 추가/삭제/정렬
- 필드 타입 선택 (text, textarea, select, image, url)
- 플레이스홀더 설정
- 필수 여부 설정
- select 타입: 옵션 입력
- url 타입: 도움말 입력

### Step 3: Personality (AI 성격)
- 프리셋 선택 (professional, friendly, creative, academic, casual)
- 톤 슬라이더 (formal, friendly, creative)
- 전문 분야 태그
- 커스텀 지시사항

### Step 4: Prompt (프롬프트)
- 시스템 프롬프트 직접 입력
- 출력 형식 설정 (text, markdown, json, list)
- 스트리밍 옵션
- 최대 길이 설정

### Step 5: Preview (미리보기)
- 카드 미리보기
- 입력 폼 미리보기
- 시스템 프롬프트 미리보기
- 저장 버튼

## 🔧 FieldEditor 컴포넌트

### 지원 필드 타입
```typescript
const FIELD_TYPES = [
  { value: 'text', label: '텍스트' },
  { value: 'textarea', label: '긴 텍스트' },
  { value: 'select', label: '선택' },
  { value: 'image', label: '이미지' },
  { value: 'url', label: 'URL' },
];
```

### 필드 구조
```typescript
interface InputField {
  name: string;        // 필드 ID
  label: string;       // 표시 라벨
  type: 'text' | 'textarea' | 'select' | 'image' | 'url';
  required: boolean;   // 필수 여부
  placeholder?: string; // 플레이스홀더
  options?: string[];  // select 타입 옵션
  helpText?: string;   // 도움말
}
```

### 필드 조작 함수
```typescript
const addField = () => {
  const newField = {
    name: `field_${Date.now()}`,
    label: '새 필드',
    type: 'text',
    required: false,
  };
  onChange([...fields, newField]);
};

const removeField = (index: number) => {
  if (fields.length <= 1) return;  // 최소 1개 필드 유지
  onChange(fields.filter((_, i) => i !== index));
};

const moveField = (fromIndex: number, toIndex: number) => {
  const newFields = [...fields];
  const [movedField] = newFields.splice(fromIndex, 1);
  newFields.splice(toIndex, 0, movedField);
  onChange(newFields);
};
```

## 🔧 PersonalityEditor 컴포넌트

### 프리셋 옵션
```typescript
const PRESETS = [
  { value: 'professional', label: '전문가', icon: '💼' },
  { value: 'friendly', label: '친근함', icon: '😊' },
  { value: 'creative', label: '창의적', icon: '🎨' },
  { value: 'academic', label: '학술적', icon: '📚' },
  { value: 'casual', label: '캐주얼', icon: '☕' },
];
```

### 톤 슬라이더
```typescript
interface Tone {
  formal: number;   // 0-100
  friendly: number; // 0-100
  creative: number; // 0-100
}
```

### 전문 분야 태그
```typescript
const EXPERTISE_OPTIONS = [
  '마케팅', '기술', '금융', '교육', '의료',
  '법률', '예술', '과학', '비즈니스', '창업',
];
```

## 🔧 PromptEditor 컴포넌트

### 출력 설정
```typescript
interface OutputConfig {
  format: 'text' | 'markdown' | 'json' | 'list';
  streaming: boolean;
  maxLength: number;
}
```

### 변수 삽입 도우미
```typescript
const insertVariable = (variableName: string) => {
  const variable = `{{${variableName}}}`;
  onSystemPromptChange(systemPrompt + variable);
};
```

## 🔧 시스템 프롬프트 자동 생성

```typescript
const buildSystemPrompt = () => {
  const parts = [];

  // 프리셋 적용
  if (personality.preset) {
    parts.push(presetPrompts[personality.preset]);
  }

  // 톤 조정
  if (personality.tone.formal > 70) {
    parts.push('격식 있는 문체를 사용합니다.');
  }

  // 전문 분야
  if (personality.expertise.length > 0) {
    parts.push(`전문 분야: ${personality.expertise.join(', ')}`);
  }

  // 사용자 지시사항
  if (personality.customInstructions) {
    parts.push(personality.customInstructions);
  }

  // 사용자 프롬프트
  if (systemPrompt) {
    parts.push(systemPrompt);
  }

  return parts.join('\n\n');
};
```

## 🔑 핵심 학습 포인트

### 1. 스텝 기반 폼 UI
```typescript
const [step, setStep] = useState<'basic' | 'fields' | 'personality' | 'prompt' | 'preview'>('basic');

const steps = [
  { id: 'basic', label: '기본 정보' },
  { id: 'fields', label: '입력 필드' },
  // ...
];

// 단계 렌더링
{step === 'basic' && <BasicStep />}
{step === 'fields' && <FieldEditor />}
// ...
```

### 2. 상태 끌어올리기 (Lifting State Up)
```typescript
// 부모 컴포넌트에서 상태 관리
const [inputFields, setInputFields] = useState<InputField[]>([...]);

// 자식 컴포넌트로 전달
<FieldEditor fields={inputFields} onChange={setInputFields} />
```

### 3. 동적 폼 필드 생성
```typescript
// 필드 타입에 따른 조건부 렌더링
{field.type === 'select' && (
  <input
    value={field.options?.join(', ') || ''}
    onChange={(e) => updateField(index, {
      options: e.target.value.split(',').map(s => s.trim())
    })}
  />
)}
```

### 4. 배열 상태 불변성 유지
```typescript
// 불변성 유지하며 배열 수정
const updateField = (index: number, updates: Partial<InputField>) => {
  const newFields = [...fields];  // 복사
  newFields[index] = { ...newFields[index], ...updates };  // 병합
  onChange(newFields);
};
```

## ✅ Phase 5 완료 항목

- [x] AIBuilder 페이지 (5단계 폼)
- [x] FieldEditor (입력 필드 편집)
- [x] PersonalityEditor (AI 성격 설정)
- [x] PromptEditor (프롬프트 편집)
- [x] BuilderPreview (미리보기)
- [x] 시스템 프롬프트 자동 생성
- [x] AI 도구 저장 API 연동
- [x] 프론트엔드 빌드 성공

## 📝 다음 단계 (Phase 6)
- 히스토리 페이지 구현
- 실행 기록 목록
- 필터링 및 검색
- 즐겨찾기 기능

---
작성일: 2024-12-18
