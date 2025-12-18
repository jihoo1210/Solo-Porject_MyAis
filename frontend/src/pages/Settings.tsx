import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Key, CreditCard, LogOut, Loader2, Save, Trash2, ChevronLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store';
import { authApi, paymentApi } from '../api';

interface ProfileFormData {
  name: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'subscription'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(true);

  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>();

  const handleProfileUpdate = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const updatedUser = await authApi.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      passwordForm.setError('confirmPassword', {
        message: '비밀번호가 일치하지 않습니다',
      });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);
      passwordForm.reset();
    } catch (error) {
      console.error('Failed to change password:', error);
      passwordForm.setError('currentPassword', {
        message: '현재 비밀번호가 올바르지 않습니다',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('정말로 구독을 취소하시겠습니까?')) return;

    setIsCanceling(true);
    try {
      await paymentApi.cancelSubscription();
      const updatedUser = await authApi.me();
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setIsCanceling(false);
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    if (!confirm('모든 AI 도구와 실행 기록이 삭제됩니다. 계속하시겠습니까?')) return;

    try {
      await authApi.deleteAccount();
      logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const tabs = [
    { id: 'profile', label: '프로필', icon: User },
    { id: 'password', label: '비밀번호', icon: Key },
    { id: 'subscription', label: '구독', icon: CreditCard },
  ];

  const handleTabChange = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    setShowMobileMenu(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">설정</h1>
        <p className="mt-1 text-sm sm:text-base text-gray-300">계정 및 앱 설정을 관리하세요</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Sidebar - Mobile: Show/Hide based on state */}
        <div className={`${showMobileMenu ? 'block' : 'hidden'} md:block w-full md:w-48 shrink-0`}>
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as typeof activeTab)}
                  className={`w-full flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-600/30 text-primary-400'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}

            <hr className="my-3 sm:my-4 border-gray-700/20" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-left transition-colors text-red-400 hover:bg-red-900/30"
            >
              <LogOut className="w-5 h-5" />
              로그아웃
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className={`${!showMobileMenu ? 'block' : 'hidden'} md:block flex-1`}>
          {/* Mobile Back Button */}
          <button
            onClick={() => setShowMobileMenu(true)}
            className="md:hidden flex items-center gap-2 text-gray-300 mb-4 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>설정 메뉴로 돌아가기</span>
          </button>

          <div className="rounded-xl border p-4 sm:p-6 bg-white/5 border-gray-700/20 backdrop-blur-sm">
            {activeTab === 'profile' && (
              <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4 sm:space-y-6">
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">프로필 설정</h2>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    이름
                  </label>
                  <input
                    {...profileForm.register('name', { required: true })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/5 border-gray-700/30 text-white backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    이메일
                  </label>
                  <input
                    {...profileForm.register('email', { required: true })}
                    type="email"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/5 border-gray-700/30 text-gray-400 backdrop-blur-sm"
                    disabled
                  />
                  <p className="text-xs sm:text-sm mt-1 text-gray-400">
                    이메일은 변경할 수 없습니다
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg transition-colors text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    저장
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4 sm:space-y-6">
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">비밀번호 변경</h2>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    현재 비밀번호
                  </label>
                  <input
                    {...passwordForm.register('currentPassword', { required: true })}
                    type="password"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/5 border-gray-700/30 text-white backdrop-blur-sm"
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    새 비밀번호
                  </label>
                  <input
                    {...passwordForm.register('newPassword', {
                      required: true,
                      minLength: {
                        value: 8,
                        message: '비밀번호는 8자 이상이어야 합니다',
                      },
                    })}
                    type="password"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/5 border-gray-700/30 text-white backdrop-blur-sm"
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    새 비밀번호 확인
                  </label>
                  <input
                    {...passwordForm.register('confirmPassword', { required: true })}
                    type="password"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/5 border-gray-700/30 text-white backdrop-blur-sm"
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg transition-colors text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    비밀번호 변경
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'subscription' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">구독 관리</h2>

                <div className="rounded-xl p-3 sm:p-4 bg-white/5 border border-gray-700/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs sm:text-sm text-gray-300">현재 플랜</div>
                      <div className="text-lg sm:text-xl font-semibold text-white">
                        {user?.subscription === 'PRO' ? 'Pro' : 'Free'}
                      </div>
                    </div>
                    {user?.subscription === 'PRO' && (
                      <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-primary-900/50 text-primary-400">
                        활성
                      </span>
                    )}
                  </div>
                </div>

                {user?.subscription === 'PRO' ? (
                  <>
                    <div className="border-t pt-4 border-gray-700/20">
                      <h3 className="font-medium mb-2 text-white text-sm sm:text-base">구독 취소</h3>
                      <p className="text-xs sm:text-sm mb-4 text-gray-300">
                        구독을 취소해도 결제 기간까지는 Pro 기능을 계속 이용할 수 있습니다.
                      </p>
                      <button
                        onClick={handleCancelSubscription}
                        disabled={isCanceling}
                        className="flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors bg-white/5 border border-gray-700/20 text-red-400 hover:bg-red-900/30 text-sm sm:text-base"
                      >
                        {isCanceling ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        구독 취소
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => navigate('/payment')}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm sm:text-base"
                  >
                    Pro로 업그레이드
                  </button>
                )}
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'profile' && (
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-700/20">
                <h3 className="text-base sm:text-lg font-semibold text-red-500 mb-3 sm:mb-4">위험 영역</h3>
                <p className="text-xs sm:text-sm mb-4 text-gray-300">
                  계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
                  이 작업은 되돌릴 수 없습니다.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors bg-white/5 border border-gray-700/20 text-red-400 hover:bg-red-900/30 text-sm sm:text-base"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  계정 삭제
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
