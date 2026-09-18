'use client';

/** Navigate uploads and documents in the collapsible workspace sidebar. */
import { DocumentIcon, File, Grid, Plus } from '@/components/icons';
import { DocuraMark } from '@/components/docura-mark';
import { SearchField } from '@/components/ui/search-field';
import { Sidebar as AceternitySidebar, SidebarBody, useSidebar } from '@/components/ui/sidebar';
import { formatSize } from '@/lib/document-format';
import type { DocumentSummary } from '@docura/contracts';
import { LayoutAlignLeftIcon, LayoutAlignRightIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
import { useState } from 'react';

function DocumentItem({
  document,
  selected,
  onSelect
}: {
  document: DocumentSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className="flex min-h-11 w-full shrink-0 items-center gap-2 rounded-lg border border-transparent px-[11px] py-2 text-left transition-none duration-0 hover:bg-[#e2e9e0] hover:text-ink aria-[current=page]:border-[#dce4d9] aria-[current=page]:bg-white group-data-[collapsed=true]/sidebar:size-9 group-data-[collapsed=true]/sidebar:min-h-9 group-data-[collapsed=true]/sidebar:justify-center group-data-[collapsed=true]/sidebar:gap-0 group-data-[collapsed=true]/sidebar:p-0 [&>span:nth-child(2)]:min-w-0 [&>span:nth-child(2)]:flex-1 [&_strong]:block [&_strong]:truncate [&_strong]:text-xs [&_strong]:leading-normal [&_strong]:font-medium [&_strong]:text-ink [&_small]:mt-1 [&_small]:block [&_small]:text-[11px] [&_small]:leading-normal [&_small]:text-muted-foreground [&_small_span]:px-1"
      onClick={onSelect}
      aria-current={selected ? 'page' : undefined}
      aria-label={document.name}
      title={document.name}>
      <span className="grid size-5 shrink-0 place-items-center text-primary [&>svg]:size-5 group-data-[collapsed=true]/sidebar:[&>svg]:size-4.5">
        <DocumentIcon name={document.name} mimeType={document.mimeType} size={19} />
      </span>
      <span className="group-data-[collapsed=true]/sidebar:hidden">
        <strong>{document.name.replace(/\.[^.]+$/, '')}</strong>
        <small>
          {document.name.split('.').pop()?.toUpperCase()} <span>·</span> {formatSize(document.size)}
        </small>
      </span>
    </button>
  );
}

function SidebarContent({
  documents,
  selectedId,
  showUpload,
  showLibrary,
  loading,
  onSelect,
  onUpload,
  onLibrary
}: {
  documents: DocumentSummary[];
  selectedId?: string;
  showUpload: boolean;
  showLibrary: boolean;
  loading: boolean;
  onSelect: (id: string) => void;
  onUpload: () => void;
  onLibrary: () => void;
}) {
  const { open, setOpen, setMobileOpen } = useSidebar();
  const [search, setSearch] = useState('');
  const filtered = documents.filter((document) =>
    document.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 group-data-[collapsed=true]/sidebar:h-9 group-data-[collapsed=true]/sidebar:justify-center group-data-[mobile=true]/sidebar:pr-13">
        <Link
          className="flex items-center gap-2 ps-1 text-2xl leading-none font-bold tracking-[-1px] text-[#284c39] group-data-[collapsed=true]/sidebar:hidden"
          href="/"
          aria-label="Docura home">
          <DocuraMark className="text-[#3c7152] group-data-[collapsed=true]/sidebar:scale-80" />
          <span className="group-data-[collapsed=true]/sidebar:hidden">
            docura<span className="text-[#719278]">.</span>
          </span>
        </Link>
        <button
          className="inline-flex size-10 shrink-0 p-0 items-center justify-center rounded-lg text-muted-foreground transition-none duration-0 hover:bg-[#e2e9e0] hover:text-ink group/toggle relative group-data-[mobile=true]/sidebar:hidden group-data-[collapsed=true]/sidebar:size-9 [&>svg]:size-5 group-data-[collapsed=true]/sidebar:[&>svg]:size-4.5 group-data-[collapsed=true]/sidebar:[&>svg]:opacity-0 group-data-[collapsed=true]/sidebar:hover:[&>svg]:opacity-100 group-data-[collapsed=true]/sidebar:focus-visible:[&>svg]:opacity-100 [@media(hover:none)]:[&>svg]:opacity-100"
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          title={open ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}>
          <span className="pointer-events-none absolute inset-0 hidden place-items-center group-data-[collapsed=true]/sidebar:grid group-hover/toggle:opacity-0 group-focus-visible/toggle:opacity-0 [@media(hover:none)]:hidden">
            <DocuraMark className="text-[#3c7152] group-data-[collapsed=true]/sidebar:scale-80" />
          </span>
          <HugeiconsIcon
            icon={open ? LayoutAlignLeftIcon : LayoutAlignRightIcon}
            size={20}
            strokeWidth={1.65}
            aria-hidden="true"
          />
        </button>
      </div>
      <button
        className="flex h-11 w-full shrink-0 items-center justify-start gap-2 rounded-lg bg-primary px-3 text-[13px] font-medium text-white transition-none duration-0 hover:bg-primary-dark group-data-[collapsed=true]/sidebar:size-9 group-data-[collapsed=true]/sidebar:justify-center group-data-[collapsed=true]/sidebar:gap-0 group-data-[collapsed=true]/sidebar:p-0 [&>svg]:size-5 group-data-[collapsed=true]/sidebar:[&>svg]:size-4.5"
        aria-label="Upload document"
        title="Upload document"
        aria-current={showUpload ? 'page' : undefined}
        onClick={() => {
          setMobileOpen(false);
          onUpload();
        }}>
        <Plus size={18} />
        <span className="group-data-[collapsed=true]/sidebar:hidden">Upload document</span>
      </button>
      <button
        className="flex h-11 w-full shrink-0 items-center gap-2 rounded-lg px-3 text-[13px] font-medium transition-none duration-0 hover:bg-[#e2e9e0] hover:text-ink aria-[current=page]:bg-[#e0e9dd] aria-[current=page]:text-[#2c573c] group-data-[collapsed=true]/sidebar:size-9 group-data-[collapsed=true]/sidebar:justify-center group-data-[collapsed=true]/sidebar:gap-0 group-data-[collapsed=true]/sidebar:p-0 [&>svg]:size-5 group-data-[collapsed=true]/sidebar:[&>svg]:size-4.5 [&>span:last-child]:text-xs [&>span:last-child]:text-muted-foreground"
        aria-label="All documents"
        title="All documents"
        aria-current={showLibrary ? 'page' : undefined}
        onClick={() => {
          setMobileOpen(false);
          onLibrary();
          setSearch('');
        }}>
        <Grid size={18} />
        <span className="group-data-[collapsed=true]/sidebar:hidden flex-1 text-left">
          All documents
        </span>
        <span className="group-data-[collapsed=true]/sidebar:hidden">{documents.length}</span>
      </button>
      {documents.length > 0 && (
        <SearchField
          className="bg-white/50 group-data-[collapsed=true]/sidebar:hidden"
          inputClassName="md:text-xs"
          placeholder="Find a document…"
          aria-label="Search documents"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto group-data-[collapsed=true]/sidebar:gap-4">
        {filtered.map((document) => (
          <DocumentItem
            key={document.id}
            document={document}
            selected={selectedId === document.id && !showUpload}
            onSelect={() => {
              setMobileOpen(false);
              onSelect(document.id);
            }}
          />
        ))}
        {loading ? (
          <p className="p-3 text-[13px] text-muted-foreground [&_svg]:hidden group-data-[collapsed=true]/sidebar:hidden">
            Loading your library…
          </p>
        ) : !documents.length ? (
          <div className="p-3 text-[13px] text-muted-foreground [&_svg]:hidden group-data-[collapsed=true]/sidebar:hidden">
            <File size={24} />
            <p>Uploaded documents will appear here.</p>
          </div>
        ) : !filtered.length ? (
          <p className="p-3 text-[13px] text-muted-foreground [&_svg]:hidden group-data-[collapsed=true]/sidebar:hidden">
            No documents found.
          </p>
        ) : null}
      </div>
    </>
  );
}

export function Sidebar(props: React.ComponentProps<typeof SidebarContent>) {
  return (
    <AceternitySidebar>
      <SidebarBody>
        <SidebarContent {...props} />
      </SidebarBody>
    </AceternitySidebar>
  );
}
