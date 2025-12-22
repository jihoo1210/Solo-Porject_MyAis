import { Copy, Download, Check, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { OutputConfig } from '../../types';

interface AIResultProps {
  result: string;
  imageUrl?: string;  // AI가 생성한 이미지 URL
  outputConfig?: OutputConfig;
  onRetry?: () => void;
  isStreaming?: boolean;
}

export default function AIResult({
  result,
  imageUrl,
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

  const handleDownload = async () => {
    // 이미지 URL이 있으면 이미지 다운로드
    if (imageUrl) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-image-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Image download failed:', error);
        // 폴백: 새 탭에서 열기
        window.open(imageUrl, '_blank');
      }
      return;
    }

    // 텍스트 다운로드
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
        {/* 이미지가 있으면 먼저 표시 */}
        {imageUrl && (
          <div className="mb-4">
            <img
              src={imageUrl}
              alt="AI 생성 이미지"
              className="max-w-full h-auto rounded-lg mx-auto border border-gray-700/30"
              loading="lazy"
            />
          </div>
        )}
        {result ? (
          renderResult()
        ) : !imageUrl ? (
          <div className="text-center py-6 sm:py-8 text-gray-400 text-sm sm:text-base">
            결과가 여기에 표시됩니다
          </div>
        ) : null}
      </div>
    </div>
  );
}

function parseMarkdown(text: string): string {
  const codeBlockClass = 'bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm my-3 block';
  const inlineCodeClass = 'bg-white/10 px-1.5 py-0.5 rounded text-primary-300 font-mono text-sm';

  let result = text;

  // 줄바꿈 정규화 (Windows \r\n -> \n)
  result = result.replace(/\r\n/g, '\n');
  result = result.replace(/\r/g, '\n');

  // 코드 블록 임시 치환 (다른 처리에서 건드리지 않도록)
  const codeBlocks: string[] = [];
  result = result.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<pre class="${codeBlockClass}"><code>${escapeHtml(code.trim())}</code></pre>`);
    return placeholder;
  });

  // 인라인 코드 임시 치환
  const inlineCodes: string[] = [];
  result = result.replace(/`([^`]+)`/g, (_, code) => {
    const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
    inlineCodes.push(`<code class="${inlineCodeClass}">${escapeHtml(code)}</code>`);
    return placeholder;
  });

  // 헤더 처리
  result = result.replace(/^#### (.*$)/gim, '<h4 class="text-base font-semibold mt-4 mb-2 text-gray-100">$1</h4>');
  result = result.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-100">$1</h3>');
  result = result.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-3 text-white">$1</h2>');
  result = result.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-5 mb-3 text-white">$1</h1>');

  // 순서 없는 리스트 (- item 또는 * item) - 굵은 글씨/기울임보다 먼저 처리
  // 줄 시작 + 선택적 공백(들여쓰기) + * 또는 - + 하나 이상의 공백 + 텍스트
  result = result.replace(/(^|\n)\s*[*\-•·]\s+(.+)/gm, (_, prefix, content) => {
    return `${prefix}<li class="ml-4 list-disc text-gray-200">${content}</li>`;
  });

  // 순서 있는 리스트 (1. item)
  result = result.replace(/(^|\n)\d+\. (.+)/gm, (_, prefix, content) =>
    `${prefix}<li class="ml-4 list-decimal text-gray-200">${content}</li>`
  );

  // 굵은 글씨 (**text**) - 반드시 기울임보다 먼저 처리
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');

  // 기울임 (*text*) - 인라인에서만 적용
  // 앞에 공백이나 태그가 있고, 뒤에 공백/태그/구두점이 있는 경우만 매칭
  result = result.replace(/(?<=[\s>])\*([^*\n]+)\*(?=[\s<.,!?;:]|$)/g, '<em class="italic text-gray-200">$1</em>');

  // 연속된 li 태그를 ul/ol로 감싸기
  result = result.replace(/(<li class="ml-4 list-disc[^>]*>.*?<\/li>(\n|<br \/>)?)+/g, '<ul class="my-2 space-y-1 list-disc list-inside">$&</ul>');
  result = result.replace(/(<li class="ml-4 list-decimal[^>]*>.*?<\/li>(\n|<br \/>)?)+/g, '<ol class="my-2 space-y-1 list-decimal list-inside">$&</ol>');

  // 이미지 ![alt](url) - 링크보다 먼저 처리
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4 mx-auto border border-gray-700/30" loading="lazy" />');

  // 링크 [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary-400 hover:underline" target="_blank" rel="noopener">$1</a>');

  // 수평선
  result = result.replace(/^---$/gim, '<hr class="my-4 border-gray-700" />');

  // 줄바꿈 처리
  result = result.replace(/\n/g, '<br />');

  // 코드 블록 복원
  codeBlocks.forEach((block, i) => {
    result = result.replace(`__CODE_BLOCK_${i}__`, block);
  });

  // 인라인 코드 복원
  inlineCodes.forEach((code, i) => {
    result = result.replace(`__INLINE_CODE_${i}__`, code);
  });

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
