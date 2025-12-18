import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Star, Clock, Search, Grid, List } from 'lucide-react';
import { useAuthStore, useAIToolsStore } from '../store';
import { aiToolsApi, historyApi } from '../api';
import AICard from '../components/ai/AICard';
import { AITool, Execution } from '../types';

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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          안녕하세요, {user?.name}님! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          AI 도구를 선택하거나 새로 만들어보세요
        </p>
      </div>

      {/* Search & View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="AI 도구 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-400 hover:bg-gray-100'
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
            <section className="mb-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <Star className="w-5 h-5 text-yellow-500" />
                즐겨찾기
              </h2>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-3'
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
          <section className="mb-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
              📁 내 AI
            </h2>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
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

              {/* Create New Card */}
              <Link
                to="/ai/new"
                className={`border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:border-primary-400 hover:bg-primary-50 transition-all ${
                  viewMode === 'grid' ? 'p-8' : 'p-4'
                }`}
              >
                <div className="text-center">
                  <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">새 AI 만들기</p>
                  <p className="text-gray-400 text-sm">나만의 AI를 만들어보세요</p>
                </div>
              </Link>
            </div>
          </section>

          {/* Default AI Tools */}
          {defaultTools.length > 0 && (
            <section className="mb-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                🌟 기본 제공 AI
              </h2>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-3'
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Clock className="w-5 h-5" />
                  최근 사용
                </h2>
                <Link
                  to="/history"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  더보기 →
                </Link>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {recentExecutions.map((execution) => (
                  <Link
                    key={execution.id}
                    to={`/history/${execution.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-2xl">{execution.aiTool?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {execution.aiTool?.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {typeof execution.inputData === 'object'
                          ? String(Object.values(execution.inputData)[0] || '')
                          : ''}
                      </p>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(execution.createdAt).toLocaleDateString('ko-KR')}
                    </span>
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
