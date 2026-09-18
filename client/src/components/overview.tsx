import {
  AlertTriangle,
  Check,
  TimelineIcon,
  File,
  Shield,
  Sparkle,
  type AppIcon
} from '@/components/icons';
import type { DocumentDetail, Insight, SourceChunk, TimelineEvent } from '@docura/contracts';

/** Display cited insights and a timeline with the latest dates first. */
function SourceLinks({
  ids,
  chunks,
  onSource
}: {
  ids: string[];
  chunks: SourceChunk[];
  onSource: (id: string) => void;
}) {
  return (
    <span className="inline-flex gap-1 align-middle">
      {ids.map((id) => {
        const chunk = chunks.find((chunk) => chunk.id === id);
        return chunk ? (
          <button
            key={id}
            className="inline-flex h-6 min-w-6 items-center justify-center rounded-sm bg-[#e0eadb] px-1 text-[11px] leading-none font-semibold text-[#355b35] hover:bg-[#c8dcc0] hover:text-[#234720] max-md:h-7 max-md:min-w-7 group-data-[attention=true]/insight:bg-[#f6e8c5] group-data-[attention=true]/insight:text-[#79520b] group-data-[attention=true]/insight:hover:bg-[#eddaac]"
            title={`View evidence: ${chunk.location}`}
            aria-label={`View source ${chunk.index + 1}, ${chunk.location}`}
            onClick={() => onSource(id)}>
            {chunk.index + 1}
          </button>
        ) : null;
      })}
    </span>
  );
}

