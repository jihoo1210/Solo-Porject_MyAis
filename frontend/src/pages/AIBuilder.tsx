import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { AITool, InputField, OutputConfig, AIPersonality } from '../types';
import { aiToolsApi } from '../api';
import FieldEditor from '../components/builder/FieldEditor';
import PersonalityEditor from '../components/builder/PersonalityEditor';
import PromptEditor from '../components/builder/PromptEditor';
import BuilderPreview from '../components/builder/BuilderPreview';

interface FormData {
  name: string;
  description: string;
  icon: string;
}

const EMOJI_OPTIONS = ['🤖', '✨', '📝', '🎨', '💼', '📊', '🔍', '💡', '🎯', '⚡', '🌟', '🔮'];

export default function AIBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'basic' | 'fields' | 'personality' | 'prompt' | 'preview'>(
    'basic'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputFields, setInputFields] = useState<InputField[]>([
    { name: 'input', label: '입력', type: 'textarea', required: true },
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
      icon: '🤖',
    },
  });

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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">새 AI 만들기</h1>
          <p className="text-gray-500">나만의 AI 도구를 만들어보세요</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, index) => (
          <div
            key={s.id}
            className="flex items-center"
          >
            <button
              onClick={() => setStep(s.id as typeof step)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                step === s.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                  step === s.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {index < steps.length - 1 && (
              <div className="w-8 h-px bg-gray-200 mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {step === 'basic' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                아이콘
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setValue('icon', emoji)}
                    className={`w-12 h-12 rounded-lg text-2xl flex items-center justify-center transition-all ${
                      formData.icon === emoji
                        ? 'bg-primary-100 ring-2 ring-primary-600'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', { required: '이름을 입력해주세요' })}
                placeholder="예: 블로그 글 작성기"
                className="input"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                {...register('description')}
                placeholder="이 AI가 무엇을 하는지 간단히 설명해주세요"
                rows={3}
                className="input resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep('fields')}
                className="btn-primary"
              >
                다음
              </button>
            </div>
          </div>
        )}

        {step === 'fields' && (
          <div className="space-y-6">
            <FieldEditor fields={inputFields} onChange={setInputFields} />

            <div className="flex justify-between">
              <button
                onClick={() => setStep('basic')}
                className="btn-secondary"
              >
                이전
              </button>
              <button
                onClick={() => setStep('personality')}
                className="btn-primary"
              >
                다음
              </button>
            </div>
          </div>
        )}

        {step === 'personality' && (
          <div className="space-y-6">
            <PersonalityEditor
              personality={personality}
              onChange={setPersonality}
            />

            <div className="flex justify-between">
              <button
                onClick={() => setStep('fields')}
                className="btn-secondary"
              >
                이전
              </button>
              <button
                onClick={() => setStep('prompt')}
                className="btn-primary"
              >
                다음
              </button>
            </div>
          </div>
        )}

        {step === 'prompt' && (
          <div className="space-y-6">
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
                className="btn-secondary"
              >
                이전
              </button>
              <button
                onClick={() => setStep('preview')}
                className="btn-primary"
              >
                <Eye className="w-4 h-4 mr-2" />
                미리보기
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
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
                className="btn-secondary"
              >
                이전
              </button>
              <button
                onClick={handleSubmit(handleSave)}
                disabled={isSubmitting}
                className="btn-primary"
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
