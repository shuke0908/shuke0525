'use client';

import React, { forwardRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Controller } from 'react-hook-form';
import type { 
  Control, 
  FieldPath, 
  FieldValues, 
  ControllerRenderProps,
  ControllerFieldState,
  UseFormStateReturn
} from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

// React Hook Form 타입 지원을 위한 제네릭 인터페이스
export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>;
  name: TName;
  render: (_props: {
    field: ControllerRenderProps<TFieldValues, TName>;
    fieldState: ControllerFieldState;
    formState: UseFormStateReturn<TFieldValues>;
  }) => React.ReactElement;
}

// 제네릭 FormField 컴포넌트
export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ control, name, render }: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={render}
    />
  );
}

// Base form field properties with exact optional types
export interface BaseFormFieldProps {
  label?: string | undefined;
  description?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  className?: string | undefined;
  children: ReactNode;
}

interface InputFormFieldProps extends BaseFormFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  _value?: string;
  onChange?: (_value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

interface TextareaFormFieldProps extends BaseFormFieldProps {
  placeholder?: string;
  _value?: string;
  onChange?: (_value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  rows?: number;
}

interface SelectFormFieldProps extends BaseFormFieldProps {
  placeholder?: string;
  _value?: string;
  onChange?: (_value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  options: Array<{
    label: string;
    value: string;
    disabled?: boolean;
  }>;
}

interface CheckboxFormFieldProps extends BaseFormFieldProps {
  _checked?: boolean;
  onChange?: (_checked: boolean) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

interface RadioFormFieldProps extends BaseFormFieldProps {
  _value?: string;
  onChange?: (_value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  options: Array<{
    label: string;
    value: string;
    disabled?: boolean;
  }>;
}

// 공통 레이아웃 컴포넌트
function FormFieldWrapper({
  label,
  description,
  error,
  required,
  className,
  children,
}: BaseFormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label
          className={cn(
            'text-sm font-medium text-gray-700',
            required && "after:content-['*'] after:ml-0.5 after:text-red-500",
            error && 'text-red-700'
          )}
        >
          {label}
        </Label>
      )}

      {children}

      {description && !error && (
        <p className='text-xs text-gray-500'>{description}</p>
      )}

      {error && (
        <div className='flex items-center gap-1 text-red-600'>
          <AlertCircle className='w-3 h-3' />
          <p className='text-xs'>{error}</p>
        </div>
      )}
    </div>
  );
}

// Input 필드
export const InputFormField = forwardRef<HTMLInputElement, InputFormFieldProps>(
  (
    {
      type = 'text',
      placeholder,
      _value,
      onChange,
      onBlur,
      disabled,
      prefix,
      suffix,
      label,
      description,
      error,
      required,
      className,
      ..._props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType = type === 'password' && showPassword ? 'text' : type;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = type === 'number' ? e.target.value : e.target.value;
      onChange?.(newValue);
    };

    const inputElement = (
      <div className='relative'>
        {prefix && (
          <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500'>
            {prefix}
          </div>
        )}

        <Input
          ref={ref}
          type={inputType}
          placeholder={placeholder}
          value={_value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          className={cn(
            error && 'border-red-500 focus:border-red-500',
            prefix && 'pl-10',
            (suffix || type === 'password') && 'pr-10'
          )}
          {..._props}
        />

        {type === 'password' && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
          >
            {showPassword ? (
              <EyeOff className='h-4 w-4 text-gray-500' />
            ) : (
              <Eye className='h-4 w-4 text-gray-500' />
            )}
          </Button>
        )}

        {suffix && type !== 'password' && (
          <div className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'>
            {suffix}
          </div>
        )}
      </div>
    );

    return (
      <FormFieldWrapper
        label={label}
        description={description}
        error={error}
        required={required}
        className={className}
      >
        {inputElement}
      </FormFieldWrapper>
    );
  }
);

InputFormField.displayName = 'InputFormField';

// Textarea 필드
export const TextareaFormField = forwardRef<
  HTMLTextAreaElement,
  TextareaFormFieldProps
>(
  (
    {
      placeholder,
      _value,
      onChange,
      onBlur,
      disabled,
      rows = 3,
      label,
      description,
      error,
      required,
      className,
      ..._props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <FormFieldWrapper
        label={label}
        description={description}
        error={error}
        required={required}
        className={className}
      >
        <Textarea
          ref={ref}
          placeholder={placeholder}
          value={_value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          rows={rows}
          className={cn(error && 'border-red-500 focus:border-red-500')}
          {..._props}
        />
      </FormFieldWrapper>
    );
  }
);

TextareaFormField.displayName = 'TextareaFormField';

// Select 필드
export function SelectFormField({
  placeholder,
  _value,
  onChange,
  onBlur,
  disabled,
  options,
  label,
  description,
  error,
  required,
  className,
}: SelectFormFieldProps) {
  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Select 
        {...({
          value: _value ?? undefined,
          onValueChange: onChange ?? undefined,
          disabled: disabled ?? undefined,
        } as any)}
      >
        <SelectTrigger
          className={cn(error && 'border-red-500 focus:border-red-500')}
          onBlur={onBlur}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled || false}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormFieldWrapper>
  );
}

// Checkbox 필드
export function CheckboxFormField({
  _checked,
  onChange,
  onBlur,
  disabled,
  label,
  description,
  error,
  required,
  className,
}: CheckboxFormFieldProps) {
  return (
    <FormFieldWrapper
      description={description}
      error={error}
      className={className}
    >
      <div className='flex items-center space-x-2'>
        <Checkbox
          {...({
            checked: _checked ?? undefined,
            onCheckedChange: onChange ?? undefined,
            onBlur: onBlur ?? undefined,
            disabled: disabled ?? undefined,
            className: cn(error && 'border-red-500'),
          } as any)}
        />
        {label && (
          <Label
            className={cn(
              'text-sm font-normal cursor-pointer',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500",
              error && 'text-red-700',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {label}
          </Label>
        )}
      </div>
    </FormFieldWrapper>
  );
}

// Radio 필드
export function RadioFormField({
  _value,
  onChange,
  onBlur,
  disabled,
  options,
  label,
  description,
  error,
  required,
  className,
}: RadioFormFieldProps) {
  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <RadioGroup
        {...({
          value: _value ?? undefined,
          onValueChange: onChange ?? undefined,
          onBlur: onBlur ?? undefined,
          disabled: disabled ?? undefined,
          className: cn('space-y-2', error && 'border-red-500'),
        } as any)}
      >
        {options.map(option => (
          <div key={option.value} className='flex items-center space-x-2'>
            <RadioGroupItem
              value={option.value}
              disabled={option.disabled || false}
              className={cn(error && 'border-red-500')}
            />
            <Label
              className={cn(
                'text-sm font-normal cursor-pointer',
                (option.disabled || disabled) && 'cursor-not-allowed opacity-50'
              )}
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </FormFieldWrapper>
  );
}

export default FormFieldWrapper;
