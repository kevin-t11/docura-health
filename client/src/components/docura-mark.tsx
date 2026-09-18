import { cn } from '@/lib/cn';

/** Reuse the Docura brand mark at sidebar and chat sizes. */
export function DocuraMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-7 w-6 shrink-0 -rotate-14 items-center gap-[12.5%] text-primary [&>span]:w-1/4 [&>span]:rounded-[3px] [&>span]:bg-current',
        className
      )}>
      <span className="h-[68%]" />
      <span className="h-[96%]" />
      <span className="h-[54%]" />
    </span>
  );
}
