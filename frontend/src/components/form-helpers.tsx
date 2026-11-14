import { useState } from 'react';
import type { BaseSyntheticEvent, ComponentProps } from 'react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { AlertCircle, Check, Circle, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { cn } from './ui/utils';
import type { FormErrors } from '../lib/api';
import { passwordChecks } from '../lib/validation';

/** An error that concerns the whole form, e.g. "Invalid credentials". */
export function FormErrorAlert({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

/** "42 / 200" next to a field, turning red once the limit is passed. */
export function CharacterCount({ value, max }: { value: string; max: number }) {
  const length = value.trim().length;

  return (
    <span
      className={cn('text-xs', length > max ? 'text-destructive font-medium' : 'text-muted-foreground')}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {length} / {max}
    </span>
  );
}

/** Live list of the password rules, ticking off as they are met. */
export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="space-y-1 text-xs">
      {passwordChecks(password).map((check) => (
        <li
          key={check.label}
          className={cn('flex items-center gap-1', check.met ? 'text-green-600' : 'text-muted-foreground')}
        >
          {check.met ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
          <span className="sr-only">{check.met ? 'Met:' : 'Not met:'}</span>
          <span>{check.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** Password input with a show/hide button. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-8', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/**
 * Put errors returned by the server on the fields they belong to.
 *
 * Returns the message to show for the form as a whole, or null when every
 * error found its field.
 */
export function applyServerErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  fields: readonly Path<T>[],
  { message, fieldErrors }: FormErrors
): string | null {
  const unplaced: string[] = [];
  let placed = 0;

  for (const [field, text] of Object.entries(fieldErrors)) {
    if ((fields as readonly string[]).includes(field)) {
      form.setError(field as Path<T>, { type: 'server', message: text });
      placed += 1;
    } else {
      unplaced.push(text);
    }
  }

  if (unplaced.length > 0) return unplaced.join('. ');
  return placed > 0 ? null : message;
}

/**
 * Move focus to the first invalid field of the submitted form.
 *
 * The ui/* inputs are plain function components and this app runs React 18,
 * so they cannot receive the `ref` react-hook-form would normally focus.
 * Fields are found through the `aria-invalid` attribute FormControl sets.
 */
export function focusFirstInvalid(event?: BaseSyntheticEvent) {
  const form = event?.target as HTMLElement | undefined;
  // Wait for React to render the errors before looking for them
  setTimeout(() => {
    form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, 0);
}

