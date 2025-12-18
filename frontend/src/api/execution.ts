import apiClient from './client';
import { Execution } from '../types';

export const executionApi = {
  execute: async (toolId: string, inputData: Record<string, unknown>): Promise<Execution> => {
    // 백엔드가 { inputs: { ... } } 형태를 기대함
    const response = await apiClient.post<Execution>(`/v1/ai-tools/${toolId}/execute`, { inputs: inputData });
    return response.data;
  },

  executeStream: async (
    toolId: string,
    inputData: Record<string, unknown>
  ): Promise<Response> => {
    const token = localStorage.getItem('accessToken');
    // 백엔드가 { inputs: { ... } } 형태를 기대함
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/v1/ai-tools/${toolId}/execute/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ inputs: inputData }),
      }
    );
    return response;
  },
};
