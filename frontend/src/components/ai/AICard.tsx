import { Link } from 'react-router-dom';
import { Star, Play, Edit, Trash2, MoreVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { AITool } from '../../types';

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
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <span className="text-3xl">{tool.icon}</span>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{tool.name}</h3>
            <p className="text-sm text-gray-500 truncate">{tool.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(tool.id);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Star
                className={`w-5 h-5 ${
                  isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                }`}
              />
            </button>

            <Link
              to={`/ai/${tool.id}`}
              className="btn-primary px-4 py-2 text-sm"
            >
              <Play className="w-4 h-4 mr-1" />
              실행
            </Link>

            {!tool.isDefault && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                    <Link
                      to={`/ai/${tool.id}/edit`}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4" />
                      수정
                    </Link>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(tool.id)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                      >
                        <Trash2 className="w-4 h-4" />
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
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-4">
        <span className="text-4xl">{tool.icon}</span>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(tool.id);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Star
              className={`w-5 h-5 ${
                isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
              }`}
            />
          </button>

          {!tool.isDefault && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                  <Link
                    to={`/ai/${tool.id}/edit`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4" />
                    수정
                  </Link>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(tool.id)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{tool.description}</p>

      <Link
        to={`/ai/${tool.id}`}
        className="btn-primary w-full justify-center"
      >
        <Play className="w-4 h-4 mr-2" />
        실행하기
      </Link>
    </div>
  );
}
