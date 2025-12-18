import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, User, LogOut, Settings, CreditCard, Sparkles, Plus, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore, useUIStore } from '../../store';

export default function Header() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard?search=${encodeURIComponent(searchQuery)}`);
      setShowMobileSearch(false);
    }
  };

  return (
    <header className="bg-gray-900/15 border-gray-700/20 border-b backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4">
        {/* Left */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleSidebar}
            className="p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-white/10 text-gray-300"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/dashboard" className="flex items-center gap-1.5 sm:gap-2">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
            <span className="text-lg sm:text-xl font-bold text-white">MyAIs</span>
          </Link>
        </div>

        {/* Center - Search (Desktop) */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="AI 도구 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-700/30 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all bg-white/5 text-white placeholder-gray-400 focus:bg-white/10 backdrop-blur-sm"
            />
          </div>
        </form>

        {/* Right */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile Search Button */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-white/10 text-gray-300"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Create AI Button */}
          <Link
            to="/ai/new"
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">+ AI 만들기</span>
            <span className="sm:hidden">AI</span>
          </Link>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-white/10"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-primary-600/30">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-300" />
              </div>
              <span className="hidden lg:block text-sm font-medium text-white max-w-24 truncate">
                {user?.name}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 sm:w-56 rounded-xl shadow-lg border py-2 bg-gray-900/90 border-gray-700/30 backdrop-blur-xl">
                <div className="px-3 sm:px-4 py-2 border-b border-gray-700/30">
                  <p className="font-medium text-white text-sm sm:text-base truncate">{user?.name}</p>
                  <p className="text-xs sm:text-sm text-gray-300 truncate">{user?.email}</p>
                </div>

                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-3 sm:px-4 py-2 text-sm sm:text-base text-white hover:bg-white/10"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span>설정</span>
                </Link>

                <Link
                  to="/payment"
                  className="flex items-center gap-3 px-3 sm:px-4 py-2 text-sm sm:text-base text-white hover:bg-white/10"
                  onClick={() => setShowUserMenu(false)}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>구독 관리</span>
                </Link>

                <hr className="my-2 border-gray-700/30" />

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 sm:px-4 py-2 w-full text-sm sm:text-base text-red-400 hover:bg-red-900/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div className="md:hidden px-3 pb-3 border-t border-gray-700/20">
          <form onSubmit={handleSearch} className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="AI 도구 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-10 py-2 border border-gray-700/30 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all bg-white/5 text-white placeholder-gray-400 focus:bg-white/10 backdrop-blur-sm"
            />
            <button
              type="button"
              onClick={() => setShowMobileSearch(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
