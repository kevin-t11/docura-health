/** Extract document text or transcribe an uploaded conversation. */
import { audioTimestamp, type createAudioTranscriber } from '@/adapters/audio-transcription';
import { AppError } from '@/errors/app.error';
import { extname } from 'node:path';
import { parse } from 'csv-parse/sync';
import mammoth from 'mammoth';
import WordExtractor from 'word-extractor';
import { type Page } from '@/domain/document';
import type { TextExtractor } from '@/domain/ports';
export type OcrReader = (key: string, attemptId: string) => Promise<Page[]>;
export function createExtractor(
  ocr?: OcrReader,
  transcribe?: ReturnType<typeof createAudioTranscriber>
): TextExtractor {
  return {
    async extract(document, data) {
      const extension = extname(document.name).toLowerCase();
      if (document.mimeType.startsWith('audio/')) {
        if (!transcribe) {
          throw new AppError('Audio transcription is unavailable. Please try again later.');
        }
        const transcript = await transcribe(data, document.name, document.mimeType);
        return {
          method: 'audio',
          transcript,
          pages: transcript.segments.map((segment, index) => ({
            ...segment,
            number: index + 1,
            text: `${segment.speaker}: ${segment.text}`,
            location: `${segment.speaker} · ${audioTimestamp(segment.startSeconds)}–${audioTimestamp(segment.endSeconds)}`
          }))
        };
      }
      if (extension === '.pdf') {
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: new Uint8Array(data) });
        let pages: Page[];
        try {
          const result = await parser.getText();
          pages = result.pages.map((page) => ({
            number: page.num,
            text: page.text,
            location: `Page ${page.num}`
          }));
        } catch {
          throw new AppError(
            'This PDF could not be read. It may be damaged or password protected.'
          );
        } finally {
          await parser.destroy();
        }
        // OCR the whole file if even one page is image-only; this also handles mixed PDFs.
        if (pages.some((page) => page.text.trim().length < 20) || pages.length === 0) {
          if (!ocr) {
            throw new AppError(
              'This PDF needs OCR. AWS Textract must be available to process scanned or mixed PDFs.'
            );
          }
          return {
            pages: await ocr(document.storageKey, document.updatedAt),
            method: 'ocr'
          };
        }
        return { pages, method: 'native' };
      }
      if (extension === '.csv') {
        let rows: string[][];
        try {
          rows = parse(data.toString('utf8'), {
            bom: true,
            skip_empty_lines: true,
            max_record_size: 100_000
          });
        } catch {
          throw new AppError('This CSV is malformed. Check its quoting and column counts.');
        }
        if (rows.length < 2) {
          throw new AppError('The CSV needs a header and at least one data row.');
        }
        const headers = rows[0]!;
        const pages: Page[] = [];
        for (let start = 1; start < rows.length; start += 20) {
          const group = rows.slice(start, start + 20);
          pages.push({
            number: pages.length + 1,
            location: `Rows ${start + 1}–${start + group.length}`,
            text: group
              .map(
                (row, i) =>
                  `Row ${start + i + 1}:\n${row.map((value, j) => `${headers[j] || `Column ${j + 1}`}: ${value}`).join('; ')}`
              )
              .join('\n\n')
          });
        }
        return { pages, method: 'csv' };
      }
      let text: string;
      try {
        text =
          extension === '.docx'
            ? (await mammoth.extractRawText({ buffer: data })).value
            : (await new WordExtractor().extract(data)).getBody();
      } catch {
        throw new AppError(
          'This Word document could not be read. Try exporting it as DOCX or PDF.'
        );
      }
      // Word reflow has no stable page numbers; these are explicitly labeled sections.
      const sections: string[] = [];
      for (const section of text.split(/\f/)) {
        for (let start = 0; start < section.length; start += 8000) {
          sections.push(section.slice(start, start + 8000));
        }
      }
      return {
        pages: sections.map((text, i) => ({
          number: i + 1,
          text,
          location: `Section ${i + 1}`
        })),
        method: 'word'
      };
    }
  };
}
