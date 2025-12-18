import { Info } from 'lucide-react';
import { InputField, OutputConfig } from '../../types';

interface PromptEditorProps {
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  outputConfig: OutputConfig;
  onOutputConfigChange: (config: OutputConfig) => void;
  inputFields: InputField[];
}

const OUTPUT_FORMATS = [
  { value: 'text', label: '일반 텍스트' },
  { value: 'markdown', label: '마크다운' },
  { value: 'json', label: 'JSON' },
  { value: 'list', label: '목록' },
];

export default function PromptEditor({
  systemPrompt,
  onSystemPromptChange,
  outputConfig,
  onOutputConfigChange,
  inputFields,
}: PromptEditorProps) {
  const insertVariable = (fieldName: string) => {
    const variable = `{{${fieldName}}}`;
    onSystemPromptChange(systemPrompt + variable);
  };

  return (
    <div className="space-y-6">
      {/* System Prompt */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            시스템 프롬프트
          </label>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Info className="w-4 h-4" />
            <span>AI의 기본 동작을 정의합니다</span>
          </div>
        </div>
        <textarea
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          placeholder="예: 당신은 전문 블로그 작가입니다. 주어진 주제에 대해 SEO에 최적화된 블로그 글을 작성합니다."
          rows={6}
          className="input resize-none font-mono text-sm"
        />

        {/* Variable Buttons */}
        {inputFields.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-gray-500 mb-2">변수 삽입:</p>
            <div className="flex flex-wrap gap-2">
              {inputFields.map((field) => (
                <button
                  key={field.name}
                  onClick={() => insertVariable(field.name)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors font-mono"
                >
                  {`{{${field.name}}}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Output Config */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">출력 설정</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              출력 형식
            </label>
            <select
              value={outputConfig.format}
              onChange={(e) =>
                onOutputConfigChange({
                  ...outputConfig,
                  format: e.target.value as OutputConfig['format'],
                })
              }
              className="input"
            >
              {OUTPUT_FORMATS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              최대 길이 (토큰)
            </label>
            <input
              type="number"
              value={outputConfig.maxLength}
              onChange={(e) =>
                onOutputConfigChange({
                  ...outputConfig,
                  maxLength: Number(e.target.value),
                })
              }
              min={100}
              max={4000}
              className="input"
            />
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={outputConfig.streaming}
                onChange={(e) =>
                  onOutputConfigChange({
                    ...outputConfig,
                    streaming: e.target.checked,
                  })
                }
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-gray-700">스트리밍 출력 활성화</span>
              <span className="text-sm text-gray-400">
                (결과를 실시간으로 표시)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">프롬프트 미리보기</h3>
        <div className="bg-gray-900 rounded-xl p-4 text-sm font-mono">
          <div className="text-gray-400 mb-2">// System Prompt</div>
          <div className="text-green-400 whitespace-pre-wrap">
            {systemPrompt || '(시스템 프롬프트가 비어있습니다)'}
          </div>

          {inputFields.length > 0 && (
            <>
              <div className="text-gray-400 mt-4 mb-2">// User Input</div>
              <div className="text-blue-400">
                {inputFields.map((field) => (
                  <div key={field.name}>
                    {field.label}: {`{{${field.name}}}`}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
