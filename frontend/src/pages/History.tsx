import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Search, Filter, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { Execution } from '../types';
import { historyApi } from '../api';

export default function History() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string>('all');

  useEffect(() => {
    fetchHistory();
  }, [page, selectedTool]);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
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
      setError('실행 기록을 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExecutions = executions.filter(
    (execution) => {
      const toolName = execution.aiToolName || execution.aiTool?.name || '';
      return (
        toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (execution.inputData && typeof execution.inputData === 'object' &&
          Object.values(execution.inputData).some(
            (v) =>
              typeof v === 'string' &&
              v.toLowerCase().includes(searchQuery.toLowerCase())
          ))
      );
    }
  );

  const uniqueTools = Array.from(
    new Map(
      executions
        .filter((e) => e.aiToolId)
        .map((e) => [e.aiToolId, { id: e.aiToolId, name: e.aiToolName || e.aiTool?.name, icon: e.aiToolIcon || e.aiTool?.icon }])
    ).values()
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          실행 기록
        </h1>
        <p className="mt-1 text-sm sm:text-base text-gray-300">AI 도구 사용 기록을 확인하세요</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 z-10 pointer-events-none" />
          <input
            type="text"
            placeholder="기록 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/2 border-gray-700/30 text-white placeholder-gray-400 backdrop-blur-sm text-sm sm:text-base"
          />
        </div>

        <div className="relative self-end sm:self-auto">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={selectedTool}
            onChange={(e) => {
              setSelectedTool(e.target.value);
              setPage(0);
            }}
            className="pl-9 pr-8 py-2.5 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/5 border-gray-700/30 text-white backdrop-blur-sm text-sm sm:text-base"
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
      ) : error ? (
        <div className="text-center py-12 rounded-xl border bg-red-900/20 border-red-700/30 backdrop-blur-sm">
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-red-400" />
          <p className="text-sm sm:text-base text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchHistory}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </button>
        </div>
      ) : filteredExecutions.length === 0 ? (
        <div className="text-center py-12 rounded-xl border bg-white/5 border-gray-700/20 backdrop-blur-sm">
          <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-500" />
          <p className="text-sm sm:text-base text-gray-300">실행 기록이 없습니다</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 sm:space-y-3">
            {filteredExecutions.map((execution) => (
              <Link
                key={execution.id}
                to={`/history/${execution.id}`}
                className="block rounded-xl border p-3 sm:p-4 transition-all bg-white/5 border-gray-700/20 backdrop-blur-sm hover:bg-white/10 hover:border-primary-500/30"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="text-2xl sm:text-3xl shrink-0">
                    {execution.aiToolIcon || execution.aiTool?.icon || '🤖'}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-semibold text-white text-sm sm:text-base truncate">
                          {execution.aiToolName || execution.aiTool?.name || 'AI Tool'}
                        </p>
                        {execution.output && (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-xs bg-green-900/50 text-green-400 shrink-0">
                            완료
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        {new Date(execution.createdAt).toLocaleString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* 입력 내용 */}
                    <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2 truncate">
                      <span className="text-gray-500">입력:</span>{' '}
                      {execution.inputData && typeof execution.inputData === 'object'
                        ? String(Object.values(execution.inputData)[0] || '-')
                        : '-'}
                    </p>

                    {/* 결과 미리보기 */}
                    {execution.output && (
                      <p className="text-xs sm:text-sm text-gray-300 line-clamp-2">
                        {execution.output.replace(/[#*`]/g, '').slice(0, 200)}
                        {execution.output.length > 200 && '...'}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 sm:gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 sm:p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-300 hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum = i;
                  if (totalPages > 5) {
                    if (page < 3) {
                      pageNum = i;
                    } else if (page > totalPages - 3) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm transition-colors ${
                        page === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'hover:bg-white/10 text-gray-300'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="p-1.5 sm:p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-300 hover:bg-white/10"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
