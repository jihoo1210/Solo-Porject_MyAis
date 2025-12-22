import { useForm } from 'react-hook-form';
import { Upload, Link as LinkIcon, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useRef } from 'react';
import { InputField } from '../../types';
import { utilsApi } from '../../api';
import { useUIStore } from '../../store';

interface AIFormProps {
  fields: InputField[];
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function AIForm({ fields, onSubmit, isLoading, disabled = false }: AIFormProps) {
  const { theme } = useUIStore();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [crawlingField, setCrawlingField] = useState<string | null>(null);
  const [crawledContent, setCrawledContent] = useState<Record<string, string>>({});
  const [expandedCrawl, setExpandedCrawl] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileUpload = async (fieldName: string, file: File) => {
    setUploadingField(fieldName);
    try {
      // 이전 이미지가 있으면 S3에서 삭제
      const previousUrl = watch(fieldName);
      if (previousUrl && typeof previousUrl === 'string' &&
          (previousUrl.includes('amazonaws.com') || previousUrl.includes('s3.'))) {
        try {
          await utilsApi.deleteImage(previousUrl);
        } catch (deleteError) {
          console.error('Failed to delete previous image:', deleteError);
          // 삭제 실패해도 업로드는 계속 진행
        }
      }

      const response = await utilsApi.uploadImage(file);
      setValue(fieldName, response.url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingField(null);
    }
  };

  const handleUrlCrawl = async (fieldName: string, url: string) => {
    setCrawlingField(fieldName);
    try {
      const response = await utilsApi.crawlUrl(url);
      // 크롤링된 내용은 미리보기용으로 저장
      setCrawledContent(prev => ({ ...prev, [fieldName]: response.content }));
      setExpandedCrawl(prev => ({ ...prev, [fieldName]: false }));
      // 실제 전송되는 값은 URL로 유지 (백엔드에서 크롤링)
      setValue(fieldName, url);
    } catch (error) {
      console.error('Crawl failed:', error);
    } finally {
      setCrawlingField(null);
    }
  };

  const handleClearCrawl = (fieldName: string) => {
    setCrawledContent(prev => {
      const newContent = { ...prev };
      delete newContent[fieldName];
      return newContent;
    });
    setValue(fieldName, '');
    setValue(`${fieldName}_url`, '');
  };

  const inputStyles = `w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base ${
    theme === 'dark'
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-900'
  }`;

  const renderField = (field: InputField) => {
    const fieldValue = watch(field.name);

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            {...register(field.name, { required: field.required })}
            placeholder={field.placeholder}
            className={inputStyles}
          />
        );

      case 'textarea':
        return (
          <textarea
            {...register(field.name, { required: field.required })}
            placeholder={field.placeholder}
            rows={4}
            className={`${inputStyles} resize-none`}
          />
        );

      case 'select':
        return (
          <select
            {...register(field.name, { required: field.required })}
            className={inputStyles}
          >
            <option value="">선택하세요</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'image':
        return (
          <div className="space-y-2">
            <input
              type="hidden"
              {...register(field.name, { required: field.required })}
            />
            <div
              onClick={() => fileInputRefs.current[field.name]?.click()}
              className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center cursor-pointer transition-all ${
                theme === 'dark'
                  ? 'border-gray-700 hover:border-primary-500 hover:bg-primary-900/20'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
              }`}
            >
              {uploadingField === field.name ? (
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mx-auto animate-spin" />
              ) : fieldValue ? (
                <img
                  src={fieldValue}
                  alt="Uploaded"
                  className="max-h-32 sm:max-h-40 mx-auto rounded-lg"
                />
              ) : (
                <>
                  <Upload className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>이미지를 업로드하세요</p>
                  <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>PNG, JPG up to 10MB</p>
                </>
              )}
            </div>
            <input
              type="file"
              ref={(el) => { fileInputRefs.current[field.name] = el; }}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(field.name, file);
              }}
            />
          </div>
        );

      case 'url':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                {...register(`${field.name}_url`, { required: field.required && !crawledContent[field.name] })}
                placeholder="https://example.com"
                className={`${inputStyles} flex-1`}
                disabled={!!crawledContent[field.name]}
              />
              <input type="hidden" {...register(field.name)} />
              <button
                type="button"
                onClick={() => {
                  const urlValue = watch(`${field.name}_url`);
                  if (urlValue) handleUrlCrawl(field.name, urlValue);
                }}
                disabled={!watch(`${field.name}_url`) || crawlingField === field.name || !!crawledContent[field.name]}
                title="웹사이트 크롤링"
                className={`px-3 sm:px-4 rounded-lg transition-colors group relative ${
                  theme === 'dark'
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:text-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-100/50'
                }`}
              >
                {crawlingField === field.name ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  웹사이트 크롤링
                </span>
              </button>
            </div>

            {/* 크롤링된 내용 표시 */}
            {crawledContent[field.name] && (
              <div className={`rounded-lg border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between p-2 sm:p-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                      ✓ 크롤링 완료
                    </span>
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                      ({crawledContent[field.name].length.toLocaleString()}자)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setExpandedCrawl(prev => ({ ...prev, [field.name]: !prev[field.name] }))}
                      className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                      title={expandedCrawl[field.name] ? '접기' : '펼치기'}
                    >
                      {expandedCrawl[field.name] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearCrawl(field.name)}
                      className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-red-900/30 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-500'}`}
                      title="크롤링 삭제"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {expandedCrawl[field.name] && (
                  <div className={`p-2 sm:p-3 border-t max-h-48 overflow-y-auto ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <pre className={`text-xs whitespace-pre-wrap wrap-break-word ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {crawledContent[field.name].slice(0, 2000)}
                      {crawledContent[field.name].length > 2000 && '...'}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {field.helpText && (
              <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{field.helpText}</p>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            {...register(field.name, { required: field.required })}
            placeholder={field.placeholder}
            className={inputStyles}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
      {fields.map((field) => (
        <div key={field.name}>
          <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderField(field)}
          {errors[field.name] && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">이 필드는 필수입니다</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isLoading || disabled}
        className="flex items-center justify-center w-full py-2.5 sm:py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm sm:text-base"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
            AI가 처리중...
          </>
        ) : disabled ? (
          '일일 한도 도달'
        ) : (
          '실행하기'
        )}
      </button>
    </form>
  );
}
