import { useForm } from 'react-hook-form';
import { Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { InputField } from '../../types';
import { utilsApi } from '../../api';

interface AIFormProps {
  fields: InputField[];
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading: boolean;
}

export default function AIForm({ fields, onSubmit, isLoading }: AIFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [crawlingField, setCrawlingField] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileUpload = async (fieldName: string, file: File) => {
    setUploadingField(fieldName);
    try {
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
      setValue(fieldName, response.content);
    } catch (error) {
      console.error('Crawl failed:', error);
    } finally {
      setCrawlingField(null);
    }
  };

  const renderField = (field: InputField) => {
    const fieldValue = watch(field.name);

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            {...register(field.name, { required: field.required })}
            placeholder={field.placeholder}
            className="input"
          />
        );

      case 'textarea':
        return (
          <textarea
            {...register(field.name, { required: field.required })}
            placeholder={field.placeholder}
            rows={4}
            className="input resize-none"
          />
        );

      case 'select':
        return (
          <select
            {...register(field.name, { required: field.required })}
            className="input"
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
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all"
            >
              {uploadingField === field.name ? (
                <Loader2 className="w-8 h-8 text-primary-600 mx-auto animate-spin" />
              ) : fieldValue ? (
                <img
                  src={fieldValue}
                  alt="Uploaded"
                  className="max-h-40 mx-auto rounded-lg"
                />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">이미지를 업로드하세요</p>
                  <p className="text-gray-400 text-sm">PNG, JPG up to 10MB</p>
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
                {...register(field.name, { required: field.required })}
                placeholder="https://example.com"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={() => fieldValue && handleUrlCrawl(field.name, fieldValue)}
                disabled={!fieldValue || crawlingField === field.name}
                className="btn-secondary px-4"
              >
                {crawlingField === field.name ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LinkIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {field.helpText && (
              <p className="text-sm text-gray-500">{field.helpText}</p>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            {...register(field.name, { required: field.required })}
            placeholder={field.placeholder}
            className="input"
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderField(field)}
          {errors[field.name] && (
            <p className="text-red-500 text-sm mt-1">이 필드는 필수입니다</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full justify-center py-3"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            AI가 처리중...
          </>
        ) : (
          '실행하기'
        )}
      </button>
    </form>
  );
}
