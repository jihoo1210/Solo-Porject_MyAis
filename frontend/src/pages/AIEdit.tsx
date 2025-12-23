import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Loader2, Crown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { AITool, InputField, OutputConfig, AIPersonality } from '../types';
import { aiToolsApi } from '../api';
import { useAuthStore } from '../store';
import FieldEditor from '../components/builder/FieldEditor';
import PersonalityEditor from '../components/builder/PersonalityEditor';
import PromptEditor from '../components/builder/PromptEditor';

interface FormData {
  name: string;
  description: string;
  icon: string;
  aiModel: string;
}

const AI_MODELS = [
  // Free tier
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: '초고속 경량 모델 (무료)', proRequired: false },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: '빠르고 효율적인 모델 (무료)', proRequired: false },
  // Gemini 2.5
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: '균형 잡힌 성능 모델', proRequired: true },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: '고급 추론 및 코딩 모델', proRequired: true },
  // Gemini 3 (Latest)
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', description: '최신 고속 모델 (2025.12)', proRequired: true },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', description: '최고 성능 추론 모델 (1M 컨텍스트)', proRequired: true },
];

const EMOJI_OPTIONS = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐧', '🦄'];

export default function AIEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isPro = user?.subscription === 'PRO';
  const [tool, setTool] = useState<AITool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'fields' | 'personality' | 'prompt'>('basic');

  const [inputFields, setInputFields] = useState<InputField[]>([]);
  const [personality, setPersonality] = useState<AIPersonality>({
    preset: 'professional',
    tone: { formal: 70, friendly: 50, creative: 30 },
    expertise: [],
    customInstructions: '',
  });
  const [systemPrompt, setSystemPrompt] = useState('');
  const [outputConfig, setOutputConfig] = useState<OutputConfig>({
    format: 'text',
    streaming: true,
    maxLength: 2000,
  });

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const formData = watch();

  // 이메일 인증 필요 여부 (SNS 로그인 제외)
  const needsEmailVerification = user && !user.emailVerified && !user.provider;

  useEffect(() => {
    // 이메일 미인증 시 대시보드로 리다이렉트
    if (needsEmailVerification) {
      navigate('/dashboard');
      return;
    }
    if (id) {
      fetchTool();
    }
  }, [id, needsEmailVerification, navigate]);

  const fetchTool = async () => {
    try {
      const data = await aiToolsApi.getById(id!);
      setTool(data);

      setValue('name', data.name);
      setValue('description', data.description || '');
      setValue('icon', data.icon);
      setValue('aiModel', data.aiModel || 'gemini-2.5-flash-lite');
      // 기존 필드에 id가 없으면 부여
      const fieldsWithIds = (data.inputFields || []).map((field, index) => ({
        ...field,
        id: field.id || `field_${Date.now()}_${index}`,
      }));
      setInputFields(fieldsWithIds);
      if (data.outputConfig) {
        setOutputConfig(data.outputConfig);
      }
      setSystemPrompt(data.systemPrompt || '');
    } catch (error) {
      console.error('Failed to fetch tool:', error);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const updatedTool: Partial<AITool> = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        aiModel: formData.aiModel,
        inputFields,
        outputConfig,
        systemPrompt,  // buildSystemPrompt() 대신 순수 systemPrompt만 저장
      };

      await aiToolsApi.update(id!, updatedTool);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to update AI tool:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말로 이 AI를 삭제하시겠습니까?')) return;

    setIsDeleting(true);
    try {
      await aiToolsApi.delete(id!);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete AI tool:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-300">AI 도구를 찾을 수 없습니다</p>
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: '기본 정보' },
    { id: 'fields', label: '입력 필드' },
    { id: 'personality', label: 'AI 성격' },
    { id: 'prompt', label: '프롬프트' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-white">AI 수정</h1>
            <p className="text-sm sm:text-base text-gray-300 truncate">{tool.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors bg-white/5 border border-red-500/30 text-red-400 hover:bg-red-900/20 text-sm sm:text-base"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">삭제</span>
              </>
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex items-center px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg transition-colors text-sm sm:text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                <span className="hidden sm:inline">저장 중...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">저장</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary-600/30 text-primary-400'
                : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-xl border p-4 sm:p-6 bg-white/5 border-gray-700/20 backdrop-blur-sm">
        {activeTab === 'basic' && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                아이콘
              </label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setValue('icon', emoji)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg text-xl sm:text-2xl flex items-center justify-center transition-all ${
                      formData.icon === emoji
                        ? 'bg-primary-600/30 ring-2 ring-primary-500'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', { required: '이름을 입력해주세요' })}
                placeholder="예: 블로그 글 작성기"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/5 border-gray-700/30 text-white placeholder-gray-400 backdrop-blur-sm text-sm sm:text-base"
              />
              {errors.name && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                설명
              </label>
              <textarea
                {...register('description')}
                placeholder="이 AI가 무엇을 하는지 간단히 설명해주세요"
                rows={3}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-white/5 border-gray-700/30 text-white placeholder-gray-400 backdrop-blur-sm text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                AI 모델
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {AI_MODELS.map((model) => {
                  const isDisabled = model.proRequired && !isPro;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setValue('aiModel', model.id)}
                      className={`relative p-3 sm:p-4 rounded-lg border text-left transition-all ${
                        formData.aiModel === model.id
                          ? 'bg-primary-600/20 border-primary-500 ring-2 ring-primary-500/50'
                          : isDisabled
                            ? 'bg-gray-800/50 border-gray-700/30 opacity-60 cursor-not-allowed'
                            : 'bg-white/5 border-gray-700/30 hover:bg-white/10'
                      }`}
                    >
                      {model.proRequired && (
                        <Crown className={`absolute top-2 right-2 w-4 h-4 ${isPro ? 'text-yellow-400' : 'text-gray-500'}`} />
                      )}
                      <div className="font-medium text-white text-sm sm:text-base">{model.name}</div>
                      <div className="text-xs sm:text-sm text-gray-400 mt-0.5">{model.description}</div>
                      {isDisabled && (
                        <div className="text-xs text-yellow-500 mt-1">Pro 구독 필요</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fields' && (
          <FieldEditor fields={inputFields} onChange={setInputFields} />
        )}

        {activeTab === 'personality' && (
          <PersonalityEditor personality={personality} onChange={setPersonality} />
        )}

        {activeTab === 'prompt' && (
          <PromptEditor
            systemPrompt={systemPrompt}
            onSystemPromptChange={setSystemPrompt}
            outputConfig={outputConfig}
            onOutputConfigChange={setOutputConfig}
            inputFields={inputFields}
          />
        )}
      </div>
    </div>
  );
}
