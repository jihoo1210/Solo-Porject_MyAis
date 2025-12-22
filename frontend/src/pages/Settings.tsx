import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Key, CreditCard, LogOut, Loader2, Save, Trash2, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
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

type ToastType = 'success' | 'error';
interface Toast {
  type: ToastType;
  message: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'subscription'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

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
      showToast('success', '프로필이 업데이트되었습니다.');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showToast('error', '프로필 업데이트에 실패했습니다.');
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
      showToast('success', '비밀번호가 변경되었습니다.');
    } catch (error) {
      console.error('Failed to change password:', error);
      passwordForm.setError('currentPassword', {
        message: '현재 비밀번호가 올바르지 않습니다',
      });
      showToast('error', '비밀번호 변경에 실패했습니다.');
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
      showToast('success', '구독이 취소되었습니다.');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      showToast('error', '구독 취소에 실패했습니다.');
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
      showToast('error', '계정 삭제에 실패했습니다.');
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
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all ${
          toast.type === 'success'
            ? 'bg-green-900/90 text-green-300 border border-green-700/50'
            : 'bg-red-900/90 text-red-300 border border-red-700/50'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm">{toast.message}</span>
        </div>
      )}

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
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">비밀번호 변경</h2>

                {user?.provider ? (
                  // SNS 로그인 사용자
                  <div className="rounded-xl p-4 sm:p-6 bg-gray-800/50 border border-gray-700/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center">
                        {user.provider === 'google' && (
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        )}
                        {user.provider === 'kakao' && (
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#3C1E1E" d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.8 5.27 4.53 6.7-.2.73-.72 2.65-.83 3.06-.13.51.19.5.4.36.16-.1 2.6-1.76 3.65-2.48.73.1 1.48.16 2.25.16 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8z"/>
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {user.provider === 'google' ? 'Google' : user.provider === 'kakao' ? 'Kakao' : user.provider} 계정으로 로그인됨
                        </p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">
                      SNS 계정으로 로그인한 경우 비밀번호를 변경할 수 없습니다.
                      비밀번호는 연결된 SNS 계정에서 관리됩니다.
                    </p>
                  </div>
                ) : (
                  // 일반 로그인 사용자
                  <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4 sm:space-y-6">
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
              </div>
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
