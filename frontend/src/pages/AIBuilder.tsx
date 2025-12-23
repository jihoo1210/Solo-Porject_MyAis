import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Loader2, Crown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { InputField, OutputConfig, AIPersonality } from '../types';
import { aiToolsApi } from '../api';
import { useAuthStore, useAIToolsStore } from '../store';
import FieldEditor from '../components/builder/FieldEditor';
import PersonalityEditor from '../components/builder/PersonalityEditor';
import PromptEditor from '../components/builder/PromptEditor';
import BuilderPreview from '../components/builder/BuilderPreview';

const FREE_AI_LIMIT = 3;

interface FormData {
  name: string;
  description: string;
  icon: string;
  aiModel: string;
}

const EMOJI_OPTIONS = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐧', '🦄'];

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

export default function AIBuilder() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tools } = useAIToolsStore();
  const [step, setStep] = useState<'basic' | 'fields' | 'personality' | 'prompt' | 'preview'>(
    'basic'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputFields, setInputFields] = useState<InputField[]>([
    { id: `field_${Date.now()}`, name: '입력', label: '입력', type: 'textarea', required: true },
  ]);
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

  // Free 회원의 AI 개수 제한 확인
  const myTools = tools.filter((tool) => !tool.isDefault);
  const isFreeTier = !user?.subscription || user.subscription === 'FREE';
  const hasReachedLimit = isFreeTier && myTools.length >= FREE_AI_LIMIT;

  // 이메일 인증 필요 여부 (SNS 로그인 제외)
  const needsEmailVerification = user && !user.emailVerified && !user.provider;

  // 제한에 도달하거나 이메일 미인증인 경우 리다이렉트
  useEffect(() => {
    if (hasReachedLimit || needsEmailVerification) {
      navigate('/dashboard');
    }
  }, [hasReachedLimit, needsEmailVerification, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      icon: '🐶',
      aiModel: 'gemini-2.5-flash-lite',
    },
  });

  const isPro = user?.subscription === 'PRO';

  const formData = watch();

  const handleSave = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const tool = {
        name: data.name,
        description: data.description,
        icon: data.icon,
        category: 'other',
        inputFields: inputFields.map(f => ({ ...f, id: f.id || f.name })),
        outputConfig,
        systemPrompt: buildSystemPrompt(),
        isPublic: false,
        aiModel: data.aiModel,
      };

      await aiToolsApi.create(tool);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to create AI tool:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildSystemPrompt = () => {
    const parts = [];

    // Personality preset
    const presetPrompts: Record<string, string> = {
      professional: '전문적이고 정확한 정보를 제공합니다.',
      friendly: '친근하고 이해하기 쉽게 설명합니다.',
      creative: '창의적이고 독특한 관점으로 접근합니다.',
      academic: '학술적이고 심도 있는 분석을 제공합니다.',
      casual: '편안하고 가벼운 톤으로 대화합니다.',
    };

    if (personality.preset && presetPrompts[personality.preset]) {
      parts.push(presetPrompts[personality.preset]);
    }

    // Tone adjustments
    if (personality.tone.formal > 70) {
      parts.push('격식 있는 문체를 사용합니다.');
    } else if (personality.tone.formal < 30) {
      parts.push('편안한 문체를 사용합니다.');
    }

    if (personality.tone.creative > 70) {
      parts.push('창의적이고 독창적인 표현을 사용합니다.');
    }

    // Expertise
    if (personality.expertise.length > 0) {
      parts.push(`전문 분야: ${personality.expertise.join(', ')}`);
    }

    // Custom instructions
    if (personality.customInstructions) {
      parts.push(personality.customInstructions);
    }

    // User's system prompt
    if (systemPrompt) {
      parts.push(systemPrompt);
    }

    return parts.join('\n\n');
  };

  const steps = [
    { id: 'basic', label: '기본 정보' },
    { id: 'fields', label: '입력 필드' },
    { id: 'personality', label: 'AI 성격' },
    { id: 'prompt', label: '프롬프트' },
    { id: 'preview', label: '미리보기' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-white/10 text-gray-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">새 AI 만들기</h1>
          <p className="text-sm sm:text-base text-gray-300">나만의 AI 도구를 만들어보세요</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 overflow-x-auto pb-2">
        {steps.map((s, index) => (
          <div
            key={s.id}
            className="flex items-center shrink-0"
          >
            <button
              onClick={() => setStep(s.id as typeof step)}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors ${
                step === s.id
                  ? 'bg-primary-600/30 text-primary-400'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <span
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm ${
                  step === s.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700/50 text-gray-400'
                }`}
              >
                {index + 1}
              </span>
              <span className="hidden sm:inline text-sm">{s.label}</span>
            </button>
            {index < steps.length - 1 && (
              <div className="w-4 sm:w-8 h-px mx-1 sm:mx-2 bg-gray-700/30" />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-xl border p-4 sm:p-6 bg-white/5 border-gray-700/20 backdrop-blur-sm">
        {step === 'basic' && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
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
              <label className="block text-sm font-medium mb-2 text-gray-300">
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
              <label className="block text-sm font-medium mb-2 text-gray-300">
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

            <div className="flex justify-end">
              <button
                onClick={() => setStep('fields')}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                다음
              </button>
            </div>
          </div>
        )}

        {step === 'fields' && (
          <div className="space-y-4 sm:space-y-6">
            <FieldEditor fields={inputFields} onChange={setInputFields} />

            <div className="flex justify-between">
              <button
                onClick={() => setStep('basic')}
                className="px-3 sm:px-4 py-2 rounded-lg transition-colors bg-white/5 border border-gray-700/30 text-gray-300 hover:bg-white/10 text-sm sm:text-base"
              >
                이전
              </button>
              <button
                onClick={() => setStep('personality')}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                다음
              </button>
            </div>
          </div>
        )}

        {step === 'personality' && (
          <div className="space-y-4 sm:space-y-6">
            <PersonalityEditor
              personality={personality}
              onChange={setPersonality}
            />

            <div className="flex justify-between">
              <button
                onClick={() => setStep('fields')}
                className="px-3 sm:px-4 py-2 rounded-lg transition-colors bg-white/5 border border-gray-700/30 text-gray-300 hover:bg-white/10 text-sm sm:text-base"
              >
                이전
              </button>
              <button
                onClick={() => setStep('prompt')}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                다음
              </button>
            </div>
          </div>
        )}

        {step === 'prompt' && (
          <div className="space-y-4 sm:space-y-6">
            <PromptEditor
              systemPrompt={systemPrompt}
              onSystemPromptChange={setSystemPrompt}
              outputConfig={outputConfig}
              onOutputConfigChange={setOutputConfig}
              inputFields={inputFields}
            />

            <div className="flex justify-between">
              <button
                onClick={() => setStep('personality')}
                className="px-3 sm:px-4 py-2 rounded-lg transition-colors bg-white/5 border border-gray-700/30 text-gray-300 hover:bg-white/10 text-sm sm:text-base"
              >
                이전
              </button>
              <button
                onClick={() => setStep('preview')}
                className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                <Eye className="w-4 h-4 mr-2" />
                미리보기
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4 sm:space-y-6">
            <BuilderPreview
              name={formData.name}
              description={formData.description}
              icon={formData.icon}
              inputFields={inputFields}
              systemPrompt={buildSystemPrompt()}
            />

            <div className="flex justify-between">
              <button
                onClick={() => setStep('prompt')}
                className="px-3 sm:px-4 py-2 rounded-lg transition-colors bg-white/5 border border-gray-700/30 text-gray-300 hover:bg-white/10 text-sm sm:text-base"
              >
                이전
              </button>
              <button
                onClick={handleSubmit(handleSave)}
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    저장하기
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
