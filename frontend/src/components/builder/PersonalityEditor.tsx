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
  '여행', '음식', '패션', '부동산', '게임', '음악',
  '심리', '환경', '건축', '제조',
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
    <div className="space-y-6 sm:space-y-8">
      {/* Presets */}
      <div>
        <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">성격 프리셋</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onChange({ ...personality, preset: preset.id })}
              className={`p-2.5 sm:p-4 rounded-xl border-2 transition-all ${
                personality.preset === preset.id
                  ? 'border-primary-500 bg-primary-600/20'
                  : 'border-gray-700/30 hover:border-gray-600/50 bg-white/2'
              }`}
            >
              <span className="text-xl sm:text-2xl block mb-0.5 sm:mb-1">{preset.emoji}</span>
              <span className="text-xs sm:text-sm font-medium text-white">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tone Sliders */}
      <div>
        <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">톤 조절</h3>
        <div className="space-y-4 sm:space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-300">캐주얼</span>
              <span className="text-xs sm:text-sm text-gray-300">격식체</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={personality.tone.formal}
              onChange={(e) => updateTone('formal', Number(e.target.value))}
              className="w-full h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-300">사무적</span>
              <span className="text-xs sm:text-sm text-gray-300">친근함</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={personality.tone.friendly}
              onChange={(e) => updateTone('friendly', Number(e.target.value))}
              className="w-full h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-300">정형적</span>
              <span className="text-xs sm:text-sm text-gray-300">창의적</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={personality.tone.creative}
              onChange={(e) => updateTone('creative', Number(e.target.value))}
              className="w-full h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>
        </div>
      </div>

      {/* Expertise Tags */}
      <div>
        <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">전문 분야</h3>

        {/* Selected Tags */}
        {personality.expertise.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {personality.expertise.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-primary-600/30 text-primary-300 rounded-full text-xs sm:text-sm"
              >
                {tag}
                <button
                  onClick={() => removeExpertise(tag)}
                  className="hover:text-primary-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Suggestions */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {EXPERTISE_SUGGESTIONS.filter(
            (tag) => !personality.expertise.includes(tag)
          ).map((tag) => (
            <button
              key={tag}
              onClick={() => addExpertise(tag)}
              className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/2 border border-gray-700/30 text-gray-300 rounded-full text-xs sm:text-sm hover:bg-white/10 transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Instructions */}
      <div>
        <h3 className="text-base sm:text-lg font-medium text-white mb-2">응답 스타일 가이드</h3>
        <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
          AI가 응답할 때 따라야 할 스타일이나 형식을 지정하세요. 위에서 설정한 성격과 함께 적용됩니다.
        </p>
        <textarea
          value={personality.customInstructions}
          onChange={(e) =>
            onChange({ ...personality, customInstructions: e.target.value })
          }
          placeholder="예: 항상 예시를 포함해서 설명해줘, 이모지를 사용해줘, 3줄 이내로 간결하게 답변해줘"
          rows={4}
          className="input resize-none font-mono text-xs sm:text-sm"
        />
      </div>
    </div>
  );
}
