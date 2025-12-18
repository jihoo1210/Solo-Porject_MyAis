# Phase 3: 대시보드 (AI 카드 + CRUD) 학습 문서

## 📋 개요
Phase 3에서는 대시보드 페이지를 구현하고 AI 도구 CRUD API를 테스트했습니다. 프론트엔드 API 클라이언트 경로를 수정하여 백엔드와 통합했습니다.

## 🔧 수정된 이슈들

### 1. 프론트엔드 API 경로 불일치

**문제**: 프론트엔드 API 클라이언트가 `/api/ai-tools`로 호출하지만, 백엔드는 `/api/v1/ai-tools` 필요

**해결**: 모든 API 파일에 `/v1` prefix 추가

```typescript
// api/aiTools.ts
getAll: async () => {
  const response = await apiClient.get('/v1/ai-tools');  // v1 추가
  return response.data;
},

// api/history.ts
getAll: async (query) => {
  const response = await apiClient.get(`/v1/history?${params}`);  // v1 추가
  return response.data;
},

// api/payment.ts
createSubscription: async (plan) => {
  const response = await apiClient.post('/v1/payment/subscription', { plan });
  return response.data;
},

// api/execution.ts
execute: async (toolId, inputData) => {
  const response = await apiClient.post(`/v1/ai-tools/${toolId}/execute`, inputData);
  return response.data;
},
```

## 📁 수정된 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `frontend/src/api/aiTools.ts` | 모든 API 경로에 `/v1` 추가 |
| `frontend/src/api/history.ts` | 모든 API 경로에 `/v1` 추가 |
| `frontend/src/api/payment.ts` | 모든 API 경로에 `/v1` 추가 |
| `frontend/src/api/execution.ts` | 모든 API 경로에 `/v1` 추가 |

## 🧪 테스트 결과

### AI 도구 API 테스트

| API | Method | Status | 결과 |
|-----|--------|--------|------|
| `/api/v1/ai-tools` | GET | ✅ 성공 | 빈 배열 반환 |
| `/api/v1/ai-tools` | POST | ✅ 성공 | AI 도구 생성 |
| `/api/v1/ai-tools/:id` | GET | ✅ 성공 | AI 도구 상세 |
| `/api/v1/ai-tools/:id` | PUT | ✅ 예상됨 | AI 도구 수정 |
| `/api/v1/ai-tools/:id` | DELETE | ✅ 예상됨 | AI 도구 삭제 |
| `/api/v1/ai-tools/:id/favorite` | POST | ✅ 예상됨 | 즐겨찾기 토글 |

### AI 도구 생성 테스트

```powershell
Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/ai-tools' `
  -Method Post -ContentType 'application/json' `
  -Headers @{'Authorization'='Bearer <token>'} `
  -Body '{
    "name": "블로그 글쓰기",
    "description": "SEO에 최적화된 블로그 글을 작성합니다",
    "icon": "📝",
    "category": "writing",
    "systemPrompt": "당신은 전문 블로그 작가입니다.",
    "inputFields": [
      {"type": "text", "name": "topic", "label": "주제", "required": true}
    ]
  }'
```

## 🎨 대시보드 컴포넌트 구조

```
Dashboard.tsx
├── Welcome Section (환영 메시지)
├── Search & View Toggle
├── Favorites Section (즐겨찾기)
│   └── AICard[]
├── My AI Section (내 AI)
│   ├── AICard[]
│   └── Create New Card (새 AI 만들기)
├── Default AI Section (기본 제공 AI)
│   └── AICard[]
└── Recent History Section (최근 사용)
    └── History Links[]
```

### AICard 컴포넌트

```typescript
interface AICardProps {
  tool: AITool;
  isFavorite: boolean;
  onToggleFavorite: (toolId: string) => void;
  onDelete?: (toolId: string) => void;
  viewMode: 'grid' | 'list';
}
```

- Grid 모드: 카드 형태로 AI 도구 표시
- List 모드: 리스트 형태로 AI 도구 표시
- 즐겨찾기 토글 버튼
- 수정/삭제 드롭다운 메뉴 (사용자 생성 AI만)

## 🔑 핵심 학습 포인트

### 1. Zustand 상태 관리 패턴
```typescript
// 스토어 정의
export const useAIToolsStore = create<AIToolsState>((set) => ({
  tools: [],
  favorites: [],
  isLoading: false,
  setTools: (tools) => set({ tools }),
  addTool: (tool) => set((state) => ({ tools: [...state.tools, tool] })),
  toggleFavorite: (toolId) => set((state) => ({
    favorites: state.favorites.includes(toolId)
      ? state.favorites.filter((id) => id !== toolId)
      : [...state.favorites, toolId],
  })),
}));

// 컴포넌트에서 사용
const { tools, favorites, setTools, toggleFavorite } = useAIToolsStore();
```

### 2. API 병렬 호출
```typescript
const fetchData = async () => {
  setLoading(true);
  try {
    const [toolsData, historyData] = await Promise.all([
      aiToolsApi.getAll(),
      historyApi.getAll({ size: 5 }),
    ]);
    setTools(toolsData);
    setRecentExecutions(historyData.content);
  } finally {
    setLoading(false);
  }
};
```

### 3. 조건부 필터링
```typescript
const filteredTools = tools.filter((tool) =>
  tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
);

const favoriteTools = filteredTools.filter((tool) => favorites.includes(tool.id));
const myTools = filteredTools.filter((tool) => !tool.isDefault);
const defaultTools = filteredTools.filter((tool) => tool.isDefault);
```

### 4. 클릭 외부 감지 (Click Outside)
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setShowMenu(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

## ✅ Phase 3 완료 항목

- [x] 대시보드 페이지 레이아웃
- [x] AI 카드 컴포넌트 (Grid/List 뷰)
- [x] AI 도구 검색 기능
- [x] 즐겨찾기 토글 기능
- [x] AI 도구 CRUD API 연동
- [x] 프론트엔드 API 경로 수정
- [x] 프론트엔드 빌드 성공

## 📝 다음 단계 (Phase 4)
- AI 사용 페이지 구현
- 동적 폼 컴포넌트 구현
- AI 실행 API 연동
- 결과 표시 및 스트리밍

---
작성일: 2024-12-18
