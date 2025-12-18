import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Copy, Check, Play, Loader2, Zap, Timer, Hash } from 'lucide-react';
import { Execution } from '../types';
import { historyApi } from '../api';

// 마크다운 파싱 함수
function parseMarkdown(text: string): string {
  const codeBlockClass = 'bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm my-3 block';
  const inlineCodeClass = 'bg-white/10 px-1.5 py-0.5 rounded text-primary-300 font-mono text-sm';

  let result = text;

  // 코드 블록 처리
  result = result.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="${codeBlockClass}"><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // 헤더 처리
  result = result.replace(/^#### (.*$)/gim, '<h4 class="text-base font-semibold mt-4 mb-2 text-gray-100">$1</h4>');
  result = result.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-100">$1</h3>');
  result = result.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-3 text-white">$1</h2>');
  result = result.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-5 mb-3 text-white">$1</h1>');

  // 굵은 글씨
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');

  // 기울임
  result = result.replace(/\*(.*?)\*/g, '<em class="italic text-gray-200">$1</em>');

  // 인라인 코드
  result = result.replace(/`([^`]+)`/g, `<code class="${inlineCodeClass}">$1</code>`);

  // 순서 없는 리스트
  result = result.replace(/^[-*] (.*)$/gim, '<li class="ml-4 list-disc text-gray-200">$1</li>');

  // 순서 있는 리스트
  result = result.replace(/^\d+\. (.*)$/gim, '<li class="ml-4 list-decimal text-gray-200">$1</li>');

  // 링크
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary-400 hover:underline" target="_blank" rel="noopener">$1</a>');

  // 수평선
  result = result.replace(/^---$/gim, '<hr class="my-4 border-gray-700" />');

  // 줄바꿈
  result = result.replace(/\n/g, '<br />');

  // pre 태그 내의 <br /> 제거
  result = result.replace(/<pre([^>]*)>([\s\S]*?)<\/pre>/g, (match, attrs, content) => {
    return `<pre${attrs}>${content.replace(/<br \/>/g, '\n')}</pre>`;
  });

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function HistoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);

  useEffect(() => {
    if (id) {
      fetchExecution();
    }
  }, [id]);

  const fetchExecution = async () => {
    try {
      const data = await historyApi.getById(id!);
      setExecution(data);
    } catch (error) {
      console.error('Failed to fetch execution:', error);
      navigate('/history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyInput = async () => {
    if (execution?.inputData) {
      await navigator.clipboard.writeText(JSON.stringify(execution.inputData, null, 2));
      setCopiedInput(true);
      setTimeout(() => setCopiedInput(false), 2000);
    }
  };

  const handleCopyOutput = async () => {
    const outputText = execution?.output || execution?.result;
    if (outputText) {
      const text =
        typeof outputText === 'string'
          ? outputText
          : JSON.stringify(outputText, null, 2);
      await navigator.clipboard.writeText(text);
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">실행 기록을 찾을 수 없습니다</p>
      </div>
    );
  }

  // 결과 텍스트 가져오기 (output 또는 result)
  const outputText = execution.output || (
    typeof execution.result === 'string'
      ? execution.result
      : execution.result
        ? JSON.stringify(execution.result, null, 2)
        : null
  );

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
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-3xl sm:text-4xl shrink-0">
              {execution.aiToolIcon || execution.aiTool?.icon || '🤖'}
            </span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-white truncate">
                {execution.aiToolName || execution.aiTool?.name || 'AI Tool'}
              </h1>
              <div className="flex items-center gap-2 sm:gap-3 text-gray-400 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="whitespace-nowrap">
                    {new Date(execution.createdAt).toLocaleString('ko-KR')}
                  </span>
                </div>
                {execution.output && (
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-xs bg-green-900/50 text-green-400 shrink-0">
                    완료
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <Link
          to={`/ai/${execution.aiToolId}`}
          className="flex items-center justify-center px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm sm:text-base self-end sm:self-auto"
        >
          <Play className="w-4 h-4 mr-1.5 sm:mr-2" />
          다시 실행
        </Link>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-xl border p-3 sm:p-4 bg-white/5 border-gray-700/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-gray-400 mb-1 sm:mb-2">
              <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">실행 시간</span>
            </div>
            <p className="text-lg sm:text-xl font-semibold text-white">
              {execution.executionTime
                ? `${(execution.executionTime / 1000).toFixed(2)}초`
                : '-'}
            </p>
          </div>
          <div className="rounded-xl border p-3 sm:p-4 bg-white/5 border-gray-700/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-gray-400 mb-1 sm:mb-2">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">토큰 사용량</span>
            </div>
            <p className="text-lg sm:text-xl font-semibold text-white">
              {execution.tokensUsed ? `${execution.tokensUsed.toLocaleString()}` : '-'}
            </p>
          </div>
          <div className="rounded-xl border p-3 sm:p-4 bg-white/5 border-gray-700/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-gray-400 mb-1 sm:mb-2">
              <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">실행 ID</span>
            </div>
            <p className="text-xs sm:text-sm font-mono text-white truncate" title={execution.id}>
              {execution.id.slice(0, 8)}...
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="rounded-xl border overflow-hidden bg-white/5 border-gray-700/20 backdrop-blur-sm">
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border-b border-gray-700/20">
            <h3 className="font-medium text-white text-sm sm:text-base">입력</h3>
            <button
              onClick={handleCopyInput}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400"
            >
              {copiedInput ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="p-3 sm:p-4">
            {execution.inputData && typeof execution.inputData === 'object' ? (
              (() => {
                const validEntries = Object.entries(execution.inputData).filter(
                  ([, value]) => value !== null && value !== undefined && value !== ''
                );
                return validEntries.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {validEntries.map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">
                          {key}
                        </label>
                        <div className="bg-gray-900/50 rounded-lg p-2.5 sm:p-3 text-gray-200 border border-gray-700/30 text-sm">
                          {typeof value === 'string' && value.startsWith('http') ? (
                            value.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img
                                src={value}
                                alt={key}
                                className="max-h-32 sm:max-h-40 rounded"
                              />
                            ) : (
                              <a
                                href={value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-400 hover:underline break-all"
                              >
                                {value}
                              </a>
                            )
                          ) : (
                            <span className="whitespace-pre-wrap">{String(value)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">입력 데이터가 없습니다</p>
                );
              })()
            ) : (
              <p className="text-gray-500 text-sm">입력 데이터가 없습니다</p>
            )}
          </div>
        </div>

        {/* Output */}
        <div className="rounded-xl border overflow-hidden bg-white/5 border-gray-700/20 backdrop-blur-sm">
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border-b border-gray-700/20">
            <h3 className="font-medium text-white text-sm sm:text-base">결과</h3>
            <button
              onClick={handleCopyOutput}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400"
            >
              {copiedOutput ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="p-4 sm:p-6">
            {outputText ? (
              <div
                className="leading-relaxed text-gray-200 text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(outputText) }}
              />
            ) : (
              <p className="text-gray-500 text-sm">결과가 없습니다</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
