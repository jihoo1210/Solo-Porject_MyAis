import { Link } from 'react-router-dom';
import { Star, Play, Edit, Trash2, MoreVertical, Lock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { AITool } from '../../types';
import { useAuthStore } from '../../store';

interface AICardProps {
  tool: AITool;
  isFavorite: boolean;
  onToggleFavorite: (toolId: string) => void;
  onDelete?: (toolId: string) => void;
  viewMode: 'grid' | 'list';
}

export default function AICard({
  tool,
  isFavorite,
  onToggleFavorite,
  onDelete,
  viewMode,
}: AICardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  // 이메일 인증 필요 여부 (SNS 로그인 제외)
  const needsEmailVerification = user && !user.emailVerified && !user.provider;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (viewMode === 'list') {
    return (
      <div className="rounded-xl border p-3 sm:p-4 hover:shadow-lg transition-all bg-white/5 border-gray-700/20 backdrop-blur-sm hover:bg-white/10">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-2xl sm:text-3xl shrink-0">{tool.icon}</span>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate text-white text-sm sm:text-base">{tool.name}</h3>
            <p className="text-xs sm:text-sm truncate text-gray-300">{tool.description}</p>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                if (!needsEmailVerification) {
                  onToggleFavorite(tool.id);
                }
              }}
              disabled={needsEmailVerification}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                needsEmailVerification
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-white/10'
              }`}
              title={needsEmailVerification ? '이메일 인증이 필요합니다' : undefined}
            >
              <Star
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
              />
            </button>

            {needsEmailVerification ? (
              <div
                className="flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
                title="이메일 인증이 필요합니다"
              >
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">인증필요</span>
              </div>
            ) : (
              <Link
                to={`/ai/${tool.id}`}
                className="flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">실행</span>
              </Link>
            )}

            {!tool.isDefault && !needsEmailVerification && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-white/10"
                >
                  <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 rounded-lg shadow-lg border py-1 z-10 min-w-[100px] sm:min-w-[120px] bg-gray-900/90 border-gray-700/30 backdrop-blur-xl">
                    <Link
                      to={`/ai/${tool.id}/edit`}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white hover:bg-white/10"
                    >
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      수정
                    </Link>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(tool.id)}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm w-full text-red-400 hover:bg-red-900/30"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        삭제
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4 sm:p-6 hover:shadow-lg transition-all group bg-white/5 border-gray-700/20 backdrop-blur-sm hover:bg-white/10">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <span className="text-3xl sm:text-4xl">{tool.icon}</span>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!needsEmailVerification) {
                onToggleFavorite(tool.id);
              }
            }}
            disabled={needsEmailVerification}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              needsEmailVerification
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-white/10'
            }`}
            title={needsEmailVerification ? '이메일 인증이 필요합니다' : undefined}
          >
            <Star
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>

          {!tool.isDefault && !needsEmailVerification && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 sm:p-2 rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100 hover:bg-white/10"
              >
                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 rounded-lg shadow-lg border py-1 z-10 min-w-[100px] sm:min-w-[120px] bg-gray-900/90 border-gray-700/30 backdrop-blur-xl">
                  <Link
                    to={`/ai/${tool.id}/edit`}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white hover:bg-white/10"
                  >
                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    수정
                  </Link>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(tool.id)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm w-full text-red-400 hover:bg-red-900/30"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      삭제
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <h3 className="font-semibold mb-1 text-white text-sm sm:text-base">{tool.name}</h3>
      <p className="text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 text-gray-300">{tool.description}</p>

      {needsEmailVerification ? (
        <div
          className="flex items-center justify-center w-full px-3 sm:px-4 py-2 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed text-sm sm:text-base"
          title="이메일 인증이 필요합니다"
        >
          <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          이메일 인증 필요
        </div>
      ) : (
        <Link
          to={`/ai/${tool.id}`}
          className="flex items-center justify-center w-full px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm sm:text-base"
        >
          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          실행하기
        </Link>
      )}
    </div>
  );
}
