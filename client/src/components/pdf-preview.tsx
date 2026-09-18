'use client';

/** Preview original PDF pages with selectable text and navigation. */
import { PdfLoading } from '@/components/pdf-loading';
import { ArrowRight } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
const options = {
  cMapUrl: '/pdfjs/cmaps/',
  standardFontDataUrl: '/pdfjs/standard_fonts/',
  wasmUrl: '/pdfjs/wasm/',
  isEvalSupported: false
};

export default function PdfPreview({ url, initialPage }: { url: string; initialPage: number }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(initialPage);

  /** Handle the resizing of the container. */
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(150, entry.contentRect.width - 24));
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-soft p-3" ref={container}>
      <nav aria-label="PDF pages" className="mb-3 flex items-center justify-between gap-2">
        <Button
          type="button"
          size="sm"
          className="h-8 w-25 gap-1.5 enabled:hover:bg-primary-dark disabled:border-border disabled:bg-transparent disabled:text-muted-foreground/45 disabled:opacity-100"
          aria-label="Previous page"
          disabled={!pages || page <= 1}
          onClick={() => setPage((value) => value - 1)}>
          <ArrowRight className="size-3.5 rotate-180" />
          Previous
        </Button>
        <span aria-live="polite" className="text-xs tabular-nums text-muted-foreground">
          {pages ? `Page ${page} of ${pages}` : 'PDF preview'}
        </span>
        <Button
          type="button"
          size="sm"
          className="h-8 w-25 gap-1.5 enabled:hover:bg-primary-dark disabled:border-border disabled:bg-transparent disabled:text-muted-foreground/45 disabled:opacity-100"
          aria-label="Next page"
          disabled={!pages || page >= pages}
          onClick={() => setPage((value) => value + 1)}>
          Next
          <ArrowRight className="size-3.5" />
        </Button>
      </nav>
      <Document
        file={url}
        options={options}
        onLoadSuccess={({ numPages }) => {
          setPages(numPages);
          setPage((value) => Math.min(Math.max(1, value), numPages));
        }}
        loading={<PdfLoading />}
        error={
          <p className="px-[15px] py-7.5 text-sm text-muted-foreground" role="alert">
            This PDF could not be previewed. You can still read the extracted text or download the
            original.
          </p>
        }>
        <Page
          className="mx-auto [&_canvas]:max-w-full [&_canvas]:h-auto!"
          pageNumber={page}
          width={width}
          renderAnnotationLayer={false}
          loading={<PdfLoading />}
        />
      </Document>
    </div>
  );
}
