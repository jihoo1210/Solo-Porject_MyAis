import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Settings, Loader2, AlertTriangle, Crown } from 'lucide-react';
import { AITool, Execution } from '../types';
import { aiToolsApi, executionApi } from '../api';
import { useAuthStore } from '../store';
import AIForm from '../components/ai/AIForm';
import AIResult from '../components/ai/AIResult';
import AILoadingSpinner from '../components/three/AILoadingSpinner';

const FREE_DAILY_LIMIT = 20;

export default function AIUse() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();
  const [tool, setTool] = useState<AITool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastInputData, setLastInputData] = useState<Record<string, unknown> | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 이미지 생성 모델인지 확인
  const isImageGenerationModel = tool?.aiModel?.includes('image-generation') ||
    tool?.aiModel?.includes('image-preview') ||
    tool?.aiModel === 'gemini-2.0-flash-preview-image-generation';

  // FREE 사용자 일일 제한 체크
  const isFreeTier = !user?.subscription || user.subscription === 'FREE';
  const hasReachedDailyLimit = isFreeTier && (user?.dailyUsageCount ?? 0) >= FREE_DAILY_LIMIT;

  // 이메일 인증 필요 여부 (SNS 로그인 제외)
  const needsEmailVerification = user && !user.emailVerified && !user.provider;

  useEffect(() => {
    // 이메일 미인증 시 대시보드로 리다이렉트
    if (needsEmailVerification) {
      navigate('/dashboard');
      return;
    }
    if (id) {
      fetchTool();
    }
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [id, needsEmailVerification, navigate]);

  const fetchTool = async () => {
    try {
      const data = await aiToolsApi.getById(id!);
      setTool(data);
    } catch (error) {
      console.error('Failed to fetch tool:', error);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (inputData: Record<string, unknown>) => {
    if (!tool) return;

    // 제한 도달 시 실행 차단
    if (hasReachedDailyLimit) {
      setExecutionError('일일 사용 한도에 도달했습니다. Premium으로 업그레이드하세요.');
      return;
    }

    setIsExecuting(true);
    setResult('');
    setImageUrl(undefined);
    setExecutionError(null);
    setLastInputData(inputData);

    try {
      // 이미지 생성 모델은 스트리밍 사용하지 않음
      if (tool.outputConfig?.streaming && !isImageGenerationModel) {
        setIsStreaming(true);
        abortControllerRef.current = new AbortController();

        const response = await executionApi.executeStream(tool.id, inputData);

        // HTTP 에러 응답 처리
        if (!response.ok) {
          let errorMessage = '스트리밍 실행 중 오류가 발생했습니다.';
          try {
            const errorData = await response.json();
            if (errorData.code === 'T003') {
              errorMessage = '일일 사용 한도에 도달했습니다. Premium으로 업그레이드하세요.';
              await refreshUser();
            } else if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch {
            // JSON 파싱 실패 시 기본 메시지 사용
          }
          setExecutionError(errorMessage);
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          setExecutionError('스트리밍 응답을 읽을 수 없습니다.');
          return;
        }

        let accumulatedResult = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data:')) {
                const data = line.slice(5).trim();
                if (data === '[DONE]') {
                  setIsStreaming(false);
                } else if (data.startsWith('{"error":')) {
                  // SSE 에러 이벤트 처리
                  try {
                    const errorData = JSON.parse(data);
                    setExecutionError(errorData.error || '스트리밍 중 오류가 발생했습니다.');
                  } catch {
                    setExecutionError('스트리밍 중 오류가 발생했습니다.');
                  }
                } else {
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                      accumulatedResult += parsed.content;
                      setResult(accumulatedResult);
                    }
                  } catch {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }
        } catch (streamError) {
          console.error('Stream reading error:', streamError);
          if (!accumulatedResult) {
            setExecutionError('스트리밍이 중단되었습니다. 다시 시도해주세요.');
          }
        }
      } else {
        const execution: Execution = await executionApi.execute(tool.id, inputData);
        if (execution.result) {
          setResult(
            typeof execution.result === 'string'
              ? execution.result
              : JSON.stringify(execution.result)
          );
        }
        // 이미지 URL이 있으면 설정
        if (execution.imageUrl) {
          setImageUrl(execution.imageUrl);
        }
      }
    } catch (error: unknown) {
      console.error('Execution failed:', error);
      // 일일 제한 초과 에러 처리
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { code?: string } } };
        if (axiosError.response?.data?.code === 'T003') {
          setExecutionError('일일 사용 한도에 도달했습니다. Premium으로 업그레이드하세요.');
          await refreshUser(); // 사용량 정보 갱신
        } else {
          setResult('실행 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      } else {
        setResult('실행 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsExecuting(false);
      setIsStreaming(false);
      // 실행 후 사용량 갱신
      await refreshUser();
    }
  };

  const handleRetry = () => {
    if (lastInputData) {
      handleSubmit(lastInputData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-300">AI 도구를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-white/10 text-gray-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-3xl sm:text-4xl shrink-0">{tool.icon}</span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-white truncate">{tool.name}</h1>
              <p className="text-sm sm:text-base text-gray-300 truncate">{tool.description}</p>
            </div>
          </div>
        </div>

        {!tool.isDefault && (
          <button
            onClick={() => navigate(`/ai/${tool.id}/edit`)}
            className="flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors bg-white/5 border border-gray-700/30 text-gray-300 hover:bg-white/10 backdrop-blur-sm text-sm sm:text-base self-end sm:self-auto"
          >
            <Settings className="w-4 h-4 mr-1.5 sm:mr-2" />
            설정
          </button>
        )}
      </div>

      <div className="space-y-6 sm:space-y-8">
        {/* Daily Limit Warning for FREE users */}
        {hasReachedDailyLimit && (
          <div className="rounded-xl border p-4 bg-red-900/20 border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="font-medium text-red-400">일일 사용 한도 도달</p>
                <p className="text-sm text-gray-300">
                  오늘 {FREE_DAILY_LIMIT}회 사용 한도에 도달했습니다. 내일 자정에 초기화됩니다.
                </p>
              </div>
            </div>
            <Link
              to="/settings"
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors text-sm whitespace-nowrap"
            >
              <Crown className="w-4 h-4" />
              Premium 업그레이드
            </Link>
          </div>
        )}

        {/* Execution Error */}
        {executionError && (
          <div className="rounded-xl border p-4 bg-red-900/20 border-red-500/30 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-400">{executionError}</p>
          </div>
        )}

        {/* Input Form - Top */}
        <div className="rounded-xl border p-4 sm:p-6 bg-white/5 border-gray-700/20 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-white">입력</h2>
            {isFreeTier && (
              <span className="text-xs text-gray-400">
                오늘 사용: <span className={hasReachedDailyLimit ? 'text-red-400' : 'text-primary-400'}>{user?.dailyUsageCount ?? 0}</span> / {FREE_DAILY_LIMIT}회
              </span>
            )}
          </div>
          <AIForm
            fields={tool.inputFields}
            onSubmit={handleSubmit}
            isLoading={isExecuting}
            disabled={hasReachedDailyLimit}
          />
        </div>

        {/* Result - Bottom */}
        <div>
          {isExecuting && !result ? (
            <div className="rounded-xl border p-4 sm:p-6 bg-white/5 border-gray-700/20 backdrop-blur-sm">
              <div className="h-48 sm:h-64">
                <AILoadingSpinner />
              </div>
              <p className="text-center mt-3 sm:mt-4 text-gray-300 text-sm sm:text-base">AI가 작업 중입니다...</p>
            </div>
          ) : (
            <AIResult
              result={result}
              imageUrl={imageUrl}
              outputConfig={tool.outputConfig}
              onRetry={handleRetry}
              isStreaming={isStreaming}
            />
          )}
        </div>
      </div>
    </div>
  );
}
