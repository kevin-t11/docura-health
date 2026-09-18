import { Loader } from '@/components/motion/loader';

/** Show a centered loader while the PDF preview loads. */
export function PdfLoading() {
  return (
    <div className="flex min-h-80 w-full flex-col items-center justify-center gap-3 rounded-lg bg-card p-6">
      <Loader size={24} label="Loading your preview" />
      <p aria-hidden="true" className="text-sm text-muted-foreground">
        Loading your preview…
      </p>
    </div>
  );
}
