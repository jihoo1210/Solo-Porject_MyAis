import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Copy, Check, Play, Loader2 } from 'lucide-react';
import { Execution } from '../types';
import { historyApi } from '../api';

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
    if (execution?.result) {
      const text =
        typeof execution.result === 'string'
          ? execution.result
          : JSON.stringify(execution.result, null, 2);
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
        <p className="text-gray-500">실행 기록을 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{execution.aiTool?.icon}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {execution.aiTool?.name}
              </h1>
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="w-4 h-4" />
                <span>
                  {new Date(execution.createdAt).toLocaleString('ko-KR')}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    execution.status === 'SUCCESS'
                      ? 'bg-green-100 text-green-700'
                      : execution.status === 'FAILED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {execution.status === 'SUCCESS'
                    ? '성공'
                    : execution.status === 'FAILED'
                    ? '실패'
                    : '처리중'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {execution.aiTool && (
          <Link
            to={`/ai/${execution.aiTool.id}`}
            className="btn-primary"
          >
            <Play className="w-4 h-4 mr-2" />
            다시 실행
          </Link>
        )}
      </div>

      <div className="space-y-6">
        {/* Input */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">입력</h3>
            <button
              onClick={handleCopyInput}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
            >
              {copiedInput ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="p-4">
            {execution.inputData && typeof execution.inputData === 'object' ? (
              <div className="space-y-3">
                {Object.entries(execution.inputData).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      {key}
                    </label>
                    <div className="bg-gray-50 rounded-lg p-3 text-gray-800">
                      {typeof value === 'string' && value.startsWith('http') ? (
                        value.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img
                            src={value}
                            alt={key}
                            className="max-h-40 rounded"
                          />
                        ) : (
                          <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline"
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
              <p className="text-gray-500">입력 데이터가 없습니다</p>
            )}
          </div>
        </div>

        {/* Output */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">결과</h3>
            <button
              onClick={handleCopyOutput}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
            >
              {copiedOutput ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="p-4">
            {execution.result ? (
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {typeof execution.result === 'string'
                  ? execution.result
                  : JSON.stringify(execution.result, null, 2)}
              </div>
            ) : execution.status === 'FAILED' ? (
              <div className="text-red-600">
                실행 중 오류가 발생했습니다
              </div>
            ) : (
              <p className="text-gray-500">결과가 없습니다</p>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">상세 정보</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">실행 ID</span>
              <p className="text-gray-900 font-mono">{execution.id}</p>
            </div>
            <div>
              <span className="text-gray-500">실행 시간</span>
              <p className="text-gray-900">
                {execution.executionTime
                  ? `${(execution.executionTime / 1000).toFixed(2)}초`
                  : '-'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">토큰 사용량</span>
              <p className="text-gray-900">
                {execution.tokensUsed ? `${execution.tokensUsed} 토큰` : '-'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">생성일</span>
              <p className="text-gray-900">
                {new Date(execution.createdAt).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