/** Show a list of insights with a source link for each. */
function InsightCard({
  title,
  icon: InsightIcon,
  items,
  document,
  onSource,
  tone
}: {
  title: string;
  icon: AppIcon;
  items: Insight[];
  document: DocumentDetail;
  onSource: (id: string) => void;
  tone?: 'attention';
}) {
  const needsAttention = tone === 'attention' && items.length > 0;
  return (
    <section
      data-attention={needsAttention}
      className="group/insight rounded-xl border border-border bg-white p-5 data-[attention=true]:bg-[#fff9ec] @max-[561px]:p-4">
      <div className="mb-3 flex items-center justify-between gap-3 @max-[561px]:flex-wrap [&_h3]:flex [&_h3]:items-center [&_h3]:gap-2 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-ink [&_h3_svg]:size-4.5 [&_h3_svg]:text-primary group-data-[attention=true]/insight:[&_h3]:text-[#79520b] group-data-[attention=true]/insight:[&_h3_svg]:text-[#79520b]">
        <h3>
          <InsightIcon size={17} />
          {title}
        </h3>
        <span
          className={
            needsAttention
              ? 'inline-flex min-h-6 items-center rounded-sm bg-[#f9e8bd] px-2 py-0.5 text-xs font-medium whitespace-nowrap text-[#79520b]'
              : 'grid h-6 min-w-6 place-items-center rounded-sm bg-soft text-xs text-muted-foreground'
          }>
          {needsAttention ? `Needs attention · ${items.length}` : items.length}
        </span>
      </div>
      {items.length ? (
        <ul className="m-0 list-none p-0 [&_li]:mt-2 [&_li]:flex [&_li]:gap-2 [&_li]:text-[15px] [&_li]:leading-[1.7] [&_li]:wrap-anywhere [&_li]:text-copy [&_li]:before:mt-[11px] [&_li]:before:size-1 [&_li]:before:shrink-0 [&_li]:before:rounded-full [&_li]:before:bg-[#82997a] [&_li]:before:content-[''] group-data-[attention=true]/insight:[&_li]:before:bg-[#ad791e]">
          {items.map((item) => (
            <li key={`${item.sourceIds.join(':')}-${item.text}`}>
              <span>
                {item.text}{' '}
                <SourceLinks ids={item.sourceIds} chunks={document.chunks} onSource={onSource} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-[1.65] text-muted-foreground">
          None identified in the document. This does not confirm completeness.
        </p>
      )}
    </section>
  );
}

/** Show a timeline of events with a source link for each. */
export function Timeline({
  events,
  chunks,
  onSource
}: {
  events: TimelineEvent[];
  chunks: SourceChunk[];
  onSource: (id: string) => void;
}) {
  if (!events.length)
    return (
      <div className="px-4 py-6 text-center text-muted-foreground [&>svg]:mx-auto [&>svg]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink [&_p]:mt-2 [&_p]:text-sm">
        <TimelineIcon size={28} />
        <h3>No dated events identified</h3>
        <p>The document doesn’t include a clear timeline.</p>
      </div>
    );
  const sortedEvents = events.toSorted((a, b) => {
    const first = Date.parse(a.date);
    const second = Date.parse(b.date);
    if (Number.isNaN(first)) return Number.isNaN(second) ? 0 : 1;
    if (Number.isNaN(second)) return -1;
    return second - first;
  });
  return (
    <ol className="mt-2 list-none p-0 [&_li]:relative [&_li]:ml-1 [&_li]:border-l [&_li]:border-[#d9e2d5] [&_li]:pb-5 [&_li]:pl-5 [&_li:last-child]:border-transparent [&_li:last-child]:pb-0 [&_time]:text-xs [&_time]:font-medium [&_time]:text-muted-foreground [&_p]:mt-1 [&_p]:text-[15px] [&_p]:leading-[1.7] [&_p]:wrap-anywhere [&_p]:text-copy">
      {sortedEvents.map((event) => (
        <li key={`${event.date}-${event.sourceIds.join(':')}-${event.event}`}>
          <div className="absolute top-[7px] -left-1 size-[7px] rounded-full bg-[#6f9061]" />
          <time>{event.date}</time>
          <p>
            {event.event} <SourceLinks ids={event.sourceIds} chunks={chunks} onSource={onSource} />
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Show the document overview with key points, requirements, missing items, and callouts. */
export function Overview({
  document,
  onSource
}: {
  document: DocumentDetail;
  onSource: (id: string) => void;
}) {
  const overview = document.overview;
  if (!overview) return null;
  return (
    <div className="mx-auto flex max-w-250 flex-col gap-4">
      <section className="rounded-xl border border-[#dce6d6] bg-[#f0f5ed] p-5 @max-[561px]:p-4">
        <div className="mb-3 flex items-center justify-between gap-3 @max-[561px]:flex-wrap [&_h3]:flex [&_h3]:items-center [&_h3]:gap-2 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-ink [&_h3_svg]:size-4.5 [&_h3_svg]:text-primary group-data-[attention=true]/insight:[&_h3]:text-[#79520b] group-data-[attention=true]/insight:[&_h3_svg]:text-[#79520b]">
          <h3>
            <Sparkle />
            At a glance
          </h3>
        </div>
        <p className="text-[15px] leading-[1.7] wrap-anywhere text-copy">
          {overview.summary.text}{' '}
          <SourceLinks
            ids={overview.summary.sourceIds}
            chunks={document.chunks}
            onSource={onSource}
          />
        </p>
        <div className="mt-4 border-t border-[#dce6d6] pt-3 [&>span]:text-[13px] [&>span]:font-semibold [&>span]:text-ink [&_p]:mt-1 [&_p]:text-[15px] [&_p]:leading-[1.7] [&_p]:wrap-anywhere [&_p]:text-copy">
          <span>Objective</span>
          <p>
            {overview.objective.text}{' '}
            <SourceLinks
              ids={overview.objective.sourceIds}
              chunks={document.chunks}
              onSource={onSource}
            />
          </p>
        </div>
      </section>
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-white [&>section]:rounded-none [&>section]:border-0 [&>section+section]:border-t [&>section+section]:border-border">
        <InsightCard
          title="Key points"
          icon={File}
          items={overview.keyPoints}
          document={document}
          onSource={onSource}
        />
        <InsightCard
          title="Requirements & next steps"
          icon={Check}
          items={overview.requirements}
          document={document}
          onSource={onSource}
        />
        <InsightCard
          title="Missing & pending"
          icon={AlertTriangle}
          items={overview.missingItems}
          document={document}
          onSource={onSource}
          tone="attention"
        />
        <InsightCard
          title="Important callouts"
          icon={Sparkle}
          items={overview.callouts}
          document={document}
          onSource={onSource}
        />
      </div>
      <section className="rounded-xl border border-border bg-white p-5 @max-[561px]:p-4">
        <div className="mb-3 flex items-center justify-between gap-3 @max-[561px]:flex-wrap [&_h3]:flex [&_h3]:items-center [&_h3]:gap-2 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-ink [&_h3_svg]:size-4.5 [&_h3_svg]:text-primary group-data-[attention=true]/insight:[&_h3]:text-[#79520b] group-data-[attention=true]/insight:[&_h3_svg]:text-[#79520b]">
          <h3>
            <TimelineIcon />
            Document timeline
          </h3>
          <span className="text-xs text-muted-foreground">{overview.timeline.length} events</span>
        </div>
        <Timeline events={overview.timeline} chunks={document.chunks} onSource={onSource} />
      </section>
      <p className="flex items-start gap-2 text-xs text-muted-foreground [&_svg]:mt-[3px]">
        <Shield size={14} />
        Grounded in your document. Select a numbered source to check the evidence.
      </p>
    </div>
  );
}
