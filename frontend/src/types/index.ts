// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  subscription?: 'FREE' | 'PRO';
  createdAt: string;
  updatedAt: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Input Field Types
export type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'url' | 'image';

export interface InputField {
  id?: string;
  type: FieldType;
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  helpText?: string;
  order?: number;
}

// Output Config Types
export type OutputFormat = 'text' | 'markdown' | 'json' | 'list';

export interface OutputConfig {
  format: OutputFormat;
  streaming?: boolean;
  maxLength?: number;
  showCopy?: boolean;
  showRegenerate?: boolean;
  showDownload?: boolean;
}

// AI Personality Types
export interface AIPersonality {
  preset: string;
  tone: {
    formal: number;
    friendly: number;
    creative: number;
  };
  expertise: string[];
  customInstructions: string;
}

// AI Tool Types
export interface AITool {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  icon: string;
  category?: string;
  systemPrompt?: string;
  inputFields: InputField[];
  outputConfig?: OutputConfig;
  personality?: AIPersonality;
  isPublic?: boolean;
  isDefault?: boolean;
  usageCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAIToolRequest {
  name: string;
  description: string;
  icon: string;
  category: string;
  systemPrompt: string;
  inputFields: Omit<InputField, 'id'>[];
  outputConfig: OutputConfig;
  isPublic: boolean;
}

export interface UpdateAIToolRequest extends Partial<CreateAIToolRequest> {}

// Execution Types
export interface ExecutionInput {
  [fieldName: string]: string | string[] | File[];
}

export interface ExecuteRequest {
  inputs: ExecutionInput;
}

export interface Execution {
  id: string;
  userId: string;
  aiToolId: string;
  aiTool?: AITool;
  inputData: Record<string, unknown>;
  result?: string | Record<string, unknown>;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  executionTime?: number;
  tokensUsed?: number;
  isFavorite?: boolean;
  createdAt: string;
}

export interface ExecuteResponse {
  id: string;
  result: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
  createdAt: string;
}

// Favorite Types
export interface Favorite {
  id: string;
  userId: string;
  aiToolId: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// Category Types
export const CATEGORIES = [
  { value: 'writing', label: '글쓰기', icon: '📝' },
  { value: 'coding', label: '코딩', icon: '💻' },
  { value: 'education', label: '교육', icon: '📚' },
  { value: 'business', label: '비즈니스', icon: '💼' },
  { value: 'creative', label: '창작', icon: '🎨' },
  { value: 'analysis', label: '분석', icon: '📊' },
  { value: 'other', label: '기타', icon: '🔧' },
] as const;

export type Category = typeof CATEGORIES[number]['value'];

// Common UI Types
export interface SelectOption {
  value: string;
  label: string;
}
