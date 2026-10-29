import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
export interface Field {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'number' | 'select' | 'textarea' | 'password';
  required?: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  hint?: string;
  full?: boolean;
  validate?: (value: string) => string | undefined;
}
export function FormDialog({
  open,
  onClose,
  title,
  description,
  fields,
  values,
  onSave,
  submitLabel = 'Lưu thông tin',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  fields: Field[];
  values: Record<string, string>;
  onSave: (values: Record<string, string>) => void;
  submitLabel?: string;
}) {
  const schema = z.record(z.string(), z.string()).superRefine((data, ctx) =>
    fields.forEach((f) => {
      const v = (data[f.name] || '').trim();
      let error = '';
      if (f.required && !v) error = 'Vui lòng nhập ' + f.label.toLowerCase();
      else if (v && f.type === 'email' && !z.email().safeParse(v).success)
        error = 'Email không hợp lệ';
      else if (v && f.type === 'tel' && !/^0[0-9\s]{8,13}$/.test(v))
        error = 'Số điện thoại phải bắt đầu bằng 0, từ 10–11 chữ số';
      else if (
        v &&
        f.type === 'number' &&
        (!Number.isFinite(Number(v)) ||
          (f.min !== undefined && Number(v) < f.min) ||
          (f.max !== undefined && Number(v) > f.max))
      )
        error = `Giá trị phải từ ${f.min ?? 0}${f.max !== undefined ? ' đến ' + f.max : ''}`;
      else if (f.validate) error = f.validate(v) || '';
      if (error) ctx.addIssue({ code: 'custom', path: [f.name], message: error });
    }),
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, string>>({ resolver: zodResolver(schema), defaultValues: values });
  useEffect(() => {
    if (open) reset(values);
  }, [open, values, reset]);
  return (
    <Dialog open={open} onOpenChange={onClose} title={title} description={description}>
      <form
        noValidate
        onSubmit={handleSubmit((data) => {
          try {
            onSave(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.trim()])));
            toast.success('Đã lưu thông tin');
            onClose();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Không thể lưu dữ liệu');
          }
        })}
      >
        <div className="form-grid">
          {fields.map((f) => (
            <div className={`form-field ${f.full ? 'full' : ''}`} key={f.name}>
              <label htmlFor={'field-' + f.name}>
                {f.label}
                {f.required && <span className="required"> *</span>}
              </label>
              {f.type === 'select' ? (
                <select id={'field-' + f.name} {...register(f.name)}>
                  {!f.required && <option value="">Không liên kết</option>}
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea id={'field-' + f.name} rows={3} {...register(f.name)} />
              ) : (
                <input
                  id={'field-' + f.name}
                  type={f.type || 'text'}
                  min={f.min}
                  max={f.max}
                  step={f.type === 'number' ? 'any' : undefined}
                  {...register(f.name)}
                  aria-invalid={!!errors[f.name]}
                />
              )}
              <span className={errors[f.name] ? 'field-error' : 'field-hint'}>
                {errors[f.name]?.message || f.hint}
              </span>
            </div>
          ))}
        </div>
        <div className="dialog-footer">
          <Button variant="outline" type="button" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save size={16} />
            {submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
