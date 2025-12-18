import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Key, Bell, CreditCard, LogOut, Loader2, Save, Trash2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'subscription' | 'notifications'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

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
    { id: 'notifications', label: '알림', icon: Bell },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-500 mt-1">계정 및 앱 설정을 관리하세요</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}

            <hr className="my-4" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              로그아웃
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {activeTab === 'profile' && (
              <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">프로필 설정</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    {...profileForm.register('name', { required: true })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    {...profileForm.register('email', { required: true })}
                    type="email"
                    className="input"
                    disabled
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    이메일은 변경할 수 없습니다
                  </p>
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={isLoading} className="btn-primary">
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
              <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">비밀번호 변경</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    현재 비밀번호
                  </label>
                  <input
                    {...passwordForm.register('currentPassword', { required: true })}
                    type="password"
                    className="input"
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="input"
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호 확인
                  </label>
                  <input
                    {...passwordForm.register('confirmPassword', { required: true })}
                    type="password"
                    className="input"
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={isLoading} className="btn-primary">
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
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">구독 관리</h2>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">현재 플랜</div>
                      <div className="text-xl font-semibold text-gray-900">
                        {user?.subscription === 'PRO' ? 'Pro' : 'Free'}
                      </div>
                    </div>
                    {user?.subscription === 'PRO' && (
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                        활성
                      </span>
                    )}
                  </div>
                </div>

                {user?.subscription === 'PRO' ? (
                  <>
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="font-medium text-gray-900 mb-2">구독 취소</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        구독을 취소해도 결제 기간까지는 Pro 기능을 계속 이용할 수 있습니다.
                      </p>
                      <button
                        onClick={handleCancelSubscription}
                        disabled={isCanceling}
                        className="btn-secondary text-red-600 hover:bg-red-50"
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
                    className="btn-primary"
                  >
                    Pro로 업그레이드
                  </button>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">알림 설정</h2>

                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">이메일 알림</div>
                      <div className="text-sm text-gray-500">
                        중요한 업데이트와 공지사항을 이메일로 받습니다
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 text-primary-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">마케팅 알림</div>
                      <div className="text-sm text-gray-500">
                        새로운 기능과 프로모션 정보를 받습니다
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-primary-600 rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'profile' && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-red-600 mb-4">위험 영역</h3>
                <p className="text-sm text-gray-500 mb-4">
                  계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
                  이 작업은 되돌릴 수 없습니다.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="btn-secondary text-red-600 hover:bg-red-50"
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
