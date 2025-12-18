import apiClient from './client';
import { Execution } from '../types';

export const executionApi = {
  execute: async (toolId: string, inputData: Record<string, unknown>): Promise<Execution> => {
    const response = await apiClient.post<Execution>(`/ai-tools/${toolId}/execute`, inputData);
    return response.data;
  },

  executeStream: async (
    toolId: string,
    inputData: Record<string, unknown>
  ): Promise<Response> => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/ai-tools/${toolId}/execute/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(inputData),
      }
    );
    return response;
  },
};
