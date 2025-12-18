import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Star, Clock, Search, Grid, List, FolderOpen, Sparkles, Crown, Zap } from 'lucide-react';
import { useAuthStore, useAIToolsStore } from '../store';
import { aiToolsApi, historyApi } from '../api';
import AICard from '../components/ai/AICard';
import { Execution } from '../types';

const FREE_AI_LIMIT = 3;
const FREE_DAILY_LIMIT = 20;

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { tools, favorites, setTools, toggleFavorite, setLoading, isLoading } =
    useAIToolsStore();
  const [recentExecutions, setRecentExecutions] = useState<Execution[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [toolsData, historyData] = await Promise.all([
        aiToolsApi.getAll(),
        historyApi.getAll({ size: 5 }),
      ]);
      setTools(toolsData);
      setRecentExecutions(historyData.content);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (toolId: string) => {
    try {
      await aiToolsApi.toggleFavorite(toolId);
      toggleFavorite(toolId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteTools = filteredTools.filter((tool) =>
    favorites.includes(tool.id)
  );

  const myTools = filteredTools.filter((tool) => !tool.isDefault);
  const defaultTools = filteredTools.filter((tool) => tool.isDefault);

  // Free 회원인지, AI 개수가 제한에 도달했는지 확인
  const isFreeTier = !user?.subscription || user.subscription === 'FREE';
  const hasReachedLimit = isFreeTier && myTools.length >= FREE_AI_LIMIT;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* Welcome + Usage Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            안녕하세요, {user?.name}님
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-300">
            AI 도구를 선택하거나 새로 만들어보세요
          </p>
        </div>

        {/* Daily Usage Stats for FREE users */}
        {isFreeTier && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-gray-700/30">
            <Zap className="w-5 h-5 text-primary-400" />
            <div>
              <p className="text-xs text-gray-400">오늘 사용량</p>
              <p className="text-sm font-medium text-white">
                <span className={user?.dailyUsageCount && user.dailyUsageCount >= FREE_DAILY_LIMIT ? 'text-red-400' : 'text-primary-400'}>
                  {user?.dailyUsageCount ?? 0}
                </span>
                <span className="text-gray-400"> / {FREE_DAILY_LIMIT}회</span>
              </p>
            </div>
            {user?.dailyUsageCount && user.dailyUsageCount >= FREE_DAILY_LIMIT && (
              <Link
                to="/payment"
                className="ml-2 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30"
              >
                업그레이드
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Search & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 z-10 pointer-events-none" />
          <input
            type="text"
            placeholder="AI 도구 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-700/30 focus:ring-2 focus:ring-primary-500 bg-white/2 text-white placeholder-gray-400 backdrop-blur-sm text-sm sm:text-base"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-600/30 text-primary-400'
                : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-600/30 text-primary-400'
                : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Favorites */}
          {favoriteTools.length > 0 && (
            <section className="mb-6 sm:mb-8">
              <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                즐겨찾기
              </h2>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'
                    : 'space-y-2 sm:space-y-3'
                }
              >
                {favoriteTools.map((tool) => (
                  <AICard
                    key={tool.id}
                    tool={tool}
                    isFavorite={true}
                    onToggleFavorite={handleToggleFavorite}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </section>
          )}

          {/* My AI Tools */}
          <section className="mb-6 sm:mb-8">
            <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">
              <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              내 AI
            </h2>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'
                  : 'space-y-2 sm:space-y-3'
              }
            >
              {myTools.map((tool) => (
                <AICard
                  key={tool.id}
                  tool={tool}
                  isFavorite={favorites.includes(tool.id)}
                  onToggleFavorite={handleToggleFavorite}
                  viewMode={viewMode}
                />
              ))}

              {/* Create New Card or Upgrade Button */}
              {hasReachedLimit ? (
                <Link
                  to="/payment"
                  className={`border-2 border-dashed rounded-xl flex items-center justify-center transition-all border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/10 ${
                    viewMode === 'grid' ? 'p-6 sm:p-8' : 'p-3 sm:p-4'
                  }`}
                >
                  <div className="text-center">
                    <Crown className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-yellow-500" />
                    <p className="font-medium text-yellow-400 text-sm sm:text-base">Premium으로 변경하기</p>
                    <p className="text-xs sm:text-sm text-gray-300">
                      무제한 AI를 만들어보세요 ({myTools.length}/{FREE_AI_LIMIT})
                    </p>
                  </div>
                </Link>
              ) : (
                <Link
                  to="/ai/new"
                  className={`border-2 border-dashed rounded-xl flex items-center justify-center transition-all border-gray-700/30 hover:border-primary-500 hover:bg-primary-600/20 ${
                    viewMode === 'grid' ? 'p-6 sm:p-8' : 'p-3 sm:p-4'
                  }`}
                >
                  <div className="text-center">
                    <Plus className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium text-white text-sm sm:text-base">새 AI 만들기</p>
                    <p className="text-xs sm:text-sm text-gray-300">나만의 AI를 만들어보세요</p>
                  </div>
                </Link>
              )}
            </div>
          </section>

          {/* Default AI Tools */}
          {defaultTools.length > 0 && (
            <section className="mb-6 sm:mb-8">
              <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                기본 제공 AI
              </h2>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'
                    : 'space-y-2 sm:space-y-3'
                }
              >
                {defaultTools.map((tool) => (
                  <AICard
                    key={tool.id}
                    tool={tool}
                    isFavorite={favorites.includes(tool.id)}
                    onToggleFavorite={handleToggleFavorite}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Recent History */}
          {recentExecutions.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-white">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  최근 사용
                </h2>
                <Link
                  to="/history"
                  className="text-primary-400 hover:text-primary-300 text-xs sm:text-sm font-medium"
                >
                  더보기
                </Link>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {recentExecutions.map((execution) => (
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
                          <p className="font-semibold text-white text-sm sm:text-base truncate pr-2">
                            {execution.aiToolName || execution.aiTool?.name || 'AI Tool'}
                          </p>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
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
                            {execution.output.slice(0, 150)}
                            {execution.output.length > 150 && '...'}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
