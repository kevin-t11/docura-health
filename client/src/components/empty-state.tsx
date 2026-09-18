/** Show the upload screen before a document is selected. */
import { MessageSquareText, Shield, Sparkle } from '@/components/icons';
import { Upload } from '@/components/upload';
import type { AppConfig, DocumentDetail } from '@docura/contracts';

export function EmptyState({
  config,
  onUploaded
}: {
  config?: AppConfig;
  onUploaded: (document: DocumentDetail) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="grid min-h-full grid-rows-[1fr_auto_2fr] px-4 py-6 md:px-6">
        <div className="row-start-2 mx-auto w-full max-w-218 [&_h1]:text-[26px] [&_h1]:font-semibold [&_h1]:leading-[1.2] [&_h1]:tracking-[-.8px] [&_h1]:text-ink md:[&_h1]:text-[30px]">
          <div className="mb-6 md:[@media(max-height:700px)]:mb-5">
            <h1>Add a document or recording</h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-[15px]">
              Get a clear summary, find next steps, and ask questions with sources.
            </p>
          </div>
          <Upload config={config} onUploaded={onUploaded} />
          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-border pt-6 md:grid-cols-3 md:gap-6 md:[@media(max-height:700px)]:mt-4 md:[@media(max-height:700px)]:pt-5 [&>div]:grid [&>div]:grid-cols-[20px_minmax(0,1fr)] [&>div]:content-start [&>div]:gap-x-2 [&>div]:gap-y-1 [&_svg]:mt-0.5 [&_svg]:text-primary max-md:[&_svg]:row-span-2 [&_strong]:text-sm [&_strong]:font-semibold [&_strong]:text-ink [&_p]:col-start-2 [&_p]:text-[13px] [&_p]:leading-[1.6] [&_p]:text-muted-foreground">
            <div>
              <Sparkle />
              <strong>Read the summary</strong>
              <p>Key points and next steps, in one place.</p>
            </div>
            <div>
              <MessageSquareText />
              <strong>Ask a question</strong>
              <p>Answers grounded in your document.</p>
            </div>
            <div>
              <Shield />
              <strong>Check the source</strong>
              <p>Follow citations to the original passage.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
