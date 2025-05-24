import { useState, useCallback } from 'react';
import type { ValidationError } from '@/types';
import { validation } from '@/lib/error-handler';

interface UseFormValidationOptions {
  initialValues?: Record<string, any>;
  validationRules?: Record<string, (_value: any) => ValidationError | null>;
  onSubmit?: (_values: Record<string, any>) => void | Promise<void>;
}

export const useFormValidation = ({
  initialValues = {},
  validationRules = {},
  onSubmit,
}: UseFormValidationOptions) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (name: string, value: any): string | null => {
      const rule = validationRules[name];
      if (rule) {
        const result = rule(value);
        return result?.message || null;
      }
      return null;
    },
    [validationRules]
  );

  const validateAllFields = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField, validationRules]);

  const setValue = useCallback(
    (name: string, value: any) => {
      setValues(prev => ({ ...prev, [name]: value }));

      // 실시간 유효성 검사 (해당 필드가 이미 터치된 경우에만)
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors(prev => ({
          ...prev,
          [name]: error || '',
        }));
      }
    },
    [touched, validateField]
  );

  const setFieldTouched = useCallback(
    (name: string, isTouched = true) => {
      setTouched(prev => ({ ...prev, [name]: isTouched }));

      if (isTouched) {
        const error = validateField(name, values[name]);
        setErrors(prev => ({
          ...prev,
          [name]: error || '',
        }));
      }
    },
    [values, validateField]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // 모든 필드를 터치된 상태로 설정
      const allTouched: Record<string, boolean> = {};
      Object.keys(validationRules).forEach(key => {
        allTouched[key] = true;
      });
      setTouched(allTouched);

      // 유효성 검사
      if (!validateAllFields()) {
        return;
      }

      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [values, validateAllFields, onSubmit, validationRules]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const clearFieldError = useCallback((name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const isFieldValid = useCallback(
    (name: string): boolean => {
      return !!(touched[name] && !errors[name]);
    },
    [touched, errors]
  );

  const isFieldInvalid = useCallback(
    (name: string): boolean => {
      return !!(touched[name] && !!errors[name]);
    },
    [touched, errors]
  );

  const getFieldProps = useCallback(
    (name: string) => {
      return {
        name,
        value: values[name] || '',
        error: touched[name] ? errors[name] : undefined,
        onChange: (value: any) => setValue(name, value),
        onBlur: () => setFieldTouched(name, true),
      };
    },
    [values, errors, touched, setValue, setFieldTouched]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setFieldTouched,
    setFieldError,
    clearFieldError,
    handleSubmit,
    reset,
    isFieldValid,
    isFieldInvalid,
    getFieldProps,
    validateField,
    validateAllFields,
  };
};

// 일반적인 유효성 검사 규칙들
export const commonValidationRules = {
  required: (fieldName: string) => (value: any) =>
    validation.required(value, fieldName),

  email: (value: string) => validation.email(value),

  password: (value: string) => validation.password(value),

  amount: (value: string | number) => validation.amount(value),

  minLength: (min: number) => (value: string) => {
    if (!value || value.length < min) {
      return { field: 'value', message: `최소 ${min}자 이상 입력해주세요.` };
    }
    return null;
  },

  maxLength: (max: number) => (value: string) => {
    if (value && value.length > max) {
      return { field: 'value', message: `최대 ${max}자까지 입력 가능합니다.` };
    }
    return null;
  },

  confirmPassword:
    (passwordField: string) =>
    (value: string, allValues: Record<string, any>) => {
      if (value !== allValues[passwordField]) {
        return {
          field: 'confirmPassword',
          message: '비밀번호가 일치하지 않습니다.',
        };
      }
      return null;
    },
};

export default useFormValidation;
