import { Plus, Trash2, GripVertical } from 'lucide-react';
import { InputField } from '../../types';

interface FieldEditorProps {
  fields: InputField[];
  onChange: (fields: InputField[]) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: '텍스트' },
  { value: 'textarea', label: '긴 텍스트' },
  { value: 'select', label: '선택' },
  { value: 'image', label: '이미지' },
  { value: 'url', label: 'URL' },
];

export default function FieldEditor({ fields, onChange }: FieldEditorProps) {
  const addField = () => {
    const newField: InputField = {
      name: `field_${Date.now()}`,
      label: '새 필드',
      type: 'text',
      required: false,
    };
    onChange([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<InputField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange(newFields);
  };

  const removeField = (index: number) => {
    if (fields.length <= 1) return;
    onChange(fields.filter((_, i) => i !== index));
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= fields.length) return;
    const newFields = [...fields];
    const [movedField] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, movedField);
    onChange(newFields);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">입력 필드</h3>
        <button
          onClick={addField}
          className="btn-secondary text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          필드 추가
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.name}
            className="bg-gray-50 rounded-xl p-4 border border-gray-200"
          >
            <div className="flex items-start gap-4">
              <div className="flex flex-col gap-1 pt-2">
                <button
                  onClick={() => moveField(index, index - 1)}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                >
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    필드 이름
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    타입
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(index, {
                        type: e.target.value as InputField['type'],
                      })
                    }
                    className="input"
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    플레이스홀더
                  </label>
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => updateField(index, { placeholder: e.target.value })}
                    placeholder="예: 내용을 입력하세요"
                    className="input"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm text-gray-700">필수</span>
                  </label>
                </div>

                {field.type === 'select' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      옵션 (콤마로 구분)
                    </label>
                    <input
                      type="text"
                      value={field.options?.join(', ') || ''}
                      onChange={(e) =>
                        updateField(index, {
                          options: e.target.value.split(',').map((s) => s.trim()),
                        })
                      }
                      placeholder="옵션1, 옵션2, 옵션3"
                      className="input"
                    />
                  </div>
                )}

                {field.type === 'url' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      도움말
                    </label>
                    <input
                      type="text"
                      value={field.helpText || ''}
                      onChange={(e) => updateField(index, { helpText: e.target.value })}
                      placeholder="URL을 입력하면 자동으로 내용을 가져옵니다"
                      className="input"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={() => removeField(index)}
                disabled={fields.length <= 1}
                className="p-2 rounded-lg hover:bg-red-100 text-red-500 disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
