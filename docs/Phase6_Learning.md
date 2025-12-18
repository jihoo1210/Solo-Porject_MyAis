# Phase 6: 히스토리 학습 문서

## 📋 개요
Phase 6에서는 실행 기록(히스토리) 페이지를 확인했습니다. 페이지네이션, 검색, 필터링 기능이 구현되어 있습니다.

## 🏗️ 컴포넌트 구조

```
History
├── Header (타이틀)
├── Filters
│   ├── Search Input
│   └── AI Tool Filter (Select)
├── History List
│   └── Execution Items[]
└── Pagination
```

## 🔧 주요 기능

### 1. 페이지네이션
```typescript
const [page, setPage] = useState(0);
const [totalPages, setTotalPages] = useState(0);

const fetchHistory = async () => {
  const response = await historyApi.getAll({ page, size: 10 });
  setExecutions(response.content);
  setTotalPages(response.totalPages);
};
```

### 2. AI 도구별 필터링
```typescript
const [selectedTool, setSelectedTool] = useState<string>('all');

// 고유 도구 목록 추출
const uniqueTools = Array.from(
  new Map(
    executions
      .filter((e) => e.aiTool)
      .map((e) => [e.aiTool!.id, e.aiTool])
  ).values()
);
```

### 3. 클라이언트 측 검색
```typescript
const filteredExecutions = executions.filter((execution) =>
  execution.aiTool?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  Object.values(execution.inputData).some(
    (v) => typeof v === 'string' && v.toLowerCase().includes(searchQuery.toLowerCase())
  )
);
```

## 🔧 실행 기록 표시

### 상태별 배지
```typescript
<span className={`px-2 py-0.5 rounded-full text-xs ${
  execution.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
  execution.status === 'FAILED' ? 'bg-red-100 text-red-700' :
  'bg-yellow-100 text-yellow-700'
}`}>
  {execution.status === 'SUCCESS' ? '성공' :
   execution.status === 'FAILED' ? '실패' : '처리중'}
</span>
```

### 날짜 표시
```typescript
<div className="text-right">
  <p className="text-sm text-gray-500">
    {new Date(execution.createdAt).toLocaleDateString('ko-KR')}
  </p>
  <p className="text-xs text-gray-400">
    {new Date(execution.createdAt).toLocaleTimeString('ko-KR', {
      hour: '2-digit', minute: '2-digit'
    })}
  </p>
</div>
```

## ✅ Phase 6 완료 항목

- [x] 히스토리 목록 페이지
- [x] 페이지네이션
- [x] AI 도구별 필터링
- [x] 검색 기능
- [x] 상태별 배지 표시
- [x] 상세 페이지 링크

---
작성일: 2024-12-18
