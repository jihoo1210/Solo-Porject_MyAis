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

// label을 name(변수명)으로 변환 - 한글도 그대로 사용
const labelToName = (label: string): string => {
  const cleaned = label.trim();
  if (!cleaned) return `입력_${Date.now()}`;
  return cleaned;
};

export default function FieldEditor({ fields, onChange }: FieldEditorProps) {
  const addField = () => {
    const timestamp = Date.now();
    const baseLabel = '입력';
    const newField: InputField = {
      id: `field_${timestamp}`,
      name: baseLabel,
      label: baseLabel,
      type: 'text',
      required: false,
    };
    // 중복 체크
    const existingNames = fields.map(f => f.name);
    if (existingNames.includes(newField.name)) {
      const newLabel = `입력${fields.length + 1}`;
      newField.name = newLabel;
      newField.label = newLabel;
    }
    onChange([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<InputField>) => {
    const newFields = [...fields];

    // label이 변경되면 name도 함께 업데이트
    if (updates.label !== undefined) {
      const newName = labelToName(updates.label);
      // 중복 체크 (자신 제외)
      const otherNames = fields.filter((_, i) => i !== index).map(f => f.name);
      if (otherNames.includes(newName)) {
        updates.name = `${newName}_${Date.now()}`;
      } else {
        updates.name = newName;
      }
    }

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
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-medium text-white">입력 필드</h3>
        <button
          onClick={addField}
          className="btn-secondary text-xs sm:text-sm"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
          필드 추가
        </button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id || `field-${index}`}
            className="bg-white/2 rounded-xl p-3 sm:p-4 border border-gray-700/20 backdrop-blur-sm"
          >
            <div className="flex items-start gap-2 sm:gap-4">
              <div className="hidden sm:flex flex-col gap-1 pt-2">
                <button
                  onClick={() => moveField(index, index - 1)}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-white/10 disabled:opacity-30"
                >
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    필드 이름
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    className="input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    타입
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(index, {
                        type: e.target.value as InputField['type'],
                      })
                    }
                    className="input text-sm"
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    플레이스홀더
                  </label>
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => updateField(index, { placeholder: e.target.value })}
                    placeholder="예: 내용을 입력하세요"
                    className="input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    필수 입력
                  </label>
                  <button
                    type="button"
                    onClick={() => updateField(index, { required: !field.required })}
                    className={`relative w-full h-9 sm:h-10 rounded-lg transition-colors ${
                      field.required
                        ? 'bg-primary-600'
                        : 'bg-gray-700/50'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-md shadow transition-all ${
                        field.required ? 'left-[calc(100%-2rem)] sm:left-[calc(100%-2.25rem)]' : 'left-1'
                      }`}
                    />
                    <span className={`absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-medium ${
                      field.required ? 'text-white' : 'text-gray-400'
                    }`}>
                      {field.required ? '필수' : '선택'}
                    </span>
                  </button>
                </div>

                {field.type === 'select' && (
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
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
                      className="input text-sm"
                    />
                  </div>
                )}

                {field.type === 'url' && (
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                      도움말
                    </label>
                    <input
                      type="text"
                      value={field.helpText || ''}
                      onChange={(e) => updateField(index, { helpText: e.target.value })}
                      placeholder="URL을 입력하면 자동으로 내용을 가져옵니다"
                      className="input text-sm"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={() => removeField(index)}
                disabled={fields.length <= 1}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-red-900/30 text-red-400 disabled:opacity-30"
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
