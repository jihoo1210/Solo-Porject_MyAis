import apiClient from './client';
import { Execution, PaginatedResponse } from '../types';

export interface HistoryQuery {
  aiToolId?: string;
  page?: number;
  size?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  favoriteOnly?: boolean;
}

export const historyApi = {
  getAll: async (query?: HistoryQuery): Promise<PaginatedResponse<Execution>> => {
    const params = new URLSearchParams();
    if (query?.aiToolId) params.append('aiToolId', query.aiToolId);
    if (query?.page !== undefined) params.append('page', query.page.toString());
    if (query?.size !== undefined) params.append('size', query.size.toString());
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.search) params.append('search', query.search);
    if (query?.favoriteOnly) params.append('favoriteOnly', 'true');

    const response = await apiClient.get<PaginatedResponse<Execution>>(
      `/v1/history?${params.toString()}`
    );
    return response.data;
  },

  getById: async (id: string): Promise<Execution> => {
    const response = await apiClient.get<Execution>(`/v1/history/${id}`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/history/${id}`);
  },

  toggleFavorite: async (id: string): Promise<{ isFavorite: boolean }> => {
    const response = await apiClient.post<{ isFavorite: boolean }>(
      `/v1/history/${id}/favorite`
    );
    return response.data;
  },
};
