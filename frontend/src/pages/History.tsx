import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Execution } from '../types';
import { historyApi } from '../api';

export default function History() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string>('all');

  useEffect(() => {
    fetchHistory();
  }, [page, selectedTool]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await historyApi.getAll({
        page,
        size: 10,
        aiToolId: selectedTool !== 'all' ? selectedTool : undefined,
      });
      setExecutions(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExecutions = executions.filter(
    (execution) =>
      execution.aiTool?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof execution.inputData === 'object' &&
        Object.values(execution.inputData).some(
          (v) =>
            typeof v === 'string' &&
            v.toLowerCase().includes(searchQuery.toLowerCase())
        ))
  );

  const uniqueTools = Array.from(
    new Map(
      executions
        .filter((e) => e.aiTool)
        .map((e) => [e.aiTool!.id, e.aiTool])
    ).values()
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          실행 기록
        </h1>
        <p className="text-gray-500 mt-1">AI 도구 사용 기록을 확인하세요</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="기록 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={selectedTool}
            onChange={(e) => {
              setSelectedTool(e.target.value);
              setPage(0);
            }}
            className="input pl-9 pr-8 appearance-none"
          >
            <option value="all">모든 AI</option>
            {uniqueTools.map((tool) => (
              <option key={tool!.id} value={tool!.id}>
                {tool!.icon} {tool!.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : filteredExecutions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">실행 기록이 없습니다</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {filteredExecutions.map((execution) => (
              <Link
                key={execution.id}
                to={`/history/${execution.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <span className="text-3xl">{execution.aiTool?.icon}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {execution.aiTool?.name}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        execution.status === 'SUCCESS'
                          ? 'bg-green-100 text-green-700'
                          : execution.status === 'FAILED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {execution.status === 'SUCCESS'
                        ? '성공'
                        : execution.status === 'FAILED'
                        ? '실패'
                        : '처리중'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {typeof execution.inputData === 'object'
                      ? String(Object.values(execution.inputData)[0] || '')
                      : ''}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(execution.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(execution.createdAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 rounded-lg text-sm ${
                      page === i
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
