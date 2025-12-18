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
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">미리보기</h3>

      {/* Card Preview */}
      <div>
        <p className="text-sm text-gray-500 mb-2">카드 미리보기</p>
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-sm">
          <div className="flex items-start justify-between mb-4">
            <span className="text-4xl">{icon || '🤖'}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">
            {name || '새 AI'}
          </h3>
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {description || '설명이 없습니다'}
          </p>
          <button className="btn-primary w-full justify-center">
            <Play className="w-4 h-4 mr-2" />
            실행하기
          </button>
        </div>
      </div>

      {/* Form Preview */}
      <div>
        <p className="text-sm text-gray-500 mb-2">입력 폼 미리보기</p>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-4">
            {inputFields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    placeholder={field.placeholder}
                    rows={3}
                    className="input resize-none"
                    disabled
                  />
                ) : field.type === 'select' ? (
                  <select className="input" disabled>
                    <option>선택하세요</option>
                    {field.options?.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === 'image' ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                    <p className="text-gray-400">이미지 업로드 영역</p>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    className="input"
                    disabled
                  />
                )}
              </div>
            ))}

            <button className="btn-primary w-full justify-center" disabled>
              실행하기
            </button>
          </div>
        </div>
      </div>

      {/* System Prompt Preview */}
      <div>
        <p className="text-sm text-gray-500 mb-2">시스템 프롬프트</p>
        <div className="bg-gray-900 rounded-xl p-4">
          <pre className="text-green-400 text-sm whitespace-pre-wrap font-mono">
            {systemPrompt || '(시스템 프롬프트가 비어있습니다)'}
          </pre>
        </div>
      </div>
    </div>
  );
}
