import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useUIStore, useAuthStore } from '../../store';
import NeuralNetwork from '../three/NeuralNetwork';

export default function MainLayout() {
  const { sidebarOpen, theme } = useUIStore();
  const { refreshUser } = useAuthStore();

  // 앱 로드 시 사용자 정보 갱신
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <div className={`min-h-screen relative ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Three.js Background */}
      <div className="fixed inset-0 z-0">
        <NeuralNetwork opacity={theme === 'dark' ? 0.3 : 0.15} particleCount={1500} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header />
        <div className="flex">
          <Sidebar />
          <main
            className={`flex-1 transition-all duration-300 ${
              sidebarOpen ? 'ml-64' : 'ml-0'
            }`}
          >
            <div className="p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
