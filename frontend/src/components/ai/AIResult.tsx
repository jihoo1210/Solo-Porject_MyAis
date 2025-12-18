import { Copy, Download, Check, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { OutputConfig } from '../../types';

interface AIResultProps {
  result: string;
  outputConfig?: OutputConfig;
  onRetry?: () => void;
  isStreaming?: boolean;
}

export default function AIResult({
  result,
  outputConfig,
  onRetry,
  isStreaming,
}: AIResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `result-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderResult = () => {
    const format = outputConfig?.format || 'text';

    switch (format) {
      case 'markdown':
        return (
          <div
            className="prose prose-sm max-w-none prose-invert"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(result) }}
          />
        );

      case 'json':
        try {
          const parsed = JSON.parse(result);
          return (
            <pre className="bg-white/5 text-green-400 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          );
        } catch {
          return <pre className="whitespace-pre-wrap text-gray-200 text-sm">{result}</pre>;
        }

      case 'list':
        const items = result.split('\n').filter(Boolean);
        return (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm shrink-0 bg-primary-600/30 text-primary-400">
                  {index + 1}
                </span>
                <span className="text-gray-200 text-sm sm:text-base">{item.replace(/^\d+\.\s*/, '')}</span>
              </li>
            ))}
          </ul>
        );

      default:
        // 기본 텍스트도 마크다운 렌더링 적용
        return (
          <div className="leading-relaxed text-gray-200 text-sm sm:text-base">
            <div dangerouslySetInnerHTML={{ __html: parseMarkdown(result) }} />
            {isStreaming && (
              <span className="inline-block w-2 h-4 sm:h-5 bg-primary-600 ml-1 animate-pulse" />
            )}
          </div>
        );
    }
  };

  return (
    <div className="rounded-xl border overflow-hidden bg-white/5 border-gray-700/20 backdrop-blur-sm">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b bg-white/5 border-gray-700/20">
        <h3 className="font-medium text-white text-sm sm:text-base">결과</h3>
        <div className="flex items-center gap-1 sm:gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-white/10 text-gray-300"
              title="다시 실행"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-white/10 text-gray-300"
            title="복사"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-white/10 text-gray-300"
            title="다운로드"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {result ? (
          renderResult()
        ) : (
          <div className="text-center py-6 sm:py-8 text-gray-400 text-sm sm:text-base">
            결과가 여기에 표시됩니다
          </div>
        )}
      </div>
    </div>
  );
}

function parseMarkdown(text: string): string {
  const codeBlockClass = 'bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm my-3 block';
  const inlineCodeClass = 'bg-white/10 px-1.5 py-0.5 rounded text-primary-300 font-mono text-sm';

  let result = text;

  // 코드 블록 처리 (```로 감싸진 부분)
  result = result.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="${codeBlockClass}"><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // 헤더 처리
  result = result.replace(/^#### (.*$)/gim, '<h4 class="text-base font-semibold mt-4 mb-2 text-gray-100">$1</h4>');
  result = result.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-100">$1</h3>');
  result = result.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-3 text-white">$1</h2>');
  result = result.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-5 mb-3 text-white">$1</h1>');

  // 굵은 글씨 (**text**)
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');

  // 기울임 (*text*)
  result = result.replace(/\*(.*?)\*/g, '<em class="italic text-gray-200">$1</em>');

  // 인라인 코드 (`code`)
  result = result.replace(/`([^`]+)`/g, `<code class="${inlineCodeClass}">$1</code>`);

  // 순서 없는 리스트 (- item 또는 * item)
  result = result.replace(/^[\-\*] (.*)$/gim, '<li class="ml-4 list-disc text-gray-200">$1</li>');

  // 순서 있는 리스트 (1. item)
  result = result.replace(/^\d+\. (.*)$/gim, '<li class="ml-4 list-decimal text-gray-200">$1</li>');

  // 연속된 li 태그를 ul/ol로 감싸기
  result = result.replace(/(<li class="ml-4 list-disc[^>]*>.*?<\/li>\n?)+/g, '<ul class="my-2 space-y-1">$&</ul>');
  result = result.replace(/(<li class="ml-4 list-decimal[^>]*>.*?<\/li>\n?)+/g, '<ol class="my-2 space-y-1">$&</ol>');

  // 링크 [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary-400 hover:underline" target="_blank" rel="noopener">$1</a>');

  // 수평선
  result = result.replace(/^---$/gim, '<hr class="my-4 border-gray-700" />');

  // 줄바꿈 처리 (pre 태그 내부 제외)
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
