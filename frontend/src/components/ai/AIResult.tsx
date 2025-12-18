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
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(result) }}
          />
        );

      case 'json':
        try {
          const parsed = JSON.parse(result);
          return (
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          );
        } catch {
          return <pre className="whitespace-pre-wrap text-gray-800">{result}</pre>;
        }

      case 'list':
        const items = result.split('\n').filter(Boolean);
        return (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-gray-800">{item.replace(/^\d+\.\s*/, '')}</span>
              </li>
            ))}
          </ul>
        );

      default:
        return (
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {result}
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-primary-600 ml-1 animate-pulse" />
            )}
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">결과</h3>
        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
              title="다시 실행"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
            title="복사"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
            title="다운로드"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {result ? (
          renderResult()
        ) : (
          <div className="text-center py-8 text-gray-400">
            결과가 여기에 표시됩니다
          </div>
        )}
      </div>
    </div>
  );
}

function parseMarkdown(text: string): string {
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
    .replace(/\n/g, '<br />');
}
