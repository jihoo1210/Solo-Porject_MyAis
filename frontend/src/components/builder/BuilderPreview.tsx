import { Play } from 'lucide-react';
import { InputField } from '../../types';

interface BuilderPreviewProps {
  name: string;
  description: string;
  icon: string;
  inputFields: InputField[];
  systemPrompt: string;
}

export default function BuilderPreview({
  name,
  description,
  icon,
  inputFields,
  systemPrompt,
}: BuilderPreviewProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h3 className="text-base sm:text-lg font-medium text-white">미리보기</h3>

      {/* Card Preview */}
      <div>
        <p className="text-xs sm:text-sm text-gray-400 mb-2">카드 미리보기</p>
        <div className="bg-white/2 rounded-xl border border-gray-700/20 p-4 sm:p-6 max-w-sm backdrop-blur-sm">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <span className="text-3xl sm:text-4xl">{icon || '🤖'}</span>
          </div>
          <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">
            {name || '새 AI'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 line-clamp-2">
            {description || '설명이 없습니다'}
          </p>
          <button className="btn-primary w-full justify-center text-sm sm:text-base">
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            실행하기
          </button>
        </div>
      </div>

      {/* Form Preview */}
      <div>
        <p className="text-xs sm:text-sm text-gray-400 mb-2">입력 폼 미리보기</p>
        <div className="bg-white/2 rounded-xl border border-gray-700/20 p-4 sm:p-6 backdrop-blur-sm">
          <div className="space-y-3 sm:space-y-4">
            {inputFields.map((field) => (
              <div key={field.name}>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    placeholder={field.placeholder}
                    rows={3}
                    className="input resize-none text-sm"
                    disabled
                  />
                ) : field.type === 'select' ? (
                  <select className="input text-sm" disabled>
                    <option>선택하세요</option>
                    {field.options?.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === 'image' ? (
                  <div className="border-2 border-dashed border-gray-700/30 rounded-xl p-4 sm:p-6 text-center bg-white/2">
                    <p className="text-gray-400 text-xs sm:text-sm">이미지 업로드 영역</p>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    className="input text-sm"
                    disabled
                  />
                )}
              </div>
            ))}

            <button className="btn-primary w-full justify-center text-sm sm:text-base" disabled>
              실행하기
            </button>
          </div>
        </div>
      </div>

      {/* System Prompt Preview */}
      <div>
        <p className="text-xs sm:text-sm text-gray-400 mb-2">시스템 프롬프트</p>
        <div className="bg-gray-900/80 rounded-xl p-3 sm:p-4 border border-gray-700/20 overflow-x-auto">
          <pre className="text-green-400 text-xs sm:text-sm whitespace-pre-wrap font-mono">
            {systemPrompt || '(시스템 프롬프트가 비어있습니다)'}
          </pre>
        </div>
      </div>
    </div>
  );
}
