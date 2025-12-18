import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { AITool, InputField, OutputConfig, AIPersonality } from '../types';
import { aiToolsApi } from '../api';
import FieldEditor from '../components/builder/FieldEditor';
import PersonalityEditor from '../components/builder/PersonalityEditor';
import PromptEditor from '../components/builder/PromptEditor';

interface FormData {
  name: string;
  description: string;
  icon: string;
}

const EMOJI_OPTIONS = ['🤖', '✨', '📝', '🎨', '💼', '📊', '🔍', '💡', '🎯', '⚡', '🌟', '🔮'];

export default function AIEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (id) {
      fetchTool();
    }
  }, [id]);

  const fetchTool = async () => {
    try {
      const data = await aiToolsApi.getById(id!);
      setTool(data);

      setValue('name', data.name);
      setValue('description', data.description || '');
      setValue('icon', data.icon);
      setInputFields(data.inputFields);
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
        inputFields,
        outputConfig,
        systemPrompt: buildSystemPrompt(),
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

  const buildSystemPrompt = () => {
    const parts = [];

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

    if (personality.tone.formal > 70) {
      parts.push('격식 있는 문체를 사용합니다.');
    } else if (personality.tone.formal < 30) {
      parts.push('편안한 문체를 사용합니다.');
    }

    if (personality.tone.creative > 70) {
      parts.push('창의적이고 독창적인 표현을 사용합니다.');
    }

    if (personality.expertise.length > 0) {
      parts.push(`전문 분야: ${personality.expertise.join(', ')}`);
    }

    if (personality.customInstructions) {
      parts.push(personality.customInstructions);
    }

    if (systemPrompt) {
      parts.push(systemPrompt);
    }

    return parts.join('\n\n');
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
        <p className="text-gray-500">AI 도구를 찾을 수 없습니다</p>
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI 수정</h1>
            <p className="text-gray-500">{tool.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn-secondary text-red-600 hover:bg-red-50"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                삭제
              </>
            )}
          </button>
          <button
            onClick={handleSave}
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
                저장
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === 'basic' && (
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
