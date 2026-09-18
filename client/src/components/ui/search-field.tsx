/** Render a reusable search input with a Hugeicons search icon. */
import { Search } from '@/components/icons';
import { cn } from '@/lib/cn';
import type { InputHTMLAttributes } from 'react';

type SearchFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  inputClassName?: string;
};

export function SearchField({ className, inputClassName, ...props }: SearchFieldProps) {
  return (
    <label
      className={cn(
        'flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-border bg-white px-[11px] py-2 text-muted-foreground focus-within:border-primary focus-within:shadow-[0_0_0_2px_#32684e14]',
        className
      )}>
      <Search className="size-5" />
      <input
        {...props}
        className={cn(
          'min-w-0 w-full border-0 bg-transparent text-base text-copy outline-none placeholder:text-muted-foreground md:text-[13px]',
          inputClassName
        )}
      />
    </label>
  );
}
