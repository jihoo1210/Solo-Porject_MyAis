import { Info } from 'lucide-react';
import { useRef, useEffect, useCallback } from 'react';
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

// 변수를 하이라이트하는 함수
function highlightVariables(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.replace(
    /\{\{([^}]+)\}\}/g,
    '<span class="variable-highlight">{{$1}}</span>'
  );
}

export default function PromptEditor({
  systemPrompt,
  onSystemPromptChange,
  outputConfig,
  onOutputConfigChange,
  inputFields,
}: PromptEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);

  // 커서 위치 저장 및 복원
  const saveCaretPosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return null;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);

    return preCaretRange.toString().length;
  }, []);

  const restoreCaretPosition = useCallback((position: number | null) => {
    if (position === null || !editorRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    let charCount = 0;
    let found = false;

    const traverseNodes = (node: Node): boolean => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        if (charCount + textLength >= position) {
          range.setStart(node, position - charCount);
          range.collapse(true);
          return true;
        }
        charCount += textLength;
      } else {
        for (const child of Array.from(node.childNodes)) {
          if (traverseNodes(child)) return true;
        }
      }
      return false;
    };

    found = traverseNodes(editorRef.current);

    if (!found) {
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  // 텍스트 추출
  const getTextContent = useCallback(() => {
    if (!editorRef.current) return '';
    return editorRef.current.innerText || '';
  }, []);

  // 에디터 내용 업데이트
  const updateEditorContent = useCallback(() => {
    if (!editorRef.current || isComposing.current) return;

    const caretPos = saveCaretPosition();
    editorRef.current.innerHTML = highlightVariables(systemPrompt) || '<br>';
    restoreCaretPosition(caretPos);
  }, [systemPrompt, saveCaretPosition, restoreCaretPosition]);

  useEffect(() => {
    updateEditorContent();
  }, [systemPrompt]);

  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    const text = getTextContent();
    if (text !== systemPrompt) {
      onSystemPromptChange(text);
    }
  }, [getTextContent, systemPrompt, onSystemPromptChange]);

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = () => {
    isComposing.current = false;
    handleInput();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter 키로 줄바꿈 허용 (기본 동작 유지)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertLineBreak');
    }
  };

  const insertVariable = (fieldName: string) => {
    const variable = `{{${fieldName}}}`;
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      document.execCommand('insertText', false, variable);
    } else {
      onSystemPromptChange(systemPrompt + variable);
    }

    editorRef.current?.focus();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* CSS for variable highlighting */}
      <style>{`
        .prompt-editor .variable-highlight {
          color: #facc15;
          font-weight: 600;
          background: rgba(250, 204, 21, 0.1);
          padding: 0 2px;
          border-radius: 3px;
        }
        .prompt-editor:empty::before {
          content: attr(data-placeholder);
          color: #6b7280;
          pointer-events: none;
        }
        .prompt-editor:focus {
          outline: none;
        }
      `}</style>

      {/* System Prompt */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
          <label className="block text-sm font-medium text-gray-300">
            핵심 역할 및 작업 지시
          </label>
          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-400">
            <Info className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>AI가 수행할 구체적인 작업을 정의합니다</span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-400 mb-3">
          AI의 역할과 수행해야 할 작업을 구체적으로 작성하세요. 입력 필드의 변수를 활용할 수 있습니다.
        </p>

        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onPaste={handlePaste}
          data-placeholder="예: 당신은 전문 블로그 작가입니다. {{topic}}에 대해 SEO에 최적화된 블로그 글을 작성합니다. 제목, 서론, 본문 3개 섹션, 결론으로 구성해주세요."
          className="prompt-editor input resize-none font-mono text-sm w-full min-h-36 whitespace-pre-wrap text-gray-200"
          suppressContentEditableWarning
        />

        {/* Variable Buttons */}
        {inputFields.length > 0 && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white/2 rounded-lg border border-gray-700/20">
            <div className="flex items-start gap-2 mb-3">
              <Info className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-300 font-medium mb-1">변수 사용법</p>
                <p className="text-xs sm:text-sm text-gray-400">
                  아래 버튼을 클릭하면 변수가 프롬프트에 삽입됩니다.
                  AI 실행 시 사용자가 입력한 값으로 자동 대체됩니다.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {inputFields.map((field) => (
                <button
                  key={field.name}
                  onClick={() => insertVariable(field.name)}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary-600/20 border border-primary-500/30 text-primary-300 rounded text-xs sm:text-sm hover:bg-primary-600/30 transition-colors"
                  title={`"${field.label}" 필드의 값이 여기에 대체됩니다`}
                >
                  <span className="text-gray-400">{field.label}:</span>
                  <code className="font-mono text-yellow-400">{`{{${field.name}}}`}</code>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              예시: 프롬프트에 <code className="text-yellow-400">{'{{topic}}'}</code>을 넣고, 실행 시 "강아지 기르기"를 입력하면 → "강아지 기르기"로 대체됨
            </p>
          </div>
        )}
      </div>

      {/* Output Config */}
      <div className="border-t border-gray-700/20 pt-4 sm:pt-6">
        <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">출력 설정</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
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
              className="input w-full"
            >
              {OUTPUT_FORMATS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
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
              className="input w-full"
            />
          </div>

          <div className="sm:col-span-2">
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
                className="w-4 h-4 text-primary-600 rounded bg-gray-800 border-gray-700"
              />
              <span className="text-sm text-gray-300">스트리밍 출력 활성화</span>
              <span className="text-xs sm:text-sm text-gray-400">
                (결과를 실시간으로 표시)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="border-t border-gray-700/20 pt-4 sm:pt-6">
        <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">프롬프트 미리보기</h3>
        <div className="bg-gray-900/80 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-mono border border-gray-700/20 overflow-x-auto">
          <div className="text-gray-400 mb-2">// System Prompt</div>
          <div className="text-green-400 whitespace-pre-wrap wrap-break-word">
            {systemPrompt || '(시스템 프롬프트가 비어있습니다)'}
          </div>

          {inputFields.length > 0 && (
            <>
              <div className="text-gray-400 mt-4 mb-2">// User Input</div>
              <div className="text-blue-400">
                {inputFields.map((field) => (
                  <div key={field.name}>
                    {field.label}: <span className="text-yellow-400">{`{{${field.name}}}`}</span>
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
