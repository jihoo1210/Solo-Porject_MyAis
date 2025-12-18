import { X } from 'lucide-react';
import { AIPersonality } from '../../types';

interface PersonalityEditorProps {
  personality: AIPersonality;
  onChange: (personality: AIPersonality) => void;
}

const PRESETS = [
  { id: 'professional', label: '전문적', emoji: '💼' },
  { id: 'friendly', label: '친근한', emoji: '😊' },
  { id: 'creative', label: '창의적', emoji: '🎨' },
  { id: 'academic', label: '학술적', emoji: '📚' },
  { id: 'casual', label: '캐주얼', emoji: '✌️' },
];

const EXPERTISE_SUGGESTIONS = [
  '마케팅', '기술', '금융', '의료', '법률', '교육',
  '디자인', '영업', '인사', '물류', '미디어', '스포츠',
];

export default function PersonalityEditor({
  personality,
  onChange,
}: PersonalityEditorProps) {
  const updateTone = (key: keyof AIPersonality['tone'], value: number) => {
    onChange({
      ...personality,
      tone: { ...personality.tone, [key]: value },
    });
  };

  const addExpertise = (tag: string) => {
    if (!personality.expertise.includes(tag)) {
      onChange({
        ...personality,
        expertise: [...personality.expertise, tag],
      });
    }
  };

  const removeExpertise = (tag: string) => {
    onChange({
      ...personality,
      expertise: personality.expertise.filter((t) => t !== tag),
    });
  };

  return (
    <div className="space-y-8">
      {/* Presets */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">성격 프리셋</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onChange({ ...personality, preset: preset.id })}
              className={`p-4 rounded-xl border-2 transition-all ${
                personality.preset === preset.id
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl block mb-1">{preset.emoji}</span>
              <span className="text-sm font-medium text-gray-900">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tone Sliders */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">톤 조절</h3>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">캐주얼</span>
              <span className="text-sm text-gray-600">격식체</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={personality.tone.formal}
              onChange={(e) => updateTone('formal', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">사무적</span>
              <span className="text-sm text-gray-600">친근함</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={personality.tone.friendly}
              onChange={(e) => updateTone('friendly', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">정형적</span>
              <span className="text-sm text-gray-600">창의적</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={personality.tone.creative}
              onChange={(e) => updateTone('creative', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>
        </div>
      </div>

      {/* Expertise Tags */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">전문 분야</h3>

        {/* Selected Tags */}
        {personality.expertise.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {personality.expertise.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
              >
                {tag}
                <button
                  onClick={() => removeExpertise(tag)}
                  className="hover:text-primary-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2">
          {EXPERTISE_SUGGESTIONS.filter(
            (tag) => !personality.expertise.includes(tag)
          ).map((tag) => (
            <button
              key={tag}
              onClick={() => addExpertise(tag)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Instructions */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">추가 지시사항</h3>
        <textarea
          value={personality.customInstructions}
          onChange={(e) =>
            onChange({ ...personality, customInstructions: e.target.value })
          }
          placeholder="AI에게 추가로 지시할 내용을 입력하세요. 예: 항상 예시를 포함해서 설명해줘"
          rows={4}
          className="input resize-none"
        />
      </div>
    </div>
  );
}
