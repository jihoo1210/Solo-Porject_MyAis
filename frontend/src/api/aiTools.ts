import apiClient, { uploadClient } from './client';
import {
  AITool,
  CreateAIToolRequest,
  UpdateAIToolRequest,
  ExecuteRequest,
  ExecuteResponse,
  PaginatedResponse,
} from '../types';

export const aiToolsApi = {
  getAll: async (): Promise<AITool[]> => {
    const response = await apiClient.get<AITool[]>('/v1/ai-tools');
    return response.data;
  },

  getById: async (id: string): Promise<AITool> => {
    const response = await apiClient.get<AITool>(`/v1/ai-tools/${id}`);
    return response.data;
  },

  create: async (data: CreateAIToolRequest): Promise<AITool> => {
    const response = await apiClient.post<AITool>('/v1/ai-tools', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAIToolRequest): Promise<AITool> => {
    const response = await apiClient.put<AITool>(`/v1/ai-tools/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/ai-tools/${id}`);
  },

  toggleFavorite: async (id: string): Promise<{ isFavorite: boolean }> => {
    const response = await apiClient.post<{ isFavorite: boolean }>(
      `/v1/ai-tools/${id}/favorite`
    );
    return response.data;
  },

  execute: async (id: string, data: ExecuteRequest): Promise<ExecuteResponse> => {
    const response = await apiClient.post<ExecuteResponse>(
      `/v1/ai-tools/${id}/execute`,
      data
    );
    return response.data;
  },

  executeStream: async (
    id: string,
    data: ExecuteRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/v1/ai-tools/${id}/execute/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state?.accessToken : ''}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error('Stream request failed');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      onChunk(chunk);
    }
  },
};

export const utilsApi = {
  crawlUrl: async (url: string): Promise<{ content: string }> => {
    const response = await apiClient.post<{ content: string }>('/v1/utils/crawl', {
      url,
    });
    return response.data;
  },

  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await uploadClient.post<{ url: string }>(
      '/v1/utils/upload',
      formData
    );
    return response.data;
  },
};
