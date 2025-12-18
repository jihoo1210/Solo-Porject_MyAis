import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Loader2 } from 'lucide-react';
import { AITool, Execution } from '../types';
import { aiToolsApi, executionApi } from '../api';
import AIForm from '../components/ai/AIForm';
import AIResult from '../components/ai/AIResult';
import AILoadingSpinner from '../components/three/AILoadingSpinner';

export default function AIUse() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tool, setTool] = useState<AITool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastInputData, setLastInputData] = useState<Record<string, unknown> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (id) {
      fetchTool();
    }
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [id]);

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

    setIsExecuting(true);
    setResult('');
    setLastInputData(inputData);

    try {
      if (tool.outputConfig?.streaming) {
        setIsStreaming(true);
        abortControllerRef.current = new AbortController();

        const response = await executionApi.executeStream(tool.id, inputData);
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let accumulatedResult = '';
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
      }
    } catch (error) {
      console.error('Execution failed:', error);
      setResult('실행 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsExecuting(false);
      setIsStreaming(false);
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
        <p className="text-gray-500">AI 도구를 찾을 수 없습니다</p>
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
            <span className="text-4xl">{tool.icon}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tool.name}</h1>
              <p className="text-gray-500">{tool.description}</p>
            </div>
          </div>
        </div>

        {!tool.isDefault && (
          <button
            onClick={() => navigate(`/ai/${tool.id}/edit`)}
            className="btn-secondary"
          >
            <Settings className="w-4 h-4 mr-2" />
            설정
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">입력</h2>
          <AIForm
            fields={tool.inputFields}
            onSubmit={handleSubmit}
            isLoading={isExecuting}
          />
        </div>

        {/* Result */}
        <div>
          {isExecuting && !result ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="h-64">
                <AILoadingSpinner />
              </div>
              <p className="text-center text-gray-500 mt-4">AI가 작업 중입니다...</p>
            </div>
          ) : (
            <AIResult
              result={result}
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
