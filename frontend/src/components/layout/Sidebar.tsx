import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, Star, Plus, Settings } from 'lucide-react';
import { useUIStore, useAIToolsStore } from '../../store';
import { cn } from '../../utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '대시보드' },
  { to: '/history', icon: History, label: '히스토리' },
];

export default function Sidebar() {
  const { sidebarOpen } = useUIStore();
  const { favorites, tools } = useAIToolsStore();

  const favoriteTools = tools.filter((tool) => favorites.includes(tool.id));

  if (!sidebarOpen) return null;

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r overflow-y-auto z-30 bg-gray-900/15 border-gray-700/20 backdrop-blur-xl">
      <nav className="p-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-600/30 text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Favorites */}
        {favoriteTools.length > 0 && (
          <div className="mt-6">
            <h3 className="flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <Star className="w-4 h-4" />
              즐겨찾기
            </h3>
            <div className="mt-2 space-y-1">
              {favoriteTools.map((tool) => (
                <NavLink
                  key={tool.id}
                  to={`/ai/${tool.id}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary-600/30 text-white'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    )
                  }
                >
                  <span className="text-lg">{tool.icon}</span>
                  <span className="truncate">{tool.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-gray-700/20">
          <NavLink
            to="/ai/new"
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-primary-300 hover:bg-primary-600/20 hover:text-primary-200"
          >
            <Plus className="w-5 h-5" />
            <span>새 AI 만들기</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-600/30 text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <Settings className="w-5 h-5" />
            <span>설정</span>
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}
